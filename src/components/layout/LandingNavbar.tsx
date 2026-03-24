'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
    Heart, ChevronDown, Menu, X, Moon, Sun,
    Zap, ListChecks, Activity, Megaphone, Calendar, Quote, Users,
    Award, Globe, BookOpen, GraduationCap, Star, LayoutGrid,
    ArrowRight, Layers
} from 'lucide-react'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useOrganization } from '@/hooks/useOrganization'
import { OrganizationLogo } from '@/components/ui/OrganizationLogo'

// ── Types ───────────────────────────────────────────────────────────────────
interface NavSubItem { _id: string; title: string; slug: string; icon?: string; description?: string }
interface NavHeading { _id: string; name: string; slug: string; isDefault: boolean; defaultType?: string; subItems: NavSubItem[] }
interface CourseItem { _id: string; name: string; description?: string; badge?: string }
interface CertItem { _id: string; name: string }

// ── Section anchors for Features dropdown ───────────────────────────────────
const FEATURE_SECTIONS = [
    { id: 'unique-features', label: 'Unique Features', Icon: Zap },
    { id: 'key-features', label: 'Key Features', Icon: ListChecks },
    { id: 'key-features', label: 'Training Programs', Icon: Activity },
    { id: 'announcements', label: 'Announcements', Icon: Megaphone },
    { id: 'events-section', label: 'Events', Icon: Calendar },
    { id: 'testimonials', label: 'Testimonials', Icon: Quote },
    { id: 'lecture-panel', label: 'Lecture Panel', Icon: Users },
]

function scrollToSection(id: string) {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    requestAnimationFrame(() => {
        setTimeout(() => {
            const el = document.getElementById(id)
            if (el) {
                const top = el.getBoundingClientRect().top + window.scrollY - 90
                window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
            }
        }, 120)
    })
}

// ── Dropdown wrapper (shared style) ─────────────────────────────────────────
function NavDropdown({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-white/90 dark:hover:text-white transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/10 group outline-none">
                {label}
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="rounded-xl border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xl dark:border-white/20 dark:bg-slate-900/95 p-2 w-64 max-h-[70vh] overflow-y-auto">
                {children}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function NavItem({ Icon, label, onClick }: { Icon: any; label: string; onClick: () => void }) {
    return (
        <DropdownMenuItem
            onSelect={onClick}
            className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-teal-600/10 dark:hover:bg-teal-600/20 transition-all duration-200 group"
        >
            <Icon className="mr-2.5 h-4 w-4 text-teal-600 group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="font-medium text-sm truncate">{label}</span>
        </DropdownMenuItem>
    )
}

// ── Main Component ───────────────────────────────────────────────────────────
export function LandingNavbar() {
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const { organization, loading: orgLoading } = useOrganization()
    const [mounted, setMounted] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [expandedSections, setExpandedSections] = useState({
        features: false,
        courses: false,
        more: false
    })

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }
    const [customHeadings, setCustomHeadings] = useState<NavHeading[]>([])
    const [courses, setCourses] = useState<CourseItem[]>([])
    const [certs, setCerts] = useState<CertItem[]>([])

    useEffect(() => { setMounted(true) }, [])

    // Fetch dynamic navbar headings
    useEffect(() => {
        fetch('/api/public/navbar')
            .then(r => r.ok ? r.json() : null)
            .then(d => d?.data && setCustomHeadings(d.data))
            .catch(() => { })
    }, [])

    
    // Fetch certifications for default "Courses" dropdown
    useEffect(() => {
        fetch('/api/certifications/landing')
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (Array.isArray(d)) setCerts(d) })
            .catch(() => { })
    }, [])

    // Custom headings — non-default
    const dynamicHeadings = customHeadings.filter(h => !h.isDefault)

    // ── Expandable Mobile Section Component ──────────────────────────────────────
    const ExpandableMobileSection = ({
        title,
        icon: Icon,
        sectionKey,
        children,
        isExpanded,
        onToggle
    }: {
        title: string
        icon: any
        sectionKey: keyof typeof expandedSections
        children: React.ReactNode
        isExpanded: boolean
        onToggle: () => void
    }) => (
        <div className="border-b border-slate-100 dark:border-white/5 last:border-b-0">
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full px-3 py-3 text-sm font-semibold text-slate-700 dark:text-white/90 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-teal-600" />
                    {title}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-2 space-y-1">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#040714]/80 transition-colors duration-300">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-16">

                {/* ── Logo ── */}
                <div className="flex items-center gap-2 sm:gap-6">
                    <Link href="/landing" className="flex items-center gap-2 text-lg sm:text-xl font-bold group flex-shrink-0">
                        {orgLoading ? (
                            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 shadow-lg shadow-teal-600/30 group-hover:shadow-teal-600/50 group-hover:scale-110 transition-all duration-300">
                                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                        ) : organization?.logo ? (
                            <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center">
                                <OrganizationLogo 
                                    lightLogo={organization.logo}
                                    darkLogo={organization.darkLogo}
                                    logoMode={organization.logoMode}
                                    fallbackText="HL"
                                    size="lg"
                                    className="rounded-lg"
                                />
                            </div>
                        ) : (
                            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 shadow-lg shadow-teal-600/30 group-hover:shadow-teal-600/50 group-hover:scale-110 transition-all duration-300">
                                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                        )}
                        <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-white/80 bg-clip-text text-transparent group-hover:from-teal-600 group-hover:to-teal-500 transition-all duration-300 font-extrabold tracking-tight">
                            <span className="hidden xs:inline">{organization?.name || 'Help Line'}</span><span> Help Line Academy</span>
                        </span>
                    </Link>

                    {/* ── Desktop nav ── */}
                    <nav className="hidden md:flex items-center gap-1">

                        {/* Features (default) */}
                        <NavDropdown label="Features">
                            {FEATURE_SECTIONS.map(({ id, label, Icon }) => (
                                <NavItem key={id} Icon={Icon} label={label} onClick={() => scrollToSection(id)} />
                            ))}
                        </NavDropdown>

                        {/* Courses (default) */}
                        <NavDropdown label="Courses">
                            {/* Courses from DB */}
                            {courses.length > 0 && (
                                <>
                                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">
                                        Course Modules
                                    </div>
                                    {courses.slice(0, 6).map(c => (
                                        <DropdownMenuItem
                                            key={c._id}
                                            onSelect={() => scrollToSection('key-features')}
                                            className="rounded-lg px-3 py-2 cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all group"
                                        >
                                            <BookOpen className="mr-2.5 h-4 w-4 text-teal-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{c.name}</p>
                                                {c.description && <p className="text-xs text-slate-400 truncate mt-0.5">{c.description}</p>}
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </>
                            )}

                            {/* Certifications from DB */}
                            {certs.length > 0 && (
                                <>
                                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-2">
                                        Certifications
                                    </div>
                                    {certs.slice(0, 4).map(c => (
                                        <DropdownMenuItem
                                            key={c._id}
                                            onSelect={() => scrollToSection('key-features')}
                                            className="rounded-lg px-3 py-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
                                        >
                                            <Award className="mr-2.5 h-4 w-4 text-amber-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                            <span className="font-medium text-sm truncate">{c.name}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </>
                            )}

                            {/* Fallback if nothing from DB yet */}
                            {courses.length === 0 && certs.length === 0 && (
                                <>
                                    <NavItem
                                        Icon={GraduationCap}
                                        label="Caregiver Courses"
                                        onClick={() => router.push('/landing/courses')}
                                    />
                                    <NavItem
                                        Icon={Award}
                                        label="Certifications"
                                        onClick={() => router.push('/landing/certifications')}
                                    />
                                </>
                            )}
                        </NavDropdown>

                        {/* Custom dynamic headings */}
                        {dynamicHeadings.map(heading => (
                            heading.subItems.length > 0 ? (
                                <NavDropdown key={heading._id} label={heading.name}>
                                    {heading.subItems.map(sub => (
                                        <DropdownMenuItem
                                            key={sub._id}
                                            onSelect={() => router.push(`/nav/${sub.slug}`)}
                                            className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all group"
                                        >
                                            <Layers className="mr-2.5 h-4 w-4 text-teal-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{sub.title}</p>
                                                {sub.description && (
                                                    <p className="text-xs text-slate-400 truncate mt-0.5">{sub.description}</p>
                                                )}
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </NavDropdown>
                            ) : (
                                <button
                                    key={heading._id}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-white/90 dark:hover:text-white transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/10"
                                    onClick={() => router.push(`/nav/${heading.slug}`)}
                                >
                                    {heading.name}
                                </button>
                            )
                        ))}
                    </nav>
                </div>

                {/* ── Right side ── */}
                <div className="flex items-center gap-2">
                    {/* Theme toggle */}
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>
                    )}

                    {/* Login button */}
                    <Link
                        href="/login"
                        className="hidden sm:inline-flex items-center gap-1.5 h-12 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                        Login
                    </Link>

                    {/* Mobile menu trigger */}
                    <button
                        className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
                        onClick={() => {
                            setMobileOpen(v => !v)
                            if (!mobileOpen) {
                                // Reset expanded sections when opening menu
                                setExpandedSections({ features: false, courses: false, more: false })
                            }
                        }}
                        aria-label="Toggle mobile menu"
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* ── Mobile menu ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-slate-200 dark:border-white/10 md:hidden bg-white dark:bg-[#040714] max-h-[70vh] overflow-y-auto"
                    >
                        <div className="py-2">
                            {/* Features Section */}
                            <ExpandableMobileSection
                                title="Features"
                                icon={Zap}
                                sectionKey="features"
                                isExpanded={expandedSections.features}
                                onToggle={() => toggleSection('features')}
                            >
                                {FEATURE_SECTIONS.map(({ id, label, Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => { scrollToSection(id); setMobileOpen(false) }}
                                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-left"
                                    >
                                        <Icon className="h-4 w-4 text-teal-600" />
                                        <span className="truncate">{label}</span>
                                    </button>
                                ))}
                            </ExpandableMobileSection>

                            {/* Courses Section */}
                            <ExpandableMobileSection
                                title="Courses"
                                icon={BookOpen}
                                sectionKey="courses"
                                isExpanded={expandedSections.courses}
                                onToggle={() => toggleSection('courses')}
                            >
                                {courses.length > 0 && courses.slice(0, 4).map(c => (
                                    <button
                                        key={c._id}
                                        onClick={() => { scrollToSection('key-features'); setMobileOpen(false) }}
                                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-left"
                                    >
                                        <BookOpen className="h-4 w-4 text-teal-600" />
                                        <span className="truncate">{c.name}</span>
                                    </button>
                                ))}
                                {certs.length > 0 && certs.slice(0, 3).map(c => (
                                    <button
                                        key={c._id}
                                        onClick={() => { scrollToSection('key-features'); setMobileOpen(false) }}
                                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-left"
                                    >
                                        <Award className="h-4 w-4 text-amber-500" />
                                        <span className="truncate">{c.name}</span>
                                    </button>
                                ))}
                                {(courses.length === 0 && certs.length === 0) && (
                                    <>
                                        <button
                                            onClick={() => { router.push('/landing/courses'); setMobileOpen(false) }}
                                            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-left"
                                        >
                                            <GraduationCap className="h-4 w-4 text-teal-600" />
                                            <span className="truncate">Caregiver Courses</span>
                                        </button>
                                        <button
                                            onClick={() => { router.push('/landing/certifications'); setMobileOpen(false) }}
                                            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-left"
                                        >
                                            <Award className="h-4 w-4 text-amber-500" />
                                            <span className="truncate">Certifications</span>
                                        </button>
                                    </>
                                )}
                            </ExpandableMobileSection>

                            {/* Custom dynamic headings */}
                            {dynamicHeadings.length > 0 && (
                                <ExpandableMobileSection
                                    title="More"
                                    icon={Layers}
                                    sectionKey="more"
                                    isExpanded={expandedSections.more}
                                    onToggle={() => toggleSection('more')}
                                >
                                    {dynamicHeadings.flatMap(h => h.subItems.map(sub => (
                                        <Link
                                            key={sub._id}
                                            href={`/nav/${sub.slug}`}
                                            onClick={() => setMobileOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                                        >
                                            <Layers className="h-4 w-4 text-teal-600" />
                                            <span className="truncate">{sub.title}</span>
                                        </Link>
                                    )))}
                                </ExpandableMobileSection>
                            )}

                            {/* Login Button */}
                            <div className="px-3 pt-4">
                                <Link
                                    href="/login"
                                    className="flex items-center justify-center gap-2 h-12 px-6 bg-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 w-full"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Login <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}
