// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { useTheme } from 'next-themes'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import {
  Award,
  ArrowRight,
  CheckCircle,
  Clock,
  GraduationCap,
  Heart,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Shield,
  Star,
  BookOpen,
  Stethoscope,
  Moon,
  Sun,
  ChevronDown,
  Menu,
  X,
  ChevronUp,
  Instagram,
  MessageCircle,
  Youtube,
  Facebook,
  Zap,
  ListChecks,
  Activity,
  Layers,
  BarChart3,
  TrendingUp,
  FileText,
  Watch
} from 'lucide-react'

const courses = [
  {
    icon: <Heart className="h-6 w-6 text-emerald-600 dark:text-[#7bffde]" />,
    name: 'Caregiver NVQ Level 3',
    description: 'The foundational course for starting your professional caregiving journey. Learn essential patient care skills.',
    badge: 'Foundation',
    duration: '3 Months',
    route: '/courses/caregiver-nvq-3'
  },
  {
    icon: <Award className="h-6 w-6 text-blue-600 dark:text-[#a0a7ff]" />,
    name: 'Caregiver NVQ Level 4',
    description: 'Advanced training for career progression with weekend classes available for working professionals.',
    badge: 'Advanced',
    duration: '4 Months',
    route: '/courses/caregiver-nvq-4'
  },
  {
    icon: <Globe className="h-6 w-6 text-purple-600 dark:text-[#ffc7ff]" />,
    name: 'Israel Caregiver Course',
    description: '45-Day Full-Time Course approved by the Foreign Employment Bureau for international opportunities.',
    badge: 'SLFEB Approved',
    duration: '45 Days',
    route: '/courses/israel-caregiver'
  },
  {
    icon: <Shield className="h-6 w-6 text-cyan-600 dark:text-[#9effff]" />,
    name: 'First Aid & BLS',
    description: 'Master essential life-saving skills and Basic Life Support techniques with hands-on training.',
    badge: 'Life-Saving',
    duration: '2 Weeks',
    route: '/courses/first-aid-bls'
  },
  {
    icon: <Stethoscope className="h-6 w-6 text-amber-600 dark:text-[#ffdd8f]" />,
    name: 'Phlebotomy',
    description: 'Specialized one-day workshop on blood drawing and sample handling techniques.',
    badge: 'Specialized',
    duration: '1 Day',
    route: '/courses/phlebotomy'
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-indigo-600 dark:text-[#9fc5ff]" />,
    name: 'Housekeeping',
    description: 'Professional housekeeping workshop for domestic and institutional care environments.',
    badge: 'Professional',
    duration: '1 Week',
    route: '/courses/housekeeping'
  }
]

// Alias for modules section in the mobile menu
const modules = courses

const features = [
  {
    title: 'Government Registered Institute',
    description: 'TVEC Reg No: P03/0174. Fully approved by Sri Lanka Foreign Employment Bureau (SLFEB) for international employment.',
    icon: <Shield className="h-8 w-8 text-blue-600" />,
    stats: 'TVEC/SLFEB Approved'
  },
  {
    title: 'Learn from Medical Experts',
    description: 'Practical training led by qualified doctors and experienced nursing staff. Master first aid, BLS, and patient care.',
    icon: <Stethoscope className="h-8 w-8 text-emerald-600" />,
    stats: 'Expert Faculty'
  },
  {
    title: 'Global Career Opportunities',
    description: 'Specialized training for Israel, Japan, and Europe. Internationally recognized qualifications for worldwide employment.',
    icon: <Globe className="h-8 w-8 text-purple-600" />,
    stats: 'International Ready'
  },
  {
    title: 'Prime Location',
    description: 'Located in Bandaragama, just 3km from Galanigama Expressway entrance. Convenient access for students across Sri Lanka.',
    icon: <MapPin className="h-8 w-8 text-amber-600" />,
    stats: 'Bandaragama'
  }
]

const achievements = [
  {
    number: '1000+',
    label: 'Trained Students',
    description: 'Skilled professionals ready for healthcare careers locally and internationally.',
    icon: <Users className="h-6 w-6" />,
    color: 'text-emerald-600 dark:text-emerald-400'
  },
  {
    number: 'TVEC',
    label: 'Approved Institute',
    description: 'Government-registered vocational training institute with full accreditation.',
    icon: <Award className="h-6 w-6" />,
    color: 'text-blue-600 dark:text-blue-400'
  },
  {
    number: '45 Days',
    label: 'Israel Course',
    description: 'Intensive full-time training program for international caregiver opportunities.',
    icon: <Clock className="h-6 w-6" />,
    color: 'text-purple-600 dark:text-purple-400'
  },
  {
    number: 'SLFEB',
    label: 'Foreign Employment',
    description: 'Approved by Sri Lanka Foreign Employment Bureau for global job placements.',
    icon: <Globe className="h-6 w-6" />,
    color: 'text-amber-600 dark:text-amber-400'
  }
]

// Showcase modules for the "Our Programs" section
const showcaseModules = [
  {
    name: 'Caregiver NVQ Level 3',
    icon: <Heart className="h-6 w-6" />,
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    metric: 'Foundation Program',
    detail: 'Start your caregiving journey with core patient care skills and practical training.',
    submodules: ['Basic Patient Care', 'Hygiene & Safety', 'Communication Skills'],
    route: '/courses/caregiver-nvq-3'
  },
  {
    name: 'Caregiver NVQ Level 4',
    icon: <Award className="h-6 w-6" />,
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    metric: 'Advanced Program',
    detail: 'Progress to advanced caregiving techniques with weekend options for professionals.',
    submodules: ['Advanced Care Plans', 'Elderly Care', 'Professional Practice'],
    route: '/courses/caregiver-nvq-4'
  },
  {
    name: 'Israel Caregiver Course',
    icon: <Globe className="h-6 w-6" />,
    iconBg: 'bg-purple-50 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    metric: 'SLFEB Approved',
    detail: 'Intensive 45-day full-time program tailored for international caregiver opportunities.',
    submodules: ['Hebrew Basics', 'Cultural Training', 'Practical Workshops'],
    route: '/courses/israel-caregiver'
  }
]

// Optional image used in the module preview area
const imageUrl = ''

// Caregiving Academy Images
const LANDING_PAGE_IMAGES = {
 
}

// Demo videos - all videos now available
const DEMO_VIDEOS = {

}

export default function LandingPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [ctaLoading, setCtaLoading] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<string>('dashboard')
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    features: true,
    modules: true,
    demo: false
  })
  const [articles, setArticles] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [articlesLoading, setArticlesLoading] = useState(true)
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  
  // Use the hardcoded images directly
  const images = LANDING_PAGE_IMAGES

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      // Show button when user scrolls down 300px
      setShowBackToTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch articles for landing page
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/public/landing?type=articles&limit=3')
        if (response.ok) {
          const data = await response.json()
          setArticles(data.articles || [])
        }
      } catch (error) {
        console.error('Error fetching articles:', error)
      } finally {
        setArticlesLoading(false)
      }
    }

    fetchArticles()
  }, [])

  // Fetch announcements for landing page
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/public/landing?type=announcements&limit=3')
        if (response.ok) {
          const data = await response.json()
          setAnnouncements(data.announcements || [])
        }
      } catch (error) {
        console.error('Error fetching announcements:', error)
      } finally {
        setAnnouncementsLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleGetStarted = async () => {
    if (ctaLoading) return
    setCtaLoading(true)
    try {
      // Interactive preview - redirect to setup page for exploration without signup
      router.push('/setup')
    } catch (error) {
      router.push('/setup')
    } finally {
      setCtaLoading(false)
    }
  }

  const startGuidedTour = () => {
    // Close video modal if open
    setShowVideoModal(false)
    
    // Scroll to first section and highlight it
    const sections = [
      'unique-features',
      'key-features',
      'workflows',
      'module-walkthrough',
      'reporting-analytics',
      'team-collaboration'
    ]
    
    let currentIndex = 0
    
    const scrollToNext = () => {
      if (currentIndex < sections.length) {
        scrollToSection(sections[currentIndex])
        currentIndex++
        if (currentIndex < sections.length) {
          setTimeout(scrollToNext, 3000) // Wait 3 seconds before next section
        }
      }
    }
    
    // Start the tour
    scrollToNext()
  }

  const scrollToSection = (sectionId: string) => {
    // Close any open dropdowns first by blurring active element
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    
    // Delay to ensure dropdown closes and DOM updates
    requestAnimationFrame(() => {
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          // Get the element's position and scroll with proper offset
          const headerOffset = 80
          const elementPosition = element.getBoundingClientRect().top + window.scrollY
          const offsetPosition = elementPosition - headerOffset

          // Use window.scrollTo with smooth behavior
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          })
          
          // Ensure page remains scrollable after scroll completes
          setTimeout(() => {
            document.body.style.overflow = ''
            document.documentElement.style.overflow = ''
          }, 500)
        }
      }, 150) // Reduced delay for better responsiveness
    })
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] text-slate-900 transition-colors dark:bg-[#040714] dark:text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f4f8ff] via-[#ffffff] to-[#e8eeff] dark:from-[#050c1d] dark:via-[#0a1030] dark:to-[#071328]" />
        <div className="absolute inset-y-0 left-1/2 w-[45rem] -translate-x-1/2 bg-[radial-gradient(circle_at_top,_rgba(120,140,255,0.25),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(108,99,255,0.35),_transparent_55%)]" />
        {/* Header Navigation */}
        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 pt-8">
          <div className="flex items-center gap-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 text-2xl font-bold cursor-pointer group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-300 group-hover:scale-110">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-red-400 dark:to-white bg-clip-text text-transparent group-hover:from-red-600 group-hover:via-red-500 group-hover:to-red-600 dark:group-hover:from-red-400 dark:group-hover:via-white dark:group-hover:to-red-400 transition-all duration-300">
                Help Line Academy
              </span>
            </button>
            
            <nav className="hidden md:flex items-center gap-2 overflow-x-auto md:overflow-visible">
              {/* Features Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-white/90 dark:hover:text-white transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/10 group">
                  Features
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 rounded-xl border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xl dark:border-white/20 dark:bg-slate-900/95 dark:backdrop-blur-md p-2">
                  <DropdownMenuItem 
                    onSelect={() => {
                      scrollToSection('unique-features')
                    }}
                    className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gradient-to-r hover:from-[#7bffde]/10 hover:to-[#7afdea]/10 dark:hover:from-[#7bffde]/20 dark:hover:to-[#7afdea]/20 transition-all duration-200 group"
                  >
                    <Zap className="mr-2.5 h-4 w-4 text-[#7bffde] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Unique Features</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={() => {
                      scrollToSection('key-features')
                    }}
                    className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gradient-to-r hover:from-[#7bffde]/10 hover:to-[#7afdea]/10 dark:hover:from-[#7bffde]/20 dark:hover:to-[#7afdea]/20 transition-all duration-200 group"
                  >
                    <ListChecks className="mr-2.5 h-4 w-4 text-[#7bffde] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Key Features</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={() => {
                      scrollToSection('workflows')
                    }}
                    className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gradient-to-r hover:from-[#7bffde]/10 hover:to-[#7afdea]/10 dark:hover:from-[#7bffde]/20 dark:hover:to-[#7afdea]/20 transition-all duration-200 group"
                  >
                    <Activity className="mr-2.5 h-4 w-4 text-[#7bffde] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Workflows</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Modules Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-white/90 dark:hover:text-white transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/10 group">
                  Modules
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 rounded-xl border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xl dark:border-white/20 dark:bg-slate-900/95 dark:backdrop-blur-md p-2">
                  <DropdownMenuItem 
                    onSelect={() => {
                      scrollToSection('module-walkthrough')
                    }}
                    className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gradient-to-r hover:from-[#7bffde]/10 hover:to-[#7afdea]/10 dark:hover:from-[#7bffde]/20 dark:hover:to-[#7afdea]/20 transition-all duration-200 group"
                  >
                    <Layers className="mr-2.5 h-4 w-4 text-[#7bffde] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Module Walkthrough</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={() => {
                      scrollToSection('reporting-analytics')
                    }}
                    className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gradient-to-r hover:from-[#7bffde]/10 hover:to-[#7afdea]/10 dark:hover:from-[#7bffde]/20 dark:hover:to-[#7afdea]/20 transition-all duration-200 group"
                  >
                    <BarChart3 className="mr-2.5 h-4 w-4 text-[#7bffde] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Reports & Analytics</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={() => {
                      scrollToSection('team-collaboration')
                    }}
                    className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gradient-to-r hover:from-[#7bffde]/10 hover:to-[#7afdea]/10 dark:hover:from-[#7bffde]/20 dark:hover:to-[#7afdea]/20 transition-all duration-200 group"
                  >
                    <Users className="mr-2.5 h-4 w-4 text-[#7bffde] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Team Collaboration</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Demo Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-white/90 dark:hover:text-white transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/10 group">
                  Demo
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 rounded-xl border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xl dark:border-white/20 dark:bg-slate-900/95 dark:backdrop-blur-md p-2">
                  <DropdownMenuItem 
                    onClick={() => {
                      setCurrentVideo('dashboard')
                      setShowVideoModal(true)
                    }}
                    className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gradient-to-r hover:from-[#7bffde]/10 hover:to-[#7afdea]/10 dark:hover:from-[#7bffde]/20 dark:hover:to-[#7afdea]/20 transition-all duration-200 group"
                  >
                    <BarChart3 className="mr-2.5 h-4 w-4 text-[#7bffde] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Dashboard Demo</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setCurrentVideo('tasks')
                      setShowVideoModal(true)
                    }}
                    className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gradient-to-r hover:from-[#7bffde]/10 hover:to-[#7afdea]/10 dark:hover:from-[#7bffde]/20 dark:hover:to-[#7afdea]/20 transition-all duration-200 group"
                  >
                    <ListChecks className="mr-2.5 h-4 w-4 text-[#7bffde] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Tasks Demo</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setCurrentVideo('projects')
                      setShowVideoModal(true)
                    }}
                    className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gradient-to-r hover:from-[#7bffde]/10 hover:to-[#7afdea]/10 dark:hover:from-[#7bffde]/20 dark:hover:to-[#7afdea]/20 transition-all duration-200 group"
                  >
                    <Layers className="mr-2.5 h-4 w-4 text-[#7bffde] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Course Modules Demo</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setCurrentVideo('settings')
                      setShowVideoModal(true)
                    }}
                    className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gradient-to-r hover:from-[#7bffde]/10 hover:to-[#7afdea]/10 dark:hover:from-[#7bffde]/20 dark:hover:to-[#7afdea]/20 transition-all duration-200 group"
                  >
                    <Shield className="mr-2.5 h-4 w-4 text-[#7bffde] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Settings Demo</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button - Right Aligned */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-slate-700 hover:text-slate-900 dark:text-white/90 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            
            {/* Theme Toggle - Horizontal */}
            {mounted && (
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 dark:border-white/20 dark:bg-white/5">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  Dark
                </button>
              </div>
            )}
            
            {/* Right-side CTAs */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push('/login')}
                className="hidden sm:flex text-sm font-medium hover:bg-slate-100 dark:hover:bg-[#7bffde]/20 dark:hover:text-[#7bffde]"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 shadow-lg">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-red-400 bg-clip-text text-transparent">
                      Help Line Academy
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-700 dark:text-white/70 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Mobile Menu Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Features Section */}
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection('features')}
                      className="flex items-center justify-between w-full text-left text-sm font-semibold text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Features
                      {expandedSections.features ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {expandedSections.features && (
                      <div className="space-y-2 pl-4">
                        <button
                          onClick={() => {
                            scrollToSection('unique-features')
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                        >
                          <Zap className="h-4 w-4 text-[#7bffde]" />
                          Unique Features
                        </button>
                        <button
                          onClick={() => {
                            scrollToSection('key-features')
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                        >
                          <Shield className="h-4 w-4 text-[#7bffde]" />
                          Key Features
                        </button>
                        <button
                          onClick={() => {
                            scrollToSection('workflows')
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                        >
                          <TrendingUp className="h-4 w-4 text-[#7bffde]" />
                          Workflows
                        </button>
                        <button
                          onClick={() => {
                            scrollToSection('module-walkthrough')
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                        >
                          <Layers className="h-4 w-4 text-[#7bffde]" />
                          Module Walkthrough
                        </button>
                        <button
                          onClick={() => {
                            scrollToSection('reporting-analytics')
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                        >
                          <BarChart3 className="h-4 w-4 text-[#7bffde]" />
                          Reports & Analytics
                        </button>
                        <button
                          onClick={() => {
                            scrollToSection('team-collaboration')
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                        >
                          <Users className="h-4 w-4 text-[#7bffde]" />
                          Team Collaboration
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Modules Section */}
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection('modules')}
                      className="flex items-center justify-between w-full text-left text-sm font-semibold text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Modules
                      {expandedSections.modules ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {expandedSections.modules && (
                      <div className="space-y-2 pl-4">
                        {modules.map((module, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              router.push(module.route)
                              setIsMobileMenuOpen(false)
                            }}
                            className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                          >
                            {module.icon}
                            <div>
                              <div className="font-medium">{module.name}</div>
                              <div className="text-xs text-slate-500 dark:text-white/50 mt-0.5">{module.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Demo Section */}
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection('demo')}
                      className="flex items-center justify-between w-full text-left text-sm font-semibold text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Demo
                      {expandedSections.demo ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {expandedSections.demo && (
                      <div className="space-y-2 pl-4">
                        <button
                          onClick={() => {
                            setCurrentVideo('dashboard')
                            setShowVideoModal(true)
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                        >
                          <BarChart3 className="h-4 w-4 text-[#7bffde]" />
                          Dashboard Demo
                        </button>
                        <button
                          onClick={() => {
                            setCurrentVideo('tasks')
                            setShowVideoModal(true)
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                        >
                          <ListChecks className="h-4 w-4 text-[#7bffde]" />
                          Tasks Demo
                        </button>
                        <button
                          onClick={() => {
                            setCurrentVideo('projects')
                            setShowVideoModal(true)
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                        >
                          <Layers className="h-4 w-4 text-[#7bffde]" />
                          Course Modules Demo
                        </button>
                        <button
                          onClick={() => {
                            setCurrentVideo('settings')
                            setShowVideoModal(true)
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200"
                        >
                          <Shield className="h-4 w-4 text-[#7bffde]" />
                          Settings Demo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Mobile Menu Footer */}
                <div className="border-t border-slate-200 dark:border-white/10 p-6 space-y-4">
                  {/* Theme Toggle */}
                  {mounted && (
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 dark:border-white/20 dark:bg-white/5">
                      <button
                        onClick={() => setTheme('light')}
                        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          theme === 'light'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white'
                        }`}
                      >
                        <Sun className="h-3.5 w-3.5" />
                        Light
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white'
                        }`}
                      >
                        <Moon className="h-3.5 w-3.5" />
                        Dark
                      </button>
                    </div>
                  )}
                  
                  {/* Login Button */}
                  <Button
                    onClick={() => {
                      router.push('/login')
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full bg-[#0d9488] dark:bg-[#7bffde] text-white dark:text-slate-900 hover:bg-[#0f766e] dark:hover:bg-[#62f5cf] transition-colors"
                  >
                    Login
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="relative mx-auto flex max-w-7xl flex-col gap-16 px-6 pt-20 pb-20 lg:flex-row lg:items-center lg:pt-24 lg:pb-32">
          <div className="space-y-10 text-center lg:text-left lg:flex-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-300/60 bg-white/70 px-5 py-2 text-sm uppercase tracking-[0.3em] text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-white/80">
              <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
              Government Registered Vocational Institute
            </p>
            <div className="space-y-8">
              <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-[2.5rem] xl:text-[3rem] dark:text-white">
                <span className="block">Launch Your Global</span>
                <span className="block mt-1 sm:mt-2 lg:mt-3 xl:mt-4">Career In</span>
                <span className="block mt-1 sm:mt-2 lg:mt-3 xl:mt-4 bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent">Caregiving</span>
              </h1>
              <p className="text-base text-slate-600 sm:text-lg lg:text-base xl:text-lg dark:text-white/80 leading-relaxed">
                Specialized 45-Day Training For Israel, Japan, And Europe. SLFEB Approved. Get Internationally Recognized Qualifications Right Here In Bandaragama.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Button
                onClick={() => router.push('/contact')}
                disabled={ctaLoading}
                className="h-14 rounded-full bg-red-600 dark:bg-red-500 px-10 text-base font-semibold text-white dark:text-white shadow-[0_20px_45px_rgba(220,38,38,0.35)] dark:shadow-[0_20px_45px_rgba(239,68,68,0.35)] transition hover:-translate-y-1 hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-70"
              >
                {ctaLoading ? (
                  <>
                    Loading...
                    <ArrowRight className="ml-2 h-5 w-5 animate-pulse" />
                  </>
                ) : (
                  <>
                    Apply Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/about')}
                className="h-14 rounded-full border-slate-300 bg-white px-10 text-base font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/40 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Learn More
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl rounded-[3rem] border border-slate-200 bg-white p-8 text-slate-900 shadow-[0_50px_80px_rgba(15,23,42,0.15)] backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-[0_40px_80px_rgba(0,0,0,0.45)]">
            <div className="rounded-3xl bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-8 text-center">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 shadow-lg">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">TVEC Reg No: P03/0174</h3>
                  <p className="text-sm text-slate-600 dark:text-white/80 mt-2">Government Registered Vocational Institute</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-lg bg-white/80 dark:bg-slate-800/80 p-4">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">1000+</div>
                    <div className="text-sm text-slate-600 dark:text-white/70">Trained Students</div>
                  </div>
                  <div className="rounded-lg bg-white/80 dark:bg-slate-800/80 p-4">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">SLFEB</div>
                    <div className="text-sm text-slate-600 dark:text-white/70">Approved</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                  <p className="text-sm text-slate-600 dark:text-white/80">
                    "Learn from medical experts. Master first aid, BLS, and patient care."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unique Features Section */}
      <section id="unique-features" className="bg-[#f7f9ff] px-6 py-20 text-slate-900 dark:bg-[#040714] dark:text-white sm:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#0d9488] dark:text-[#68ffde]">
            Unique Features
          </p>
          <h2 className="mt-4 text-5xl font-semibold sm:text-6xl">
            What makes Help Line Academy different
          </h2>
          <p className="mt-4 text-slate-600 dark:text-white/80">
            Built for teams who want complete control, flexibility, and ownership of their course management solution.
          </p>
        </div>
        <div className="mx-auto mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Self-Hosted',
              description: 'Complete control over your data with Docker-based deployment. Host on your own infrastructure with full data sovereignty. No third-party access, complete privacy, and compliance with your organization\'s security policies.',
              icon: <Shield className="h-6 w-6 text-[#0d9488] dark:text-[#7bffde]" />,
              color: 'from-[#0d9488]/10 to-[#0d9488]/5 dark:from-[#7bffde]/10 dark:to-[#7bffde]/5'
            },
            {
              title: 'Open Source',
              description: 'Fully open-source with community-driven development. Customize and extend to fit your needs. Any organization can configure the system and create their admin account as the first step to get started.',
              icon: <Zap className="h-6 w-6 text-[#6366f1]" />,
              color: 'from-[#6366f1]/10 to-[#6366f1]/5'
            },
            {
              title: 'Modern Stack',
              description: 'Built with Next.js, Node.js, and MongoDB for a fast, scalable, and modern experience. Enjoy real-time updates, server-side rendering, and a responsive UI that works seamlessly across all devices.',
              icon: <Activity className="h-6 w-6 text-[#d946ef]" />,
              color: 'from-[#d946ef]/10 to-[#d946ef]/5'
            },
            {
              title: 'Scalable',
              description: 'Designed to grow with your team and project complexity from startups to enterprises. Handle thousands of tasks, multiple projects, and large teams without performance degradation.',
              icon: <TrendingUp className="h-6 w-6 text-[#06b6d4]" />,
              color: 'from-[#06b6d4]/10 to-[#06b6d4]/5'
            },
            {
              title: 'Customizable',
              description: 'Flexible architecture for custom workflows, integrations, and branding. Adapt the system to match your existing processes, create custom fields, and integrate with your favorite tools.',
              icon: <Layers className="h-6 w-6 text-[#f59e0b]" />,
              color: 'from-[#f59e0b]/10 to-[#f59e0b]/5'
            }
          ].map((feature, idx) => (
            <div
              key={feature.title}
              className="group relative rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-2 hover:border-[#7bffde]/30 hover:shadow-[0_12px_40px_rgba(123,255,222,0.15)] dark:border-white/20 dark:bg-gradient-to-br dark:from-[#0f1329] dark:via-[#151c3d] dark:to-[#0a1f3b] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] dark:hover:border-[#7bffde]/40"
            >
              <div className={`absolute inset-0 rounded-[24px] bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:opacity-20`} />
              <div className="relative z-10">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#0d9488] dark:group-hover:text-[#7bffde] transition-colors">{feature.title}</h3>
                <p className="text-sm text-slate-600 dark:text-white/80 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Features Section */}
      <section id="key-features" className="bg-gradient-to-b from-[#eef2ff] to-[#f9fbff] px-6 py-20 dark:from-[#050c1d] dark:to-[#030714] sm:py-28">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#0d9488] dark:text-[#7bffde]">Key Features</p>
          <h2 className="mt-4 text-5xl font-semibold sm:text-6xl lg:text-7xl">
            Core Project Management Features
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-white/70 max-w-3xl mx-auto">
            Everything you need to manage projects, teams, and workflows in one unified platform.
          </p>
        </div>
        <div className="mx-auto mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { 
              name: 'Project Creation & Management', 
              description: 'Create projects with templates, manage hierarchies, track lifecycles, and visualize timelines.',
              icon: <Layers className="h-6 w-6" />,
              iconColor: 'text-blue-600 dark:text-blue-400',
              iconBg: 'bg-blue-50 dark:bg-blue-900/30',
              features: ['Project Templates', 'Hierarchical Structure', 'Status Tracking', 'Visual Timeline']
            },
            { 
              name: 'Task Management with Scrum & Kanban', 
              description: 'Full Scrum & Kanban support with sprint planning, backlog management, and velocity tracking.',
              icon: <ListChecks className="h-6 w-6" />,
              iconColor: 'text-emerald-600 dark:text-emerald-400',
              iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
              features: ['Lessons Boards', 'Sprint Planning', 'Burndown Charts', 'Velocity Metrics']
            },
            { 
              name: 'Team Collaboration & User Management', 
              description: 'Invite members, assign roles, manage permissions, and collaborate with real-time activity feeds.',
              icon: <Users className="h-6 w-6" />,
              iconColor: 'text-purple-600 dark:text-purple-400',
              iconBg: 'bg-purple-50 dark:bg-purple-900/30',
              features: ['Role-Based Access', 'Team Invitations', 'Activity Tracking', 'Audit Logs']
            },
            { 
              name: 'Invoicing & Billing Capabilities', 
              description: 'Generate professional invoices, track payments, manage billing cycles, and automate financial workflows.',
              icon: <FileText className="h-6 w-6" />,
              iconColor: 'text-rose-600 dark:text-rose-400',
              iconBg: 'bg-rose-50 dark:bg-rose-900/30',
              features: ['Invoice Generation', 'Payment Tracking', 'Billing Automation', 'Financial Reports']
            },
            { 
              name: 'File Management & Document Sharing', 
              description: 'Upload, organize, and share files securely. Attach documents to tasks, projects, and collaborate in real-time.',
              icon: <Layers className="h-6 w-6" />,
              iconColor: 'text-amber-600 dark:text-amber-400',
              iconBg: 'bg-amber-50 dark:bg-amber-900/30',
              features: ['File Uploads', 'Document Sharing', 'Version Control', 'Secure Storage']
            },
            { 
              name: 'Time Tracking & Reporting', 
              description: 'Track billable hours with built-in timers, approval workflows, and comprehensive time reports.',
              icon: <Watch className="h-6 w-6" />,
              iconColor: 'text-cyan-600 dark:text-cyan-400',
              iconBg: 'bg-cyan-50 dark:bg-cyan-900/30',
              features: ['Live Timer', 'Billable Hours', 'Time Approval', 'Capacity Planning']
            },
            { 
              name: 'Budget Allocation & Financial Management', 
              description: 'Budget allocation, expense tracking, invoicing, and ROI analytics with multi-currency support.',
              icon: <TrendingUp className="h-6 w-6" />,
              iconColor: 'text-orange-600 dark:text-orange-400',
              iconBg: 'bg-orange-50 dark:bg-orange-900/30',
              features: ['Budget Tracking', 'Cost Centers', 'Expense Management', 'ROI Analytics']
            },
            { 
              name: 'Reports & Analytics', 
              description: 'Real-time dashboards, Gantt charts, team performance metrics, and exportable custom reports.',
              icon: <BarChart3 className="h-6 w-6" />,
              iconColor: 'text-indigo-600 dark:text-indigo-400',
              iconBg: 'bg-indigo-50 dark:bg-indigo-900/30',
              features: ['Executive Dashboards', 'Gantt Charts', 'Custom Reports', 'Data Export']
            }
          ].map((feature, idx) => (
            <div
              key={feature.name}
              className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-2 hover:border-[#7bffde]/50 hover:bg-white hover:shadow-[0_8px_32px_rgba(123,255,222,0.15)] dark:border-white/20 dark:bg-gradient-to-br dark:from-[#0f1329] dark:via-[#151c3d] dark:to-[#0a1f3b] dark:backdrop-blur-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] dark:hover:border-[#7bffde]/50 dark:hover:shadow-[0_8px_32px_rgba(123,255,222,0.2)]"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full ${feature.iconBg} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBg} mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  <div className={feature.iconColor}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#0d9488] dark:group-hover:text-[#7bffde] transition-colors">{feature.name}</h3>
                <p className="text-sm text-slate-600 dark:text-white/80 mb-4 leading-relaxed">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.features.map((feat, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 dark:bg-slate-700/70 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10"
                    >
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">âœ“</span>
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Help Line Academy Section */}
      <section id="why-choose-us" className="bg-gradient-to-b from-[#f9fbff] to-[#eef2ff] px-6 py-20 dark:from-[#030714] dark:to-[#050c1d] sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-red-600 dark:text-red-400">Why Choose Us</p>
            <h2 className="mt-4 text-5xl font-semibold sm:text-6xl">
              Your Gateway to Global Caregiving
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-white/70 max-w-3xl mx-auto">
              Quality education, professional training, and secure future in healthcare careers worldwide.
            </p>
          </div>
          <div className="mx-auto grid gap-8 lg:grid-cols-2">
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_25px_55px_rgba(15,23,42,0.08)] dark:border-white/20 dark:bg-gradient-to-br dark:from-[#0f1329] dark:via-[#151c3d] dark:to-[#0a1f3b] dark:shadow-[0_35px_65px_rgba(0,0,0,0.6)]"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30 shadow-md">
                    <div className="text-red-600 dark:text-red-400">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-white/80 mt-1">{feature.stats}</p>
                  </div>
                </div>
                <p className="text-base text-slate-600 dark:text-white/80 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 shadow-lg">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Help Line Academy</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Government-registered vocational training institute specializing in healthcare education.
              TVEC Reg No: P03/0174 â€¢ SLFEB Approved.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-red-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-red-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-red-400 transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-red-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/about" className="text-slate-300 hover:text-red-400 transition-colors">About Us</a></li>
              <li><a href="/courses" className="text-slate-300 hover:text-red-400 transition-colors">Our Courses</a></li>
              <li><a href="/gallery" className="text-slate-300 hover:text-red-400 transition-colors">Gallery</a></li>
              <li><a href="/contact" className="text-slate-300 hover:text-red-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Our Courses */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Our Courses</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/courses/caregiver-nvq-3" className="text-slate-300 hover:text-red-400 transition-colors">Caregiver NVQ Level 3</a></li>
              <li><a href="/courses/caregiver-nvq-4" className="text-slate-300 hover:text-red-400 transition-colors">Caregiver NVQ Level 4</a></li>
              <li><a href="/courses/israel-caregiver" className="text-slate-300 hover:text-red-400 transition-colors">Israel Caregiver Course</a></li>
              <li><a href="/courses/first-aid-bls" className="text-slate-300 hover:text-red-400 transition-colors">First Aid & BLS</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Get In Touch</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">
                  327/B2, Piliyandala Road,<br />
                  Madagama Junction,<br />
                  Bandaragama
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-red-400 flex-shrink-0" />
                <a href="tel:+94715465556" className="text-slate-300 hover:text-red-400 transition-colors">
                  +94 71 546 5556
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-red-400 flex-shrink-0" />
                <a href="mailto:info@helplineacademy.lk" className="text-slate-300 hover:text-red-400 transition-colors">
                  info@helplineacademy.lk
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center">
          <p className="text-slate-400 text-sm">
             2026 Help Line Academy | Powered by FlexNode| All rights reserved
          </p>
        </div>
      </footer>

      {/* Course Modules Showcase */}
      <section className="relative -mt-32 px-6 pb-20 sm:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#0d9488] dark:text-[#7bffde]">Our Programs</p>
            <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">
              Comprehensive Healthcare Training
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-white/70 max-w-3xl mx-auto">
              Choose from our specialized training programs designed for healthcare careers worldwide.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {showcaseModules.map((showcase) => (
              <div
                key={showcase.name}
                className="group rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_25px_55px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_35px_65px_rgba(15,23,42,0.15)] dark:border-white/20 dark:bg-gradient-to-br dark:from-[#0f1329] dark:via-[#151c3d] dark:to-[#0a1f3b] dark:shadow-[0_25px_55px_rgba(0,0,0,0.6)] dark:hover:border-[#7bffde]/40 cursor-pointer"
                onClick={() => showcase.route && router.push(showcase.route)}
              >
                {/* Module Header with Icon */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${showcase.iconBg} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <div className={showcase.iconColor}>
                      {showcase.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white group-hover:text-[#0d9488] dark:group-hover:text-[#7bffde] transition-colors">{showcase.name}</h3>
                        <span className="rounded-full bg-[#0d9488]/10 dark:bg-[#7bffde]/20 px-3 py-1 text-xs font-semibold text-[#0d9488] dark:text-[#7bffde]">{showcase.metric}</span>
                      </div>
                    </div>
                  </div>

                  {/* Module Description */}
                  <p className="text-sm text-slate-600 dark:text-white/80 leading-relaxed mb-4">{showcase.detail}</p>

                  {/* Submodules */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {showcase.submodules.map((submodule, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-white/80"
                      >
                        {submodule}
                      </span>
                    ))}
                  </div>

                  {/* Module Preview Image */}
                  {imageUrl ? (
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 group-hover:border-[#0d9488]/50 dark:group-hover:border-[#7bffde]/50 transition-all duration-300 shadow-lg hover:shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                      <Image
                        src={imageUrl}
                        alt={showcase.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs uppercase tracking-[0.4em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/40">
                      Module Preview
                    </div>
                  )}

                  {/* Click to Explore CTA */}
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
                    <button className="w-full flex items-center justify-center gap-2 rounded-full bg-[#0d9488]/10 dark:bg-[#7bffde]/20 py-3 text-sm font-semibold text-[#0d9488] dark:text-[#7bffde] hover:bg-[#0d9488] hover:text-white dark:hover:bg-[#7bffde]/20 dark:hover:text-[#7bffde] transition-colors">
                      <span>Click to Explore</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </main>
  )
}
