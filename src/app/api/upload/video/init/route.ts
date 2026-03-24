import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-utils'
import { b2Client } from '@/lib/backblaze'

// Reuse the same accepted video types as the main upload route
const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/mov',
  'video/avi',
  'video/wmv',
  'video/flv',
  'video/webm',
  'video/mkv'
]

// Hard upper bound for direct uploads via browser → Backblaze
// This does NOT pass through the Next.js API, so larger sizes are safer,
// but we still keep a reasonable limit (5GB here).
const MAX_DIRECT_FILE_SIZE = 5 * 1024 * 1024 * 1024 // 5GB

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const { fileName, fileType, fileSize, folder } = body || {}

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
        { error: 'File size too large. Maximum size for direct upload is 5GB.' },
        { status: 400 }
      )
    }

    const targetFolder = typeof folder === 'string' && folder.trim() !== '' ? folder.trim() : 'uploads'

    // Sanitize filename similar to the existing /api/upload/video route
    const safeName = String(fileName).replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileKey = `${targetFolder}/${Date.now()}-${safeName}`

    // Get a direct upload URL and auth token from Backblaze
    const { uploadUrl, authorizationToken } = await b2Client.getDirectUploadUrl()

    return NextResponse.json({
      uploadUrl,
      authorizationToken,
      fileKey,
      maxFileSize: MAX_DIRECT_FILE_SIZE
    })
  } catch (error) {
    console.error('Error initializing direct video upload:', error)
    return NextResponse.json(
      { error: 'Failed to initialize direct upload. Please try again.' },
      { status: 500 }
    )
  }
}
