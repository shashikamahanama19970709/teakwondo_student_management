import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Assignment } from '@/models/Assignment'
import { AssignmentSubmission } from '@/models/AssignmentSubmission'
import { User } from '@/models/User'
import { allowCreate, allowRead, allowUpdate } from '@/lib/permissions/role-middleware'

// POST /api/assignments/[assignmentId]/submissions - Submit an assignment
export async function POST(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    await connectDB()

    // Check create permissions (students can create submissions)
    const authResult = await allowCreate(request)
    if (authResult instanceof NextResponse) {
      return authResult
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

    if (userDoc.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can submit assignments' },
        { status: 403 }
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

    const body = await request.json()
    const { fileUrl, fileName, fileSize, fileType } = body

    // Validate required fields
    if (!fileUrl?.trim()) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      )
    }

    if (!fileName?.trim()) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      )
    }

    if (typeof fileSize !== 'number' || fileSize <= 0) {
      return NextResponse.json(
        { error: 'Valid file size is required' },
        { status: 400 }
      )
    }

    if (!fileType?.trim()) {
      return NextResponse.json(
        { error: 'File type is required' },
        { status: 400 }
      )
    }

    // Get the assignment
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      organization: organizationId
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check if deadline has passed
    if (new Date() > new Date(assignment.deadline)) {
      return NextResponse.json(
        { error: 'Assignment deadline has passed' },
        { status: 400 }
      )
    }

    // Check if student has already submitted
    const existingSubmission = await AssignmentSubmission.findOne({
      assignmentId,
      studentId: userDoc._id
    })

    if (existingSubmission) {
      // Update existing submission
      const updatedSubmission = await AssignmentSubmission.findOneAndUpdate(
        {
          assignmentId,
          studentId: userDoc._id
        },
        {
          fileUrl: fileUrl.trim(),
          fileName: fileName.trim(),
          fileSize,
          fileType: fileType.trim(),
          submittedAt: new Date(),
          marks: undefined, // Reset marks when resubmitted
          feedback: undefined,
          gradedAt: undefined,
          gradedBy: undefined
        },
        { new: true }
      )

      return NextResponse.json(updatedSubmission)
    } else {
      // Create new submission
      const submission = new AssignmentSubmission({
        assignmentId,
        studentId: userDoc._id,
        fileUrl: fileUrl.trim(),
        fileName: fileName.trim(),
        fileSize,
        fileType: fileType.trim(),
        organization: organizationId
      })

      await submission.save()
      return NextResponse.json(submission, { status: 201 })
    }
  } catch (error) {
    console.error('Error submitting assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/assignments/[assignmentId]/submissions - Get all submissions for an assignment (admin/lecturer only)
export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    await connectDB()

    // Check read permissions
    const authResult = await allowRead(request)
    if (authResult instanceof NextResponse) {
      return authResult
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

    // Only allow admin/lecturer/teacher to view all submissions
    if (!['admin', 'lecturer', 'teacher'].includes(userDoc.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get all submissions for this assignment
    const submissions = await AssignmentSubmission.find({
      assignmentId,
      organization: organizationId
    })
    .populate('studentId', 'name email')
    .populate('gradedBy', 'name email')
    .sort({ submittedAt: -1 })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Error fetching assignment submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/assignments/[assignmentId]/submissions - Grade a submission (admin/lecturer only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    await connectDB()

    // Check update permissions
    const authResult = await allowUpdate(request)
    if (authResult instanceof NextResponse) {
      return authResult
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

    // Only allow admin/lecturer/teacher to grade
    if (!['admin', 'lecturer', 'teacher'].includes(userDoc.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to grade assignments' },
        { status: 403 }
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

    const body = await request.json()
    const { studentId, marks, feedback } = body

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    if (typeof marks !== 'number' || marks < 0) {
      return NextResponse.json(
        { error: 'Valid marks are required' },
        { status: 400 }
      )
    }

    // Update the submission
    const submission = await AssignmentSubmission.findOneAndUpdate(
      {
        assignmentId,
        studentId,
        organization: organizationId
      },
      {
        marks,
        feedback: feedback?.trim() || '',
        gradedAt: new Date(),
        gradedBy: userDoc._id
      },
      { new: true }
    ).populate('studentId', 'name email')

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error grading assignment submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
