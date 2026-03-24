import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Unit } from '@/models/Unit'
import { User } from '@/models/User'
import { allowCreate, allowRead, allowUpdate, allowDelete } from '@/lib/permissions/role-middleware'

// GET /api/units/[id]/assignments/[assignmentId] - Get a specific assignment from a unit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    await connectDB()

    // Check read permissions
    const authResult = await allowRead(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult
    const { id: unitId, assignmentId } = params

    if (!unitId || !assignmentId) {
      return NextResponse.json(
        { error: 'Unit ID and Assignment ID are required' },
        { status: 400 }
      )
    }

    // Get user from database
    const userDoc = await User.findById(user.id)
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const organizationId = userDoc.organization!

    // Get the unit with the specific assignment
    const unit = await Unit.findOne({ 
      _id: unitId, 
      organization: organizationId 
    }).populate('courses', 'name')

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }
    console.log('assignmentId:', assignmentId) // Debug log
console.log('Fetched unit:', unit) // Debug log
    // Find the specific assignment in the unit's assignments array
    const assignment = unit.assignments.find((assignment: any) => assignment._id.toString() === assignmentId)

    
    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...assignment.toObject(),
      unit: {
        _id: unit._id,
        title: unit.title,
        description: unit.description
      },
      courses: unit.courses
    })
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/units/[id]/assignments/[assignmentId] - Update a specific assignment in a unit
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    await connectDB()

    // Check update permissions
    const authResult = await allowUpdate(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult
    const { id: unitId, assignmentId } = params

    if (!unitId || !assignmentId) {
      return NextResponse.json(
        { error: 'Unit ID and Assignment ID are required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, description, deadline } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Assignment title is required' },
        { status: 400 }
      )
    }

    if (!deadline) {
      return NextResponse.json(
        { error: 'Deadline is required' },
        { status: 400 }
      )
    }

    // Get user from database
    const userDoc = await User.findById(user.id)
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const organizationId = userDoc.organization!

    // Get the unit
    const unit = await Unit.findOne({ 
      _id: unitId, 
      organization: organizationId 
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    // Find the assignment index
    const assignmentIndex = unit.assignments.findIndex((assignment: any) => assignment._id.toString() === assignmentId)

    if (assignmentIndex === -1) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Update the assignment in place (don't replace the object to preserve _id)
    const existingAssignment = unit.assignments[assignmentIndex]
    existingAssignment.title = title.trim()
    existingAssignment.description = description?.trim() || ''
    existingAssignment.deadline = new Date(deadline)
    existingAssignment.updatedAt = new Date()
    // Preserve createdBy and enrollment - don't modify them

    await unit.save()

    return NextResponse.json(unit.assignments[assignmentIndex])
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/units/[id]/assignments/[assignmentId] - Delete a specific assignment from a unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    await connectDB()

    // Check delete permissions
    const authResult = await allowDelete(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult
    const { id: unitId, assignmentId } = params

    if (!unitId || !assignmentId) {
      return NextResponse.json(
        { error: 'Unit ID and Assignment ID are required' },
        { status: 400 }
      )
    }

    // Get user from database
    const userDoc = await User.findById(user.id)
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const organizationId = userDoc.organization!

    // Get the unit
    const unit = await Unit.findOne({ 
      _id: unitId, 
      organization: organizationId 
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    // Find and remove the assignment
    const assignmentIndex = unit.assignments.findIndex((assignment: any) => assignment._id.toString() === assignmentId)

    if (assignmentIndex === -1) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Remove the assignment from the array
    unit.assignments.splice(assignmentIndex, 1)
    await unit.save()

    return NextResponse.json(
      { message: 'Assignment deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
