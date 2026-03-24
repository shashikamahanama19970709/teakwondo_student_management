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
    
    let assignments: any[] = []

    // Use raw MongoDB query to get assignments from units
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    
    const unitsCollection = db.collection('units')

    if (userRole === 'student') {
      // Students only see assignments from their enrolled courses
      const courses = await Course.find({
        isActive: true,
        'groups.batches.students': user.id
      }).select('_id name').lean()
      
      const courseIds = courses.map(course => course._id)
      
      // Get units that belong to student's courses
      const units = await unitsCollection
        .find({
          courses: { $in: courseIds },
          'assignments.0': { $exists: true } // Only get units that have assignments
        })
        .project({
          _id: 1,
          title: 1,
          description: 1,
          courses: 1,
          assignments: 1,
          createdAt: 1,
          updatedAt: 1
        })
        .toArray()

      // Extract and flatten all assignments from units
      assignments = units.flatMap((unit: any) => 
        unit.assignments.map((assignment: any) => ({
          ...assignment,
          unit: {
            _id: unit._id,
            title: unit.title,
            description: unit.description
          },
          course: courses.find((course: any) => unit.courses.includes(course._id))
        }))
      ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)

    } else if (userRole === 'admin') {
      // Admins see all assignments from all units
      const units = await unitsCollection
        .find({
          'assignments.0': { $exists: true } // Only get units that have assignments
        })
        .project({
          _id: 1,
          title: 1,
          description: 1,
          courses: 1,
          assignments: 1,
          createdAt: 1,
          updatedAt: 1
        })
        .toArray()

      // Get all courses for reference
      const allCourses = await Course.find({ isActive: true }).select('_id name').lean()
      
      // Extract and flatten all assignments from units
      assignments = units.flatMap((unit: any) => 
        unit.assignments.map((assignment: any) => ({
          ...assignment,
          unit: {
            _id: unit._id,
            title: unit.title,
            description: unit.description
          },
          course: allCourses.find((course: any) => unit.courses.includes(course._id))
        }))
      ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)

    } else {
      // Teachers see assignments from courses they're assigned to
      const courses = await Course.find({
        isActive: true,
        lecturers: user.id
      }).select('_id name').lean()
      
      const courseIds = courses.map(course => course._id)
      
      // Get units that belong to teacher's courses
      const units = await unitsCollection
        .find({
          courses: { $in: courseIds },
          'assignments.0': { $exists: true } // Only get units that have assignments
        })
        .project({
          _id: 1,
          title: 1,
          description: 1,
          courses: 1,
          assignments: 1,
          createdAt: 1,
          updatedAt: 1
        })
        .toArray()

      // Extract and flatten all assignments from units
      assignments = units.flatMap((unit: any) => 
        unit.assignments.map((assignment: any) => ({
          ...assignment,
          unit: {
            _id: unit._id,
            title: unit.title,
            description: unit.description
          },
          course: courses.find((course: any) => unit.courses.includes(course._id))
        }))
      ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
    }

    return NextResponse.json({
      success: true,
      assignments,
      userRole,
      total: assignments.length
    })

  } catch (error) {
    console.error('Error fetching latest assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}
