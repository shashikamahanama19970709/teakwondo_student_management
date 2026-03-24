'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { X, Download, AlertTriangle, FileText, Maximize2, Minimize2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useStudentTracking } from '@/hooks/useStudentTracking'

interface MediaLightboxProps {
  isOpen: boolean
  onClose: () => void
  file: {
    fileId: string
    fileName: string
    fileType: 'video' | 'image' | 'document'
    title: string
    fileUrl: string // This is the file key, not signed URL
  } | null
  unitId: string
  studentId?: string
}

export function MediaLightbox({ isOpen, onClose, file, unitId, studentId }: MediaLightboxProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  // Fetch signed URL when file changes
  useEffect(() => {
    if (!file?.fileUrl) {
      setSignedUrl(null)
      return
    }

    const fetchSignedUrl = async () => {
      try {
        const res = await fetch(
          `/api/files/signed-url?key=${encodeURIComponent(file.fileUrl)}&download=false`
        )
        
        if (!res.ok) {
          throw new Error('Failed to fetch signed URL')
        }
        
        const data = await res.json()
        setSignedUrl(data.url) // API returns { url: signedUrl }, not { signedUrl: signedUrl }
      } catch (error) {
        console.error('MediaLightbox: Error fetching signed URL:', error)
        setError('Failed to load file - could not get secure URL')
        setSignedUrl(null)
      }
    }

    fetchSignedUrl()
  }, [file])

  // Initialize tracking hook
  const { isTracking, videoRef, trackVideoProgress, trackContentView } = useStudentTracking({
    unitId,
    fileId: file?.fileId || '',
    fileType: file?.fileType || 'document',
    studentId
  })

  // Track content view when lightbox opens and content loads
  useEffect(() => {
    if (isOpen && file && !isLoading && signedUrl) {
      trackContentView()
    }
  }, [isOpen, file, isLoading, signedUrl, trackContentView])

  if (!file) return null

  // Show loading state while fetching signed URL
  if (!signedUrl && !error) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Loading file...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Show error state if signed URL fetch failed
  if (error || !signedUrl) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="flex items-center justify-center min-h-[400px] p-8">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-center">
                {error || 'Failed to load file. Please try again.'}
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const mediaUrl = signedUrl

  const handleLoad = () => {
    setIsLoading(false)
    setError(null)
    
    // Track content view for all file types
    trackContentView()
    
    // Start video tracking if it's a video file
    if (file.fileType === 'video') {
      trackVideoProgress()
    }
  }

  const handleError = () => {
    setIsLoading(false)
    setError('Failed to load media - check console for server logs')
    console.error('Media failed to load for:', mediaUrl, file)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const preventContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  const preventDownload = (e: React.KeyboardEvent) => {
    // Prevent Ctrl+S and other download shortcuts
    if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-4xl max-h-[90vh] p-0 overflow-hidden ${isFullscreen ? 'w-screen h-screen max-w-none max-h-none' : ''}`}
        onEscapeKeyDown={(e) => {
          if (isFullscreen) {
            setIsFullscreen(false)
            e.preventDefault()
          }
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Preview</DialogTitle>
          <DialogDescription>
            File preview window
          </DialogDescription>
        </DialogHeader>
        <div className="relative bg-black">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{file.title || file.fileName}</h3>
                <p className="text-white/70 text-sm">{file.fileType}</p>
              </div>
              <div className="flex items-center gap-2">
                {file.fileType === 'image' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Media Content */}
          <div className="flex items-center justify-center min-h-[400px] max-h-[80vh]">
            {error ? (
              <div className="p-8">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-center">
                    {error}
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}

                {file.fileType === 'image' ? (
                  <img
                    src={mediaUrl}
                    alt={file.title || file.fileName}
                    className={`max-w-full max-h-full object-contain ${isFullscreen ? 'w-full h-full' : ''}`}
                    onLoad={handleLoad}
                    onError={handleError}
                    onContextMenu={preventContextMenu}
                    onKeyDown={preventDownload}
                    draggable={false}
                    style={{ userSelect: 'none' }}
                  />
                ) : file.fileType === 'video' ? (
                  <video
                    ref={videoRef}
                    src={mediaUrl}
                    preload="metadata"
                    controls
                    controlsList="nodownload"
                    className="max-w-full max-h-full"
                    onLoadedData={handleLoad}
                    onError={handleError}
                    onContextMenu={preventContextMenu}
                    onKeyDown={preventDownload}
                    disablePictureInPicture
                    style={{ userSelect: 'none' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : file.fileType === 'document' ? (
                  // Handle documents - PDFs can be displayed, others show download option
                  file.fileName.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={mediaUrl}
                      className="w-full h-full min-h-[600px]"
                      onLoad={handleLoad}
                      onError={handleError}
                      title={file.title || file.fileName}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Document Preview Not Available
                      </h3>
                      <p className="text-white/70 mb-6 max-w-md">
                        This document type ({file.fileName.split('.').pop()?.toUpperCase()}) cannot be previewed in the browser.
                        Click below to download and view the file.
                      </p>
                      <Button
                        onClick={() => window.open(mediaUrl, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download {file.fileName}
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="p-8 text-center text-white">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Preview not available for this file type.</p>
                    <p className="text-sm opacity-70 mt-2">
                      This file type cannot be displayed in the browser.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
            <p className="text-white/70 text-xs text-center">
              This content is protected. Right-click and download functions are disabled.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}