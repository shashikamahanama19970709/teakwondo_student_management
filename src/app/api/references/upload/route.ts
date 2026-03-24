import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import Reference from '@/models/Reference'
import { authenticateUser } from '@/lib/auth-utils'
import { PermissionService } from '@/lib/permissions/permission-service'
import { Permission } from '@/lib/permissions/permission-definitions'
import { b2Client } from '@/lib/backblaze'

// POST /api/references/upload - Upload files to references
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const userId = authResult.user.id

    const formData = await request.formData()
    const file = formData.get('file') as File
    const taskId = formData.get('taskId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    // Check permissions - user should have access to the task
    const hasPermission = await PermissionService.hasPermission(
      userId,
      Permission.TASK_UPDATE
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate file type
    const allowedTypes = ['image/', 'video/']
    const isAllowedType = allowedTypes.some(type => file.type.startsWith(type))

    if (!isAllowedType) {
      return NextResponse.json({ error: 'Only images and videos are allowed' }, { status: 400 })
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 100MB' }, { status: 400 })
    }

    // Upload to Backblaze
    const buffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(buffer)

    const fileName = `references/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const fileUrl = await b2Client.uploadFile(fileBuffer, fileName, file.type)

    // Create reference record
    const reference = new Reference({
      taskId,
      name: fileName,
      originalName: file.name,
      url: fileUrl,
      size: file.size,
      mimeType: file.type,
      uploadedBy: userId
    })

    await reference.save()

    // Populate uploadedBy for response
    await reference.populate('uploadedBy', 'firstName lastName email')

    return NextResponse.json({
      reference,
      message: 'File uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}