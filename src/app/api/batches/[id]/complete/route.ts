import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Project } from '@/models/Project'
import { authenticateUser } from '@/lib/auth-utils'
import mongoose from 'mongoose'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
 
  
  try {
    await connectDB()

  
    const authResult = await authenticateUser()
  
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult
    const { id } = params


    if (!mongoose.Types.ObjectId.isValid(id)) {
   
      return NextResponse.json(
        { error: 'Invalid batch ID' },
        { status: 400 }
      )
    }

    // Find the project that contains this batch
    const project = await Project.findOne({
      'batches._id': id,
      organization: user.organization
    })

   

    if (!project) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    // Find the specific batch
    const batch = project.batches.id(id)
   
    
    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    // Update batch status to COMPLETED
    batch.status = 'COMPLETED'
    
   
    
    await project.save()
    
   

    return NextResponse.json({
      success: true,
      data: {
        _id: batch._id,
        status: batch.status
      }
    })

  } catch (error) {
    console.error('Error completing batch:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
