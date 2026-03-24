'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { useSignedUrl } from '@/hooks/useSignedUrl'

interface OrganizationLogoProps {
  lightLogo?: string
  darkLogo?: string
  logoMode?: 'light' | 'dark' | 'both' | 'auto'
  fallbackText?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const OrganizationLogo = ({ 
  lightLogo, 
  darkLogo, 
  logoMode = 'both',
  fallbackText = 'K', 
  className = '',
  size = 'md'
}: OrganizationLogoProps) => {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Get signed URLs for logos
  const { signedUrl: lightLogoSignedUrl } = useSignedUrl(lightLogo)
  const { signedUrl: darkLogoSignedUrl } = useSignedUrl(darkLogo)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-12 w-12 text-lg',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-32 w-32 text-2xl'
  }

  // Always render the same structure on server and client initially
  if (!mounted) {
    return (
      <div 
        className={`flex items-center justify-center bg-primary/10 text-primary font-bold rounded ${sizeClasses[size]} ${className}`}
        suppressHydrationWarning
      >
        {fallbackText}
      </div>
    )
  }

  const currentTheme = resolvedTheme || theme
  
  // Determine which logo to use based on logoMode and current theme
  let logoSrc: string | undefined
  
  if (logoMode === 'light') {
    // Force light logo regardless of theme
    logoSrc = lightLogoSignedUrl
  } else if (logoMode === 'dark') {
    // Force dark logo regardless of theme
    logoSrc = darkLogoSignedUrl
  } else if (logoMode === 'auto') {
    // Auto mode: choose logo based on current theme
    if (currentTheme === 'dark') {
      logoSrc = darkLogoSignedUrl || lightLogoSignedUrl // Fallback to light logo if dark logo not available
    } else {
      logoSrc = lightLogoSignedUrl || darkLogoSignedUrl // Fallback to dark logo if light logo not available
    }
  } else { // logoMode === 'both' or undefined
    // Choose logo based on current theme
    if (currentTheme === 'dark') {
      logoSrc = darkLogoSignedUrl || lightLogoSignedUrl // Fallback to light logo if dark logo not available
    } else {
      logoSrc = lightLogoSignedUrl || darkLogoSignedUrl // Fallback to dark logo if light logo not available
    }
  }

  // If we only have one logo and it's a base64 data URL, use it for both themes
  // This handles the case where the database only has one logo
  if (!logoSrc && (lightLogoSignedUrl || darkLogoSignedUrl)) {
    logoSrc = lightLogoSignedUrl || darkLogoSignedUrl
  }

  if (logoSrc) {
    return (
      <div className={`flex items-center justify-center ${sizeClasses[size]} ${className}`} suppressHydrationWarning>
        <img
          src={logoSrc}
          alt="Organization logo"
          className="object-contain w-full h-full"
        />
      </div>
    )
  }

  return (
    <div 
      className={`flex items-center justify-center bg-primary/10 text-primary font-bold rounded ${sizeClasses[size]} ${className}`}
      suppressHydrationWarning
    >
      {fallbackText}
    </div>
  )
}
