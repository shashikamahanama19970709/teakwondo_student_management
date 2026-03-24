import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import Reference from '@/models/Reference'
import { authenticateUser } from '@/lib/auth-utils'
import { PermissionService } from '@/lib/permissions/permission-service'
import { Permission } from '@/lib/permissions/permission-definitions'
import { b2Client } from '@/lib/backblaze'

// DELETE /api/references/[id] - Delete a reference
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()

    const referenceId = params.id

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

    // Check permissions - user should have access to the task
    const hasPermission = await PermissionService.hasPermission(
      userId,
      Permission.TASK_UPDATE
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if user is the uploader or has admin permissions
    const isUploader = reference.uploadedBy.toString() === userId
    const hasAdminPermission = await PermissionService.hasPermission(
      userId,
      Permission.SETTINGS_VIEW
    )

    if (!isUploader && !hasAdminPermission) {
      return NextResponse.json({ error: 'You can only delete your own references' }, { status: 403 })
    }

    // Delete file from Backblaze
    try {
      // Extract file name from URL
      const urlParts = reference.url.split('/')
      const fileName = urlParts[urlParts.length - 1]

      if (fileName) {
        await b2Client.deleteFile(fileName)
      }
    } catch (deleteError) {
      console.error('Error deleting file from Backblaze:', deleteError)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await Reference.findByIdAndDelete(referenceId)

    return NextResponse.json({
      message: 'Reference deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting reference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}