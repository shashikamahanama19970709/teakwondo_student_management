import { useState, useEffect } from 'react'

export function useSignedUrl(fileKey: string | undefined) {
  const [signedUrl, setSignedUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!fileKey || fileKey.startsWith('http')) {
      // If it's already a full URL or no key, use as-is
      setSignedUrl(fileKey || '')
      return
    }

    const fetchSignedUrl = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(
          `/api/files/signed-url?key=${encodeURIComponent(fileKey)}`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch signed URL')
        }
        
        const data = await response.json()
        setSignedUrl(data.url)
      } catch (err) {
        console.error('Error fetching signed URL:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch signed URL')
        setSignedUrl('') // Fallback to empty on error
      } finally {
        setLoading(false)
      }
    }

    fetchSignedUrl()
  }, [fileKey])

  return { signedUrl, loading, error }
}
