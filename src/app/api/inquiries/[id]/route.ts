import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Inquiry } from '@/models'
import { authenticateUser } from '@/lib/auth-utils'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'ATTENDED', 'STUDENT_ADDED'])
})

// PATCH /api/inquiries/[id] - Update inquiry status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { status } = updateSchema.parse(body)

    const inquiry = await Inquiry.findByIdAndUpdate(
      params.id,
      {
        status,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Inquiry updated successfully',
      inquiry
    })
  } catch (error) {
    console.error('Error updating inquiry:', error)

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