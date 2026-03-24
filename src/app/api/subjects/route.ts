import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Subject } from '@/models/Subject'
import { Project } from '@/models/Project'
import { authenticateUser } from '@/lib/auth-utils'
import { PermissionService } from '@/lib/permissions/permission-service'
import { Permission } from '@/lib/permissions/permission-definitions'

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

    const { user } = authResult
    const userId = user.id
    const organizationId = user.organization
  

    const body = await request.json()
  

    const {
      name,
      code,
      description,
      totalLessons,
      order,
      status,
      projectId
    } = body


    // Validate required fields
    if (!name || !code || !totalLessons || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if project exists and user has access
   
    const project = await Project.findOne({
      _id: projectId,
      organization: organizationId,
    })


    if (!project) {
     
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Check permissions - temporarily disabled for testing
   
    // const hasPermission = await PermissionService.hasPermission(
    //   userId,
    //   Permission.PROJECT_MANAGE,
    //   PermissionScope.PROJECT,
    //   projectId
    // )
  

    // if (!hasPermission) {
   
    //   return NextResponse.json(
    //     { error: 'Insufficient permissions' },
    //     { status: 403 }
    //   )
    // }

    // Create the subject
  
    const subjectData = {
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description?.trim(),
      totalLessons: Number(totalLessons),
      order: order ? Number(order) : 0,
      status: status || 'active',
      project: projectId,
      organization: organizationId,
      createdBy: userId
    }
  

    const newSubject = new Subject(subjectData)
 

    const savedSubject = await newSubject.save()
 

    // Add subject to project's subjects array
   
    await Project.findByIdAndUpdate(
      projectId,
      {
        $push: { subjects: savedSubject._id }
      }
    )
   

    return NextResponse.json({
      success: true,
      data: savedSubject
    })

  } catch (error: any) {
    console.error('POST subjects error:', error)
    console.error('Error stack:', error.stack)

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Subject code already exists for this project' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

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
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Check if project exists and user has access
    const project = await Project.findOne({
      _id: projectId,
      organization: organizationId,
      is_deleted: { $ne: true }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get subjects for the project
    const subjects = await Subject.find({
      project: projectId,
      organization: organizationId
    }).sort({ order: 1, createdAt: 1 })

    return NextResponse.json({
      success: true,
      data: subjects
    })

  } catch (error) {
    console.error('Get subjects error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}