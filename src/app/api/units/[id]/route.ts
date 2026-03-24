import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Unit } from '@/models/Unit'
import { Course } from '@/models/Course'
import { User } from '@/models/User'
import { allowRead, allowCreate, allowUpdate, allowDelete } from '@/lib/permissions/role-middleware'
import mongoose from 'mongoose'

// DELETE /api/units/[id] - Delete a unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    // Check delete permissions
    const authResult = await allowDelete(request)
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
    const unitId = params.id

    if (!unitId) {
      return NextResponse.json(
        { error: 'Unit ID required' },
        { status: 400 }
      )
    }

    // Find and delete the unit
    const unit = await Unit.findOneAndDelete({
      _id: unitId,
      organization: organizationId
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    // Remove the unit from all courses that reference it
    if (unit.courses && unit.courses.length > 0) {
      await Course.updateMany(
        { _id: { $in: unit.courses } },
        { 
          $pull: { units: unitId },
          $set: { updatedAt: new Date() }
        }
      )
    }

    return NextResponse.json({ message: 'Unit deleted successfully' })
  } catch (error) {
    console.error('Error deleting unit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/units/[id] - Update a unit
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const organizationId = userDoc.organization!
    const unitId = params.id

    if (!unitId) {
      return NextResponse.json(
        { error: 'Unit ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, description, courses, files } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Get the current unit to compare course changes
    const currentUnit = await Unit.findOne({
      _id: unitId,
      organization: organizationId
    })

    if (!currentUnit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    const currentCourseIds = currentUnit.courses && Array.isArray(currentUnit.courses) 
      ? currentUnit.courses.map((course: any) => course._id) 
      : []
    const newCourseIds = courses || []

    // First, remove this unit ID from ALL courses that might have it
    await Course.updateMany(
      { units: unitId },
      { 
        $pull: { units: unitId },
        $set: { updatedAt: new Date() }
      }
    )

    // Then, add this unit ID only to the specified courses
    if (newCourseIds.length > 0) {
      await Course.updateMany(
        { _id: { $in: newCourseIds } },
        { 
          $push: { units: unitId },
          $set: { updatedAt: new Date() }
        }
      )
    }

    // Find and update the unit
    const unit = await Unit.findOneAndUpdate(
      { _id: unitId, organization: organizationId },
      {
        title: title.trim(),
        description: description?.trim() || '',
        courses: newCourseIds,
        files: files || []
      },
      { new: true }
    ).populate('courses', 'title')

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(unit)
  } catch (error) {
    console.error('Error updating unit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/units/[id] - Get a single unit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    // Check read permissions with student filtering
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
    const unitId = params.id
    const unitObjectId = new mongoose.Types.ObjectId(unitId)

    if (!unitId) {
      return NextResponse.json(
        { error: 'Unit ID required' },
        { status: 400 }
      )
    }

    // Check if user is student
    const customRoleName = (userDoc.customRole as any)?.name
    const userRole = customRoleName?.toLowerCase() || userDoc.role?.toLowerCase() || 'student'
    
    let unit
    
    if (userRole === 'student') {
      // Students can only access units from courses they're enrolled in via batch membership
      const userObjectId = new mongoose.Types.ObjectId(authResult.user.id)
      const enrolledCourses = await Course.find({
        'groups.batches.students': userObjectId,
        organization: organizationId
      }).select('_id')
      
      const enrolledCourseIds = enrolledCourses.map(c => c._id)
      
      unit = await Unit.findOne({
        _id: unitObjectId,
        organization: organizationId,
        courses: { $in: enrolledCourseIds }
      }).populate('courses', 'title')
      
    } else {
      // Admins and instructors can access any unit in their organization
      unit = await Unit.findOne({
        _id: unitObjectId,
        organization: organizationId
      }).populate('courses', 'title')
    }

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...unit.toObject(),
      userRole: userRole
    })
  } catch (error) {
    console.error('Error getting unit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
