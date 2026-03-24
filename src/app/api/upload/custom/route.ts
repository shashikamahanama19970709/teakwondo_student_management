import { NextRequest, NextResponse } from 'next/server'
import { b2Client } from '@/lib/backblaze'
import { authenticateUser } from '@/lib/auth-utils'
import { Organization } from '@/models/Organization'
import connectDB from '@/lib/db-config'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadType = formData.get('type') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type for company logo
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Connect to database to get organization info
    await connectDB()
    
    // Get user's organization
    const userOrg = await Organization.findOne({
      _id: authResult.user.organization
    })

    if (!userOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)

    // Generate custom filename based on upload type
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const nameWithoutExt = file.name.split('.').slice(0, -1).join('.')
    
    let fileName: string
    
    if (uploadType === 'companylogo') {
      // Format: companylogo/organizationId-timestamp-originalName
      fileName = `companylogo/${userOrg._id}-${timestamp}-${nameWithoutExt}.${extension}`
    } else {
      // Fallback to default naming with uploads prefix
      fileName = `uploads/${nameWithoutExt}_${timestamp}.${extension}`
    }

    // Upload to Backblaze B2
    const fileUrl = await b2Client.uploadFile(uint8Array, fileName, file.type)

    return NextResponse.json({
      success: true,
      fileUrl: fileName, // Return the file key, not full URL
      fileName: fileName,
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

  } catch (error) {
    console.error('Custom file upload error:', error)
    return NextResponse.json(
      { error: 'File upload failed: The file may be corrupted or the upload was interrupted. Please try again.' },
      { status: 500 }
    )
  }
}
