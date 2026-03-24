import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-utils'
import { getUploadPresignedUrl } from '@/lib/backblaze-s3'

const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/mov',
  'video/avi',
  'video/wmv',
  'video/flv',
  'video/webm',
  'video/mkv'
]

// Hard upper bound for S3-style direct uploads (single PUT)
const MAX_DIRECT_FILE_SIZE = 5 * 1024 * 1024 * 1024 // 5GB

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const { fileName, fileType, fileSize } = body || {}


    if (!fileName || !fileType || typeof fileSize !== 'number') {
      return NextResponse.json(
        { error: 'Missing file metadata (fileName, fileType, fileSize)' },
        { status: 400 }
      )
    }

    if (!ACCEPTED_VIDEO_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only video files are allowed.' },
        { status: 400 }
      )
    }

    if (fileSize > MAX_DIRECT_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5GB.' },
        { status: 400 }
      )
    }

    // Respect the Backblaze key name prefix you configured (uploads/)
    const safeName = String(fileName).replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = `uploads/${Date.now()}-${safeName}`


    const url = await getUploadPresignedUrl({
      key,
      contentType: fileType
    })


    return NextResponse.json({
      url,
      key,
      maxFileSize: MAX_DIRECT_FILE_SIZE
    })
  } catch (error) {
    console.error('Error creating video upload presign URL:', error)
    return NextResponse.json(
      { error: 'Failed to create upload URL. Please try again.' },
      { status: 500 }
    )
  }
}
