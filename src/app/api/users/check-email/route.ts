import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { User } from '@/models'
import { z } from 'zod'

const checkEmailSchema = z.object({
  email: z.string().email('Invalid email address')
})

// POST /api/users/check-email - Check if email already exists
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { email } = checkEmailSchema.parse(body)

    const existingUser = await User.findOne({ email: email.toLowerCase() })

    return NextResponse.json({
      exists: !!existingUser
    })
  } catch (error) {
    console.error('Error checking email:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}