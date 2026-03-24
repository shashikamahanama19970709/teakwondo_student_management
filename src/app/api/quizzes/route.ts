import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-utils'
import connectDB from '@/lib/db-config'
import { Unit } from '@/models/Unit'

// GET /api/quizzes - Get all quizzes across all units
export async function GET(request: NextRequest) {
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

    // Get all units for the user's organization
    const units = await Unit.find({ 
      organization: user.organization 
    }).populate('quizzes.createdBy', 'name email')

    if (!units || units.length === 0) {
      return NextResponse.json({ quizzes: [] })
    }

    // Collect all quizzes from all units
    const allQuizzes: any[] = []
    
    units.forEach((unit: any) => {
      if (unit.quizzes && unit.quizzes.length > 0) {
        unit.quizzes.forEach((quiz: any) => {
          allQuizzes.push({
            ...quiz.toObject(),
            unit: {
              _id: unit._id,
              title: unit.title,
              description: unit.description
            }
          })
        })
      }
    })

    // Sort quizzes by creation date (newest first)
    allQuizzes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ quizzes: allQuizzes })
  } catch (error) {
    console.error('Error fetching all quizzes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult
    const { quizName, deadline, duration, questions, unit: unitId } = await request.json()

    // Validate required fields
    if (!quizName || !deadline || !duration || !questions || !unitId) {
      return NextResponse.json({ 
        error: 'Missing required fields: quizName, deadline, duration, questions, unit' 
      }, { status: 400 })
    }

    await connectDB()

    // Verify the unit exists and user has permission
    const unit = await Unit.findOne({
      _id: unitId,
      organization: user.organization
    })

    if (!unit) {
      return NextResponse.json({ 
        error: 'Unit not found or access denied' 
      }, { status: 404 })
    }

    // Create the quiz object directly in the unit's quizzes array
    const quizData = {
      quizName,
      deadline: new Date(deadline),
      duration,
      questions,
      createdBy: user.id,
      createdAt: new Date()
    }

    // Update the unit by pushing the embedded quiz
    const updatedUnit = await Unit.findByIdAndUpdate(
      unitId,
      {
        $push: { quizzes: quizData }
      },
      { new: true }
    )

    if (!updatedUnit) {
      return NextResponse.json({ 
        error: 'Unit not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Quiz created successfully', 
      quiz: quizData
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating quiz:', error)
    return NextResponse.json({ 
      error: 'Failed to create quiz' 
    }, { status: 500 })
  }
}
