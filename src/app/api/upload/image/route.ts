import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-utils'
import { PermissionService } from '@/lib/permissions/permission-service'
import { Permission } from '@/lib/permissions/permission-definitions'
import { b2Client } from '@/lib/backblaze'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Check permissions (allow any authenticated user to upload images for now)
    const userId = authResult.user.id.toString()
    // You can add specific permission checks here if needed

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type (allow images and videos)
    const allowedTypes = ['image/', 'video/']
    const isValidType = allowedTypes.some(type => file.type.startsWith(type))
    if (!isValidType) {
      return NextResponse.json({ error: 'Only image and video files are allowed' }, { status: 400 })
    }

    // Validate file size (max 50MB for videos, 10MB for images)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      const maxSizeText = file.type.startsWith('video/') ? '50MB' : '10MB'
      return NextResponse.json({ error: `File size too large (max ${maxSizeText})` }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(buffer)

    // Generate unique filename
    const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // Upload to Backblaze
    const fileUrl = await b2Client.uploadFile(fileBuffer, fileName, file.type)
    
    // Return the file key as-is (without /file/ prefix)
    // The signed URL will construct the proper Backblaze URL

    return NextResponse.json({
      fileId: Date.now().toString(), // Using timestamp as fileId for now
      fileUrl, // Returns: "images/filename.jpg"
      fileName: file.name,
      fileType: 'image',
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Image upload failed: The file may be corrupted or the upload was interrupted. Please try again.' },
      { status: 500 }
    )
  }
}