import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { authenticateUser } from '@/lib/auth-utils'
import { CustomRole } from '@/models/CustomRole'
import { User } from '@/models/User'
import { Permission, Role } from '@/lib/permissions/permission-definitions'
import { PermissionService } from '@/lib/permissions/permission-service'

/**
 * Get predefined system role names
 * This function returns the names of all predefined roles that cannot be duplicated
 */
function getPredefinedRoleNames(): string[] {
  return [
    'Administrator',
    'Teacher',
    'Student'
  ]
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Get system roles (predefined)
    const systemRolesData = [
      {
        _id: Role.ADMIN,
        name: 'Administrator',
        description: 'Full access to all features and settings',
        permissions: PermissionService.getGlobalPermissions(Role.ADMIN),
        isSystem: true
      },
      {
        _id: Role.TEACHER,
        name: 'Teacher',
        description: 'Can create and manage courses, full teaching access',
        permissions: PermissionService.getGlobalPermissions(Role.TEACHER),
        isSystem: true
      },
      {
        _id: Role.LECTURER,
        name: 'Lecturer',
        description: 'Can create and manage courses, full teaching access',
        permissions: PermissionService.getGlobalPermissions(Role.LECTURER),
        isSystem: true
      },
      {
        _id: Role.STUDENT,
        name: 'Student',
        description: 'Access to assigned courses and learning materials',
        permissions: PermissionService.getGlobalPermissions(Role.STUDENT),
        isSystem: true
      }
    ]

    // Get user counts for system roles
    const systemRoles = await Promise.all(
      systemRolesData.map(async (role) => {
        const userCount = await User.countDocuments({
          role: role._id,
          organization: authResult.user.organization
        })
        return {
          ...role,
          userCount,
          createdAt: new Date().toISOString()
        }
      })
    )

    // Get custom roles from database
    const customRoles = await CustomRole.find({
      organization: authResult.user.organization,
      isActive: true
    }).lean()

    // Get user counts for custom roles
    const customRolesWithCounts = await Promise.all(
      customRoles.map(async (role) => {
        const userCount = await User.countDocuments({
          customRole: role._id,
          organization: authResult.user.organization
        })
        return {
          ...role,
          userCount,
          isSystem: false
        }
      })
    )

    const allRoles = [...systemRoles, ...customRolesWithCounts]

    return NextResponse.json({
      success: true,
      data: allRoles
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Hoisted context variables for use in catch block
  let normalizedNameScoped = ''
  let orgIdScoped = ''
  let descriptionScoped = ''
  let permissionsScoped: string[] = []
  let createdByScoped = ''

  try {
    await connectDB()

    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { name, description, permissions } = body

    // Validate required fields
    if (!name || !description || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({
        success: false,
        error: 'Name, description, and permissions are required'
      }, { status: 400 })
    }

    // Validate permissions
    const validPermissions = Object.values(Permission)
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
    if (invalidPermissions.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Invalid permissions: ${invalidPermissions.join(', ')}`
      }, { status: 400 })
    }

    // Check if role name already exists in predefined roles
    const predefinedRoleNames = getPredefinedRoleNames()
    const normalizedName = name.trim()
    // capture for catch scope
    normalizedNameScoped = normalizedName
    orgIdScoped = authResult.user.organization!
    descriptionScoped = description
    permissionsScoped = permissions
    createdByScoped = authResult.user.id
    const isPredefinedRole = predefinedRoleNames.some(
      predefinedName => predefinedName.toLowerCase() === normalizedName.toLowerCase()
    )

    if (isPredefinedRole) {
      return NextResponse.json({
        success: false,
        error: 'Role name already exists'
      }, { status: 409 })
    }

    // Check if role name already exists in active custom roles
    const existingActiveRole = await CustomRole.findOne({
      name: normalizedName,
      organization: authResult.user.organization,
      isActive: true
    })

    if (existingActiveRole) {
      return NextResponse.json({
        success: false,
        error: 'Role name already exists'
      }, { status: 409 })
    }

    // Check if there's an inactive (deleted) role with the same name
    // If so, permanently delete it to allow reuse of the name
    const existingInactiveRole = await CustomRole.findOne({
      name: normalizedName,
      organization: authResult.user.organization,
      isActive: false
    })

    if (existingInactiveRole) {
      // Permanently delete the inactive role to allow reuse of the name
      await CustomRole.deleteOne({ _id: existingInactiveRole._id })
    }

    // Create new custom role
    const customRole = new CustomRole({
      name: normalizedName,
      description,
      permissions,
      organization: authResult.user.organization,
      createdBy: authResult.user.id,
      isActive: true
    })

    await customRole.save()

    return NextResponse.json({
      success: true,
      data: {
        ...customRole.toObject(),
        isSystem: false,
        userCount: 0
      },
      message: 'Custom role created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating role:', error)

    // Handle MongoDB duplicate key error
    if (error.code === 11000 || error.code === '11000') {
      // Check if it's due to a deleted role that wasn't cleaned up
      if (normalizedNameScoped && orgIdScoped) {
        const existingInactiveRole = await CustomRole.findOne({
          name: normalizedNameScoped,
          organization: orgIdScoped,
          isActive: false
        })

        if (existingInactiveRole) {
          // Try to permanently delete the inactive role and create again
          try {
            await CustomRole.deleteOne({ _id: existingInactiveRole._id })

            // Retry creating the role
            const customRole = new CustomRole({
              name: normalizedNameScoped,
              description: descriptionScoped,
              permissions: permissionsScoped,
              organization: orgIdScoped,
              createdBy: createdByScoped,
              isActive: true
            })

            await customRole.save()

            return NextResponse.json({
              success: true,
              data: {
                ...customRole.toObject(),
                isSystem: false,
                userCount: 0
              },
              message: 'Custom role created successfully'
            }, { status: 201 })
          } catch (retryError: any) {
            console.error('Error retrying role creation:', retryError)
            return NextResponse.json({
              success: false,
              error: 'Failed to create role. Please try again.'
            }, { status: 500 })
          }
        }
      }

      return NextResponse.json({
        success: false,
        error: 'Role name already exists'
      }, { status: 409 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
