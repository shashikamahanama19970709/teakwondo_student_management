import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { authenticateUser } from '@/lib/auth-utils'
import { BatchService } from '@/lib/batch-service'

export async function PATCH(
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
    const organizationId = user.organization

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const groupName = searchParams.get('groupName')

    if (!projectId || !groupName) {
      return NextResponse.json(
        { error: 'projectId and groupName are required' },
        { status: 400 }
      )
    }

    const data = await request.json()
    const { action } = data

    if (action === 'complete') {
      const result = await BatchService.completeBatch(projectId, groupName, params.id)

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message
        })
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Batch update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const organizationId = user.organization

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const groupName = searchParams.get('groupName')

    if (!projectId || !groupName) {
      return NextResponse.json(
        { error: 'projectId and groupName are required' },
        { status: 400 }
      )
    }

    const result = await BatchService.getBatchDetails(projectId, groupName, params.id)

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Get batch details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}