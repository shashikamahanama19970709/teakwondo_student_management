import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Unit } from '@/models/Unit'
import { authenticateUser } from '@/lib/auth-utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    await connectDB()

    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const assignmentId = params.assignmentId

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { studentId, mark } = body

    if (!studentId || mark === undefined) {
      return NextResponse.json(
        { error: 'Student ID and mark are required' },
        { status: 400 }
      )
    }

    // Find the unit containing this assignment
    const unit = await Unit.findOne({
      'assignments._id': assignmentId
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Find the assignment
    const assignment = unit.assignments.find((a: any) => a._id.toString() === assignmentId)

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Find the enrollment for this student
    const enrollment = assignment.enrollment?.find((e: any) => e.studentId.toString() === studentId)

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Student enrollment not found' },
        { status: 404 }
      )
    }

    // Update the mark
    enrollment.mark = mark

    // Save the unit
    await unit.save()

    return NextResponse.json(
      { message: 'Mark updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating mark:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
