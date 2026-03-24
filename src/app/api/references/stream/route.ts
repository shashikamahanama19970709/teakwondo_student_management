import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import Reference from '@/models/Reference'
import { authenticateUser } from '@/lib/auth-utils'
import { PermissionService } from '@/lib/permissions/permission-service'
import { Permission } from '@/lib/permissions/permission-definitions'
import { b2Client } from '@/lib/backblaze'

export const dynamic = 'force-dynamic'

// GET /api/references/stream?referenceId=<id> - Stream video with security
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const referenceId = searchParams.get('referenceId')

    if (!referenceId) {
      return NextResponse.json({ error: 'Reference ID is required' }, { status: 400 })
    }

    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const userId = authResult.user.id

    // Find the reference
    const reference = await Reference.findById(referenceId)
    if (!reference) {
      return NextResponse.json({ error: 'Reference not found' }, { status: 404 })
    }

    // Check if it's a video
    if (!reference.isVideo) {
      return NextResponse.json({ error: 'Reference is not a video' }, { status: 400 })
    }

    // Check permissions - user should have access to the task
    const hasPermission = await PermissionService.hasPermission(
      userId,
      Permission.TASK_READ
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get the video file from Backblaze
    try {
      // Extract file name from URL
      const urlParts = reference.url.split('/')
      const fileName = urlParts[urlParts.length - 1]

      if (!fileName) {
        return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 })
      }

      // Get signed URL for secure streaming
      const signedUrlData = await b2Client.getSignedUrl(fileName, 3600) // 1 hour expiry

      // Construct the full streaming URL with authorization
      const streamUrl = `${signedUrlData.url}?Authorization=${signedUrlData.authToken}`

      // Return the signed URL
      return NextResponse.json({
        streamUrl: streamUrl,
        userEmail: authResult.user.email
      })
    } catch (b2Error) {
      console.error('Error getting signed URL from Backblaze:', b2Error)
      return NextResponse.json({ error: 'Failed to generate stream URL' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error streaming video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}