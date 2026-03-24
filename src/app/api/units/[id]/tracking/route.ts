import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { authenticateUser } from '@/lib/auth-utils'
import { StudentTracking } from '@/models/StudentTracking'
import { Unit } from '@/models/Unit'
import { User } from '@/models/User'
import mongoose from 'mongoose'

// GET /api/units/[id]/tracking?fileId=xxx - Get student tracking for a specific file
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult
    const organizationId = user.organization!
    const unitId = params.id
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId parameter is required' },
        { status: 400 }
      )
    }

    // Get the unit to find which courses it belongs to
    const unit: any = await Unit.findOne({
      _id: unitId,
      organization: organizationId
    }).lean()

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    // Get all course IDs (projects) this unit belongs to
      const rawCourses = (((unit as any).courses) || []) as Array<{ toString?: () => string } | string>
      const courseIds: string[] = rawCourses.map((id) =>
      typeof id === 'string' ? id : id && id.toString ? id.toString() : String(id)
    )
    
    if (courseIds.length === 0) {
      // No courses assigned, return empty array
      return NextResponse.json(
        [],
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        }
      )
    }

    // Convert courseIds to ObjectIds for query
    const courseObjectIds = courseIds.map((id) => {
      try {
        return new mongoose.Types.ObjectId(id)
      } catch {
        return null
      }
    }).filter((id): id is mongoose.Types.ObjectId => id !== null)

    if (courseObjectIds.length === 0) {
      return NextResponse.json(
        [],
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        }
      )
    }

    // Find all students enrolled in these courses
    const students = await User.find({
      organization: organizationId,
      role: 'student',
      isActive: true,
      enrolledCourses: {
        $elemMatch: {
          courseId: { $in: courseObjectIds }
        }
      }
    })
      .select('_id firstName lastName email enrolledCourses')
      .lean()

    // Get all tracking records for this unit and file
    const trackingRecords = await StudentTracking.find({
      unitId: new mongoose.Types.ObjectId(unitId),
      fileId: fileId,
      organization: organizationId
    })
      .populate('studentId', 'firstName lastName email')
      .lean()

    // Create a map of tracking data by studentId for quick lookup
    const trackingMap = new Map()
    trackingRecords.forEach((tracking: any) => {
      const studentId = tracking.studentId?._id?.toString() || tracking.studentId?.toString()
      if (studentId) {
        trackingMap.set(studentId, tracking)
      }
    })

    // Get file type from unit
    const file = (unit as any).files?.find((f: any) => f.fileId === fileId)
    const fileType = file?.fileType || 'document'

    // Build the result array with real data
    const studentProgress = students.map((student: any) => {
      // Find the enrollment for this course to get group name
      // Handle both populated and non-populated courseId
      const enrollment = student.enrolledCourses?.find((enrollment: any) => {
        const enrollmentCourseId = enrollment.courseId?._id?.toString() || 
                                   enrollment.courseId?.toString() || 
                                   enrollment.courseId
        return courseIds.some((courseId) => {
          const courseIdStr = courseId.toString()
          return courseIdStr === enrollmentCourseId
        })
      })
      
      const groupName = enrollment?.groupName || 'No Group'
      const studentId = student._id.toString()
      const tracking = trackingMap.get(studentId)

      if (fileType === 'video') {
        return {
          studentId: studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          groupName: groupName,
          durationWatched: tracking?.durationWatched || 0,
          completionPercentage: tracking?.completionPercentage || 0,
          viewedDate: tracking?.lastWatchedAt ? new Date(tracking.lastWatchedAt).toISOString().split('T')[0] : null,
          viewCount: 0 // Not applicable for videos
        }
      } else {
        // Document or image
        return {
          studentId: studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          groupName: groupName,
          durationWatched: 0, // Not applicable for documents/images
          completionPercentage: 0, // Not applicable for documents/images
          viewedDate: tracking?.lastViewedAt ? new Date(tracking.lastViewedAt).toISOString().split('T')[0] : null,
          viewCount: tracking?.viewCount || 0
        }
      }
    })

    // Sort by group name, then by student name
    studentProgress.sort((a, b) => {
      if (a.groupName !== b.groupName) {
        return a.groupName.localeCompare(b.groupName)
      }
      return a.studentName.localeCompare(b.studentName)
    })

    return NextResponse.json(
      studentProgress,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    )
  } catch (error) {
    console.error('Error fetching student tracking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/units/[id]/tracking - Update student tracking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult
    const organizationId = user.organization!
    const unitId = params.id

    const body = await request.json()
    const {
      fileId,
      fileType,
      durationWatched,
      completionPercentage,
      viewCount
    } = body

    // Use the logged-in user's ID as studentId
    const studentId = user.id

    // Find existing tracking record or create new one
    let tracking = await StudentTracking.findOne({
      studentId,
      unitId,
      fileId,
      organization: organizationId
    })

    if (!tracking) {
      tracking = new StudentTracking({
        studentId,
        unitId,
        fileId,
        fileType,
        organization: organizationId
      })
    }

    // Update tracking data based on file type
    if (fileType === 'video') {
      if (durationWatched !== undefined) {
        tracking.durationWatched = Math.max(tracking.durationWatched || 0, durationWatched)
      }
      if (completionPercentage !== undefined) {
        tracking.completionPercentage = Math.max(tracking.completionPercentage || 0, completionPercentage)
      }
      tracking.lastWatchedAt = new Date()
    } else {
      // Document or image
      if (viewCount !== undefined) {
        tracking.viewCount = (tracking.viewCount || 0) + viewCount
      }
      if (!tracking.firstViewedAt) {
        tracking.firstViewedAt = new Date()
      }
      tracking.lastViewedAt = new Date()
    }

    await tracking.save()

    // Update Unit collection enrollment array
    const unit = await Unit.findOne({ _id: unitId, organization: organizationId })
    if (unit) {
      const fileIndex = unit.files.findIndex((file: any) => file.fileId === fileId)
      if (fileIndex !== -1) {
        const enrollmentIndex = unit.files[fileIndex].enrollment.findIndex(
          (enrollment: any) => enrollment.studentId.toString() === studentId
        )

        if (enrollmentIndex !== -1) {
          // Update existing enrollment
          unit.files[fileIndex].enrollment[enrollmentIndex].viewedAt = new Date()
          unit.files[fileIndex].enrollment[enrollmentIndex].viewCount = 
            (unit.files[fileIndex].enrollment[enrollmentIndex].viewCount || 0) + (viewCount || 1)
        } else {
          // Add new enrollment
          unit.files[fileIndex].enrollment.push({
            studentId,
            viewedAt: new Date(),
            viewCount: viewCount || 1
          })
        }

        await unit.save()
      }
    }

    return NextResponse.json(tracking)
  } catch (error) {
    console.error('Error updating student tracking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}