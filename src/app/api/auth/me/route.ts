import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/db-config'
import { User } from '@/models/User'
import '@/models/CustomRole' // Ensure CustomRole model is registered for populate
import jwt from 'jsonwebtoken'
import { normalizeUploadUrl } from '@/lib/file-utils'
import { getOrganizationId } from '@/lib/server-config'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'

export async function GET() {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('accessToken')?.value
    const refreshToken = cookieStore.get('refreshToken')?.value

   

    // If no tokens, return unauthorized
    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { error: 'No authentication tokens' },
        { status: 401 }
      )
    }

    let userData = null

    // Try to verify access token first
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, JWT_SECRET) as any
        
        // Database mode - fetch user from database
        await connectDB()
        const user = await User.findById(decoded.userId).populate('customRole', 'name')
        if (user && user.isActive) {
          userData = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            memberId: user.memberId,
            email: user.email,
            role: user.role,
            customRole: user.customRole ? {
              _id: (user.customRole as any)._id.toString(),
              name: (user.customRole as any).name
            } : null,
            organization: getOrganizationId(),
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            avatar: normalizeUploadUrl(user.avatar || ''),
            timezone: user.timezone,
            language: user.language,
            currency: user.currency,
            preferences: user.preferences,
            twoFactorEnabled: user.twoFactorEnabled ?? false,
            security: {
              loginAlerts: user.security?.loginAlerts ?? true,
              sessionTimeout: user.security?.sessionTimeout ?? 30,
              requirePasswordChange: user.security?.requirePasswordChange ?? false
            },
            lastLogin: user.lastLogin
          }
        }
      } catch (error) {
        // Access token is invalid, try refresh token
        if (refreshToken) {
          try {
            const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any
            
            // Database mode - fetch user from database
            await connectDB()
            const user = await User.findById(decoded.userId).populate('customRole', 'name')
            if (user && user.isActive) {
              
              // Create new access token
              const newAccessToken = jwt.sign(
                { userId: user._id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '15m' }
              )

              // Set new access token cookie
              cookieStore.set('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60, // 15 minutes
                path: '/'
              })

              userData = {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                memberId: user.memberId,
                email: user.email,
                role: user.role,
                customRole: user.customRole ? {
                  _id: (user.customRole as any)._id.toString(),
                  name: (user.customRole as any).name
                } : null,
                organization: getOrganizationId(),
                isActive: user.isActive,
                emailVerified: user.emailVerified,
                avatar: normalizeUploadUrl(user.avatar || ''),
                timezone: user.timezone,
                language: user.language,
                currency: user.currency,
                preferences: user.preferences,
                twoFactorEnabled: user.twoFactorEnabled ?? false,
                security: {
                  loginAlerts: user.security?.loginAlerts ?? true,
                  sessionTimeout: user.security?.sessionTimeout ?? 30,
                  requirePasswordChange: user.security?.requirePasswordChange ?? false
                },
                lastLogin: user.lastLogin
              }
            } 
          } catch (refreshError) {
            return NextResponse.json(
              { error: 'Invalid authentication tokens' },
              { status: 401 }
            )
          }
        } else {
          return NextResponse.json(
            { error: 'Invalid access token' },
            { status: 401 }
          )
        }
      }
    } else if (refreshToken) {
      // Only refresh token available
      try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any
        
        await connectDB()
        const user = await User.findById(decoded.userId).populate('customRole', 'name')
        if (user && user.isActive) {
          
          // Create new access token
          const newAccessToken = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '15m' }
          )

          // Set new access token cookie
          cookieStore.set('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 minutes
            path: '/'
          })

          userData = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            memberId: user.memberId,
            email: user.email,
            role: user.role,
            customRole: user.customRole ? {
              _id: (user.customRole as any)._id.toString(),
              name: (user.customRole as any).name
            } : null,
            organization: getOrganizationId(),
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            avatar: normalizeUploadUrl(user.avatar || ''),
            timezone: user.timezone,
            language: user.language,
            currency: user.currency,
            preferences: user.preferences,
            twoFactorEnabled: user.twoFactorEnabled ?? false,
            security: {
              loginAlerts: user.security?.loginAlerts ?? true,
              sessionTimeout: user.security?.sessionTimeout ?? 30,
              requirePasswordChange: user.security?.requirePasswordChange ?? false
            },
            lastLogin: user.lastLogin
          }
        } 
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid refresh token' },
          { status: 401 }
        )
      }
    }

    if (userData) {
      return NextResponse.json(userData)
    } else {
    
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
