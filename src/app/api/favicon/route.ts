import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { Organization } from '@/models/Organization'
import { hasDatabaseConfig } from '@/lib/db-config'
import { normalizeUploadUrl } from '@/lib/file-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check if database is configured
    const isConfigured = await hasDatabaseConfig()
    if (!isConfigured) {
      // Return default favicon if DB is not configured
      const defaultFaviconResponse = await fetch(new URL('/favicon.ico', request.url))
      const faviconBuffer = await defaultFaviconResponse.arrayBuffer()
      
      return new NextResponse(faviconBuffer, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      })
    }

    await connectDB()
    
    // Get organization
    const organization = await Organization.findOne()
    
    if (!organization || !organization.logo) {
      // Return default favicon if no organization logo exists
      const defaultFaviconResponse = await fetch(new URL('/favicon.ico', request.url))
      const faviconBuffer = await defaultFaviconResponse.arrayBuffer()
      
      return new NextResponse(faviconBuffer, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Get normalized URL for organization logo
    const logoUrl = normalizeUploadUrl(organization.logo)
    
    if (!logoUrl) {
      // Return default favicon if URL normalization fails
      const defaultFaviconResponse = await fetch(new URL('/favicon.ico', request.url))
      const faviconBuffer = await defaultFaviconResponse.arrayBuffer()
      
      return new NextResponse(faviconBuffer, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // If logo is already a full URL, fetch it directly
    // Otherwise, construct the full URL
    const fullLogoUrl = logoUrl.startsWith('http') 
      ? logoUrl 
      : new URL(logoUrl, request.url).toString()

    // Fetch the organization logo
    const logoResponse = await fetch(fullLogoUrl)
    
    if (!logoResponse.ok) {
      // Return default favicon if logo fetch fails
      const defaultFaviconResponse = await fetch(new URL('/favicon.ico', request.url))
      const faviconBuffer = await defaultFaviconResponse.arrayBuffer()
      
      return new NextResponse(faviconBuffer, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    const logoBuffer = await logoResponse.arrayBuffer()
    const contentType = logoResponse.headers.get('content-type') || 'image/png'

    return new NextResponse(logoBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    console.error('Error generating favicon:', error)
    
    // Return default favicon on error
    try {
      const defaultFaviconResponse = await fetch(new URL('/favicon.ico', request.url))
      const faviconBuffer = await defaultFaviconResponse.arrayBuffer()
      
      return new NextResponse(faviconBuffer, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to generate favicon' },
        { status: 500 }
      )
    }
  }
}
