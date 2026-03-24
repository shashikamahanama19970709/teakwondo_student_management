import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Course } from '@/models/Course'
import { authenticateUser } from '@/lib/auth-utils'

// POST /api/course-batches - Create a new batch in a course group
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult
    const organizationId = user.organization!

    const body = await request.json()
    const {
      courseId,
      groupId,
      batchData
    } = body

    // Validate required fields
    if (!courseId || !groupId || !batchData) {
      return NextResponse.json(
        { error: 'Course ID, Group ID, and batch data are required' },
        { status: 400 }
      )
    }

    if (!batchData.name || !batchData.name.trim()) {
      return NextResponse.json(
        { error: 'Batch name is required' },
        { status: 400 }
      )
    }

    if (!batchData.students || batchData.students.length === 0) {
      return NextResponse.json(
        { error: 'At least one student is required' },
        { status: 400 }
      )
    }

    if (!batchData.startDate || !batchData.endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    // Find the course
    const course = await Course.findOne({
      _id: courseId,
      organization: organizationId
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Find the group within the course
    const group = course.groups.id(groupId)
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Add the new batch to the group
    const newBatch = {
      name: batchData.name.trim(),
      description: batchData.description?.trim() || '',
      students: batchData.students,
      startDate: new Date(batchData.startDate),
      endDate: new Date(batchData.endDate),
      progress: 0
    }

    group.batches.push(newBatch)
    await course.save()

    // Return the updated course with populated fields
    await course.populate('lecturers', 'firstName lastName email')
    await course.populate('certifications', 'name')
    await course.populate('units', 'title description')
    await course.populate('createdBy', 'firstName lastName email')

    return NextResponse.json({
      success: true,
      course,
      batch: group.batches[group.batches.length - 1],
      message: 'Batch created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating batch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
