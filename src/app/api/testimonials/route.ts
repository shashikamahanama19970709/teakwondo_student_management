import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Testimonial } from '@/models/Testimonial'
import { authenticateUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const all = searchParams.get('all') === 'true';

        const query = all ? {} : { isActive: true };
        const testimonials = await Testimonial.find(query).sort({ createdAt: -1 }).lean();

        // Return the testimonial with the image key only (not full URL)
        const testimonialsWithImageKey = testimonials.map((testimonial: any) => ({
            _id: testimonial._id.toString(),
            name: testimonial.name,
            role: testimonial.role,
            message: testimonial.message,
            profile_picture: testimonial.profile_picture, // just the key, not a full URL
            isActive: testimonial.isActive,
            createdAt: testimonial.createdAt,
            updatedAt: testimonial.updatedAt
        }));

        return NextResponse.json({ testimonials: testimonialsWithImageKey });
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
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

        if (!data.name || !data.role || !data.message || !data.profile_picture) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        const testimonial = await Testimonial.create(data)

        return NextResponse.json({ success: true, testimonial })
    } catch (error) {
        console.error('Error creating testimonial:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
