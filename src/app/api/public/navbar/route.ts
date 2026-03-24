import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { NavbarHeading, NavbarSubItem } from '@/models/NavbarItem'

// GET /api/public/navbar — returns all active headings + their sub-items (no auth needed)
export async function GET(request: NextRequest) {
    await connectDB()

    // Try to get orgId from query (optional; for multi-org. Falls back to first org)
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')
    const filter: any = { isActive: true }
    if (orgId) filter.organization = orgId

    const headings = await NavbarHeading.find(filter).sort({ order: 1, createdAt: 1 }).lean()

    const withSubs = await Promise.all(
        headings.map(async (h) => {
            const subs = await NavbarSubItem.find({
                heading: h._id,
                organization: h.organization,
                isActive: true
            }).sort({ order: 1 }).lean()
            return { ...h, subItems: subs }
        })
    )

    return NextResponse.json({ success: true, data: withSubs })
}
