import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Quiz } from '@/models/Quiz'
import { QuizAttempt } from '@/models/QuizAttempt'
import { User } from '@/models/User'
import { allowCreate, allowRead } from '@/lib/permissions/role-middleware'

// POST /api/quizzes/[quizId]/attempts - Submit a quiz attempt
export async function POST(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    await connectDB()

    // Check create permissions (students can create attempts)
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

    if (userDoc.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can attempt quizzes' },
        { status: 403 }
      )
    }

    const organizationId = userDoc.organization!
    const quizId = params.quizId

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { answers, startedAt, timeSpent } = body

    // Validate required fields
    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Answers are required' },
        { status: 400 }
      )
    }

    if (!startedAt) {
      return NextResponse.json(
        { error: 'Start time is required' },
        { status: 400 }
      )
    }

    if (typeof timeSpent !== 'number' || timeSpent < 0) {
      return NextResponse.json(
        { error: 'Valid time spent is required' },
        { status: 400 }
      )
    }

    // Get the quiz
    const quiz = await Quiz.findOne({
      _id: quizId,
      organization: organizationId
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Check if deadline has passed
    if (new Date() > new Date(quiz.deadline)) {
      return NextResponse.json(
        { error: 'Quiz deadline has passed' },
        { status: 400 }
      )
    }

    // Check number of attempts (max 3)
    const existingAttempts = await QuizAttempt.countDocuments({
      quizId,
      studentId: userDoc._id
    })

    if (existingAttempts >= 3) {
      return NextResponse.json(
        { error: 'Maximum attempts (3) reached' },
        { status: 400 }
      )
    }

    // Validate answers count matches questions count
    if (answers.length !== quiz.questions.length) {
      return NextResponse.json(
        { error: 'Number of answers must match number of questions' },
        { status: 400 }
      )
    }

    // Calculate score
    let score = 0
    let maxScore = 0

    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i]
      const studentAnswer = answers[i]
      const points = question.points || 1
      maxScore += points

      // Check if answer is correct
      let isCorrect = false
      if (question.type === 'multiple_choice') {
        isCorrect = studentAnswer === question.correctAnswer
      } else {
        // For short answers, do case-insensitive comparison
        isCorrect = String(studentAnswer).toLowerCase().trim() === 
                   String(question.correctAnswer).toLowerCase().trim()
      }

      if (isCorrect) {
        score += points
      }
    }

    // Create the quiz attempt
    const attempt = new QuizAttempt({
      quizId,
      studentId: userDoc._id,
      answers,
      score,
      maxScore,
      attemptNumber: existingAttempts + 1,
      startedAt: new Date(startedAt),
      timeSpent,
      organization: organizationId
    })

    await attempt.save()

    return NextResponse.json({
      attempt,
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      attemptNumber: existingAttempts + 1,
      attemptsRemaining: Math.max(0, 3 - (existingAttempts + 1))
    }, { status: 201 })
  } catch (error) {
    console.error('Error submitting quiz attempt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/quizzes/[quizId]/attempts - Get all attempts for a quiz (admin/lecturer only)
export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
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
    const quizId = params.quizId

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID required' },
        { status: 400 }
      )
    }

    // Only allow admin/lecturer/teacher to view all attempts
    if (!['admin', 'lecturer', 'teacher'].includes(userDoc.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get all attempts for this quiz
    const attempts = await QuizAttempt.find({
      quizId,
      organization: organizationId
    })
    .populate('studentId', 'name email')
    .sort({ submittedAt: -1 })

    return NextResponse.json(attempts)
  } catch (error) {
    console.error('Error fetching quiz attempts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
