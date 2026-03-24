import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Announcement } from '@/models/Announcement'
import { authenticateUser } from '@/lib/auth-utils'
import { PermissionService } from '@/lib/permissions/permission-service'
import { Permission } from '@/lib/permissions/permission-definitions'
import { z } from 'zod'
import mongoose from 'mongoose'

const updateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters').optional(),
  description: z.string().min(1, 'Description is required').max(2000, 'Description cannot exceed 2000 characters').optional(),
  featureImageUrl: z.string().url('Invalid image URL').optional(),
  happeningDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid happening date').optional(),
  expireDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid expire date').optional(),
  isActive: z.boolean().optional()
}).refine((data) => {
  if (data.expireDate && data.happeningDate) {
    return new Date(data.expireDate) > new Date(data.happeningDate)
  }
  return true
}, {
  message: 'Expire date must be after happening date',
  path: ['expireDate']
})

// GET /api/announcements/[id] - Get single announcement
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Check permissions
    const userId = authResult.user.id.toString()
   

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid announcement ID' }, { status: 400 })
    }

    const announcement = await Announcement.findById(params.id)

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Error fetching announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/announcements/[id] - Update announcement
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Check permissions
    const userId = authResult.user.id.toString()
   

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid announcement ID' }, { status: 400 })
    }

    const body = await request.json()

    // Validate input
    const validatedData = updateAnnouncementSchema.parse(body)

    // Convert date strings to Date objects
    const updateData: any = { ...validatedData }
    if (validatedData.happeningDate) {
      updateData.happeningDate = new Date(validatedData.happeningDate)
    }
    if (validatedData.expireDate) {
      updateData.expireDate = new Date(validatedData.expireDate)
    }

    const announcement = await Announcement.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Error updating announcement:', error)

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

// DELETE /api/announcements/[id] - Delete announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Check permissions
    const userId = authResult.user.id.toString()
    

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid announcement ID' }, { status: 400 })
    }

    const announcement = await Announcement.findByIdAndDelete(params.id)

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Announcement deleted successfully' })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}