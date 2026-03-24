import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Unit } from '@/models/Unit'
import { User } from '@/models/User'
import { authenticateUser } from '@/lib/auth-utils'
import { b2Client } from '@/lib/backblaze'

export async function GET(
  request: NextRequest,
  { params }: { params: { unitId: string; fileId: string } }
) {
  try {

    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult

    await connectDB()

    // Get user from database
    const userDoc = await User.findById(user.id)
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const organizationId = userDoc.organization!
    const { unitId, fileId } = params


    // Find the unit and verify access
    const query: any = {
      _id: unitId,
      organization: organizationId
    }

    // If user is a student, only show units from courses they're enrolled in
    if (userDoc.role === 'student') {
      const enrolledCourseIds = userDoc.enrolledCourses?.map(ec => ec.courseId) || []
      query.courses = { $in: enrolledCourseIds }
 
    }

    const unit = await Unit.findOne(query)


    if (!unit) {
  
      return NextResponse.json({ error: 'Unit not found or access denied' }, { status: 404 })
    }

    // Find the file in the unit
    const file = unit.files.find((f: any) => f.fileId === fileId)

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

  

    // Extract the file path from the Backblaze URL
    // fileUrl format: https://f005.backblazeb2.com/file/{bucket}/{path}
    const urlMatch = file.fileUrl.match(/\/file\/([^\/]+)\/(.+)$/)
   

    if (!urlMatch) {
  
      return NextResponse.json({ error: 'Invalid file URL format' }, { status: 400 })
    }

    const bucketName = urlMatch[1]
    const filePath = urlMatch[2]
   

    // Get signed URL for secure streaming
    const signedUrlData = await b2Client.getSignedUrl(filePath, 3600) // 1 hour expiry
  

    // Fetch the file from Backblaze
   
    const fileResponse = await fetch(signedUrlData.url, {
      headers: {
        'Authorization': signedUrlData.authToken
      }
    })



    if (!fileResponse.ok) {
      const errorText = await fileResponse.text()
      console.error('Backblaze fetch failed:', {
        status: fileResponse.status,
        statusText: fileResponse.statusText,
        errorText
      })
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
    }

    // Get file content
    const fileBuffer = await fileResponse.arrayBuffer()

    // Determine content type
    const extension = filePath.split('.').pop()?.toLowerCase()
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
    }

    const contentType = contentTypeMap[extension || ''] || fileResponse.headers.get('Content-Type') || 'application/octet-stream'

    // Return file with security headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline', // Prevent download, force inline display
        'Cache-Control': 'no-store', // Prevent caching
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'",
      },
    })

  } catch (error) {
    console.error('Error streaming media:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}