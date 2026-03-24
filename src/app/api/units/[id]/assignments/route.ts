import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Unit } from '@/models/Unit'
import { User } from '@/models/User'
import { allowCreate, allowRead, allowUpdate, allowDelete } from '@/lib/permissions/role-middleware'

// POST /api/units/[id]/assignments - Create a new assignment in the unit
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const unitId = params.id

    if (!unitId) {
      return NextResponse.json(
        { error: 'Unit ID required' },
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

    // Find the unit and add assignment to it
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

    // Ensure assignments array exists
    if (!unit.assignments) {
      unit.assignments = []
    }

    // Create assignment object
    const newAssignment = {
      title: title.trim(),
      description: description?.trim() || '',
      deadline: new Date(deadline),
      createdBy: userDoc._id,
      createdAt: new Date()
    }

    // Add assignment to unit
    unit.assignments.push(newAssignment)
    await unit.save()

    // Return the newly added assignment (it will have an _id from MongoDB)
    const addedAssignment = unit.assignments[unit.assignments.length - 1]

    return NextResponse.json(addedAssignment, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/units/[id]/assignments - Get all assignments for a unit or a specific assignment if assignmentId query param is provided
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const organizationId = userDoc.organization!
    const unitId = params.id
    const assignmentId = request.nextUrl.searchParams.get('assignmentId')

    if (!unitId) {
      return NextResponse.json(
        { error: 'Unit ID required' },
        { status: 400 }
      )
    }

    if (assignmentId) {
      // Get a specific assignment
      if (!assignmentId) {
        return NextResponse.json(
          { error: 'Assignment ID required' },
          { status: 400 }
        )
      }

      // Get the unit with the specific assignment
      const unit = await Unit.findOne({ 
        _id: unitId, 
        organization: organizationId 
      }).populate('courses', 'name').populate('assignments.createdBy', 'firstName lastName').populate('assignments.enrollment.studentId', '_id firstName lastName')

      if (!unit) {
        return NextResponse.json(
          { error: 'Unit not found' },
          { status: 404 }
        )
      }

      // Find the specific assignment in the unit's assignments array
      const assignment = unit.assignments.find((assignment: any) => assignment._id.toString() === assignmentId)

      if (!assignment) {
        return NextResponse.json(
          { error: 'Assignment not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        ...assignment,
        unit: {
          _id: unit._id,
          title: unit.title,
          description: unit.description
        },
        course: unit.courses?.[0] || null
      })
    } else {
      // Get all assignments
      // Get the unit with assignments
      const unit = await Unit.findOne({ 
        _id: unitId, 
        organization: organizationId 
      }).populate('assignments.createdBy', 'name email')

      if (!unit) {
        return NextResponse.json(
          { error: 'Unit not found' },
          { status: 404 }
        )
      }

      // Sort assignments by creation date (newest first)
      const assignments = unit.assignments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return NextResponse.json(assignments)
    }
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/units/[id]/assignments - Update an assignment in the unit
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    // Check update permissions
    const authResult = await allowUpdate(request)
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
    const unitId = params.id

    if (!unitId) {
      return NextResponse.json(
        { error: 'Unit ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { assignmentId, title, description, deadline } = body

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID required' },
        { status: 400 }
      )
    }

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

    // Find the unit
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

    // Ensure assignments array exists
    if (!unit.assignments) {
      unit.assignments = []
    }

    // Find the assignment index
    const assignmentIndex = unit.assignments.findIndex((assignment: any) => assignment._id.toString() === assignmentId)

    if (assignmentIndex === -1) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Update the assignment
    unit.assignments[assignmentIndex] = {
      ...unit.assignments[assignmentIndex],
      title: title.trim(),
      description: description?.trim() || '',
      deadline: new Date(deadline),
      createdBy: unit.assignments[assignmentIndex].createdBy, // Explicitly preserve createdBy
      updatedAt: new Date()
    }

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

// DELETE /api/units/[id]/assignments - Delete an assignment from the unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    // Check delete permissions
    const authResult = await allowDelete(request)
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
    const unitId = params.id

    if (!unitId) {
      return NextResponse.json(
        { error: 'Unit ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { assignmentId } = body

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID required' },
        { status: 400 }
      )
    }

    // Find the unit
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

    // Ensure assignments array exists
    if (!unit.assignments) {
      unit.assignments = []
    }

    // Find the assignment index
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