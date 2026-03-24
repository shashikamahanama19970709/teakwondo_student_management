'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar, ArrowLeft, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LandingNavbar } from '@/components/layout/LandingNavbar'

interface SubItem {
    _id: string
    title: string
    description?: string
    date?: string
    images: string[]
    videos: string[]
    icon?: string
}

const IMAGES_PER_PAGE = 6

function getProxiedUrl(url: string) {
    if (!url) return ''
    
    // For signed URLs, use them directly
    if (url.includes('backblazeb2.com') && url.includes('Authorization=')) {
        return url
    }
    
    // For relative URLs, use as-is (Backblaze doesn't want leading slash)
    return url
}

export default function NavSubItemPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params?.slug as string

    const [item, setItem] = useState<SubItem | null>(null)
    const [loading, setLoading] = useState(true)
    const [imagePage, setImagePage] = useState(0)  // 0-indexed page of images
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
    const [activeVideo, setActiveVideo] = useState<string | null>(null)

    useEffect(() => {
        if (!slug) return
        const fetchItem = async () => {
            try {
                const res = await fetch(`/api/navbar-sub-items?slug=${encodeURIComponent(slug)}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.data?.length) {
                        const subItem = data.data[0]
                        
                        // Fetch signed URLs for images
                        if (subItem.images && subItem.images.length > 0) {
                            const imageSignedUrls = await Promise.all(
                                subItem.images.map(async (imagePath: string) => {
                                    if (!imagePath) return null
                                    
                                    const res = await fetch(
                                        `/api/files/signed-url?key=${encodeURIComponent(imagePath)}`
                                    )
                                    const signed = await res.json()
                                    return signed.url
                                })
                            )
                            
                            subItem.images = imageSignedUrls.filter(url => url !== null)
                        }
                        
                        // Fetch signed URLs for videos
                        if (subItem.videos && subItem.videos.length > 0) {
                            const videoSignedUrls = await Promise.all(
                                subItem.videos.map(async (videoPath: string) => {
                                    if (!videoPath) return null
                                    
                                    const res = await fetch(
                                        `/api/files/signed-url?key=${encodeURIComponent(videoPath)}`
                                    )
                                    const signed = await res.json()
                                    return signed.url
                                })
                            )
                            
                            subItem.videos = videoSignedUrls.filter(url => url !== null)
                        }
                        
                        setItem(subItem)
                    }
                }
            } catch (e) {
                console.error('Failed to load sub-item:', e)
            } finally {
                setLoading(false)
            }
        }
        fetchItem()
    }, [slug])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent" />
            </div>
        )
    }

    if (!item) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-2xl font-semibold text-slate-600">Page not found</p>
                <Button onClick={() => router.push('/landing')}>Go Home</Button>
            </div>
        )
    }

    const totalImagePages = Math.ceil(item.images.length / IMAGES_PER_PAGE)
    const visibleImages = item.images.slice(imagePage * IMAGES_PER_PAGE, (imagePage + 1) * IMAGES_PER_PAGE)

    return (
        <>
            <LandingNavbar />

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxSrc && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setLightboxSrc(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="relative max-w-5xl w-full max-h-[90vh] aspect-video"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image src={getProxiedUrl(lightboxSrc)} alt="Full-size" fill className="object-contain rounded-xl" />
                            <button
                                onClick={() => setLightboxSrc(null)}
                                className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video modal */}
            <AnimatePresence>
                {activeVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setActiveVideo(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <video src={activeVideo} controls autoPlay className="w-full h-full object-contain bg-black" />
                            <button
                                onClick={() => setActiveVideo(null)}
                                className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="min-h-screen bg-white dark:bg-[#040714] text-slate-900 dark:text-white">
                {/* Hero */}
                <section className="relative py-20 px-6 bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 dark:from-black dark:via-slate-900 dark:to-red-950 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent pointer-events-none" />
                    <div className="relative max-w-4xl mx-auto text-center">
                        <motion.button
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </motion.button>
                        {item.date && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 text-red-400 text-sm font-medium mb-4"
                            >
                                <Calendar className="w-4 h-4" />
                                {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </motion.div>
                        )}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight"
                        >
                            {item.title}
                        </motion.h1>
                        {item.description && (
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg text-white/70 max-w-3xl mx-auto leading-relaxed"
                            >
                                {item.description}
                            </motion.p>
                        )}
                    </div>
                </section>

                <div className="max-w-6xl mx-auto px-6 py-16 space-y-20">

                    {/* ── Photo Gallery ── */}
                    {item.images.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold">Photo Gallery</h2>
                                {totalImagePages > 1 && (
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span>Page {imagePage + 1} of {totalImagePages}</span>
                                    </div>
                                )}
                            </div>

                            {/* Grid — 3 cols on md+, 2 on sm, 1 on mobile */}
                            <motion.div
                                key={imagePage}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                            >
                                {visibleImages.map((imgUrl, idx) => (
                                    <motion.div
                                        key={imgUrl}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-sm hover:shadow-lg transition-shadow"
                                        onClick={() => setLightboxSrc(imgUrl)}
                                    >
                                        <Image
                                            src={getProxiedUrl(imgUrl)}
                                            alt={`Photo ${imagePage * IMAGES_PER_PAGE + idx + 1}`}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                            <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1.5 rounded-full text-sm">
                                                View full size
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Pagination controls */}
                            {totalImagePages > 1 && (
                                <div className="flex items-center justify-center gap-4 mt-8">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={imagePage === 0}
                                        onClick={() => setImagePage(p => p - 1)}
                                        className="gap-2"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </Button>

                                    {/* Page dots */}
                                    <div className="flex gap-2">
                                        {Array.from({ length: totalImagePages }).map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setImagePage(i)}
                                                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${i === imagePage
                                                    ? 'bg-red-600 w-6'
                                                    : 'bg-slate-300 dark:bg-slate-600 hover:bg-red-400'
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={imagePage === totalImagePages - 1}
                                        onClick={() => setImagePage(p => p + 1)}
                                        className="gap-2"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </section>
                    )}

                    {/* ── Videos ── */}
                    {item.videos.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-8">Videos</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {item.videos.map((videoUrl, idx) => (
                                    <motion.div
                                        key={videoUrl}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-sm hover:shadow-lg transition-shadow"
                                        onClick={() => setActiveVideo(videoUrl)}
                                    >
                                        <video src={videoUrl} className="w-full h-full object-cover" muted preload="metadata" />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-xl transition-all group-hover:scale-110">
                                                <Play className="w-7 h-7 text-red-600 ml-1" fill="currentColor" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-3 left-3 text-white/80 text-sm font-medium">
                                            Video {idx + 1}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Empty state */}
                    {item.images.length === 0 && item.videos.length === 0 && (
                        <div className="text-center py-20 text-slate-400">
                            <p className="text-xl">No media uploaded yet.</p>
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
