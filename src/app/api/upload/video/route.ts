import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-utils'
import { b2Client } from '@/lib/backblaze'

// Video file validation
const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/mov',
  'video/avi',
  'video/wmv',
  'video/flv',
  'video/webm',
  'video/mkv'
]

// IMPORTANT: Keep this in sync with the frontend upload limit.
// Very large files can still cause memory and timeout issues when
// routed through the Next.js API before being sent to Backblaze.
// We set this to 1GB to allow ~850MB uploads while avoiding
// extremely large payloads that are likely to exhaust memory.
const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }


    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only video files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 500MB.' },
        { status: 400 }
      )
    }

  
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
      fileUrl, // Returns: "videos/filename.jpg"
      fileName: file.name,
      fileType: 'video',
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json(
      { error: 'Failed to upload video: The file may be corrupted or the upload was interrupted. Please try again.' },
      { status: 500 }
    )
  }
}