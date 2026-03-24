import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Quiz } from '@/models/Quiz'
import { QuizAttempt } from '@/models/QuizAttempt'
import { User } from '@/models/User'
import { Unit } from '@/models/Unit'
import { allowRead, allowUpdate, allowDelete } from '@/lib/permissions/role-middleware'

// GET /api/quizzes/[id]/unit - Get unit ID for a quiz
async function getUnitForQuiz(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('GET_UNIT called for quizId:', params.id)
  
  try {
    await connectDB()

    // Find the unit that contains this quiz
    const unit = await Unit.findOne({
      'quizzes._id': params.id
    })

    console.log('Found unit:', unit ? 'Yes' : 'No')

    if (!unit) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Find the specific quiz
    const quiz = unit.quizzes.find((q: any) => q._id.toString() === params.id)
    console.log('Found quiz:', quiz ? 'Yes' : 'No')
    
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Return just the unit ID
    return NextResponse.json({
      unitId: unit._id,
      quizId: quiz._id,
      quizName: quiz.quizName
    })

  } catch (error) {
    console.error('Error fetching unit ID for quiz:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/quizzes/[quizId] - Get a single quiz
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if this is a request for unit ID
  const { searchParams } = new URL(request.url)
  if (searchParams.get('type') === 'unit') {
    return getUnitForQuiz(request, { params })
  }

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
    const quizId = params.id

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID required' },
        { status: 400 }
      )
    }

    // Get the quiz
    const quiz = await Quiz.findOne({
      _id: quizId,
      organization: organizationId
    })
    .populate('createdBy', 'name email')
    .populate('unitId', 'title')

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // If user is a student, get their attempt information
    let studentAttempts = []
    if (userDoc.role === 'student') {
      studentAttempts = await QuizAttempt.find({
        quizId,
        studentId: userDoc._id
      }).sort({ attemptNumber: 1 })

      // Don't send correct answers to students
      const quizForStudent = quiz.toObject()
      quizForStudent.questions = quiz.questions.map((q: any) => ({
        ...q.toObject(),
        correctAnswer: undefined // Remove correct answers for students
      }))
      
      return NextResponse.json({
        ...quizForStudent,
        studentAttempts,
        attemptsRemaining: Math.max(0, 3 - studentAttempts.length)
      })
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

// PUT /api/quizzes/[quizId] - Update a quiz
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

    // Get user from database
    const userDoc = await User.findById(user.id)
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const organizationId = userDoc.organization!
    const quizId = params.id

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID required' },
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

    // Check if quiz has attempts - prevent editing if students have already attempted
    const existingAttempts = await QuizAttempt.findOne({ quizId })
    if (existingAttempts) {
      return NextResponse.json(
        { error: 'Cannot edit quiz after students have attempted it' },
        { status: 400 }
      )
    }

    // Update the quiz
    const quiz = await Quiz.findOneAndUpdate(
      {
        _id: quizId,
        organization: organizationId
      },
      {
        quizName: quizName.trim(),
        deadline: new Date(deadline),
        duration,
        questions: questions || []
      },
      { new: true }
    ).populate('createdBy', 'name email')

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error updating quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/quizzes/[quizId] - Delete a quiz
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
    const quizId = params.id

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID required' },
        { status: 400 }
      )
    }

    // Check if quiz has attempts - prevent deletion if students have already attempted
    const existingAttempts = await QuizAttempt.findOne({ quizId })
    if (existingAttempts) {
      return NextResponse.json(
        { error: 'Cannot delete quiz after students have attempted it' },
        { status: 400 }
      )
    }

    // Delete the quiz
    const quiz = await Quiz.findOneAndDelete({
      _id: quizId,
      organization: organizationId
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Error deleting quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
