import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-utils'
import { b2Client } from '@/lib/backblaze'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'profile-pictures'
    const memberId = formData.get('memberId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!memberId) {
      return NextResponse.json({ error: 'No member ID provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, and WEBP formats are supported' }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(buffer)

    // Generate unique filename with timestamp and member ID
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${folder}/${timestamp}-${memberId}-${originalName}`

    // Upload to Backblaze
    const fileUrl = await b2Client.uploadFile(fileBuffer, fileName, file.type)
    
    // Return the file key as-is (without /file/ prefix)
    // The signed URL will construct the proper Backblaze URL

    return NextResponse.json({
      success: true,
      fileUrl, // Returns: "profile-pictures/filename.jpg"
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Profile picture upload error:', error)
    return NextResponse.json(
      { error: 'Profile picture upload failed: The file may be corrupted or the upload was interrupted. Please try again.' },
      { status: 500 }
    )
  }
}
