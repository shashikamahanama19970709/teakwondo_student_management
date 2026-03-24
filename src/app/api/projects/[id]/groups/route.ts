import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Project } from '@/models/Project'
import { authenticateUser } from '@/lib/auth-utils'

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
    const projectId = params.id

    // Fetch the specific project and get its groups
    const project = await Project.findOne({
      _id: projectId,
      organization: organizationId,
      isArchived: { $ne: true }
    })
    .select('groups')

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Extract group names from the groups array
    const groupNames = project.groups?.map((group: { name: any }) => group.name).filter(Boolean) || []

    return NextResponse.json(groupNames)
  } catch (error) {
    console.error('Error fetching project groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project groups' },
      { status: 500 }
    )
  }
}