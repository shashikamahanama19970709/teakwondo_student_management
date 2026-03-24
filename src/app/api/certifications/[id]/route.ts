import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Certification } from '@/models/Certification'
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
    const userId = user.id
    const organizationId = user.organization!
    const certificationId = params.id

    // Validate that id is a valid ObjectId
    if (!certificationId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid certification ID format' },
        { status: 400 }
      )
    }


    const certification = await Certification.findOne({
      _id: certificationId,
      organization: organizationId,
      isDeleted: false
    }).populate('createdBy', 'firstName lastName email')

    if (!certification) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ certification })

  } catch (error) {
    console.error('Error fetching certification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const userId = user.id
    const organizationId = user.organization!
    const certificationId = params.id

    // Validate that id is a valid ObjectId
    if (!certificationId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid certification ID format' },
        { status: 400 }
      )
    }

    // Check permissions
   

    const body = await request.json()
    const {
      name,
      description,
      status,
      issuingOrganization,
      skills,
      tags,
      attachments
    } = body

    // Validate required fields
    if (!name || !issuingOrganization) {
      return NextResponse.json(
        { error: 'Name and issuing organization are required' },
        { status: 400 }
      )
    }

    const certification = await Certification.findOneAndUpdate(
      {
        _id: certificationId,
        organization: organizationId,
        isDeleted: false
      },
      {
        name: name.trim(),
        description: description?.trim(),
        status,
        isActive: status === 'active',
        issuingOrganization: issuingOrganization.trim(),
        skills: skills || [],
        tags: tags || [],
        attachments: attachments || []
      },
      { new: true }
    ).populate('createdBy', 'firstName lastName email')

    if (!certification) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      certification,
      message: 'Certification updated successfully'
    })

  } catch (error) {
    console.error('Error updating certification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const userId = user.id
    const organizationId = user.organization!
    const certificationId = params.id

    // Validate that id is a valid ObjectId
    if (!certificationId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid certification ID format' },
        { status: 400 }
      )
    }

 

    const certification = await Certification.findOneAndUpdate(
      {
        _id: certificationId,
        organization: organizationId,
        isDeleted: false
      },
      {
        isDeleted: true,
        deletedAt: new Date()
      },
      { new: true }
    )

    if (!certification) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Certification deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting certification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH for restore functionality
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
    const userId = user.id
    const organizationId = user.organization!
    const certificationId = params.id

    // Validate that id is a valid ObjectId
    if (!certificationId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid certification ID format' },
        { status: 400 }
      )
    }

    

    const body = await request.json()
    const { action } = body

    if (action === 'restore') {
      const certification = await Certification.findOneAndUpdate(
        {
          _id: certificationId,
          organization: organizationId,
          isDeleted: true
        },
        {
          isDeleted: false,
          deletedAt: undefined
        },
        { new: true }
      ).populate('createdBy', 'firstName lastName email')

      if (!certification) {
        return NextResponse.json(
          { error: 'Certification not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        certification,
        message: 'Certification restored successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error restoring certification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}