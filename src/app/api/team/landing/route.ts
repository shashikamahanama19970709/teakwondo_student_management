import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { User } from '@/models/User'

export async function GET(request: NextRequest) {
    try {
        await connectDB()
        const members = await User.find({
            showOnLanding: true,
            isActive: true
        })
            .sort({ firstName: 1 })
            .select('firstName lastName role description avatar profile_picture')
            .lean()

        return NextResponse.json(members)
    } catch (error) {
        console.error('Error fetching landing members:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
