import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Unit } from '@/models/Unit'
import { authenticateUser } from '@/lib/auth-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { fileId } = params
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    await connectDB()

    // Find the unit and the specific file
    const unit = await Unit.findOne({
      _id: params.id,
      'files.fileId': fileId
    })

    if (!unit) {
      return NextResponse.json({ error: 'Unit or file not found' }, { status: 404 })
    }

    // Find the specific file
    const file = unit.files.find((f: any) => f.fileId === fileId)
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if student already has an enrollment record for this file
    const existingEnrollment = file.enrollment?.find(
      (e: any) => e.studentId.toString() === authResult.user.id
    )

    if (existingEnrollment) {
      // Student already viewed this file - don't update, just return existing data
      return NextResponse.json({ 
        message: 'File view already recorded',
        viewedAt: existingEnrollment.viewedAt,
        alreadyViewed: true
      })
    } else {
      // Create new enrollment record for first view
      if (!file.enrollment) {
        file.enrollment = []
      }
      file.enrollment.push({
        studentId: authResult.user.id,
        viewedAt: new Date(),
        viewCount: 1
      })
    }

    await unit.save()

    return NextResponse.json({ 
      message: 'File view tracked successfully',
      viewedAt: new Date(),
      alreadyViewed: false
    })

  } catch (error) {
    console.error('Error tracking file view:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
