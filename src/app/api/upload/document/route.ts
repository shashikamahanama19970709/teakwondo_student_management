import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-utils'
import { b2Client } from '@/lib/backblaze'

// Document file validation
const ACCEPTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only document files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 25MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(buffer)

    // Generate unique filename
    const fileName = `units/documents/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // Upload to Backblaze
    const fileUrl = await b2Client.uploadFile(fileBuffer, fileName, file.type)
    
    // Return the file key as-is (without /file/ prefix)
    // The signed URL will construct the proper Backblaze URL

    return NextResponse.json({
      fileId: Date.now().toString(), // Using timestamp as fileId for now
      fileUrl, // Returns: "units/documents/filename.jpg"
      fileName: file.name,
      fileType: 'document',
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Document upload failed: The file may be corrupted or the upload was interrupted. Please try again.' },
      { status: 500 }
    )
  }
}