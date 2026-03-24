import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db-config'
import { Inquiry } from '@/models'

const inquirySchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name cannot exceed 50 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required').max(20, 'Phone cannot exceed 20 characters'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message cannot exceed 1000 characters'),
  announcementTitle: z.string().optional()
})

// POST /api/announcements/inquiry - Submit inquiry for announcement
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()

    // Validate input
    const validatedData = inquirySchema.parse(body)

    // Create inquiry in database
    const inquiry = new Inquiry({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      message: validatedData.message,
      announcementTitle: validatedData.announcementTitle,
      type: validatedData.announcementTitle === 'Custom Inquiry' ? 'Custom' : 'Announcement'
    })

    await inquiry.save()

    return NextResponse.json({
      message: 'Inquiry submitted successfully'
    })
  } catch (error) {
    console.error('Error processing inquiry:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message?.includes('already submitted an inquiry')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}