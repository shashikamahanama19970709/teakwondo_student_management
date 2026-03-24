import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Unit } from '@/models/Unit'
import mongoose from 'mongoose'

// GET /api/units/by-course/[courseId] - Get all units for a specific course
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    await connectDB()

    const courseId = params.courseId

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Get all units where the course ID is in the courses array
    const courseObjectId = new mongoose.Types.ObjectId(courseId)
    const units = await Unit.find({
      courses: { $in: [courseObjectId] } // Find units where courseId is in the courses array
    })
    .populate('courses', 'title') // Populate course details
    .sort({ createdAt: 1 }) // Sort by creation date (oldest first)
    .lean()

    // Format the response
    const formattedUnits = units.map((unit: any) => ({
      _id: unit._id?.toString() || '',
      title: unit.title || '',
      description: unit.description || '',
      courses: (unit.courses || []).map((course: any) => ({
        _id: course._id?.toString() || '',
        title: course.title || ''
      })),
      files: unit.files || [],
      quizzes: unit.quizzes || [],
      assignments: unit.assignments || [],
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: formattedUnits,
      courseId: courseId,
      totalUnits: formattedUnits.length
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })

  } catch (error) {
    console.error('Error fetching units by course:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
