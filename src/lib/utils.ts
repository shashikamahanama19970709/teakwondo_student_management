import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return 'N/A'

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date value:', date)
      return 'Invalid Date'
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj)
  } catch (error) {
    console.error('Error formatting date:', error, 'Original value:', date)
    return 'Invalid Date'
  }
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

/**
 * Converts text to Title Case
 * Handles snake_case, kebab-case, UPPERCASE, and regular lowercase text
 * Examples:
 *   "in_progress" -> "In Progress"
 *   "team_member" -> "Team Member"
 *   "PROJECT_MANAGER" -> "Project Manager"
 *   "project_manager" -> "Project Manager"
 *   "admin" -> "Admin"
 *   "ADMIN" -> "Admin"
 */
export function formatToTitleCase(text: string | undefined | null): string {
  if (!text) return ''
  
  // Convert to lowercase first, then split and capitalize
  return text
    .toLowerCase()
    .split(/[_\-\s]+/) // Split on underscore, hyphen, or whitespace
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Applies rounding rules to a time duration in minutes
 * @param duration - Duration in minutes
 * @param roundingRules - Rounding rules configuration
 * @returns Rounded duration in minutes
 */
export function applyRoundingRules(
  duration: number,
  roundingRules: { enabled: boolean; increment: number; roundUp: boolean }
): number {
  if (!roundingRules.enabled || duration <= 0) {
    return duration
  }

  const increment = roundingRules.increment

  // Convert total minutes to hours and minutes
  const totalHours = Math.floor(duration / 60)
  const remainingMinutes = duration % 60

  // Round the minute component
  let roundedMinutes: number
  if (roundingRules.roundUp) {
    // Round up to nearest increment
    roundedMinutes = Math.ceil(remainingMinutes / increment) * increment
    // If rounding up minutes exceeds 60, it will carry over to hours in the display
  } else {
    // Round down to nearest increment
    roundedMinutes = Math.floor(remainingMinutes / increment) * increment
  }

  // Convert back to total minutes
  return totalHours * 60 + roundedMinutes
}

/**
 * Fixes file URL format to match API expectations
 * Converts URLs like https://f005.backblazeb2.com/file/HelpLine/units/videos/filename.mp4 to /file/HelpLine/units/videos/filename.mp4
 * @param fileUrl - The original file URL
 * @returns The corrected file URL in /file/<bucket>/<full-path> format
 */
export function fixFileUrl(fileUrl: string): string {
  if (!fileUrl) return fileUrl

  try {
    // Remove any single quotes from the URL
    let cleanUrl = fileUrl.replace(/'/g, '')

    // Check if it's already in the correct format /file/<bucket>/<path>
    if (cleanUrl.includes('/file/')) {
      const parts = cleanUrl.split('/file/')
      if (parts.length === 2) {
        const pathPart = parts[1] // e.g., "HelpLine/units/videos/1771658254413-Tasks_Module.mp4"
        const pathSegments = pathPart.split('/').filter(segment => segment.length > 0)

        if (pathSegments.length >= 2) {
          const bucket = pathSegments[0] // First segment is bucket (e.g., "HelpLine")
          const filePath = pathSegments.slice(1).join('/') // Rest is the full file path

          // Return the corrected format with full path
          return `/file/${bucket}/${filePath}`
        }
      }
    }

    // If we can't parse it, return the cleaned URL as-is
    return cleanUrl
  } catch (error) {
    console.error('Error fixing file URL:', error)
    return fileUrl
  }
}