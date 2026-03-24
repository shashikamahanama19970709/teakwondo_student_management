import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-utils'
import connectDB from '@/lib/db-config'
import { Course } from '@/models/Course'
import { User } from '@/models/User'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

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
    await connectDB()

    // Get user's role and courses
    const userWithRole = await User.findById(user.id)
    const userRole = userWithRole?.role?.toLowerCase() || 'student'
    
    let quizzes: any[] = []

    // Use raw MongoDB query to get quizzes from units
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    
    const unitsCollection = db.collection('units')

    if (userRole === 'student') {
      // Students only see quizzes from their enrolled courses
      const courses = await Course.find({
        isActive: true,
        'groups.batches.students': user.id
      }).select('_id name')
      
      const courseIds = courses.map(course => course._id)
      
      // Get units that belong to student's courses
      const units = await unitsCollection
        .find({
          courses: { $in: courseIds },
          'quizzes.0': { $exists: true } // Only get units that have quizzes
        })
        .project({
          _id: 1,
          title: 1,
          description: 1,
          courses: 1,
          quizzes: 1,
          createdAt: 1,
          updatedAt: 1
        })
        .toArray()

      // Extract and flatten all quizzes from units
      quizzes = units.flatMap((unit: any) => 
        unit.quizzes.map((quiz: any) => {
          const course = courses.find((course: any) => 
            unit.courses && unit.courses.some((courseId: any) => courseId.toString() === course._id.toString())
          )
          return {
            ...quiz,
            unit: {
              _id: unit._id,
              title: unit.title,
              description: unit.description
            },
            course: course || { _id: null, name: 'Unknown Course' }
          }
        })
      ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)

    } else if (userRole === 'admin') {
      // Admins see all quizzes from all units
      const units = await unitsCollection
        .find({
          'quizzes.0': { $exists: true } // Only get units that have quizzes
        })
        .project({
          _id: 1,
          title: 1,
          description: 1,
          courses: 1,
          quizzes: 1,
          createdAt: 1,
          updatedAt: 1
        })
        .toArray()

      // Get all courses for reference
      const allCourses = await Course.find({ isActive: true }).select('_id name').lean()
      
      // Extract and flatten all quizzes from units
      quizzes = units.flatMap((unit: any) => 
        unit.quizzes.map((quiz: any) => {
          const course = allCourses.find((course: any) => 
            unit.courses && unit.courses.some((courseId: any) => courseId.toString() === course._id.toString())
          )
          return {
            ...quiz,
            unit: {
              _id: unit._id,
              title: unit.title,
              description: unit.description
            },
            course: course || { _id: null, name: 'Unknown Course' }
          }
        })
      ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)

    } else {
      // Teachers see quizzes from courses they're assigned to
      const courses = await Course.find({
        isActive: true,
        lecturers: user.id
      }).select('_id name')
      
      const courseIds = courses.map(course => course._id)
      
      // Get units that belong to teacher's courses
      const units = await unitsCollection
        .find({
          courses: { $in: courseIds },
          'quizzes.0': { $exists: true } // Only get units that have quizzes
        })
        .project({
          _id: 1,
          title: 1,
          description: 1,
          courses: 1,
          quizzes: 1,
          createdAt: 1,
          updatedAt: 1
        })
        .toArray()

      // Extract and flatten all quizzes from units
      quizzes = units.flatMap((unit: any) => 
        unit.quizzes.map((quiz: any) => {
          const course = courses.find((course: any) => 
            unit.courses && unit.courses.some((courseId: any) => courseId.toString() === course._id.toString())
          )
          return {
            ...quiz,
            unit: {
              _id: unit._id,
              title: unit.title,
              description: unit.description
            },
            course: course || { _id: null, name: 'Unknown Course' }
          }
        })
      ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
    }

    return NextResponse.json({
      success: true,
      quizzes,
      userRole,
      total: quizzes.length
    })

  } catch (error) {
    console.error('Error fetching latest quizzes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    )
  }
}
