import { NextResponse } from 'next/server'
import connectDB from '@/lib/db-config'
import { User } from '@/models/User'
import { emailService } from '@/lib/email/EmailService'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

 

    await connectDB()

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      // Don't reveal if user exists or not for security

      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset code has been sent.'
      })
    }

    if (!user.isActive) {
  
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset code has been sent.'
      })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
 
    
    // Set OTP expiry to 10 minutes from now
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)
    
    // Update user with OTP
    user.passwordResetOtp = otp
    user.passwordResetExpiry = otpExpiry
    await user.save()

    // Send email with OTP using the email service
    const emailSent = await emailService.sendEmail({
      to: user.email,
      subject: 'Password Reset Verification Code',
      html: emailService.generateOTPEmail(otp, 'FlexNode')
    })

    if (!emailSent) {
      console.error('Failed to send password reset email to:', user.email)
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again.' },
        { status: 500 }
      )
    }

  

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset code has been sent.'
    })

  } catch (error) {
    console.error('Password reset request failed:', error)
    return NextResponse.json(
      { error: 'Password reset request failed' },
      { status: 500 }
    )
  }
}
