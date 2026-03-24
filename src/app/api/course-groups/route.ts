import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Course } from '@/models/Course'
import { authenticateUser } from '@/lib/auth-utils'
import mongoose from 'mongoose'

// POST /api/course-groups - Create a new group in a course
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
      groupData
    } = body

    // Validate required fields
    if (!courseId || !groupData) {
      return NextResponse.json(
        { error: 'Course ID and group data are required' },
        { status: 400 }
      )
    }

    if (!groupData.name || !groupData.name.trim()) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    if (!groupData.type || !['weekdays', 'weekends', 'custom'].includes(groupData.type)) {
      return NextResponse.json(
        { error: 'Valid group type is required (weekdays, weekends, or custom)' },
        { status: 400 }
      )
    }

    // For custom groups, ensure days are provided
    if (groupData.type === 'custom') {
      if (!groupData.days || !Array.isArray(groupData.days) || groupData.days.length === 0) {
        return NextResponse.json(
          { error: 'Days are required for custom group types' },
          { status: 400 }
        )
      }
    }

    // Auto-populate days based on type
    let days: string[] = []
    if (groupData.type === 'weekends') {
      days = ['Saturday', 'Sunday']
    } else if (groupData.type === 'weekdays') {
      days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    } else if (groupData.type === 'custom') {
      days = groupData.days
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

    // Create the new group object
    const newGroup = {
      _id: new mongoose.Types.ObjectId(),
      name: groupData.name.trim(),
      type: groupData.type,
      days: days,
      batches: []
    }

    // Add the group to the course
    course.groups.push(newGroup)

    // Save the course
    await course.save()

    return NextResponse.json({
      message: 'Group created successfully',
      group: newGroup
    })

  } catch (error) {
    console.error('Error creating course group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
