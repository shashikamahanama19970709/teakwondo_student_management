import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db-config'
import { User } from '@/models/User'
import { Unit } from '@/models/Unit'
import { Organization } from '@/models/Organization'
import { Course } from '@/models/Course'
import { Inquiry } from '@/models/Inquiry'
import { authenticateUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    await connectDB()

    const user = await User.findById(authResult.user.id).populate('organization').populate('customRole')
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRole =  user.role?.toLowerCase()
    const isStudent = userRole === 'student'
    const isAdmin = ['admin', 'teacher', 'lecturer'].includes(userRole)

    let data: any = {}

    if (isStudent) {
      // Student data: units, assignments completed/pending, quizzes completed/pending

      // Get accessible units
      const enrolledCourseIds = user.enrolledCourses?.map((e: any) => e.courseId) || []
      const accessibleUnits = await Unit.find({
        organization: user.organization,
        courses: { $in: enrolledCourseIds }
      }).select('_id')

      const unitIds = accessibleUnits.map((u: any) => u._id)

      // Units count
      data.units = accessibleUnits.length

      // Courses count
      data.courses = enrolledCourseIds.length

      // Assignments data
      const assignments = await Unit.aggregate([
        { $match: { _id: { $in: unitIds } } },
        { $unwind: '$assignments' },
        {
          $addFields: {
            assignment: '$assignments',
            studentEnrollment: {
              $filter: {
                input: '$assignments.enrollment',
                as: 'enrollment',
                cond: { $eq: ['$$enrollment.studentId', user._id] }
              }
            }
          }
        },
        {
          $project: {
            assignment: 1,
            isEnrolled: {
              $and: [
                { $gt: [{ $size: '$studentEnrollment' }, 0] }
              ]
            },
            isCompleted: {
              $and: [
                { $gt: [{ $size: '$studentEnrollment' }, 0] },
                { $ne: [{ $arrayElemAt: ['$studentEnrollment.mark', 0] }, null] }
              ]
            }
          }
        }
      ])

      const enrolledAssignments = assignments.filter((a: any) => a.isEnrolled).length
      const completedAssignments = assignments.filter((a: any) => a.isCompleted).length
      const totalAssignments = assignments.length
      data.assignments = {
        completed: completedAssignments,
        pending: totalAssignments - completedAssignments
      }

      // Quizzes data
      const quizzes = await Unit.aggregate([
        { $match: { _id: { $in: unitIds } } },
        { $unwind: '$quizzes' },
        {
          $addFields: {
            quiz: '$quizzes',
            studentAttempt: {
              $filter: {
                input: '$quizzes.enrollment',
                as: 'enrollment',
                cond: { $eq: ['$$enrollment.studentId', user._id] }
              }
            }
          }
        },
        {
          $project: {
            quiz: 1,
            isCompleted: { $gt: [{ $size: '$studentAttempt' }, 0] }
          }
        }
      ])

      const completedQuizzes = quizzes.filter((q: any) => q.isCompleted).length
      const totalQuizzes = quizzes.length
      data.quizzes = {
        completed: completedQuizzes,
        pending: totalQuizzes - completedQuizzes
      }

      // Files data
      const files = await Unit.aggregate([
        { $match: { _id: { $in: unitIds } } },
        { $unwind: '$files' },
        {
          $addFields: {
            file: '$files',
            studentView: {
              $filter: {
                input: '$files.enrollment',
                as: 'enrollment',
                cond: { $eq: ['$$enrollment.studentId', user._id] }
              }
            }
          }
        },
        {
          $project: {
            file: 1,
            isViewed: { $gt: [{ $size: '$studentView' }, 0] }
          }
        }
      ])

      const totalFiles = files.length
      const viewedFiles = files.filter((f: any) => f.isViewed).length

      // Overall progress
      const totalItems = totalAssignments + totalQuizzes + totalFiles
      const completedItems = enrolledAssignments + completedQuizzes + viewedFiles
      data.progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

      // Add counts
      data.totalAssignments = totalAssignments
      data.totalQuizzes = totalQuizzes
      data.totalFiles = totalFiles

    } else if (isAdmin) {
      // Admin data: users counts, batches, progress data, courses/units

      // Users counts
      const totalUsers = await User.countDocuments({ organization: user.organization })
      const students = await User.countDocuments({
        organization: user.organization,
        $or: [
          { role: 'student' },
          { 'customRole.name': 'student' }
        ]
      })
      const lecturers = await User.countDocuments({
        organization: user.organization,
        $or: [
          { role: 'lecturer' },
          { 'customRole.name': 'lecturer' }
        ]
      })
      const teachers = await User.countDocuments({
        organization: user.organization,
        $or: [
          { role: 'teacher' },
          { 'customRole.name': 'teacher' }
        ]
      })

      data.users = {
        students,
        lecturers,
        teachers,
        total: totalUsers
      }

      // Batches (organizations)
      const organizations = await Organization.find({
        _id: user.organization // For admin, show their org stats
      })

      // For simplicity, use org as batch
      const totalBatches = await Organization.countDocuments()
      const activeBatches = await Organization.countDocuments({ isActive: true })
      const completedBatches = totalBatches - activeBatches

      data.batches = {
        completed: completedBatches,
        active: activeBatches,
        total: totalBatches
      }

      // Courses/Modules and Units
      const courses = await Course.countDocuments({ organization: user.organization })
      const units = await Unit.countDocuments({ organization: user.organization })

      data.courses = {
        count: courses,
        unitsCount: units,
        averageUnitsPerCourse: courses > 0 ? Math.round(units / courses) : 0
      }

      // Inquiries
      const inquiryCounts = await Inquiry.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])

      data.inquiries = inquiryCounts.reduce((acc: Record<string, number>, item: any) => {
        acc[item._id] = item.count
        return acc
      }, {})
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Dashboard widgets API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
