import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Unit } from '@/models/Unit'
import { authenticateUser } from '@/lib/auth-utils'
import mongoose from 'mongoose'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; quizId: string } }
) {
  try {
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { answers, startedAt, timeSpent } = await request.json()
    if (!answers || !startedAt) {
      return NextResponse.json({ error: 'Answers and startedAt are required' }, { status: 400 })
    }


    await connectDB()

    // Find the unit and specific quiz
    const unit = await Unit.findOne({
      _id: params.id,
      'quizzes._id': params.quizId
    })

    if (!unit) {
      return NextResponse.json({ error: 'Unit or quiz not found' }, { status: 404 })
    }

    // Find the specific quiz
    const quiz = unit.quizzes.find((q: any) => q._id.toString() === params.quizId)
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Check if quiz is still active (not past deadline)
    if (new Date() > new Date(quiz.deadline)) {
      return NextResponse.json({ error: 'Quiz deadline has passed' }, { status: 400 })
    }

    // Check if student already has an enrollment record for this quiz
    let studentEnrollment = quiz.enrollment?.find(
      (e: any) => e.studentId.equals(authResult.user.id)
    )


    // Calculate score first
    let score = 0
    let totalPoints = 0
    quiz.questions.forEach((question: any, index: number) => {
      totalPoints += question.points || 1
      const userAnswer = answers[index]
      const correctAnswer = question.correctAnswer
      
      if (userAnswer === correctAnswer) {
        score += question.points || 1
      }
    })

    const finalScore = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0

    if (!studentEnrollment) {
      // Create new enrollment record
      if (!quiz.enrollment) {
        quiz.enrollment = []
      }
      studentEnrollment = {
        studentId: new mongoose.Types.ObjectId(authResult.user.id),
        attempts: [{
          attemptNumber: 1, 
          score: finalScore, 
          startedAt: new Date(startedAt), 
          timeSpent: timeSpent || 0,
          submittedAt: new Date(),
          answers: answers
        }]
      }
      quiz.enrollment.push(studentEnrollment)
    }

    // Calculate attempt number
    const attemptNumber = studentEnrollment.attempts.length + 1

    // Add new attempt
    const newAttempt = {
      attemptNumber,
      startedAt: new Date(startedAt),
      submittedAt: new Date(),
      score: finalScore,
      answers,
      timeSpent: timeSpent || 0
    }
    
    
    studentEnrollment.attempts.push(newAttempt)
    

    await unit.save()
    

    return NextResponse.json({ 
      message: 'Quiz attempt submitted successfully',
      attemptNumber,
      score: finalScore,
      maxScore: totalPoints,
      percentage: finalScore,
attemptsRemaining: Math.max(0, quiz.maxAttempts - attemptNumber)    })

  } catch (error) {
    console.error('Error submitting quiz attempt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; quizId: string } }
) {
  try {
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    await connectDB()

    // Find the unit and specific quiz
    const unit = await Unit.findOne({
      _id: params.id,
      'quizzes._id': params.quizId
    })

    if (!unit) {
      return NextResponse.json({ error: 'Unit or quiz not found' }, { status: 404 })
    }

    // Find the specific quiz
    const quiz = unit.quizzes.find((q: any) => q._id.toString() === params.quizId)
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Get student's enrollment data
    const studentEnrollment = quiz.enrollment?.find(
      (e: any) => e.studentId.equals(authResult.user.id)
    )

    return NextResponse.json({
      quiz: {
        _id: quiz._id,
        quizName: quiz.quizName,
        deadline: quiz.deadline,
        duration: quiz.duration,
        questions: quiz.questions,
        unitId: params.id
      },
      enrollment: studentEnrollment || null,
      canRetake: new Date() <= new Date(quiz.deadline),
attemptsRemaining: Math.max(0, quiz.maxAttempts - (studentEnrollment?.attempts.length || 0))    })

  } catch (error) {
    console.error('Error fetching quiz data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
