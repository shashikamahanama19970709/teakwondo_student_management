import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { User } from '@/models/User'
import { Unit, IAssignmentEnrollment, IAssignment } from '@/models/Unit'
import { authenticateUser } from '@/lib/auth-utils'
import mongoose from 'mongoose'
import path from 'path'
import { b2Client } from '@/lib/backblaze'

export async function POST(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
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

    // Get user from database
    const userDoc = await User.findById(user.id)
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const organizationId = userDoc.organization!
    const assignmentId = params.assignmentId

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID required' },
        { status: 400 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (25MB max)
    const maxSize = 25 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 25MB limit' },
        { status: 400 }
      )
    }

    // Generate unique filename (sanitize baseName to avoid special characters)
    const fileExtension = path.extname(file.name)
    const baseName = path.basename(file.name, fileExtension).replace(/[^a-zA-Z0-9\-_\.]/g, '_')
    const uniqueName = `assignments/${Date.now()}-${baseName}${fileExtension}`

    // Upload file to Backblaze
    const buffer = Buffer.from(await file.arrayBuffer())
    // Use fallback content type if file.type is empty or invalid
    const contentType = file.type || 'application/octet-stream'
    const uploadedFileName = await b2Client.uploadFile(buffer, uniqueName, contentType)

    // Find the unit containing this assignment
    const unit = await Unit.findOne({
      organization: organizationId,
      'assignments._id': assignmentId
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Find the assignment index
    const assignmentIndex = unit.assignments.findIndex((a: IAssignment) => a._id?.toString() === assignmentId)

    if (assignmentIndex === -1) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Add submission to enrollment array
    unit.assignments[assignmentIndex].enrollment.push({
      studentId: userDoc._id,
      submittedAt: new Date(),
      fileUrl: uploadedFileName,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

    await unit.save()

    return NextResponse.json(
      { message: 'Assignment submitted successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
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

    // Get user from database
    const userDoc = await User.findById(user.id)
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const organizationId = userDoc.organization!
    const assignmentId = params.assignmentId

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID required' },
        { status: 400 }
      )
    }

    // Find the unit containing this assignment
    const unit = await Unit.findOne({
      organization: organizationId,
      'assignments._id': assignmentId
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Find the assignment
    const assignment = unit.assignments.find((a: IAssignment) => a._id?.toString() === assignmentId)

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Get submissions for this student (only valid ones)
    const submissions = assignment.enrollment.filter((enrollment: IAssignmentEnrollment) => 
      enrollment.studentId.toString() === userDoc._id.toString() && 
      enrollment.submittedAt && 
      !enrollment.deletedAt
    )

    // Add _id to each submission for frontend compatibility
    const submissionsWithId = submissions.map((submission: IAssignmentEnrollment & mongoose.Document, index: number) => ({
      ...submission.toObject(),
      _id: `${assignmentId}-${userDoc._id}-${index}`
    }))

    return NextResponse.json(submissionsWithId)
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
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

    // Get user from database
    const userDoc = await User.findById(user.id)
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const organizationId = userDoc.organization!
    const assignmentId = params.assignmentId
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')


    if (!assignmentId || !submissionId) {
      return NextResponse.json(
        { error: 'Assignment ID and Submission ID required' },
        { status: 400 }
      )
    }

    // Parse index from submissionId (format: assignmentId-studentId-index)
    const parts = submissionId.split('-')
    if (parts.length < 3) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      )
    }
    const index = parseInt(parts[parts.length - 1])


    // Find the unit containing this assignment
    const unit = await Unit.findOne({
      organization: organizationId,
      'assignments._id': assignmentId
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Find the assignment
    const assignmentIndex = unit.assignments.findIndex((a: any) => a._id.toString() === assignmentId)

    if (assignmentIndex === -1) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    const assignment = unit.assignments[assignmentIndex]

    // Find the submission for this student at the specified index
    const studentEnrollments = assignment.enrollment.filter((enrollment: IAssignmentEnrollment) => enrollment.studentId.toString() === userDoc._id.toString())


    if (index < 0 || index >= studentEnrollments.length) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }


    // Remove the submission from enrollment
    const enrollmentIndex = assignment.enrollment.findIndex((enrollment: IAssignmentEnrollment) => 
      enrollment.studentId.toString() === userDoc._id.toString() && 
      enrollment === studentEnrollments[index]
    )


    if (enrollmentIndex !== -1) {
      assignment.enrollment.splice(enrollmentIndex, 1)
      try {
        await unit.save()
      } catch (saveError) {
        console.error('Error saving unit after enrollment removal:', saveError)
        return NextResponse.json(
          { error: 'Failed to save changes after removing enrollment' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Could not find enrollment to remove' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Submission deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
