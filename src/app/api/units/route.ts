import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Unit } from '@/models/Unit'
import { Course } from '@/models/Course'
import { User } from '@/models/User'
import { allowCreate, allowRead } from '@/lib/permissions/role-middleware'

// GET /api/units - Get all units with optional course filtering & basic pagination
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Check read permissions
    const authResult = await allowRead(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

    // Get user from database
    const userDoc = await User.findById(user.id)
    if (!userDoc) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const organizationId = userDoc.organization!
    const { searchParams } = new URL(request.url)

    const courseId = searchParams.get('courseId')
    const pageParam = searchParams.get('page') || '1'
    const limitParam = searchParams.get('limit') || '50'

    const page = Math.max(1, parseInt(pageParam, 10) || 1)
    const limit = Math.max(1, Math.min(100, parseInt(limitParam, 10) || 50))
    const skip = (page - 1) * limit

    // Build query
    let query: any = { organization: organizationId }

    // If student, only show units from enrolled courses
    if (user.role === 'student') {
      const enrolledCourseIds = userDoc.enrolledCourses?.map(ec => ec.courseId) || []
      if (enrolledCourseIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        })
      }
      query.courses = { $in: enrolledCourseIds }
    }

    // Filter by course if specified
    if (courseId) {
      query.courses = courseId
    }

    // Get total count
    const total = await Unit.countDocuments(query)

    const units = await Unit.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // Ensure response is properly closed with explicit status and headers
    return NextResponse.json(
      {
        success: true,
        data: units,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit))
        }
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    )
  } catch (error) {
    console.error('Error fetching units:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/units - Create a new unit
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Check create permissions
    const authResult = await allowCreate(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

    // Get user from database
    const userDoc = await User.findById(user.id)
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const organizationId = userDoc.organization!

    const body = await request.json()
    const { title, description, courseIds, files } = body

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Unit title is required' },
        { status: 400 }
      )
    }

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one course must be selected' },
        { status: 400 }
      )
    }

    // Validate file metadata
    if (files && files.length > 0) {
      for (const file of files) {
        if (!file.title || !file.title.trim()) {
          return NextResponse.json(
            { error: 'All uploaded files must have titles' },
            { status: 400 }
          )
        }
      }
    }

    // Create unit
    const unit = new Unit({
      title: title.trim(),
      description: description?.trim() || '',
      courses: courseIds, // Store as array of course IDs
      files: files || [],
      organization: organizationId
    })

    await unit.save()

    // First, remove this unit ID from ALL courses that might have it
    await Course.updateMany(
      { units: unit._id },
      { 
        $pull: { units: unit._id },
        $set: { updatedAt: new Date() }
      }
    )

    // Then, add this unit ID only to the specified courses
    await Course.updateMany(
      { _id: { $in: courseIds } },
      { 
        $push: { units: unit._id },
        $set: { updatedAt: new Date() }
      },
      { runValidators: false }
    )

    // Populate the courses for the response
    await unit.populate('courses', 'title')

    return NextResponse.json(unit, { status: 201 })
  } catch (error) {
    console.error('Error creating unit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

