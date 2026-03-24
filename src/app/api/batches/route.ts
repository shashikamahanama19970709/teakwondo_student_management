import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Project } from '@/models/Project'
import { authenticateUser } from '@/lib/auth-utils'
import mongoose from 'mongoose'

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
    const userId = user.id
    const organizationId = user.organization

    const data = await request.json()
    const {
      projectId,
      groupName,
      batchName,
      startDate,
      endDate,
      totalBudget,
      currency = 'USD',
      lecturerPayment,
      materialCost
    } = data

    // Validate required fields
    if (!projectId || !groupName || !batchName || !startDate || !endDate ||
        totalBudget === undefined || lecturerPayment === undefined || materialCost === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Validate budget values
    if (totalBudget < 0 || lecturerPayment < 0 || materialCost < 0) {
      return NextResponse.json(
        { error: 'Budget values cannot be negative' },
        { status: 400 }
      )
    }

    // Find the project and validate it belongs to the organization
    const project = await Project.findOne({
      _id: projectId,
      organization: organizationId
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Find the group
    const groupIndex = project.groups.findIndex((g: { name: string }) => g.name === groupName)
    if (groupIndex === -1) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    const group = project.groups[groupIndex]

    // Ensure group has required schedule fields with defaults if missing
    let groupModified = false
    if (!group.startTime) {
      group.startTime = '09:00' // Default start time
      groupModified = true
    }
    if (!group.endTime) {
      group.endTime = '17:00' // Default end time
      groupModified = true
    }
    if (!group.schedule) {
      group.schedule = {
        type: 'weekdays',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      }
      groupModified = true
    } else {
      // Ensure schedule has required fields
      if (!group.schedule.type) {
        group.schedule.type = 'weekdays'
        groupModified = true
      }
      if (!group.schedule.days || group.schedule.days.length === 0) {
        group.schedule.days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        groupModified = true
      }
    }

    // Mark the specific group as modified if we changed any fields
    if (groupModified) {
      project.markModified(`groups.${groupIndex}`)
    }

    // Check if batch name already exists in this group
    const existingBatch = group.batches.find((b: { batchName: string }) => b.batchName === batchName)
    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch name already exists in this group' },
        { status: 400 }
      )
    }

    // Create new batch
    const newBatch = {
      _id: new mongoose.Types.ObjectId(),
      batchName,
      timeline: {
        startDate: start,
        endDate: end
      },
      budget: {
        totalBudget: Number(totalBudget),
        currency,
        lecturerPayment: Number(lecturerPayment),
        materialCost: Number(materialCost)
      },
      status: 'ONGOING',
      
      students: []
    }

    // Add batch to group
    project.groups[groupIndex].batches.push(newBatch)

    // Mark the groups array as modified to ensure nested changes are saved
    project.markModified('groups')

    await project.save()

    return NextResponse.json({
      success: true,
      message: 'Batch created successfully',
      data: newBatch
    })

  } catch (error) {
    console.error('Create batch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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
    const organizationId = user.organization

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const groupName = searchParams.get('groupName')

    if (!projectId || !groupName) {
      return NextResponse.json(
        { error: 'projectId and groupName are required' },
        { status: 400 }
      )
    }

    // Find the project
    const project = await Project.findOne({
      _id: projectId,
      organization: organizationId
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Find the group
    const group = project.groups.find((g: { name: string }) => g.name === groupName)
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: group.batches
    })

  } catch (error) {
    console.error('Get batches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}