import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { authenticateUser } from '@/lib/auth-utils'
import { Unit } from '@/models/Unit'
import { b2Client } from '@/lib/backblaze'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    await connectDB()

    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult
    const unitId = params.id
    const fileId = params.fileId

    // Find the unit
    const unit = await Unit.findOne({ _id: unitId })
    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    // Check if user has permission (admin, lecturer, teacher, or unit creator)
    const userRole = user.role
    const isCreator = unit.createdBy?.toString() === user.id.toString()
    const canManageFiles = ['admin', 'lecturer', 'teacher'].includes(userRole) || isCreator

    if (!canManageFiles) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete files' },
        { status: 403 }
      )
    }

    // Find the file in the unit
    const fileIndex = unit.files.findIndex((file: any) => file.fileId === fileId)
    if (fileIndex === -1) {
      return NextResponse.json(
        { error: 'File not found in unit' },
        { status: 404 }
      )
    }

    const fileToDelete = unit.files[fileIndex]

    // Delete file from Backblaze B2
    try {
      await b2Client.deleteFile(fileToDelete.fileUrl)
    } catch (error) {
      console.error('Error deleting file from Backblaze:', error)
      // Continue with unit update even if B2 deletion fails
      // The file reference will be removed from the unit
    }

    // Remove file from unit
    unit.files.splice(fileIndex, 1)
    await unit.save()

    return NextResponse.json({
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
