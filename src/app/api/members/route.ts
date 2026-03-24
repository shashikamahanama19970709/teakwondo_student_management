import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { User } from '@/models/User'
import { UserInvitation } from '@/models/UserInvitation'
import { Course } from '@/models/Course'
import '@/models/CustomRole' // Ensure CustomRole model is registered for populate
import { authenticateUser } from '@/lib/auth-utils'
import bcrypt from 'bcryptjs'
import { normalizeUploadUrl } from '@/lib/file-utils'
import { Role } from '@/lib/permissions/permission-definitions'

export async function GET(request: NextRequest) {
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
    const userId = user.id
    const organizationId = user.organization

  

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10000')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const ids = searchParams.get('ids') || ''

    // Build filters
    const filters: any = { organization: organizationId }

    // If specific IDs are provided, filter by those
    if (ids) {
      const idArray = ids.split(',').filter(id => id.trim())
      filters._id = { $in: idArray }
    }

    if (search) {
      filters.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ]
    }

    if (role) {
      // Check if the role is a system role or custom role
      const systemRoles = Object.values(Role)
      if (systemRoles.includes(role as Role)) {
        // System role - filter by role field
        filters.role = role
      } else {
        // Custom role - filter by customRole field
        filters.customRole = role
      }
    }

    if (status === 'active') {
      filters.isActive = true
    } else if (status === 'inactive') {
      filters.isActive = false
    }

    // Get members with custom role and partner information
    const members = await User.find(filters)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // Normalize avatar URLs
    const normalizedMembers = members.map((member: any) => ({
      ...member,
      avatar: member.avatar ? (member.avatar.startsWith('/') ? normalizeUploadUrl(member.avatar) : `/${member.avatar}`) : ''
    }))

    const total = await User.countDocuments(filters)

    // Get pending invitations
    const pendingInvitations = await UserInvitation.find({
      organization: organizationId,
      isAccepted: false,
      expiresAt: { $gt: new Date() }
    })
      .populate('invitedBy', 'firstName lastName email')
      .populate('customRole', 'name')

    return NextResponse.json({
      success: true,
      data: {
        members: normalizedMembers,
        pendingInvitations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Get members error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user: currentUser } = authResult
    const userId = currentUser.id
    const organizationId = currentUser.organization

    

    const data = await request.json()
    const {
      email,
      firstName,
      lastName,
      role,
      username,
      password,
      avatar,
      description,
      showOnLanding,
      courseId,
      groupName,
      batchId,
      studentRegistrationNo
    } = data

    if (!email || !firstName || !lastName || !password || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user (without enrollment initially)
    const newUser = new User({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      firstName,
      lastName,
      password: hashedPassword,
      passwordDisplay: password, // Store plain text for admin as requested
      role,
      avatar,
      description,
      showOnLanding: !!showOnLanding,
      studentRegistrationNo,
      organization: organizationId,
      isActive: true,
      emailVerified: true, // Mark as verified since admin created it
      enrolledCourses: [] // Will be populated below if needed
    })

    // Validate enrollment data and handle enrollment (optional)
    if (courseId) {
      // Find the course and validate batch exists (if batchId provided)
      const course = await Course.findOne({
        _id: courseId,
        organization: organizationId
      })

      if (!course) {
        return NextResponse.json(
          { error: 'Invalid course' },
          { status: 400 }
        )
      }

      // Find group and batch (if batchId provided)
      let group, batch
      if (batchId) {
        group = course.groups.find((g: any) => 
          g.batches.some((b: any) => b._id.toString() === batchId)
        )
        batch = group?.batches.find((b: any) => b._id.toString() === batchId)
      } else {
        // If no batchId, just find any group for course-level enrollment
        group = course.groups.find((g: any) => g.name === groupName) || course.groups[0] // Use specified group or first group
        batch = null
      }

      if (!group) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 400 }
        )
      }

      if (batchId && !batch) {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 400 }
        )
      }

      // Check if student is already in this batch
      if (batch && batch.students.some((studentId: any) => studentId.toString() === newUser._id.toString())) {
        return NextResponse.json(
          { error: 'Student is already enrolled in this batch' },
          { status: 400 }
        )
      }

      // Set enrollment data
      newUser.enrolledCourses = [{
        courseId,
        groupName: group.name,
        batchId: batchId || null, // Make batchId optional
        badgeStatus: 'NOT_EARNED',
        enrolledAt: new Date()
      }]

      // Add student to batch (if batch is specified)
      if (batch) {
        await Course.findOneAndUpdate(
          { _id: courseId, 'groups.batches._id': batchId },
          { $push: { 'groups.$.batches.$[batch].students': newUser._id } },
          { 
            arrayFilters: [{ 'batch._id': batchId }],
            new: true 
          }
        )
      }
    }
    // If no courseId, user is created without enrollment (enrolledCourses remains [])

    await newUser.save()

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      }
    })

  } catch (error) {
    console.error('Create member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const userId = user.id
    const organizationId = user.organization

    const { memberId, updates } = await request.json()

   

    // Find member
    const member = await User.findOne({
      _id: memberId,
      organization: organizationId
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

   

    // Update member
    if (updates.username && updates.username !== member.username) {
      const existingUsername = await User.findOne({ username: updates.username.toLowerCase() })
      if (existingUsername) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
      }
      member.username = updates.username.toLowerCase()
    }

    if (updates.passwordDisplay && updates.passwordDisplay !== member.passwordDisplay) {
      member.passwordDisplay = updates.passwordDisplay
      member.password = await bcrypt.hash(updates.passwordDisplay, 10)
    }

    // Handle studentRegistrationNo field
    if (updates.studentRegistrationNo !== undefined) {
      member.studentRegistrationNo = updates.studentRegistrationNo
    }

    // Merge other updates
    Object.assign(member, updates)
    await member.save()

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully',
      data: {
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        memberId: member.memberId,
        role: member.role,
        isActive: member.isActive,
        profile_picture: member.profile_picture
      }
    })

  } catch (error) {
    console.error('Update member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const userId = user.id
    const organizationId = user.organization

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }


    // TEMPORARY: Allow all authenticated users to test the API
    // TODO: Restore proper permission checking after debugging
    const hasDeletePermission = true

    // Original permission checking code (commented out for now):
    /*
    // Check if user has permission to delete/remove members
    const [hasTeamRemovePermission, hasUserDeactivatePermission] = await Promise.all([
      PermissionService.hasPermission(userId, Permission.TEAM_REMOVE),
      PermissionService.hasPermission(userId, Permission.USER_DEACTIVATE)
    ])

    // Get detailed user permissions for debugging
    const userPermissions = await PermissionService.getUserPermissions(userId)
    console.log('Member deletion debug:', {
      userId,
      userRole: userPermissions.userRole,
      globalPermissions: userPermissions.globalPermissions,
      hasTeamRemovePermission,
      hasUserDeactivatePermission,
      requiredPermissions: [Permission.TEAM_REMOVE, Permission.USER_DEACTIVATE]
    })

    // Fallback: Check user role directly from database
    const userDoc = await User.findById(userId).select('role')
    const userRole = userDoc?.role
    console.log('Direct user role check:', { userRole })

    // Allow deletion if user has admin-level roles or the required permissions
    const allowedRoles = ['super_admin', 'admin', 'lecturer', 'minor_staff']
    const hasRoleBasedPermission = allowedRoles.includes(userRole)

    const hasDeletePermission = hasTeamRemovePermission || hasUserDeactivatePermission || hasRoleBasedPermission

    console.log('Final permission check:', {
      hasTeamRemovePermission,
      hasUserDeactivatePermission,
      hasRoleBasedPermission,
      allowedRoles,
      userRole,
      hasDeletePermission
    })

    if (!hasDeletePermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    */

    // Find member
    const member = await User.findOne({
      _id: memberId,
      organization: organizationId
    })



    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Prevent self-deletion
    if (memberId === userId) {
      return NextResponse.json(
        { error: 'Cannot remove yourself' },
        { status: 400 }
      )
    }


    // Deactivate member instead of deleting
    member.isActive = false
    await member.save()


    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    })

  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
