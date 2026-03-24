import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Unit } from '@/models/Unit'
import { authenticateUser } from '@/lib/auth-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    await connectDB()

    // Find the unit and the specific assignment
    const unit = await Unit.findOne({
      _id: params.id,
      'assignments._id': params.assignmentId
    })

    if (!unit) {
      return NextResponse.json({ error: 'Unit or assignment not found' }, { status: 404 })
    }

    // Find the specific assignment
    const assignment = unit.assignments.find((a: any) => a._id.toString() === params.assignmentId)
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if deadline has passed
    if (new Date() > new Date(assignment.deadline)) {
      return NextResponse.json({ error: 'Assignment deadline has passed' }, { status: 400 })
    }

    // Upload file to Backblaze B2
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/upload`, {
      method: 'POST',
      body: uploadFormData
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json()
      return NextResponse.json({ error: error.error || 'Failed to upload file' }, { status: 500 })
    }

    const uploadData = await uploadResponse.json()

    // Check if student already has an enrollment record for this assignment
    let studentEnrollment = assignment.enrollment?.find(
      (e: any) => e.studentId.toString() === authResult.user.id
    )

   

    if (!studentEnrollment) {
      // Create new enrollment record
      if (!assignment.enrollment) {
        assignment.enrollment = []
      }
      studentEnrollment = {
        studentId: authResult.user.id
      }
      assignment.enrollment.push(studentEnrollment)
    } 

    // Update or create submission
    studentEnrollment.submittedAt = new Date()
    studentEnrollment.fileUrl = uploadData.fileUrl
    studentEnrollment.fileName = file.name
    studentEnrollment.fileSize = file.size
    studentEnrollment.fileType = file.type
    studentEnrollment.deletedAt = undefined // Clear any deleted flag


    try {
      await unit.save()
      
    } catch (saveError) {
      console.error('Error saving unit:', saveError)
      return NextResponse.json({ error: 'Failed to save submission data' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Assignment submitted successfully',
      submission: {
        fileUrl: uploadData.fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        submittedAt: studentEnrollment.submittedAt
      }
    })

  } catch (error) {
    console.error('Error submitting assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    await connectDB()

    // Find the unit and the specific assignment
    const unit = await Unit.findOne({
      _id: params.id,
      'assignments._id': params.assignmentId
    })

    if (!unit) {
      return NextResponse.json({ error: 'Unit or assignment not found' }, { status: 404 })
    }

    // Find the specific assignment
    const assignment = unit.assignments.find((a: any) => a._id.toString() === params.assignmentId)
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if deadline has passed
    if (new Date() > new Date(assignment.deadline)) {
      return NextResponse.json({ error: 'Assignment deadline has passed' }, { status: 400 })
    }

    // Find student's enrollment
    const studentEnrollment = assignment.enrollment?.find(
      (e: any) => e.studentId.toString() === authResult.user.id
    )

    if (!studentEnrollment) {
      return NextResponse.json({ error: 'No submission found' }, { status: 404 })
    }

    // Mark submission as deleted
    studentEnrollment.deletedAt = new Date()

    await unit.save()

    return NextResponse.json({ 
      message: 'Assignment submission deleted successfully',
      canResubmit: true
    })

  } catch (error) {
    console.error('Error deleting assignment submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    await connectDB()

    // Find the unit and the specific assignment
    const unit = await Unit.findOne({
      _id: params.id,
      'assignments._id': params.assignmentId
    })

    if (!unit) {
      return NextResponse.json({ error: 'Unit or assignment not found' }, { status: 404 })
    }

    // Find the specific assignment
    const assignment = unit.assignments.find((a: any) => a._id.toString() === params.assignmentId)
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Get student's enrollment data
    const studentEnrollment = assignment.enrollment?.find(
      (e: any) => e.studentId.toString() === authResult.user.id
    )

    return NextResponse.json({
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        deadline: assignment.deadline
      },
      submission: studentEnrollment && !studentEnrollment.deletedAt ? {
        fileUrl: studentEnrollment.fileUrl,
        fileName: studentEnrollment.fileName,
        fileSize: studentEnrollment.fileSize,
        fileType: studentEnrollment.fileType,
        submittedAt: studentEnrollment.submittedAt
      } : null,
      canResubmit: new Date() <= new Date(assignment.deadline)
    })

  } catch (error) {
    console.error('Error fetching assignment data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
