import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Certification } from '@/models/Certification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get active certifications for landing page
    const certifications = await Certification.find({ 
      isActive: true,
      isDeleted: false 
    })
      .select('name issuingOrganization skills tags')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json({
      success: true,
      certifications
    })

  } catch (error) {
    console.error('Error fetching landing certifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
