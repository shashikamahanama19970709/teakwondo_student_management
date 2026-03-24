import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'articles' or 'announcements'
    const limit = parseInt(searchParams.get('limit') || '3')

    if (type === 'articles') {
      // Articles module has been removed
      return NextResponse.json({ articles: [] })
    }

    if (type === 'announcements') {
      // Announcements module has been removed
      return NextResponse.json({ announcements: [] })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching public data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}