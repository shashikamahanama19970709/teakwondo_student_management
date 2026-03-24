import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { NavbarHeading } from '@/models/NavbarItem'
import { authenticateUser } from '@/lib/auth-utils'

// POST /api/navbar-headings/seed — idempotently creates default headings
export async function POST(request: NextRequest) {
    await connectDB()
    const authResult = await authenticateUser()
    if ('error' in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status })

    const { user } = authResult
    const orgId = user.organization

    const defaults = [
        { name: 'Features', slug: 'features', defaultType: 'features', order: 0 },
        { name: 'Courses', slug: 'courses', defaultType: 'courses', order: 1 },
    ]

    const created: string[] = []
    for (const d of defaults) {
        const exists = await NavbarHeading.findOne({ slug: d.slug, organization: orgId })
        if (!exists) {
            await NavbarHeading.create({ ...d, organization: orgId, isDefault: true })
            created.push(d.name)
        }
    }

    return NextResponse.json({ success: true, created })
}
