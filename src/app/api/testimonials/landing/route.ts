import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Testimonial } from '@/models/Testimonial'

export async function GET(request: NextRequest) {
    try {
        await connectDB()
        const testimonials = await Testimonial.find({ isActive: true })
            .sort({ createdAt: -1 })
            .lean()

        return NextResponse.json(testimonials)
    } catch (error) {
        console.error('Error fetching landing testimonials:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
