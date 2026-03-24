import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Announcement } from '@/models/Announcement'

// GET /api/announcements/landing - Get active announcements for landing page
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const announcements = await Announcement.find({
      isActive: true,
      expireDate: { $gte: today },
      happeningDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // Show announcements happening within next 30 days
    })
    .sort({ happeningDate: 1, createdAt: -1 })
    .select('title description featureImageUrl happeningDate expireDate')
    .lean()

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Error fetching landing announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}