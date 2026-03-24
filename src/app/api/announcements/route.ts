import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Announcement } from '@/models/Announcement'
import { authenticateUser } from '@/lib/auth-utils'
import { PermissionService } from '@/lib/permissions/permission-service'
import { Permission } from '@/lib/permissions/permission-definitions'
import { z } from 'zod'
import mongoose from 'mongoose'

// Validation schemas
const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description cannot exceed 2000 characters'),
  featureImageUrl: z.string().url('Invalid image URL').optional(),
  happeningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD required)').refine((date) => {
    const d = new Date(date + 'T00:00:00.000Z');
    return d instanceof Date && !isNaN(d.getTime());
  }, 'Invalid happening date'),
  expireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD required)').refine((date) => {
    const d = new Date(date + 'T00:00:00.000Z');
    return d instanceof Date && !isNaN(d.getTime());
  }, 'Invalid expire date')
}).refine((data) => new Date(data.expireDate + 'T00:00:00.000Z') > new Date(data.happeningDate + 'T00:00:00.000Z'), {
  message: 'Expire date must be after happening date',
  path: ['expireDate']
})

// GET /api/announcements - Get all announcements (admin)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Check permissions
    const userId = authResult.user.id.toString()
  

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const all = searchParams.get('all') === 'true'
    const skip = (page - 1) * limit

    let announcements
    let total

    if (all) {
      // Fetch all announcements without pagination
      announcements = await Announcement.find({})
        .sort({ createdAt: -1 })
        .lean()
      total = announcements.length
    } else {
      // Fetch with pagination
      const result = await Promise.all([
        Announcement.find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Announcement.countDocuments({})
      ])
      announcements = result[0]
      total = result[1]
    }

    return NextResponse.json({
      announcements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/announcements - Create new announcement (updated for optional image URL)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user (no need for separate connectDB call)
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Fast permission check for global permissions
    const userRole = authResult.user.role
    const allowedRoles = ['admin', 'lecturer', 'teacher', 'student'] // Added student since we granted permission
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
  
    const body = await request.json()


    // Create announcement directly without extra processing
    const announcementData: any = {
      title: body.title,
      description: body.description,
      happeningDate: new Date(body.happeningDate + 'T00:00:00.000Z'),
      expireDate: new Date(body.expireDate + 'T00:00:00.000Z'),
      featureImageUrl: body.featureImageUrl||null,
    }

  
    // Clear model cache to ensure fresh schema
    delete mongoose.models.Announcement

    const announcement = new Announcement(announcementData)

    await announcement.save()

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)

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