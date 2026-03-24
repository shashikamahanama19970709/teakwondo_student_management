'use client'

import { LandingNavbar } from '@/components/layout/LandingNavbar'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/Button'
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
import { useOrganization } from '@/hooks/useOrganization'
import { OrganizationLogo } from '@/components/ui/OrganizationLogo'
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
  Watch,
  Calendar,
  Quote,
  User
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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

// Navigation courses for mobile menu
const modules = [
  {
    name: 'Caregiver NVQ Level 3',
    description: 'Foundational caregiving course',
    route: '/courses/caregiver-nvq-3',
    icon: <Heart className="h-4 w-4" />
  },
  {
    name: 'Caregiver NVQ Level 4',
    description: 'Advanced caregiving training',
    route: '/courses/caregiver-nvq-4',
    icon: <Award className="h-4 w-4" />
  },
  {
    name: 'Israel Caregiver Course',
    description: 'International caregiver program',
    route: '/courses/israel-caregiver',
    icon: <Globe className="h-4 w-4" />
  },
  {
    name: 'First Aid & BLS',
    description: 'Life-saving skills training',
    route: '/courses/first-aid-bls',
    icon: <Shield className="h-4 w-4" />
  }
]

// Caregiving Academy Images
const LANDING_PAGE_IMAGES = {};

// Animation variants
const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const inquirySchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().trim().min(1, 'Last name is required').max(50, 'Last name cannot exceed 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(9, 'Please enter a valid phone number'),
  message: z.string().min(10, 'Message is required'),
})

type InquiryFormData = z.infer<typeof inquirySchema>

// Inquiry Form Component
function InquiryForm({ announcementTitle, onSuccess, onCancel }: { announcementTitle: string; onSuccess: () => void; onCancel: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, touchedFields }
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    mode: 'onChange'
  })

  // Format phone number live
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d+]/g, '');
    if (!value.startsWith('+94') && value.length > 0) {
      if (value.startsWith('0')) {
        value = '+94' + value.substring(1);
      } else if (!value.startsWith('+')) {
        value = '+94' + value;
      }
    }

    // Attempt basic text block formatting "+94 77 123 4567"
    let formatted = value;
    const match = value.match(/^(\+94)(\d{0,2})(\d{0,3})(\d{0,4})$/);
    if (match) {
      formatted = [match[1], match[2] ? ' ' + match[2] : '', match[3] ? ' ' + match[3] : '', match[4] ? ' ' + match[4] : ''].join('').trim();
    } else if (value.length > 12) {
      formatted = value.substring(0, 15);
    }

    setValue('phone', formatted, { shouldValidate: true, shouldDirty: true });
  }

  const onSubmitForm = async (data: InquiryFormData) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const response = await fetch('/api/announcements/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          announcementTitle
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          const errorData = await response.json()
          setSubmitError(errorData.error || 'You have already submitted an inquiry in the last 24 hours')
          return
        }
        throw new Error('Failed to submit inquiry')
      }

      toast.success('Inquiry submitted successfully! We will contact you soon.')
      onSuccess()
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      toast.error('Failed to submit inquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClasses = "h-[44px] border border-[#E5E7EB] rounded-[8px] px-[12px] text-[14px] transition-all duration-200 focus:border-[#2563EB] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-white/10 dark:text-white dark:focus:border-[#7bffde] dark:focus:shadow-[0_0_0_3px_rgba(123,255,222,0.12)] w-full"

  const textareaClasses = "min-h-[120px] resize-y border border-[#E5E7EB] rounded-[8px] p-[12px] text-[14px] transition-all duration-200 focus:border-[#2563EB] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-white/10 dark:text-white dark:focus:border-[#7bffde] dark:focus:shadow-[0_0_0_3px_rgba(123,255,222,0.12)] w-full"

  const labelClasses = "text-[13px] font-medium text-slate-700 block mb-[6px] dark:text-slate-300"

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="flex flex-col gap-[26px]">
      {submitError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[8px] p-4">
          <p className="text-sm text-red-800 dark:text-red-200 font-medium">{submitError}</p>
        </div>
      )}

      {/* Section A — Contact Information */}
      <div>
        <h3 className="text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-[0.08em] mb-[16px]">Your Contact Details</h3>
        <div className="flex flex-col gap-[18px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
            <div>
              <Label htmlFor="firstName" className={labelClasses}>First Name <span className="text-red-500">*</span></Label>
              <input
                id="firstName"
                {...register('firstName')}
                placeholder="Your first name"
                className={inputClasses}
              />
              {errors.firstName && touchedFields.firstName && (
                <p aria-live="polite" className="text-[12px] text-red-600 dark:text-red-400 mt-1.5 font-medium">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName" className={labelClasses}>Last Name <span className="text-red-500">*</span></Label>
              <input
                id="lastName"
                {...register('lastName')}
                placeholder="Your last name"
                className={inputClasses}
              />
              {errors.lastName && touchedFields.lastName && (
                <p aria-live="polite" className="text-[12px] text-red-600 dark:text-red-400 mt-1.5 font-medium">{errors.lastName.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
            <div>
              <Label htmlFor="email" className={labelClasses}>Email <span className="text-red-500">*</span></Label>
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="your.email@example.com"
                className={inputClasses}
              />
              {errors.email && touchedFields.email && (
                <p aria-live="polite" className="text-[12px] text-red-600 dark:text-red-400 mt-1.5 font-medium">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone" className={labelClasses}>Phone <span className="text-red-500">*</span></Label>
              <input
                id="phone"
                {...register('phone')}
                onChange={handlePhoneChange}
                placeholder="+94 XX XXX XXXX"
                className={inputClasses}
              />
              {errors.phone && touchedFields.phone && (
                <p aria-live="polite" className="text-[12px] text-red-600 dark:text-red-400 mt-1.5 font-medium">{errors.phone.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section B — Inquiry Message */}
      <div className="bg-[#F9FAFB] dark:bg-white/5 p-[14px] rounded-[8px]">
        <h3 className="text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-[0.08em] mb-[16px]">Your Inquiry</h3>
        <div>
          <Label htmlFor="message" className={labelClasses}>Message</Label>
          <textarea
            id="message"
            {...register('message')}
            placeholder="Tell us about what you want to learn..."
            className={textareaClasses}
          />
          {errors.message && touchedFields.message && (
            <p aria-live="polite" className="text-[12px] text-red-600 dark:text-red-400 mt-1.5 font-medium">{errors.message.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-[12px] pt-[8px] border-t border-[#E5E7EB] dark:border-white/10 mt-[4px]">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="h-[44px] px-[20px] bg-transparent text-[#374151] hover:bg-slate-100 font-medium rounded-[8px] transition-colors dark:text-slate-300 dark:hover:bg-white/10 flex items-center justify-center outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="h-[44px] px-[22px] bg-[#111827] text-white hover:bg-[#000000] font-medium rounded-[8px] transition-all disabled:bg-[#D1D5DB] disabled:text-white disabled:shadow-none disabled:cursor-not-allowed shadow-[0_4px_10px_rgba(0,0,0,0.08)] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 flex items-center justify-center outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#111827] dark:focus:ring-white dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
        >
          {submitting ? 'Submitting...' : 'Submit Inquiry'}
        </button>
      </div>
    </form>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { organization, loading: orgLoading } = useOrganization()
  const [ctaLoading, setCtaLoading] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<string>('dashboard')
  const [mounted, setMounted] = useState(false)

  const [articles, setArticles] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [articlesLoading, setArticlesLoading] = useState(true)
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  const [showInquiryModal, setShowInquiryModal] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null)
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [lecturePanel, setLecturePanel] = useState<any[]>([])
  const [testimonialsLoading, setTestimonialsLoading] = useState(true)
  const [lecturePanelLoading, setLecturePanelLoading] = useState(true)
  const [announcementsPage, setAnnouncementsPage] = useState(1)
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0)
  const itemsPerPage = 3

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Use the hardcoded images directly
  const images = LANDING_PAGE_IMAGES

  const getProxiedImageUrl = (url: string | null | undefined, signedUrl?: string) => {
    if (!url) return '';
    
    // Use signed URL if available (for announcements)
    if (signedUrl) {
      return signedUrl;
    }
    
    // Handle old format URLs (without /file/ prefix) and new format URLs
    // Ensure the URL starts with / for Next.js Image component
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Absolute URL, use as-is
      return url;
    } else if (url.startsWith('/')) {
      // Already starts with /, use as-is
      return url;
    } else if (url.startsWith('file/')) {
      // New format without leading slash, add it
      return `/${url}`;
    } else {
      // Old format (profile-pictures/...), add /file/ prefix
      return `/file/${url}`;
    }
  }

  // Helper function to determine if image should be unoptimized
  const shouldUnoptimize = (url: string | null | undefined) => {
    if (!url) return false;
    // Unoptimize for signed URLs (external URLs)
    return url.includes('backblazeb2.com');
  }

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
        const response = await fetch('/api/announcements/landing')
       
        if (response.ok) {
          const data = await response.json()
      
          
          // Fetch signed URLs for announcement images
          const announcementsWithSignedUrls = await Promise.all(
            data.map(async (announcement: any) => {
              if (announcement.featureImageUrl) {
                try {
                  const res = await fetch(
                    `/api/files/signed-url?key=${encodeURIComponent(announcement.featureImageUrl)}`
                  );
                  const signed = await res.json();
                  return {
                    ...announcement,
                    signedFeatureImageUrl: signed.url
                  };
                } catch (error) {
                  console.error('Error fetching signed URL for announcement:', error);
                  return announcement;
                }
              }
              return announcement;
            })
          );
          
          setAnnouncements(announcementsWithSignedUrls)
        } else {
          console.error('Announcements API error:', response.status)
        }
      } catch (error) {
        console.error('Error fetching announcements:', error)
      } finally {
        setAnnouncementsLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  // Fetch testimonials
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
       
        const response = await fetch('/api/testimonials/landing')
       
        if (response.ok) {
          const data = await response.json()
       
          
          // Fetch signed URLs for testimonial images
          const testimonialsWithSignedUrls = await Promise.all(
            data.map(async (testimonial: any) => {
              if (testimonial.profile_picture) {
                try {
                  const res = await fetch(
                    `/api/files/signed-url?key=${encodeURIComponent(testimonial.profile_picture)}`
                  );
                  const signed = await res.json();
                  return {
                    ...testimonial,
                    signedProfilePicture: signed.url
                  };
                } catch (error) {
                  console.error('Error fetching signed URL for testimonial:', error);
                  return testimonial;
                }
              }
              return testimonial;
            })
          );
          
          setTestimonials(testimonialsWithSignedUrls)
        } else {
          console.error('Testimonials API error:', response.status)
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error)
      } finally {
        setTestimonialsLoading(false)
      }
    }
    fetchTestimonials()
  }, [])

  // Fetch lecture panel members
  useEffect(() => {
    const fetchLecturePanel = async () => {
      try {
     
        const response = await fetch('/api/team/landing')
       
        if (response.ok) {
          const data = await response.json()
       
          
          // Fetch signed URLs for lecture panel avatars
          const lecturePanelWithSignedUrls = await Promise.all(
            data.map(async (member: any) => {
              // Prioritize profile_picture over avatar
              const imageKey = member.profile_picture || member.avatar;
              
              if (imageKey) {
                try {
                  const res = await fetch(
                    `/api/files/signed-url?key=${encodeURIComponent(imageKey)}`
                  );
                  const signed = await res.json();
                  return {
                    ...member,
                    signedAvatar: signed.url
                  };
                } catch (error) {
                  console.error('Error fetching signed URL for lecture panel member:', error);
                  return member;
                }
              }
              return member;
            })
          );
          
          setLecturePanel(lecturePanelWithSignedUrls)
        } else {
          console.error('Lecture panel API error:', response.status)
        }
      } catch (error) {
        console.error('Error fetching lecture panel:', error)
      } finally {
        setLecturePanelLoading(false)
      }
    }
    fetchLecturePanel()
  }, [])

  // Auto-slide testimonials
  useEffect(() => {
    if (testimonials.length > 1) {
      const interval = setInterval(() => {
        setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [testimonials.length])

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
      'training-programs',
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



  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-custom-2db247 to-custom-2596be z-[100] origin-left"
        style={{ scaleX: scaleX }}
      />

      {/* Dynamic Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, 60, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-custom-8f1e22/10 dark:bg-custom-8f1e22/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 80, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-custom-2596be/10 dark:bg-custom-2596be/20 rounded-full blur-[120px]"
        />
      </div>

      <motion.main className="min-h-screen bg-[#f4f6fb] text-slate-900 transition-colors dark:bg-[#040714] dark:text-white">
        {/* Dynamic Navbar - fetches customizations from admin panel */}
        <LandingNavbar />

        {/* Modern Hero Section - Inspired by Reference Design */}
        <section className="relative bg-white dark:bg-slate-900 overflow-hidden">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                {/* Trust Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                >
                  <Shield className="h-4 w-4" />
                  Government Registered • TVEC P03/0174 • SLFEB Approved
                </motion.div>

                {/* Main Headline */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                    Launch Your Global
                    <span className="block text-teal-600 dark:text-teal-400">Career in Caregiving</span>
                  </h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed"
                  >
                    Specialized 45-Day training for Israel, Japan, and Europe. Get internationally recognized qualifications from Sri Lanka's premier caregiving academy in Bandaragama.
                  </motion.p>
                </motion.div>

                {/* Star Rating */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">4.9 Rating</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">(500+ Reviews)</span>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Button
                    onClick={() => {
                      setSelectedAnnouncement({ title: 'Custom Inquiry' })
                      setShowInquiryModal(true)
                    }}
                    className="h-14 px-8 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2"
                  >
                    Apply Now
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                 
                </motion.div>
              </motion.div>

              {/* Right Side - Professional Caregivers Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 p-8">
                  {/* Professional Caregivers Image Placeholder */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-teal-100 to-blue-100 dark:from-teal-800/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center relative overflow-hidden">
                    {/* Healthcare Professionals Image */}
                    <img
                      src="/images/HelpLineAcademyLogo25.png"
                      alt="Healthcare Professionals"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    
                    {/* Floating badge */}
                    <motion.div
                      animate={{ y: [-5, 5, -5] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute top-4 right-4 bg-white dark:bg-slate-800 rounded-xl px-3 py-1 shadow-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500 fill-current" />
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">4.9</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section - Three Column Layout */}
        <section className="bg-white dark:bg-slate-900 px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Why Choose <span className="text-teal-600 dark:text-teal-400">Help Line Academy?</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                We provide comprehensive training and support to ensure your success in the global caregiving industry.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                  <Activity className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Practical Training</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Hands-on experience with real medical equipment and patient care scenarios. Master essential caregiving skills through practice.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Globe className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">International Placements</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Specialized training for Israel, Japan, and Europe. Get internationally recognized qualifications for global career opportunities.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Expert Instructors</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Learn from qualified doctors and experienced nursing staff. Get personalized guidance from industry professionals.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="bg-teal-50 dark:bg-slate-800 px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Our Achievements
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Numbers that speak to our commitment and excellence
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Stat 1 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <div className="text-4xl sm:text-5xl font-bold text-teal-600 dark:text-teal-400 mb-2">1000+</div>
                <div className="text-sm sm:text-base font-medium text-slate-900 dark:text-white">Students</div>
              </motion.div>

              {/* Stat 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-center"
              >
                <div className="text-4xl sm:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">SLFEB</div>
                <div className="text-sm sm:text-base font-medium text-slate-900 dark:text-white">Approved</div>
              </motion.div>

              {/* Stat 3 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center"
              >
                <div className="text-4xl sm:text-5xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">TVEC</div>
                <div className="text-sm sm:text-base font-medium text-slate-900 dark:text-white">Registered</div>
              </motion.div>

              {/* Stat 4 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-center"
              >
                <div className="text-4xl sm:text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">45</div>
                <div className="text-sm sm:text-base font-medium text-slate-900 dark:text-white">Day Program</div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why Choose Help Line Academy Section */}
        <section id="why-choose-us" className="bg-gradient-to-b from-[#f9fbff] to-[#eef2ff] px-4 py-16 dark:from-[#030714] dark:to-[#050c1d] sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-8 sm:mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600 dark:text-red-400 sm:text-sm sm:tracking-[0.4em]">Why Choose Us</p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-4xl sm:mt-4 lg:text-5xl xl:text-6xl">
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
      </motion.main>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <section id="announcements" className="bg-gradient-to-b from-[#f4f6fb] to-[#eef2ff] px-4 py-16 dark:from-[#030714] dark:to-[#050c1d] sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-8 sm:mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0d9488] dark:text-[#7bffde] sm:text-sm sm:tracking-[0.4em]">Announcements</p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl sm:mt-4 lg:text-4xl xl:text-5xl">
                Upcoming Events & Activities
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-white/70 max-w-3xl mx-auto sm:mt-4 sm:text-base lg:text-lg">
                Stay informed about upcoming events, training programs, and important announcements.
              </p>
            </div>

            {announcementsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d9488]"></div>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {announcements
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice((announcementsPage - 1) * itemsPerPage, announcementsPage * itemsPerPage)
                  .map((announcement) => (
                    <div
                      key={announcement._id}
                      className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-2 hover:border-[#7bffde]/30 hover:shadow-[0_12px_40px_rgba(123,255,222,0.15)] dark:border-white/20 dark:bg-gradient-to-br dark:from-[#0f1329] dark:via-[#151c3d] dark:to-[#0a1f3b] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] dark:hover:border-[#7bffde]/40"
                    >
                      <div className="aspect-video relative mb-4 rounded-xl overflow-hidden">
                        <Image
                          src={getProxiedImageUrl(announcement.featureImageUrl, announcement.signedFeatureImageUrl)}
                          alt={announcement.title}
                          fill
                          unoptimized={shouldUnoptimize(announcement.featureImageUrl)}
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#0d9488] dark:group-hover:text-[#7bffde] transition-colors">
                          {announcement.title}
                        </h3>

                        <p className="text-sm text-slate-600 dark:text-white/80 line-clamp-3 italic text-pink-600 dark:text-pink-400">
                          "{announcement.description}"
                        </p>

                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-white/60">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(announcement.happeningDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAnnouncement(announcement)
                            setShowInquiryModal(true)
                          }}
                          className="w-full bg-[#0d9488] dark:bg-[#7bffde] text-white dark:text-slate-900 hover:bg-[#0f766e] dark:hover:bg-[#62f5cf] transition-colors h-10 px-4 py-2 rounded-md flex items-center justify-center font-medium text-sm"
                        >
                          Inquire Now
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Pagination for Announcements */}
            {announcements.length > itemsPerPage && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAnnouncementsPage(prev => Math.max(1, prev - 1))}
                  disabled={announcementsPage === 1}
                  className="rounded-full border-[#0d9488] text-[#0d9488] hover:bg-[#0d9488] hover:text-white dark:border-[#7bffde] dark:text-[#7bffde] dark:hover:bg-[#7bffde] dark:hover:text-slate-900"
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </Button>
                <div className="flex items-center gap-2">
                  {[...Array(Math.ceil(announcements.length / itemsPerPage))].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setAnnouncementsPage(i + 1)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${announcementsPage === i + 1
                        ? 'bg-[#0d9488] dark:bg-[#7bffde] w-6'
                        : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAnnouncementsPage(prev => Math.min(Math.ceil(announcements.length / itemsPerPage), prev + 1))}
                  disabled={announcementsPage === Math.ceil(announcements.length / itemsPerPage)}
                  className="rounded-full border-[#0d9488] text-[#0d9488] hover:bg-[#0d9488] hover:text-white dark:border-[#7bffde] dark:text-[#7bffde] dark:hover:bg-[#7bffde] dark:hover:text-slate-900"
                >
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </Button>
              </div>
            )}

            {announcements.length >= 6 && (
              <div className="text-center mt-12">
                <Link
                  href="/announcements"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-[#0d9488] text-[#0d9488] hover:bg-[#0d9488] hover:text-white dark:border-[#7bffde] dark:text-[#7bffde] dark:hover:bg-[#7bffde] dark:hover:text-slate-900 h-10 px-4 py-2"
                >
                  View All Announcements
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Lecture Panel Section */}
      {lecturePanelLoading ? (
        <section id="lecture-panel" className="bg-gradient-to-b from-[#f4f6fb] to-[#eef2ff] px-4 py-16 dark:from-[#030714] dark:to-[#050c1d] sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-8 sm:mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600 dark:text-red-400 sm:text-sm sm:tracking-[0.4em]">Our Experts</p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl sm:mt-4 lg:text-4xl xl:text-5xl">
                Lecture Panel
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-white/70 max-w-3xl mx-auto">
                Learn from highly qualified professionals with years of experience in the healthcare industry.
              </p>
            </div>
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          </div>
        </section>
      ) : lecturePanel.length > 0 ? (
        <section id="lecture-panel" className="bg-gradient-to-b from-[#f4f6fb] to-[#eef2ff] px-4 py-16 dark:from-[#030714] dark:to-[#050c1d] sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-8 sm:mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600 dark:text-red-400 sm:text-sm sm:tracking-[0.4em]">Our Experts</p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl sm:mt-4 lg:text-4xl xl:text-5xl">
                Lecture Panel
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-white/70 max-w-3xl mx-auto">
                Learn from highly qualified professionals with years of experience in the healthcare industry.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {lecturePanel.map((member: any) => (
                <div
                  key={member._id}
                  className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_25px_55px_rgba(15,23,42,0.08)] dark:border-white/20 dark:bg-gradient-to-br dark:from-[#0f1329] dark:via-[#151c3d] dark:to-[#0a1f3b] dark:shadow-[0_35px_65px_rgba(0,0,0,0.6)]"
                >
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden shadow-lg border-2 border-white dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      {member.signedAvatar ? (
                        <Image
                          src={member.signedAvatar}
                          alt={`${member.firstName} ${member.lastName}`}
                          fill
                          unoptimized={shouldUnoptimize(member.profile_picture || member.avatar)}
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-10 w-10 text-slate-400 dark:text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                        {member.firstName} {member.lastName}
                      </h3>
                      <p className="text-sm font-medium text-[#0d9488] dark:text-[#7bffde] uppercase tracking-wider">
                        {member.role === 'lecturer' ? 'Senior Lecturer' : member.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-base text-slate-600 dark:text-white/80 leading-relaxed">
                    {member.description || 'Professional faculty member at Help Line Academy.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section id="lecture-panel" className="bg-gradient-to-b from-[#f4f6fb] to-[#eef2ff] px-4 py-16 dark:from-[#030714] dark:to-[#050c1d] sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-8 sm:mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600 dark:text-red-400 sm:text-sm sm:tracking-[0.4em]">Our Experts</p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl sm:mt-4 lg:text-4xl xl:text-5xl">
                Lecture Panel
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-white/70 max-w-3xl mx-auto">
                Learn from highly qualified professionals with years of experience in the healthcare industry.
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg text-slate-600 dark:text-white/70">No lecture panel members available at the moment.</p>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonialsLoading ? (
        <section id="testimonials" className="bg-gradient-to-b from-[#eef2ff] to-[#f4f6fb] px-4 py-16 dark:from-[#050c1d] dark:to-[#030714] sm:px-6 sm:py-20 lg:py-28 overflow-hidden">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-600 dark:text-pink-400 sm:text-sm sm:tracking-[0.4em]">Testimonials</p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl sm:mt-4 lg:text-4xl xl:text-5xl">
                What Our Students Say
              </h2>
            </div>
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
          </div>
        </section>
      ) : testimonials.length > 0 ? (
        <section id="testimonials" className="bg-gradient-to-b from-[#eef2ff] to-[#f4f6fb] px-4 py-16 dark:from-[#050c1d] dark:to-[#030714] sm:px-6 sm:py-20 lg:py-28 overflow-hidden">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-600 dark:text-pink-400 sm:text-sm sm:tracking-[0.4em]">Testimonials</p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl sm:mt-4 lg:text-4xl xl:text-5xl">
                What Our Students Say
              </h2>
            </div>

            <div className="relative">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonialIndex * 100}%)` }}
              >
                {testimonials.map((testimonial: any) => (
                  <div key={testimonial._id} className="w-full flex-shrink-0 px-4">
                    <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 md:p-12 shadow-[0_25px_55px_rgba(15,23,42,0.08)] dark:border-white/20 dark:bg-gradient-to-br dark:from-[#0f1329] dark:via-[#151c3d] dark:to-[#0a1f3b] dark:shadow-[0_35px_65px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center gap-8 md:gap-12 min-h-[300px]">
                      <div className="w-full md:w-[30%] flex-shrink-0">
                        <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/50 dark:ring-slate-800/50">
                          <Image
                            src={getProxiedImageUrl(testimonial.profile_picture, testimonial.signedProfilePicture)}
                            alt={testimonial.name}
                            fill
                            unoptimized={shouldUnoptimize(testimonial.profile_picture)}
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="w-full md:w-[70%] space-y-6 text-left">
                        <Quote className="h-10 w-10 text-pink-500/20" />
                        <p className="text-xl md:text-2xl text-slate-700 dark:text-white/90 italic leading-relaxed font-medium">
                          "{testimonial.message}"
                        </p>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                            {testimonial.name}
                          </h4>
                          <p className="text-sm font-medium text-pink-600 dark:text-pink-400 uppercase tracking-[0.2em] mt-1">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Slider Dots */}
              <div className="flex justify-center gap-3 mt-12">
                {testimonials.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTestimonialIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${currentTestimonialIndex === idx
                      ? 'bg-pink-600 dark:bg-pink-400 w-8'
                      : 'bg-slate-300 dark:bg-slate-700 w-2.5'
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section id="testimonials" className="bg-gradient-to-b from-[#eef2ff] to-[#f4f6fb] px-4 py-16 dark:from-[#050c1d] dark:to-[#030714] sm:px-6 sm:py-20 lg:py-28 overflow-hidden">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-600 dark:text-pink-400 sm:text-sm sm:tracking-[0.4em]">Testimonials</p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl sm:mt-4 lg:text-4xl xl:text-5xl">
                What Our Students Say
              </h2>
            </div>
            <div className="text-center">
              <p className="text-lg text-slate-600 dark:text-white/70">No testimonials available at the moment.</p>
            </div>
          </div>
        </section>
      )}

      {/* Inquiry Modal */}
      <Dialog open={showInquiryModal} onOpenChange={setShowInquiryModal}>
        <DialogContent className="max-w-[620px] w-full p-[24px_28px] rounded-[12px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] border-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-[4%] data-[state=open]:slide-in-from-top-[4%] dark:bg-slate-900 overflow-y-auto max-h-[90vh] transition-all duration-150 ease-out">
          <DialogHeader className="mb-[24px] text-left">
            <span className="text-[12px] tracking-[0.08em] text-[#6B7280] font-semibold uppercase block mb-[4px]">INQUIRE ABOUT</span>
            <DialogTitle className="text-[20px] font-semibold text-[#111827] dark:text-white mt-0">{selectedAnnouncement?.title || 'Custom Inquiry'}</DialogTitle>
          </DialogHeader>

          <InquiryForm
            announcementTitle={selectedAnnouncement?.title || 'Custom Inquiry'}
            onSuccess={() => {
              setShowInquiryModal(false)
              setSelectedAnnouncement(null)
            }}
            onCancel={() => {
              setShowInquiryModal(false)
              setSelectedAnnouncement(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {orgLoading ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 shadow-lg">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                ) : organization?.logo ? (
                  <div className="h-8 w-8 flex items-center justify-center">
                    <OrganizationLogo 
                      lightLogo={organization.logo}
                      darkLogo={organization.darkLogo}
                      logoMode={organization.logoMode}
                      fallbackText="HL"
                      size="md"
                      className="rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 shadow-lg">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                )}
                <span className="text-xl font-bold">{organization?.name || 'Help Line Academy'}</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {organization?.description || 'Government-registered vocational training institute specializing in healthcare education.'}
                {organization?.name === 'Help Line Academy' && (
                  <>
                    {' '}TVEC Reg No: P03/0174 • SLFEB Approved.
                  </>
                )}
              </p>
              <div className="flex space-x-4">
                <a href="/about" className="text-slate-400 hover:text-red-400 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="/about" className="text-slate-400 hover:text-red-400 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="/about" className="text-slate-400 hover:text-red-400 transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </a>
                <a href="/about" className="text-slate-400 hover:text-red-400 transition-colors">
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="text-slate-300 hover:text-red-400 transition-colors">About Us</a></li>
               
              </ul>
            </div>

         {/* Our Courses */}
<div className="space-y-4">
  <h3 className="text-lg font-semibold">Our Courses</h3>

  <ul className="space-y-2 text-sm">
    
    <li>
      <details className="group">
        <summary className="cursor-pointer list-none flex justify-between items-center text-slate-300 hover:text-red-400 transition">
          Caregiver NVQ Level 3
          <span className="transition-transform group-open:rotate-180">▼</span>
        </summary>
        <p className="text-xs text-slate-500 mt-1">
          Entry-level caregiving skills with practical training
        </p>
        <div className="text-xs text-slate-400 mt-2 border-l-2 border-red-400 pl-3">
          Includes patient care basics, hygiene, communication skills, and practical sessions.
        </div>
      </details>
    </li>

    <li>
      <details className="group">
        <summary className="cursor-pointer list-none flex justify-between items-center text-slate-300 hover:text-red-400 transition">
          Caregiver NVQ Level 4
          <span className="transition-transform group-open:rotate-180">▼</span>
        </summary>
        <p className="text-xs text-slate-500 mt-1">
          Advanced patient care and supervision skills
        </p>
        <div className="text-xs text-slate-400 mt-2 border-l-2 border-red-400 pl-3">
          Covers advanced caregiving, medication handling, and supervision techniques.
        </div>
      </details>
    </li>

    <li>
      <details className="group">
        <summary className="cursor-pointer list-none flex justify-between items-center text-slate-300 hover:text-red-400 transition">
          Israel Caregiver Course
          <span className="transition-transform group-open:rotate-180">▼</span>
        </summary>
        <p className="text-xs text-slate-500 mt-1">
          Specialized training for overseas caregiver opportunities
        </p>
        <div className="text-xs text-slate-400 mt-2 border-l-2 border-red-400 pl-3">
          Includes language basics, cultural training, and international caregiving standards.
        </div>
      </details>
    </li>

    <li>
      <details className="group">
        <summary className="cursor-pointer list-none flex justify-between items-center text-slate-300 hover:text-red-400 transition">
          First Aid & BLS
          <span className="transition-transform group-open:rotate-180">▼</span>
        </summary>
        <p className="text-xs text-slate-500 mt-1">
          Emergency response and life-saving techniques
        </p>
        <div className="text-xs text-slate-400 mt-2 border-l-2 border-red-400 pl-3">
          Learn CPR, AED usage, and emergency response procedures.
        </div>
      </details>
    </li>

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
        </div>
      </footer>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-600/30 transition-all duration-300 hover:shadow-xl hover:shadow-teal-600/50 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 dark:shadow-teal-600/20 dark:hover:shadow-teal-600/30"
            aria-label="Back to top"
          >
            <ChevronUp className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

    </>
  )
}
