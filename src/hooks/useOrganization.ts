'use client'

import { useState, useEffect } from 'react'

interface Organization {
  id: string
  name: string
  domain?: string
  description?: string
  vision?: string
  mission?: string
  logo?: string
  darkLogo?: string
  logoMode?: 'light' | 'dark' | 'both' | 'auto'
  timezone?: string
  currency?: string
  language?: string
  industry?: string
  size?: 'startup' | 'small' | 'medium' | 'enterprise'
  contactInfo?: {
    facebookUrl?: string
    showFacebook?: boolean
    linkedinUrl?: string
    showLinkedin?: boolean
    whatsapp?: string
    showWhatsapp?: boolean
    email?: string
    showEmail?: boolean
    mobile?: string
    showMobile?: boolean
    landphone?: string
    showLandphone?: boolean
    address?: string
    showAddress?: boolean
    mapLocationUrl?: string
    showMapLocation?: boolean
  }
  settings?: {
    allowSelfRegistration?: boolean
    defaultUserRole?: string
    timeTracking?: {
      allowTimeTracking?: boolean
      allowManualTimeSubmission?: boolean
      requireApproval?: boolean
      allowBillableTime?: boolean
      defaultHourlyRate?: number
      maxDailyHours?: number
      maxWeeklyHours?: number
      maxSessionHours?: number
      allowOvertime?: boolean
     // requireDescription?: boolean
      requireCategory?: boolean
      allowFutureTime?: boolean
      allowPastTime?: boolean
      pastTimeLimitDays?: number
      roundingRules?: {
        enabled?: boolean
        increment?: number
        roundUp?: boolean
      }
      notifications?: {
        onTimerStart?: boolean
        onTimerStop?: boolean
        onOvertime?: boolean
        onApprovalNeeded?: boolean
        onTimeSubmitted?: boolean
      }
    }
    notifications?: {
      retentionDays?: number
      autoCleanup?: boolean
    }
  }
  emailConfig?: {
    provider: 'smtp' | 'azure' | 'sendgrid' | 'mailgun'
    smtp?: {
      host: string
      port: number
      secure: boolean
      username: string
      password: string
      fromEmail: string
      fromName: string
    }
    azure?: {
      clientId: string
      clientSecret: string
      tenantId: string
      fromEmail: string
      fromName: string
    }
  }
}

// Use sessionStorage for caching organization data
// This ensures cache is cleared on page reload, preventing stale settings data
const CACHE_KEY = 'help_line_academy_organization_cache'
const CACHE_TIMESTAMP_KEY = 'help_line_academy_organization_timestamp'
const CACHE_DURATION = 30 * 1000 // 30 seconds

export function useOrganization() {
  // Try to get cached data from sessionStorage
  const getCachedData = () => {
    if (typeof window === 'undefined') return null

    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      const timestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY)

      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp)
        if (age < CACHE_DURATION) {
          return JSON.parse(cached)
        }
      }
    } catch (error) {
      // Ignore cache errors
    }

    return null
  }

  const setCachedData = (data: Organization) => {
    if (typeof window === 'undefined') return

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data))
      sessionStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    } catch (error) {
      // Ignore cache errors
    }
  }

  // Start with null on both server and client to avoid
  // hydration mismatches, then hydrate from cache/API in effects.
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrganization = async (force = false) => {
    const cachedData = getCachedData()
    const shouldUseCache = !force && cachedData

    if (shouldUseCache) {
      setOrganization(cachedData)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/organization')
      if (response.ok) {
        const data = await response.json()
        setOrganization(data)
        // Cache the data in sessionStorage
        setCachedData(data)
      } else {
        // Fallback to mock data if API fails
        const mockOrganization: Organization = {
          id: '1',
          name: 'Help Line Academy', // Fix inconsistent organization name
          logo: undefined,
          darkLogo: undefined,
          logoMode: 'auto',
          currency: 'USD'
        }
        setOrganization(mockOrganization)
        setCachedData(mockOrganization)
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error)
      // Fallback to mock data on error
      const mockOrganization: Organization = {
        id: '1',
        name: 'Help Line Academy',
        logo: undefined,
        darkLogo: undefined,
        logoMode: 'auto',
        currency: 'USD'
      }
      setOrganization(mockOrganization)
      setCachedData(mockOrganization)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // On mount, hydrate from cache or API on the client only
    if (!organization) {
      fetchOrganization()
    } else {
      setLoading(false)
    }

    // Listen for cache invalidation events from organization settings
    const handleCacheInvalidation = () => {
      fetchOrganization(true)
    }

    window.addEventListener('organization-settings-updated', handleCacheInvalidation)

    return () => {
      window.removeEventListener('organization-settings-updated', handleCacheInvalidation)
    }
  }, [organization])

  return {
    organization,
    loading,
    refetch: () => fetchOrganization(true)
  }
}