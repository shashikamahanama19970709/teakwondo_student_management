import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Unit } from '@/models/Unit'
import { User } from '@/models/User'
import { authenticateUser } from '@/lib/auth-utils'

// GET /api/units/[id]/quizzes/[quizId] - Get a specific quiz from a unit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; quizId: string } }
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

    const { user } = authResult
    const { id: unitId, quizId } = params

    if (!unitId || !quizId) {
      return NextResponse.json(
        { error: 'Unit ID and Quiz ID are required' },
        { status: 400 }
      )
    }

    // Get the unit with the specific quiz
    const unit = await Unit.findOne({ 
      _id: unitId, 
      organization: user.organization 
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    // Find the specific quiz in the unit's quizzes array
    const quiz = unit.quizzes.find((quiz: any) => quiz._id.toString() === quizId)

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/units/[id]/quizzes/[quizId] - Update a specific quiz in a unit
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; quizId: string } }
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

    const { user } = authResult
    const { id: unitId, quizId } = params

    if (!unitId || !quizId) {
      return NextResponse.json(
        { error: 'Unit ID and Quiz ID are required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { quizName, deadline, duration, questions } = body

    // Validate required fields
    if (!quizName?.trim()) {
      return NextResponse.json(
        { error: 'Quiz name is required' },
        { status: 400 }
      )
    }

    if (!deadline) {
      return NextResponse.json(
        { error: 'Deadline is required' },
        { status: 400 }
      )
    }

    if (!duration || duration < 1) {
      return NextResponse.json(
        { error: 'Duration must be at least 1 minute' },
        { status: 400 }
      )
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      )
    }

    // Get the unit
    const unit = await Unit.findOne({ 
      _id: unitId, 
      organization: user.organization 
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    // Find the quiz index
    const quizIndex = unit.quizzes.findIndex((quiz: any) => quiz._id.toString() === quizId)

    if (quizIndex === -1) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Update the quiz
    unit.quizzes[quizIndex] = {
      ...unit.quizzes[quizIndex],
      quizName: quizName.trim(),
      deadline: new Date(deadline),
      duration,
      questions,
      createdBy: unit.quizzes[quizIndex].createdBy, // Explicitly preserve createdBy
      updatedAt: new Date()
    }

    await unit.save()

    return NextResponse.json(unit.quizzes[quizIndex])
  } catch (error) {
    console.error('Error updating quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/units/[id]/quizzes/[quizId] - Delete a specific quiz from a unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; quizId: string } }
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

    const { user } = authResult
    const { id: unitId, quizId } = params

    if (!unitId || !quizId) {
      return NextResponse.json(
        { error: 'Unit ID and Quiz ID are required' },
        { status: 400 }
      )
    }

    // Get the unit
    const unit = await Unit.findOne({ 
      _id: unitId, 
      organization: user.organization 
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    // Find and remove the quiz
    const quizIndex = unit.quizzes.findIndex((quiz: any) => quiz._id.toString() === quizId)

    if (quizIndex === -1) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Remove the quiz from the array
    unit.quizzes.splice(quizIndex, 1)
    await unit.save()

    return NextResponse.json(
      { message: 'Quiz deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
