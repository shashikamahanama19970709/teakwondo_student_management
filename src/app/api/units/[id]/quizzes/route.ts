import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Unit } from '@/models/Unit'
import { User } from '@/models/User'
import { authenticateUser } from '@/lib/auth-utils'

// POST /api/units/[id]/quizzes - Create a new quiz in the unit
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const unitId = params.id

    if (!unitId) {
      return NextResponse.json(
        { error: 'Unit ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { quizName, deadline, duration, questions, maxAttempts } = body

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

    if (!maxAttempts || maxAttempts < 1) {
  return NextResponse.json(
    { error: 'Max attempts must be at least 1' },
    { status: 400 }
  )
}

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      )
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      if (!question.questionText?.trim()) {
        return NextResponse.json(
          { error: `Question ${i + 1} text is required` },
          { status: 400 }
        )
      }
      if (!['short_answer', 'multiple_choice'].includes(question.type)) {
        return NextResponse.json(
          { error: `Question ${i + 1} type is invalid` },
          { status: 400 }
        )
      }
      if (question.type === 'multiple_choice') {
        if (!question.options || !Array.isArray(question.options) || question.options.length !== 4) {
          return NextResponse.json(
            { error: `Question ${i + 1} must have exactly 4 options` },
            { status: 400 }
          )
        }
        if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer > 3) {
          return NextResponse.json(
            { error: `Question ${i + 1} correct answer must be an option index (0-3)` },
            { status: 400 }
          )
        }
      } else {
        if (!question.correctAnswer?.trim()) {
          return NextResponse.json(
            { error: `Question ${i + 1} correct answer is required` },
            { status: 400 }
          )
        }
      }
    }

    // Find the unit and add the quiz
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

    // Create the quiz object
    const newQuiz = {
      quizName: quizName.trim(),
      deadline: new Date(deadline),
      duration,
        maxAttempts,
      questions,
      createdBy: user.id,
      createdAt: new Date()
    }

    // Add quiz to unit
    unit.quizzes.push(newQuiz)
    await unit.save()

    // Return the newly added quiz (it will have an _id from MongoDB)
    const addedQuiz = unit.quizzes[unit.quizzes.length - 1]
    return NextResponse.json(addedQuiz, { status: 201 })
  } catch (error) {
    console.error('Error creating quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/units/[id]/quizzes - Get all quizzes for a unit
// GET /api/units/[id]/quizzes?quizId=[quizId] - Get a specific quiz
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const unitId = params.id
    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')

    if (!unitId) {
      return NextResponse.json(
        { error: 'Unit ID required' },
        { status: 400 }
      )
    }

    // Get the unit with quizzes
    const unit = await Unit.findOne({ 
      _id: unitId, 
      organization: user.organization 
    }).populate('quizzes.createdBy', 'name email')

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    // If quizId is provided, return specific quiz
    if (quizId) {
      const quiz = unit.quizzes.find((quiz: any) => quiz._id.toString() === quizId)
      
      if (!quiz) {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        )
      }
      
      // Convert to plain object and include unit information
      const quizWithUnit = {
        ...quiz.toObject(),
        unit: {
          _id: unit._id,
          title: unit.title,
          description: unit.description
        }
      }
      
      return NextResponse.json(quizWithUnit)
    }

    // Otherwise, return all quizzes sorted by creation date (newest first)
    const quizzes = unit.quizzes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/units/[id]/quizzes?quizId=[quizId] - Update a specific quiz in a unit
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const unitId = params.id
    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')

    if (!unitId || !quizId) {
      return NextResponse.json(
        { error: 'Unit ID and Quiz ID are required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { quizName, deadline, duration, questions,maxAttempts  } = body

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
    if (!maxAttempts || maxAttempts < 1) {
  return NextResponse.json(
    { error: 'Max attempts must be at least 1' },
    { status: 400 }
  )
}

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      )
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      if (!question.questionText?.trim()) {
        return NextResponse.json(
          { error: `Question ${i + 1} text is required` },
          { status: 400 }
        )
      }
      if (!['short_answer', 'multiple_choice'].includes(question.type)) {
        return NextResponse.json(
          { error: `Question ${i + 1} type is invalid` },
          { status: 400 }
        )
      }
      if (question.type === 'multiple_choice') {
        if (!question.options || !Array.isArray(question.options) || question.options.length !== 4) {
          return NextResponse.json(
            { error: `Question ${i + 1} must have exactly 4 options` },
            { status: 400 }
          )
        }
        if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer > 3) {
          return NextResponse.json(
            { error: `Question ${i + 1} correct answer must be an option index (0-3)` },
            { status: 400 }
          )
        }
      } else {
        if (!question.correctAnswer?.trim()) {
          return NextResponse.json(
            { error: `Question ${i + 1} correct answer is required` },
            { status: 400 }
          )
        }
      }
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
        maxAttempts,

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

// DELETE /api/units/[id]/quizzes?quizId=[quizId] - Delete a specific quiz from a unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const unitId = params.id
    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')

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
