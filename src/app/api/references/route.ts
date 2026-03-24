import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import Reference from '@/models/Reference'
import { authenticateUser } from '@/lib/auth-utils'
import { PermissionService } from '@/lib/permissions/permission-service'
import { Permission } from '@/lib/permissions/permission-definitions'
import { z } from 'zod'
import { b2Client } from '@/lib/backblaze'

// Validation schemas
const createReferenceSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  name: z.string().min(1, 'Name is required').max(255, 'Name cannot exceed 255 characters'),
  originalName: z.string().min(1, 'Original name is required').max(255, 'Original name cannot exceed 255 characters'),
  url: z.string().url('Invalid URL'),
  size: z.number().min(0, 'Size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required')
})

// GET /api/references?taskId=<taskId>&page=<page>&limit=<limit> - Get references for a task
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '5')
    const skip = (page - 1) * limit

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const userId = authResult.user.id

    // Check permissions - user should have access to the task
    const hasPermission = await PermissionService.hasPermission(
      userId,
      Permission.TASK_READ
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const [references, total] = await Promise.all([
      Reference.find({ taskId })
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'firstName lastName email')
        .lean(),
      Reference.countDocuments({ taskId })
    ])

    return NextResponse.json({
      references,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching references:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/references - Create new reference
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const userId = authResult.user.id

    const body = await request.json()

    // Validate input
    const validationResult = createReferenceSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { taskId, name, originalName, url, size, mimeType } = validationResult.data

    // Check permissions - user should have access to the task
    const hasPermission = await PermissionService.hasPermission(
      userId,
      Permission.TASK_UPDATE
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create reference
    const reference = new Reference({
      taskId,
      name,
      originalName,
      url,
      size,
      mimeType,
      uploadedBy: userId
    })

    await reference.save()

    // Populate uploadedBy for response
    await reference.populate('uploadedBy', 'firstName lastName email')

    return NextResponse.json({
      reference,
      message: 'Reference created successfully'
    })
  } catch (error) {
    console.error('Error creating reference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}