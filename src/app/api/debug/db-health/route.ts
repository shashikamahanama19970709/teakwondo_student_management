import { NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import mongoose from 'mongoose'

export async function GET() {
  try {
    
    const db = await connectDB()
   
    
    // Test a simple operation
    const collections = await db.connection.db.listCollections().toArray()
    
    return NextResponse.json({
      success: true,
      connectionState: db.connection.readyState,
      connectionStates: {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      },
      database: {
        name: db.connection.name,
        host: db.connection.host,
        port: db.connection.port
      },
      collections: collections.map((c: any) => c.name),
      message: 'Database health check completed'
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Database health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        connectionState: mongoose.connection.readyState,
        connectionStates: {
          0: 'disconnected',
          1: 'connected',
          2: 'connecting',
          3: 'disconnecting'
        }
      },
      { status: 500 }
    )
  }
}
