'use client'

import { useEffect, useRef, useState } from 'react'

interface UseStudentTrackingProps {
  unitId: string
  fileId: string
  fileType: 'video' | 'image' | 'document'
  studentId?: string
}

interface TrackingData {
  durationWatched?: number
  completionPercentage?: number
  viewCount?: number
}

export function useStudentTracking({ 
  unitId, 
  fileId, 
  fileType, 
  studentId 
}: UseStudentTrackingProps) {
  const [isTracking, setIsTracking] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasTrackedView = useRef(false)

  // Track student progress
  const trackProgress = async (trackingData: TrackingData) => {
    if (!studentId) {
      console.log('No student ID provided, skipping tracking')
      return
    }

    try {
      setIsTracking(true)
      
      const response = await fetch(`/api/units/${unitId}/tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          fileId,
          fileType,
          ...trackingData
        })
      })

      if (!response.ok) {
        console.error('Failed to track progress:', await response.text())
      } 
    } catch (error) {
      console.error('Error tracking progress:', error)
    } finally {
      setIsTracking(false)
    }
  }

  // Track video progress
  const trackVideoProgress = () => {
    if (!videoRef.current || fileType !== 'video') return

    const video = videoRef.current
    
    // Clear any existing interval
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current)
    }

    // Set up tracking interval
    trackingIntervalRef.current = setInterval(() => {
      if (video.paused || video.ended) return

      const durationWatched = Math.floor(video.currentTime)
      const completionPercentage = Math.round((video.currentTime / video.duration) * 100)

      trackProgress({
        durationWatched,
        completionPercentage
      })
    }, 5000) // Track every 5 seconds

    // Handle video end
    const handleVideoEnd = () => {
      trackProgress({
        durationWatched: Math.floor(video.duration),
        completionPercentage: 100
      })
      
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
      }
    }

    video.addEventListener('ended', handleVideoEnd)

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
      }
      video.removeEventListener('ended', handleVideoEnd)
    }
  }

  // Track document/image view
  const trackContentView = () => {
    if (fileType === 'video' || hasTrackedView.current) return

    hasTrackedView.current = true
    console.log('Tracking hook - Tracking content view:', { fileId, fileType, studentId })
    trackProgress({
      viewCount: 1
    })
  }

  // Clean up tracking on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
      }
    }
  }, [])

  return {
    isTracking,
    videoRef,
    trackVideoProgress,
    trackContentView
  }
}
