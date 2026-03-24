import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Testimonial } from '@/models/Testimonial'
import { authenticateUser } from '@/lib/auth-utils'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB()
        const testimonial = await Testimonial.findById(params.id)
        if (!testimonial) {
            return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
        }
        return NextResponse.json(testimonial)
    } catch (error) {
        console.error('Error fetching testimonial:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB()

        // Authenticate user
        const authResult = await authenticateUser()
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        // Check if admin
        if (authResult.user.role !== 'admin') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const data = await request.json()
        const testimonial = await Testimonial.findByIdAndUpdate(params.id, data, { new: true })

        if (!testimonial) {
            return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, testimonial })
    } catch (error) {
        console.error('Error updating testimonial:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB()

        // Authenticate user
        const authResult = await authenticateUser()
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        // Check if admin
        if (authResult.user.role !== 'admin') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const testimonial = await Testimonial.findByIdAndDelete(params.id)

        if (!testimonial) {
            return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, message: 'Testimonial deleted successfully' })
    } catch (error) {
        console.error('Error deleting testimonial:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
