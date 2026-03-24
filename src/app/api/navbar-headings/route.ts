import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { NavbarHeading, NavbarSubItem } from '@/models/NavbarItem'
import { authenticateUser } from '@/lib/auth-utils'

function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// GET /api/navbar-headings — list all headings (with sub-item counts)
export async function GET(request: NextRequest) {
    await connectDB()
    const authResult = await authenticateUser()
    if ('error' in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

    const { user } = authResult
    const orgId = user.organization

    const headings = await NavbarHeading.find({ organization: orgId }).sort({ order: 1, createdAt: 1 }).lean()

    // Attach sub-items to each heading
    const withSubs = await Promise.all(
        headings.map(async (h) => {
            const subs = await NavbarSubItem.find({ heading: h._id, organization: orgId }).sort({ order: 1 }).lean()
            return { ...h, subItems: subs }
        })
    )

    return NextResponse.json({ success: true, data: withSubs })
}

// POST /api/navbar-headings — create a heading (or seed defaults)
export async function POST(request: NextRequest) {
    await connectDB()
    const authResult = await authenticateUser()
    if ('error' in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

    const { user } = authResult
    const orgId = user.organization
    const body = await request.json()
    const { name, isDefault, defaultType, order } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const slug = slugify(name)

    const existing = await NavbarHeading.findOne({ slug, organization: orgId })
    if (existing) return NextResponse.json({ error: 'A heading with this name already exists' }, { status: 400 })

    const heading = await NavbarHeading.create({
        organization: orgId,
        name,
        slug,
        isDefault: !!isDefault,
        defaultType: defaultType || undefined,
        order: order ?? 0
    })

    return NextResponse.json({ success: true, data: heading })
}

// PUT /api/navbar-headings — update name / order / active
export async function PUT(request: NextRequest) {
    await connectDB()
    const authResult = await authenticateUser()
    if ('error' in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

    const { user } = authResult
    const orgId = user.organization
    const { headingId, name, order, isActive } = await request.json()

    const heading = await NavbarHeading.findOne({ _id: headingId, organization: orgId })
    if (!heading) return NextResponse.json({ error: 'Heading not found' }, { status: 404 })

    if (name) {
        heading.name = name
        heading.slug = slugify(name)
    }
    if (typeof order === 'number') heading.order = order
    if (typeof isActive === 'boolean') heading.isActive = isActive

    await heading.save()
    return NextResponse.json({ success: true, data: heading })
}

// DELETE /api/navbar-headings?id=xxx
export async function DELETE(request: NextRequest) {
    await connectDB()
    const authResult = await authenticateUser()
    if ('error' in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

    const { user } = authResult
    const orgId = user.organization
    const { searchParams } = new URL(request.url)
    const headingId = searchParams.get('id')

    if (!headingId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const heading = await NavbarHeading.findOne({ _id: headingId, organization: orgId })
    if (!heading) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (heading.isDefault) return NextResponse.json({ error: 'Default headings cannot be deleted' }, { status: 400 })

    await NavbarSubItem.deleteMany({ heading: headingId, organization: orgId })
    await heading.deleteOne()

    return NextResponse.json({ success: true })
}
