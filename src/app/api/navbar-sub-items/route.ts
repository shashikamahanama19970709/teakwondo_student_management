import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { NavbarSubItem, NavbarHeading } from '@/models/NavbarItem'
import { authenticateUser } from '@/lib/auth-utils'

function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// GET /api/navbar-sub-items?headingId=xxx  OR  /api/navbar-sub-items?slug=xxx (public page)
export async function GET(request: NextRequest) {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const headingId = searchParams.get('headingId')
    const slug = searchParams.get('slug')
    const orgId = searchParams.get('orgId') // optional for public page

    const filter: any = {}
    if (headingId) filter.heading = headingId
    if (slug) filter.slug = slug
    if (orgId) filter.organization = orgId

    const items = await NavbarSubItem.find(filter).sort({ order: 1 }).lean()
    return NextResponse.json({ success: true, data: items })
}

// POST /api/navbar-sub-items — create a sub-item
export async function POST(request: NextRequest) {
    await connectDB()
    const authResult = await authenticateUser()
    if ('error' in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

    const { user } = authResult
    const orgId = user.organization
    const body = await request.json()
    const { headingId, title, icon, description, date, images, videos, order } = body

    if (!headingId || !title) return NextResponse.json({ error: 'headingId and title are required' }, { status: 400 })

    // Ensure heading belongs to org
    const heading = await NavbarHeading.findOne({ _id: headingId, organization: orgId })
    if (!heading) return NextResponse.json({ error: 'Heading not found' }, { status: 404 })

    const slug = slugify(title)

    const item = await NavbarSubItem.create({
        heading: headingId,
        organization: orgId,
        title,
        slug,
        icon: icon || undefined,
        description: description || undefined,
        date: date ? new Date(date) : undefined,
        images: images || [],
        videos: videos || [],
        order: order ?? 0
    })

    return NextResponse.json({ success: true, data: item })
}

// PUT /api/navbar-sub-items — update
export async function PUT(request: NextRequest) {
    await connectDB()
    const authResult = await authenticateUser()
    if ('error' in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

    const { user } = authResult
    const orgId = user.organization
    const { itemId, title, icon, description, date, images, videos, order, isActive } = await request.json()

    const item = await NavbarSubItem.findOne({ _id: itemId, organization: orgId })
    if (!item) return NextResponse.json({ error: 'Sub-item not found' }, { status: 404 })

    if (title) { item.title = title; item.slug = slugify(title) }
    if (icon !== undefined) item.icon = icon
    if (description !== undefined) item.description = description
    if (date !== undefined) item.date = date ? new Date(date) : undefined
    if (images !== undefined) item.images = images
    if (videos !== undefined) item.videos = videos
    if (typeof order === 'number') item.order = order
    if (typeof isActive === 'boolean') item.isActive = isActive

    await item.save()
    return NextResponse.json({ success: true, data: item })
}

// DELETE /api/navbar-sub-items?id=xxx
export async function DELETE(request: NextRequest) {
    await connectDB()
    const authResult = await authenticateUser()
    if ('error' in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

    const { user } = authResult
    const orgId = user.organization
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')

    if (!itemId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const item = await NavbarSubItem.findOne({ _id: itemId, organization: orgId })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await item.deleteOne()
    return NextResponse.json({ success: true })
}
