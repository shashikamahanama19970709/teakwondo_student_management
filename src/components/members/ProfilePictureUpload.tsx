'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, Loader2, ImagePlus, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'
import { useSignedUrl } from '@/hooks/useSignedUrl'

interface ProfilePictureUploadProps {
  memberId: string
  currentProfilePicture?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (profilePictureUrl: string) => void
}

export function ProfilePictureUpload({
  memberId,
  currentProfilePicture,
  isOpen,
  onClose,
  onSuccess
}: ProfilePictureUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // Use signed URL for current profile picture (for private bucket access)
  const { signedUrl, loading: signedUrlLoading } = useSignedUrl(currentProfilePicture)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, PNG, and WEBP formats are supported')
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }

      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('folder', 'profile-pictures')
      formData.append('memberId', memberId)

      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload profile picture')
      }

      const data = await response.json()
      onSuccess(data.fileUrl)
      onClose()
      
      // Reset state
      setSelectedFile(null)
      setPreview('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload profile picture')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setPreview('')
    setError('')
    const input = document.getElementById('profile-picture-input') as HTMLInputElement
    if (input) input.value = ''
  }

  const handleClose = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setSelectedFile(null)
    setPreview('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Update Profile Picture
              </CardTitle>
              <CardDescription>
                Upload a new profile picture for this team member
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Current Profile Picture */}
          {(currentProfilePicture || !currentProfilePicture) && (
            <div className="space-y-2">
              <Label>Current Profile Picture</Label>
              <div className="relative w-24 h-24 mx-auto">
                {signedUrlLoading ? (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full border-2 border-gray-200" />
                ) : currentProfilePicture ? (
                  <Image
                    src={signedUrl}
                    alt="Current profile picture"
                    fill
                    className="object-cover rounded-full border-2 border-gray-200"
                  />
                ) : (
                  <Image
                    src="/default-avatar.png"
                    alt="Default profile picture"
                    fill
                    className="object-cover rounded-full border-2 border-gray-200"
                  />
                )}
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div className="space-y-2">
            <Label htmlFor="profile-picture-input">New Profile Picture</Label>
            {!preview ? (
              <Label
                htmlFor="profile-picture-input"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImagePlus className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="text-sm text-gray-600 font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WEBP (Max 5MB)
                  </p>
                </div>
                <Input
                  id="profile-picture-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </Label>
            ) : (
              <div className="space-y-3">
                <div className="relative w-24 h-24 mx-auto">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-cover rounded-full border-2 border-blue-200"
                  />
                </div>
                <div className="flex justify-center gap-2">
                  <Label
                    htmlFor="profile-picture-input"
                    className="cursor-pointer text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Replace
                    <Input
                      id="profile-picture-input"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemove}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Picture'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
