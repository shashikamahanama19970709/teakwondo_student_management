import { NextRequest, NextResponse } from 'next/server'
import { b2Client } from '@/lib/backblaze'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-zip-compressed'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOCX, TXT, images, and ZIP files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)

    // Generate unique filename with uploads prefix
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop()
    const nameWithoutExt = file.name.split('.').slice(0, -1).join('.')
    const uniqueFileName = `uploads/${nameWithoutExt}_${timestamp}_${random}.${extension}`

    // Upload to Backblaze B2
    const fileUrl = await b2Client.uploadFile(uint8Array, uniqueFileName, file.type)
    
    // Return the file key as-is (without /file/ prefix)
    // The signed URL will construct the proper Backblaze URL

    return NextResponse.json({
      success: true,
      fileUrl, // Returns: "uploads/filename.jpg"
      fileName: uniqueFileName,
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'File upload failed: The file may be corrupted or the upload was interrupted. Please try again.' },
      { status: 500 }
    )
  }
}
