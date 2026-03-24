'use client'

import { useState, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/Progress'
import { toast } from 'sonner'
import {
    Plus, Edit2, Trash2, ImagePlus, X, ChevronDown, ChevronUp,
    GripVertical, Loader2, Upload, Layers, PlusCircle, Play, Film, Calendar, LayoutGrid
} from 'lucide-react'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/Dialog'
import { Switch } from '@/components/ui/switch'

// ── Types ───────────────────────────────────────────────────────────────────
interface SubItem {
    _id: string; title: string; slug: string; icon?: string
    description?: string; date?: string; images: string[]; videos: string[]
    order: number; isActive: boolean
}
interface Heading {
    _id: string; name: string; slug: string; isDefault: boolean
    defaultType?: string; order: number; isActive: boolean; subItems: SubItem[]
}

function getProxiedUrl(url: string) {
    if (!url) return ''
    
    
    // If it's already a signed URL with authorization token, proxy it through our API
    if (url.includes('backblazeb2.com') && url.includes('Authorization=')) {
      return `/api/images?url=${encodeURIComponent(url)}`
    }
    
    // If it's a Backblaze URL without auth token, proxy it
    if (url.includes('backblazeb2.com')) {
      const proxied = `/api/images?url=${encodeURIComponent(url)}`
     
      return proxied
    }
    
    // For relative URLs, ensure they start with /
    if (!url.startsWith('/')) {
      const fixed = `/${url}`
     
      return fixed
    }
    
   
    return url
}

// ── Sub-item Form Modal ──────────────────────────────────────────────────────
function SubItemModal({
    headingId,
    headingName,
    editing,
    onClose,
    onSaved
}: {
    headingId: string
    headingName?: string
    editing: SubItem | null
    onClose: () => void
    onSaved: () => void
}) {
    const [form, setForm] = useState({
        title: editing?.title ?? '',
        description: editing?.description ?? '',
        date: editing?.date ? editing.date.split('T')[0] : '',
    })
    // Store raw Backblaze keys for persistence
    const [images, setImages] = useState<string[]>(editing?.images ?? [])
    const [videos, setVideos] = useState<string[]>(editing?.videos ?? [])
    // Store signed URLs for preview in the admin UI
    const [signedImages, setSignedImages] = useState<string[]>([])
    const [signedVideos, setSignedVideos] = useState<string[]>([])
    const [uploadingImg, setUploadingImg] = useState(false)
    const [uploadingVid, setUploadingVid] = useState(false)
    const [imageProgress, setImageProgress] = useState<number | null>(null)
    const [videoProgress, setVideoProgress] = useState<number | null>(null)
    const [saving, setSaving] = useState(false)
    const imgInputRef = useRef<HTMLInputElement>(null)
    const vidInputRef = useRef<HTMLInputElement>(null)
    const dropRef = useRef<HTMLDivElement>(null)

    // Drag over visual
    const [isDragging, setIsDragging] = useState(false)

    // When modal opens or editing changes, refresh signed URLs for existing media
    useEffect(() => {
        const loadSignedUrls = async () => {
            try {
                const imageKeys = editing?.images ?? []
                const videoKeys = editing?.videos ?? []

                setImages(imageKeys)
                setVideos(videoKeys)

                if (imageKeys.length > 0) {
                    const imageSigned = await Promise.all(
                        imageKeys.map(async (key) => {
                            if (!key) return null
                            const res = await fetch(`/api/files/signed-url?key=${encodeURIComponent(key)}`)
                            if (!res.ok) return null
                            const signed = await res.json()
                            return signed.url as string
                        })
                    )
                    setSignedImages(imageSigned.filter((url): url is string => url !== null))
                } else {
                    setSignedImages([])
                }

                if (videoKeys.length > 0) {
                    const videoSigned = await Promise.all(
                        videoKeys.map(async (key) => {
                            if (!key) return null
                            const res = await fetch(`/api/files/signed-url?key=${encodeURIComponent(key)}`)
                            if (!res.ok) return null
                            const signed = await res.json()
                            return signed.url as string
                        })
                    )
                    setSignedVideos(videoSigned.filter((url): url is string => url !== null))
                } else {
                    setSignedVideos([])
                }
            } catch (err) {
                console.error('Failed to load signed media URLs for sub-item modal:', err)
            }
        }

        loadSignedUrls()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing?._id])

    const uploadSingleImage = (file: File) => {
        return new Promise<void>((resolve) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', headingName ? headingName.toLowerCase().replace(/\s+/g, '-') : 'testimonials')

            const xhr = new XMLHttpRequest()

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100)
                    setImageProgress(percent)
                }
            }

            xhr.onload = async () => {
                setImageProgress(null)

                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const uploadData = JSON.parse(xhr.responseText)
                        const key = uploadData.fileUrl as string
                        setImages(prev => [...prev, key])

                        try {
                            const signedRes = await fetch(`/api/files/signed-url?key=${encodeURIComponent(key)}`)
                            if (signedRes.ok) {
                                const signed = await signedRes.json()
                                setSignedImages(prev => [...prev, signed.url as string])
                            }
                        } catch (err) {
                            console.error('Failed to fetch signed URL for uploaded image:', err)
                        }

                        toast.success('Image uploaded successfully')
                    } catch (err) {
                        console.error('Failed to parse image upload response:', err)
                        toast.error('Image upload failed')
                    }
                } else {
                    try {
                        const errorData = JSON.parse(xhr.responseText)
                        toast.error(errorData.error || 'Failed to upload image')
                    } catch {
                        toast.error('Failed to upload image')
                    }
                }

                resolve()
            }

            xhr.onerror = () => {
                setImageProgress(null)
                toast.error('Network error while uploading image')
                resolve()
            }

            xhr.open('POST', '/api/upload/image')
            xhr.send(formData)
        })
    }

    const handleImgFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files
        if (!fileList || fileList.length === 0) return

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        const files = Array.from(fileList).filter(f => allowedTypes.includes(f.type))

        if (files.length === 0) {
            toast.error('Only JPG, PNG, and WEBP formats are supported')
            return
        }

        setUploadingImg(true)
        try {
            for (const file of files) {
                await uploadSingleImage(file)
            }
        } catch (error) {
            console.error('Error uploading images:', error)
            toast.error('Failed to upload images')
        } finally {
            setUploadingImg(false)
        }
    }

    const handleImgFilesDrop = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        const validFiles = Array.from(files).filter(f => allowedTypes.includes(f.type))

        if (validFiles.length === 0) {
            toast.error('Only JPG, PNG, and WEBP formats are supported')
            return
        }

        setUploadingImg(true)
        try {
            for (const file of validFiles) {
                await uploadSingleImage(file)
            }
        } catch (error) {
            console.error('Error uploading images:', error)
            toast.error('Failed to upload images')
        } finally {
            setUploadingImg(false)
        }
    }

    const uploadSingleVideo = (file: File) => {
        return new Promise<void>((resolve) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', headingName ? headingName.toLowerCase().replace(/\s+/g, '-') : 'testimonials')

            const xhr = new XMLHttpRequest()

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100)
                    setVideoProgress(percent)
                }
            }

            xhr.onload = async () => {
                setVideoProgress(null)

                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const uploadData = JSON.parse(xhr.responseText)
                        const key = uploadData.fileUrl as string
                        setVideos(prev => [...prev, key])

                        try {
                            const signedRes = await fetch(`/api/files/signed-url?key=${encodeURIComponent(key)}`)
                            if (signedRes.ok) {
                                const signed = await signedRes.json()
                                setSignedVideos(prev => [...prev, signed.url as string])
                            }
                        } catch (err) {
                            console.error('Failed to fetch signed URL for uploaded video:', err)
                        }

                        toast.success('Video uploaded successfully')
                    } catch (err) {
                        console.error('Failed to parse video upload response:', err)
                        toast.error('Video upload failed')
                    }
                } else {
                    try {
                        const errorData = JSON.parse(xhr.responseText)
                        toast.error(errorData.error || 'Failed to upload video')
                    } catch {
                        toast.error('Failed to upload video')
                    }
                }

                resolve()
            }

            xhr.onerror = () => {
                setVideoProgress(null)
                toast.error('Network error while uploading video')
                resolve()
            }

            // Use the dedicated video upload API to support larger files
            xhr.open('POST', '/api/upload/video')
            xhr.send(formData)
        })
    }

    const handleVidFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files
        if (!fileList || fileList.length === 0) return

        const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm']
        const files = Array.from(fileList).filter(f => allowedTypes.includes(f.type))

        if (files.length === 0) {
            toast.error('Only MP4, MOV, AVI, and WEBP formats are supported')
            return
        }

        setUploadingVid(true)
        try {
            for (const file of files) {
                await uploadSingleVideo(file)
            }
        } catch (error) {
            console.error('Error uploading videos:', error)
            toast.error('Failed to upload videos')
        } finally {
            setUploadingVid(false)
        }
    }

    const handleVidFilesDrop = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm']
        const validFiles = Array.from(files).filter(f => allowedTypes.includes(f.type))

        if (validFiles.length === 0) {
            toast.error('Only MP4, MOV, AVI, and WEBP formats are supported')
            return
        }

        setUploadingVid(true)
        try {
            for (const file of validFiles) {
                await uploadSingleVideo(file)
            }
        } catch (error) {
            console.error('Error uploading videos:', error)
            toast.error('Failed to upload videos')
        } finally {
            setUploadingVid(false)
        }
    }

    const handleSave = async () => {
        if (!form.title.trim()) { toast.error('Title is required'); return }
        setSaving(true)
        try {
            if (editing) {
                const res = await fetch('/api/navbar-sub-items', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemId: editing._id, ...form, date: form.date || undefined, images, videos })
                })
                if (!res.ok) throw new Error('Update failed')
                toast.success('Sub-item updated')
            } else {
                const res = await fetch('/api/navbar-sub-items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ headingId, ...form, date: form.date || undefined, images, videos })
                })
                if (!res.ok) throw new Error('Create failed')
                toast.success('Sub-item created')
            }
            onSaved()
            onClose()
        } catch (err: any) {
            toast.error(err.message || 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-[720px] max-h-[90vh] overflow-hidden p-0 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] bg-white dark:bg-slate-900 border-0 flex flex-col transition-all duration-180 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]">

                {/* ── Header ── */}
                <DialogHeader className="px-7 py-6 border-b border-slate-100 dark:border-white/10 flex-shrink-0">
                    <DialogTitle className="text-[20px] font-semibold text-gray-900 dark:text-white">
                        {editing ? 'Edit Sub-item' : 'Add Sub-item'}
                    </DialogTitle>
                </DialogHeader>

                {/* ── Scrollable body ── */}
                <div className="px-7 py-6 space-y-7 overflow-y-auto flex-1">

                    {/* SECTION A — Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-[0.04em]">Content Details</h3>

                        <div>
                            <label htmlFor="sub-title" className="text-[13px] font-medium text-gray-700 dark:text-slate-300 block mb-1.5">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="sub-title"
                                value={form.title}
                                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. Certification Ceremony 2024"
                                className="w-full h-10 px-3 border border-gray-200 dark:border-white/10 rounded-lg text-[14px] bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12 dark:focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="sub-description" className="text-[13px] font-medium text-gray-700 dark:text-slate-300 block mb-1.5">
                                Description
                            </label>
                            <textarea
                                id="sub-description"
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Brief description shown on detail page..."
                                rows={3}
                                className="w-full min-h-[96px] resize-y px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-[14px] bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12 dark:focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* SECTION B — Media */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-[0.04em]">Media</h3>

                        {/* Drag & drop upload zone */}
                        <div
                            ref={dropRef}
                            className={`flex flex-col items-center justify-center w-full h-[140px] border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${isDragging
                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10'
                                : 'border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-slate-800/30 hover:bg-gray-100 dark:hover:bg-slate-800/50'
                                }`}
                            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={e => {
                                e.preventDefault(); setIsDragging(false)
                                const files = e.dataTransfer.files
                                const imgs = Array.from(files).filter(f => f.type.startsWith('image/'))
                                const vids = Array.from(files).filter(f => f.type.startsWith('video/'))
                                if (imgs.length) { const dt = new DataTransfer(); imgs.forEach(f => dt.items.add(f)); handleImgFilesDrop(dt.files) }
                                if (vids.length) { const dt = new DataTransfer(); vids.forEach(f => dt.items.add(f)); handleVidFilesDrop(dt.files) }
                            }}
                        >
                            <ImagePlus className="w-8 h-8 mb-3 text-gray-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium tracking-tight">
                                Drag &amp; drop <span className="text-blue-600 dark:text-blue-400">images or videos</span> here or <span className="text-blue-600 dark:text-blue-400">Browse</span>
                            </p>
                            <p className="text-[12px] text-gray-500 dark:text-slate-400 mt-1">Supports JPG, PNG, WEBP, MP4, MOV</p>
                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    disabled={uploadingImg}
                                    onClick={() => imgInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-[6px] transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {uploadingImg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                                    Add Images
                                </button>
                                <button
                                    type="button"
                                    disabled={uploadingVid}
                                    onClick={() => vidInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-[6px] transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {uploadingVid ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Film className="h-3.5 w-3.5" />}
                                    Add Videos
                                </button>
                            </div>
                            <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImgFiles} />
                            <input ref={vidInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleVidFiles} />
                        </div>

                        {/* Upload progress indicators */}
                        {imageProgress !== null && (
                            <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-slate-400">
                                <div>Uploading image... {imageProgress}%</div>
                                <Progress value={imageProgress} className="h-1" />
                            </div>
                        )}
                        {videoProgress !== null && (
                            <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-slate-400">
                                <div>Uploading video... {videoProgress}%</div>
                                <Progress value={videoProgress} className="h-1" />
                            </div>
                        )}

                        {/* Image previews */}
                        {signedImages.length > 0 && (
                            <div className="p-4 border border-gray-200 dark:border-white/10 rounded-lg bg-[#F9FAFB] dark:bg-slate-800/40">
                                <p className="text-[12px] font-medium text-gray-500 dark:text-slate-400 mb-3">Images ({images.length})</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {signedImages.map((url, i) => (
                                        <div key={i} className="relative group aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-sm">
                                            <img
                                                src={url}
                                                alt={`img-${i}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    console.error('Image failed to load:', url);
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImages(prev => prev.filter((_, idx) => idx !== i))
                                                    setSignedImages(prev => prev.filter((_, idx) => idx !== i))
                                                }}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Video previews */}
                        {signedVideos.length > 0 && (
                            <div className="p-4 border border-gray-200 dark:border-white/10 rounded-lg bg-[#F9FAFB] dark:bg-slate-800/40">
                                <p className="text-[12px] font-medium text-gray-500 dark:text-slate-400 mb-3">Videos ({videos.length})</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {signedVideos.map((url, i) => (
                                        <div key={i} className="relative group aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-sm">
                                            <video src={url} className="w-full h-full object-cover" muted preload="metadata" />
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                <Play className="w-8 h-8 text-white" fill="white" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setVideos(prev => prev.filter((_, idx) => idx !== i))
                                                    setSignedVideos(prev => prev.filter((_, idx) => idx !== i))
                                                }}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION C — Schedule */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-[0.04em]">Schedule</h3>
                        <div className="bg-[#F9FAFB] dark:bg-slate-800/40 p-4 rounded-lg border border-gray-100 dark:border-white/10">
                            <p className="text-[12px] text-gray-500 dark:text-slate-400 mb-4">Select an optional date to associate with this sub-item.</p>
                            <div>
                                <label htmlFor="sub-date" className="text-[13px] font-medium text-gray-700 dark:text-slate-300 block mb-1.5">
                                    Date <span className="text-[12px] text-gray-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    id="sub-date"
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                                    className="h-10 px-3 border border-gray-200 dark:border-white/10 rounded-lg text-[14px] bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12 dark:focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── Sticky Footer ── */}
                <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/10 flex justify-end space-x-3 px-7 py-4 flex-shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={saving}
                        className="text-[#374151] dark:text-slate-300 bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 h-10 px-5 font-medium text-[14px] rounded-lg transition-colors duration-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !form.title.trim()}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:bg-[#CBD5E1] disabled:text-gray-500 disabled:border-transparent disabled:cursor-not-allowed h-10 px-[20px] font-medium text-[14px] rounded-lg transition-all duration-200 shadow-sm"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : editing ? 'Update Sub-item' : 'Create'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function CustomizeLandingPage() {
    const [headings, setHeadings] = useState<Heading[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

    // New heading form
    const [newHeadingName, setNewHeadingName] = useState('')
    const [addingHeading, setAddingHeading] = useState(false)
    const [showNewHeadingInput, setShowNewHeadingInput] = useState(false)

    // Sub-item modal
    const [subModal, setSubModal] = useState<{ headingId: string; editing: SubItem | null } | null>(null)

    // Edit heading modal
    const [editingHeading, setEditingHeading] = useState<Heading | null>(null)
    const [editHeadingName, setEditHeadingName] = useState('')
    const [editingSaving, setEditingSaving] = useState(false)

    const fetchHeadings = async () => {
        try {
            const res = await fetch('/api/navbar-headings')
            if (res.ok) {
                const data = await res.json()
                // Keep raw Backblaze keys in state; signed URLs are resolved
                // lazily where needed (e.g., public nav page and SubItemModal).
                setHeadings(data.data)
            }
        } catch {
            toast.error('Failed to load navbar settings')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchHeadings() }, [])

    // Auto-expand
    useEffect(() => {
        if (headings.length > 0) {
            const init: Record<string, boolean> = {}
            headings.forEach(h => { init[h._id] = true })
            setExpanded(init)
        }
    }, [headings.length])

    const handleAddHeading = async () => {
        if (!newHeadingName.trim()) return
        setAddingHeading(true)
        try {
            const res = await fetch('/api/navbar-headings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newHeadingName.trim() })
            })
            if (!res.ok) {
                const d = await res.json()
                throw new Error(d.error || 'Failed')
            }
            toast.success('Navbar heading created')
            setNewHeadingName('')
            setShowNewHeadingInput(false)
            fetchHeadings()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setAddingHeading(false)
        }
    }

    const handleDeleteHeading = async (id: string, isDefault: boolean) => {
        if (isDefault) { toast.error('Default headings cannot be deleted'); return }
        if (!confirm('Delete this heading and all its sub-items?')) return
        try {
            const res = await fetch(`/api/navbar-headings?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Delete failed')
            toast.success('Heading deleted')
            fetchHeadings()
        } catch { toast.error('Failed to delete') }
    }

    const handleToggleHeadingActive = async (h: Heading) => {
        try {
            await fetch('/api/navbar-headings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ headingId: h._id, isActive: !h.isActive })
            })
            fetchHeadings()
        } catch { toast.error('Failed to update') }
    }

    const handleSaveHeadingName = async () => {
        if (!editingHeading || !editHeadingName.trim()) return
        setEditingSaving(true)
        try {
            const res = await fetch('/api/navbar-headings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ headingId: editingHeading._id, name: editHeadingName.trim() })
            })
            if (!res.ok) throw new Error('Update failed')
            toast.success('Heading renamed')
            setEditingHeading(null)
            fetchHeadings()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setEditingSaving(false)
        }
    }

    const handleDeleteSubItem = async (itemId: string) => {
        if (!confirm('Delete this sub-item?')) return
        try {
            const res = await fetch(`/api/navbar-sub-items?id=${itemId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Delete failed')
            toast.success('Sub-item deleted')
            fetchHeadings()
        } catch { toast.error('Failed to delete') }
    }

    const handleToggleSubActive = async (item: SubItem) => {
        try {
            await fetch('/api/navbar-sub-items', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: item._id, isActive: !item.isActive })
            })
            fetchHeadings()
        } catch { toast.error('Failed to update') }
    }

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* ── Page Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <LayoutGrid className="h-6 w-6 text-red-600" />
                            Customize Landing Navbar
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage navbar headings and sub-menu items for the public landing page.
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowNewHeadingInput(v => !v)}
                        className="bg-red-600 hover:bg-red-700 text-white gap-2"
                    >
                        <PlusCircle className="h-4 w-4" />
                        New Heading
                    </Button>
                </div>

                {/* ── Default note ── */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                    <strong>Features</strong> and <strong>Courses</strong> are built-in navbar sections and cannot be deleted. You can create additional custom headings below.
                </div>

                {/* ── New heading input ── */}
                {showNewHeadingInput && (
                    <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800/30 p-4 flex gap-3 items-end">
                        <div className="flex-1 space-y-1.5">
                            <Label>New Heading Name</Label>
                            <Input
                                autoFocus
                                value={newHeadingName}
                                onChange={e => setNewHeadingName(e.target.value)}
                                placeholder="e.g. Gallery, About Us, Success Stories..."
                                onKeyDown={e => e.key === 'Enter' && handleAddHeading()}
                            />
                        </div>
                        <Button onClick={handleAddHeading} disabled={addingHeading || !newHeadingName.trim()} className="bg-red-600 hover:bg-red-700 text-white">
                            {addingHeading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowNewHeadingInput(false)}>Cancel</Button>
                    </div>
                )}

                {/* ── Headings list ── */}
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                    </div>
                ) : headings.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>No navbar headings found. Click "New Heading" to create one.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {headings.map(heading => (
                            <div key={heading._id} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 overflow-hidden shadow-sm">
                                {/* Heading row */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <GripVertical className="h-4 w-4 text-slate-300 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <span className="font-semibold text-base truncate block">{heading.name}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-muted-foreground">/{heading.slug}</span>
                                                {heading.isDefault && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">Default</span>
                                                )}
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${heading.isActive ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-500 bg-slate-100 dark:bg-slate-700'}`}>
                                                    {heading.isActive ? 'Active' : 'Hidden'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Switch
                                            checked={heading.isActive}
                                            onCheckedChange={() => handleToggleHeadingActive(heading)}
                                            title="Toggle visibility"
                                        />
                                        {!heading.isDefault && (
                                            <>
                                                <Button
                                                    size="sm" variant="ghost"
                                                    onClick={() => { setEditingHeading(heading); setEditHeadingName(heading.name) }}
                                                    className="text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm" variant="ghost"
                                                    onClick={() => handleDeleteHeading(heading._id, heading.isDefault)}
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            size="sm" variant="ghost"
                                            onClick={() => setExpanded(p => ({ ...p, [heading._id]: !p[heading._id] }))}
                                            className="text-slate-400"
                                        >
                                            {expanded[heading._id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Sub-items */}
                                {expanded[heading._id] && (
                                    <div className="px-5 py-4 space-y-3">
                                        {heading.isDefault ? (
                                            <p className="text-sm text-muted-foreground italic">
                                                {heading.defaultType === 'features'
                                                    ? 'This section automatically shows: Unique Features, Key Features, Training Programs, Announcements, Events, Testimonials, Lecture Panel.'
                                                    : 'This section automatically shows course modules and certification records from the database.'}
                                            </p>
                                        ) : (
                                            <>
                                                {heading.subItems.length === 0 && (
                                                    <p className="text-sm text-muted-foreground">No sub-items yet. Add one below.</p>
                                                )}
                                                {heading.subItems.map(item => (
                                                    <div key={item._id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/40 group">
                                                        <GripVertical className="h-4 w-4 text-slate-300 mt-1 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-medium text-sm">{item.title}</span>
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${item.isActive ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-500 bg-slate-100'}`}>
                                                                    {item.isActive ? 'Active' : 'Hidden'}
                                                                </span>
                                                            </div>
                                                            {item.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>}
                                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                                                                {item.date && (
                                                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(item.date).toLocaleDateString()}</span>
                                                                )}
                                                                {item.images.length > 0 && (
                                                                    <span className="flex items-center gap-1"><ImagePlus className="h-3 w-3" />{item.images.length} image{item.images.length !== 1 ? 's' : ''}</span>
                                                                )}
                                                                {item.videos.length > 0 && (
                                                                    <span className="flex items-center gap-1"><Film className="h-3 w-3" />{item.videos.length} video{item.videos.length !== 1 ? 's' : ''}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            <Switch checked={item.isActive} onCheckedChange={() => handleToggleSubActive(item)} />
                                                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={() => setSubModal({ headingId: heading._id, editing: item })}>
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDeleteSubItem(item._id)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <Button
                                                    size="sm" variant="outline"
                                                    className="gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800/40 dark:hover:bg-red-900/20 mt-1"
                                                    onClick={() => setSubModal({ headingId: heading._id, editing: null })}
                                                >
                                                    <Plus className="h-3.5 w-3.5" /> Add Sub-item
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Sub-item Modal ── */}
            {subModal && (
                <SubItemModal
                    headingId={subModal.headingId}
                    headingName={headings.find(h => h._id === subModal.headingId)?.name}
                    editing={subModal.editing}
                    onClose={() => setSubModal(null)}
                    onSaved={fetchHeadings}
                />
            )}

            {/* ── Edit heading name modal ── */}
            {editingHeading && (
                <Dialog open onOpenChange={() => setEditingHeading(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>Rename Heading</DialogTitle></DialogHeader>
                        <div className="space-y-5 mt-2">
                            <div className="space-y-1.5">
                                <Label>Heading Name</Label>
                                <Input
                                    autoFocus
                                    value={editHeadingName}
                                    onChange={e => setEditHeadingName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveHeadingName()}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2 border-t">
                                <Button variant="outline" onClick={() => setEditingHeading(null)}>Cancel</Button>
                                <Button onClick={handleSaveHeadingName} disabled={editingSaving || !editHeadingName.trim()} className="bg-red-600 hover:bg-red-700 text-white">
                                    {editingSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Save
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </MainLayout>
    )
}
