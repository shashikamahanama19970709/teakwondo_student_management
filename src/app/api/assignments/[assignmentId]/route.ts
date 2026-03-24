import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Assignment } from '@/models/Assignment'
import { AssignmentSubmission } from '@/models/AssignmentSubmission'
import { User } from '@/models/User'
import { Unit } from '@/models/Unit'
import { allowRead, allowUpdate, allowDelete } from '@/lib/permissions/role-middleware'

// GET /api/assignments/[assignmentId] - Get a single assignment
// export async function GET(
//   request: NextRequest,
//   { params }: { params: { assignmentId: string } }
// ) {
//   try {
//     await connectDB()

//     // Check read permissions
//     const authResult = await allowRead(request)
//     if (authResult instanceof NextResponse) {
//       return authResult
//     }

//     const { user } = authResult

//     // Get user from database
//     const userDoc = await User.findById(user.id)
//     if (!userDoc) {
//       return NextResponse.json(
//         { error: 'User not found' },
//         { status: 404 }
//       )
//     }

//     const organizationId = userDoc.organization!
//     const assignmentId = params.assignmentId

//     if (!assignmentId) {
//       return NextResponse.json(
//         { error: 'Assignment ID required' },
//         { status: 400 }
//       )
//     }

//     // Get the assignment
//     const assignment = await Assignment.findOne({
//       _id: assignmentId,
//       organization: organizationId
//     })
//     .populate('createdBy', 'firstName lastName')
//     .populate('unitId', 'title description')
//     .populate('course', 'name')

//     if (!assignment) {
//       return NextResponse.json(
//         { error: 'Assignment not found' },
//         { status: 404 }
//       )
//     }

//     // Rename populated fields to match interface
//     const assignmentData = {
//       ...assignment.toObject(),
//       unit: assignment.unitId,
//       unitId: undefined
//     }

//     return NextResponse.json(assignmentData)
//   } catch (error) {
//     console.error('Error fetching assignment:', error)
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }

// // PUT /api/assignments/[assignmentId] - Update an assignment
// export async function PUT(
//   request: NextRequest,
//   { params }: { params: { assignmentId: string } }
// ) {
//   try {
//     await connectDB()

//     // Check update permissions
//     const authResult = await allowUpdate(request)
//     if (authResult instanceof NextResponse) {
//       return authResult
//     }

//     const { user } = authResult

//     // Get user from database
//     const userDoc = await User.findById(user.id)
//     if (!userDoc) {
//       return NextResponse.json(
//         { error: 'User not found' },
//         { status: 404 }
//       )
//     }

//     const organizationId = userDoc.organization!
//     const assignmentId = params.assignmentId

//     if (!assignmentId) {
//       return NextResponse.json(
//         { error: 'Assignment ID required' },
//         { status: 400 }
//       )
//     }

//     const body = await request.json()
//     const { title, description, deadline } = body

//     // Validate required fields
//     if (!title?.trim()) {
//       return NextResponse.json(
//         { error: 'Assignment title is required' },
//         { status: 400 }
//       )
//     }

//     if (!description?.trim()) {
//       return NextResponse.json(
//         { error: 'Assignment description is required' },
//         { status: 400 }
//       )
//     }

//     if (!deadline) {
//       return NextResponse.json(
//         { error: 'Deadline is required' },
//         { status: 400 }
//       )
//     }

//     // Update the assignment
//     const assignment = await Assignment.findOneAndUpdate(
//       {
//         _id: assignmentId,
//         organization: organizationId
//       },
//       {
//         title: title.trim(),
//         description: description.trim(),
//         deadline: new Date(deadline)
//       },
//       { new: true }
//     ).populate('createdBy', 'name email')

//     if (!assignment) {
//       return NextResponse.json(
//         { error: 'Assignment not found' },
//         { status: 404 }
//       )
//     }

//     return NextResponse.json(assignment)
//   } catch (error) {
//     console.error('Error updating assignment:', error)
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }

// DELETE /api/assignments/[assignmentId] - Delete an assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
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
    const assignmentId = params.assignmentId

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID required' },
        { status: 400 }
      )
    }

    // Check if assignment has submissions - prevent deletion if students have already submitted
    const existingSubmissions = await AssignmentSubmission.findOne({ assignmentId })
    if (existingSubmissions) {
      return NextResponse.json(
        { error: 'Cannot delete assignment after students have submitted work' },
        { status: 400 }
      )
    }

    // Delete the assignment
    const assignment = await Assignment.findOneAndDelete({
      _id: assignmentId,
      organization: organizationId
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/assignments/[assignmentId] - Get a specific assignment by searching across units
export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    await connectDB()

    // Check read permissions
    const authResult = await allowRead(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult
    const assignmentId = params.assignmentId

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID required' },
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

    // Find the unit that contains this assignment
    const unit = await Unit.findOne({
      organization: organizationId,
      'assignments._id': assignmentId
    }).populate('courses', 'name').populate('assignments.createdBy', 'firstName lastName')

    if (!unit) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Find the specific assignment
    const assignment = unit.assignments.find((a: any) => a._id.toString() === assignmentId)

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Return assignment with unit and course info
    return NextResponse.json({
      ...assignment.toObject(),
      unit: {
        _id: unit._id,
        title: unit.title,
        description: unit.description
      },
      course: unit.courses?.[0]
    })
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/assignments/[id] - Update a specific assignment
export async function PUT(
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
    const assignmentId = params.id

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, description, deadline, maxScore } = body

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

    // Find the unit that contains this assignment
    const unit = await Unit.findOne({
      organization: organizationId,
      'assignments._id': assignmentId
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Find the assignment index
    const assignmentIndex = unit.assignments.findIndex((a: any) => a._id.toString() === assignmentId)

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
      maxScore: maxScore || unit.assignments[assignmentIndex].maxScore,
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