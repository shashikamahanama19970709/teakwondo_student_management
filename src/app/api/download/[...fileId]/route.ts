import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-utils'

// GET /api/download/[fileId] - Download file from Backblaze B2
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string[] } }
) {
  try {
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const fileId = params.fileId.join('/') // In case of nested path

    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 })
    }

    const bucketName = 'Taekwondo'
    if (!bucketName) {
      return NextResponse.json({ error: 'Bucket configuration missing' }, { status: 500 })
    }

    // Construct Backblaze download URL
    const downloadUrl = `https://f002.backblazeb2.com/file/${bucketName}/${fileId}`

    // Fetch the file from Backblaze
    const response = await fetch(downloadUrl)
    if (!response.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get file data
    const fileBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentLength = response.headers.get('content-length')

    // Extract filename from fileId (remove path)
    const fileName = fileId.split('/').pop() || 'download'

    // Return file with download headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength || fileBuffer.byteLength.toString(),
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
