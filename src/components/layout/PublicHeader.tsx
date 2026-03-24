'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    Heart,
    Sun,
    Moon
} from 'lucide-react'

export function PublicHeader() {
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#040714]/70 transition-colors duration-500"
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    <motion.div whileHover={{ x: -4 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white rounded-full px-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back</span>
                        </Button>
                    </motion.div>
                    <Link
                        href="/landing"
                        className="flex items-center gap-2 text-xl font-bold cursor-pointer group"
                    >
                        <motion.div
                            whileHover={{ rotate: 15, scale: 1.1 }}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-300"
                        >
                            <Heart className="h-6 w-6 text-white" />
                        </motion.div>
                        <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-white/80 bg-clip-text text-transparent transition-all duration-300 group-hover:from-red-600 group-hover:to-red-500 font-extrabold tracking-tight">
                            Help Line <span className="text-red-500">Academy</span>
                        </span>
                    </Link>
                </div>

                {mounted && (
                    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/50 p-1 dark:border-white/10 dark:bg-white/5 backdrop-blur-md">
                        <AnimatePresence mode="wait">
                            <motion.button
                                key={theme}
                                initial={{ opacity: 0, rotate: -90 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0, rotate: 90 }}
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-white hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white transition-all shadow-sm"
                            >
                                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </motion.button>
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.header>
    )
}
