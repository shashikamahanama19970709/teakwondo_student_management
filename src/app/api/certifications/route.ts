import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Certification } from '@/models/Certification'
import { authenticateUser } from '@/lib/auth-utils'

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
    const organizationId = user.organization!

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    // Build filters
    const filters: any = {
      organization: organizationId,
      isDeleted: false
    }

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { issuingOrganization: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    if (status && status !== 'all') {
      filters.status = status
    }

    const skip = (page - 1) * limit

    // Get certifications with populated fields
    const certifications = await Certification.find(filters)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalCount = await Certification.countDocuments(filters)

    return NextResponse.json({
      success: true,
      certifications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching certifications:', error)
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

    const { user } = authResult
    const userId = user.id
    const organizationId = user.organization!

  

    const body = await request.json()
    const {
      name,
      description,
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

    // Create certification
    const certification = new Certification({
      name: name.trim(),
      description: description?.trim(),
      status: 'draft',
      isActive: false,
      organization: organizationId,
      createdBy: userId,
      issuingOrganization: issuingOrganization.trim(),
      skills: skills || [],
      tags: tags || [],
      attachments: attachments || []
    })

    await certification.save()

    // Populate createdBy for response
    await certification.populate('createdBy', 'firstName lastName email')

    const response = {
      certification,
      message: 'Certification created successfully'
    }
    
   

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error creating certification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}