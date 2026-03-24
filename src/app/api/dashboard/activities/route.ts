import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-utils'
import connectDB from '@/lib/db-config'
import { Course } from '@/models/Course'
import { Unit } from '@/models/Unit'
import { User } from '@/models/User'

export const dynamic = 'force-dynamic'

interface ActivityItem {
  id: string
  title: string
  type: 'CLASS' | 'QUIZ' | 'ASSIGNMENT'
  courseName: string
  date: Date
  status: 'UPCOMING' | 'TODAY' | 'OVERDUE'
  roleScope: 'STUDENT' | 'TEACHER' | 'ADMIN'
  description?: string
  batchName?: string
  groupName?: string
  unitId?: string
  quizId?: string
  assignmentId?: string
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult
    const searchParams = request.nextUrl.searchParams
    const dateRange = searchParams.get('dateRange') || '30days'

    await connectDB()

    // Calculate date range (default 30 days from now)
    const now = new Date()
    const endDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now

    const activities: ActivityItem[] = []

    // Get user's role and courses
    const userWithRole = await User.findById(user.id)
    const userRole = userWithRole?.role?.toLowerCase() || 'student'
    
    let courses: any[] = []

    if (userRole === 'student') {
      // Students only see their enrolled courses
      courses = await Course.find({
        isActive: true,
        'groups.batches.students': user.id
      }).populate('units groups.batches')
    } else if (userRole === 'admin') {
      // Admins see all courses
      courses = await Course.find({ isActive: true }).populate('units groups.batches')
    } else {
      // Teachers see courses they're assigned to
      courses = await Course.find({
        isActive: true,
        'groups.teachers': user.id
      }).populate('units groups.batches')
    }

    // Process each course for activities
    for (const course of courses) {
      // 1. Generate class sessions based on batch start/end dates and days
      for (const group of course.groups || []) {
        for (const batch of group.batches || []) {
          // For students, only show their batch
          if (userRole === 'student') {
            const isStudentInBatch = (batch.students || []).some((studentId: any) => {
              try {
                return studentId.toString() === user.id.toString()
              } catch {
                return false
              }
            })

            if (!isStudentInBatch) {
              continue
            }
          }

          // Determine class days: prefer batch.days if present, fallback to group.days
          const batchDays = (batch as any).days as string[] | undefined
          const dayNames = (batchDays && batchDays.length > 0 ? batchDays : group.days) || []

          if (!batch.startDate || !batch.endDate || dayNames.length === 0) {
            continue
          }

          const dayIndexes = mapDayNamesToIndexes(dayNames)
          if (dayIndexes.length === 0) continue

          const batchStart = new Date(batch.startDate)
          const batchEnd = new Date(batch.endDate)

          // Restrict to the overall calendar window
          const rangeStart = batchStart > now ? batchStart : now
          const rangeEnd = batchEnd < endDate ? batchEnd : endDate

          if (rangeStart > rangeEnd) continue

          const current = new Date(rangeStart)
          current.setHours(0, 0, 0, 0)
          const finalDate = new Date(rangeEnd)
          finalDate.setHours(0, 0, 0, 0)

          while (current <= finalDate) {
            if (dayIndexes.includes(current.getDay())) {
              const classDate = new Date(current)
              const status = classDate.toDateString() === now.toDateString() ? 'TODAY' : 'UPCOMING'

              activities.push({
                id: `class-${batch._id}-${classDate.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
                title: `${batch.name} Class`,
                type: 'CLASS',
                courseName: course.name,
                date: classDate,
                status,
                roleScope: userRole === 'student' ? 'STUDENT' : userRole === 'admin' ? 'ADMIN' : 'TEACHER',
                description: `Scheduled class for ${batch.name}`,
                batchName: batch.name,
                groupName: group.name
              })
            }

            current.setDate(current.getDate() + 1)
          }
        }
      }

      // 2. Quizzes and assignments from Units for this course
      const units = await Unit.find({ courses: course._id })

      for (const unit of units) {
        // Unit quizzes → QUIZ events
        for (const quiz of unit.quizzes || []) {
          const quizDate = quiz.deadline ? new Date(quiz.deadline) : null
          if (!quizDate) continue
          if (quizDate < now || quizDate > endDate) continue

          const status = quizDate.toDateString() === now.toDateString() ? 'TODAY' : 'UPCOMING'

          activities.push({
            id: `unit-quiz-${unit._id}-${(quiz as any)._id || quiz.quizName}-${quizDate.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
            title: quiz.quizName,
            type: 'QUIZ',
            courseName: course.name,
            date: quizDate,
            status,
            roleScope: userRole === 'student' ? 'STUDENT' : userRole === 'admin' ? 'ADMIN' : 'TEACHER',
            description: unit.title,
            unitId: unit._id?.toString(),
            quizId: (quiz as any)._id ? (quiz as any)._id.toString() : undefined
          })
        }

        // Unit assignments → ASSIGNMENT events
        for (const assignment of unit.assignments || []) {
          const assignmentDate = assignment.deadline ? new Date(assignment.deadline) : null
          if (!assignmentDate) continue
          if (assignmentDate < now || assignmentDate > endDate) continue

          const status = assignmentDate.toDateString() === now.toDateString() ? 'TODAY' : 'UPCOMING'

          activities.push({
            id: `unit-assignment-${unit._id}-${(assignment as any)._id || assignment.title}-${assignmentDate.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
            title: assignment.title,
            type: 'ASSIGNMENT',
            courseName: course.name,
            date: assignmentDate,
            status,
            roleScope: userRole === 'student' ? 'STUDENT' : userRole === 'admin' ? 'ADMIN' : 'TEACHER',
            description: assignment.description,
            unitId: unit._id?.toString(),
            assignmentId: (assignment as any)._id ? (assignment as any)._id.toString() : undefined
          })
        }
      }
    }

    // Sort activities by date (nearest first)
    activities.sort((a, b) => a.date.getTime() - b.date.getTime())
    return NextResponse.json({
      success: true,
      activities,
      userRole,
      total: activities.length
    })

  } catch (error) {
    console.error('Error fetching dashboard activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

const DAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
}

function mapDayNamesToIndexes(dayNames: string[]): number[] {
  return dayNames
    .map(name => DAY_NAME_TO_INDEX[name.toLowerCase()] ?? DAY_NAME_TO_INDEX[name.toLowerCase().slice(0, 3)])
    .filter((idx): idx is number => typeof idx === 'number')
}
