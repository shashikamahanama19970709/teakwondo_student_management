'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useTheme } from 'next-themes'
import { useOrganization } from '@/hooks/useOrganization'
import {
  ArrowLeft,
  Zap,
  Moon,
  Sun,
  Shield,
  Users,
  Globe,
  Heart,
  Code,
  Target,
  Facebook,
  Linkedin,
  MessageCircle,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

export default function AboutPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
   const { organization } = useOrganization()

   const orgName = organization?.name || 'Help Line Academy'
   const orgDescription = organization?.description ||
     "We are a vocational training institute dedicated to high-quality healthcare education and practical, real-world skills."
   const orgVision = organization?.vision ||
     'To empower caregivers and healthcare professionals with world-class training and global opportunities.'
   const orgMission = organization?.mission ||
     'Provide accessible, industry-aligned education that prepares students for meaningful careers in caregiving and healthcare.'

  const contact = organization?.contactInfo

  const getMapEmbedSrc = () => {
     if (!contact?.mapLocationUrl) return ''

     try {
       const url = new URL(contact.mapLocationUrl)

       // If it's already an embed URL, use it as-is
       if (url.hostname.includes('google.') && url.pathname.startsWith('/maps/embed')) {
         return contact.mapLocationUrl
       }
     } catch {
       // Ignore parse errors and fall back to q-based embed
     }

     // Prefer embedding by physical address when available
     if (contact?.address) {
       return `https://www.google.com/maps?q=${encodeURIComponent(contact.address)}&output=embed`
     }

     // Fallback: use the raw URL as a query parameter for embed
     return `https://www.google.com/maps?q=${encodeURIComponent(contact.mapLocationUrl)}&output=embed`
   }

   const getMapDirectionsUrl = () => {
     if (!contact?.showMapLocation) return ''

     // Build a directions URL without origin so Google uses the user's current location
     if (contact.address) {
       return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address)}`
     }

     if (contact.mapLocationUrl) {
       // Use whatever was provided as the destination query
       return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.mapLocationUrl)}`
     }

     return ''
   }

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="min-h-screen bg-[#f4f6fb] text-slate-900 dark:bg-[#040714] dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-[#040714]/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <button
              onClick={() => router.push('/landing')}
              className="flex items-center gap-2 text-xl font-bold cursor-pointer group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7bffde] to-[#7afdea] shadow-lg shadow-[#7bffde]/30">
                <Zap className="h-5 w-5 text-slate-900" />
              </div>
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-white/80 bg-clip-text text-transparent">
                Help Line Academy
              </span>
            </button>
          </div>
          
          {mounted && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 dark:border-white/20 dark:bg-white/5">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-white/70'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-white text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 dark:text-white/70'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                Dark
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f4f8ff] via-[#ffffff] to-[#e8eeff] dark:from-[#050c1d] dark:via-[#0a1030] dark:to-[#071328]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-white/80 bg-clip-text text-transparent">
              About {orgName}
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 dark:text-white/80 max-w-2xl mx-auto">
            {orgDescription}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-slate-600 dark:text-white/80 mb-6 leading-relaxed">
                {orgMission}
              </p>
              <div className="mt-8">
                <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
                <p className="text-lg text-slate-600 dark:text-white/80 leading-relaxed">
                  {orgVision}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                {
                  icon: <Shield className="h-8 w-8 text-[#0d9488] dark:text-[#7bffde]" />,
                  title: 'Practical Training',
                  desc: 'Hands-on skills labs and real healthcare scenarios that prepare you for patient care from day one.'
                },
                {
                  icon: <Users className="h-8 w-8 text-[#6366f1]" />,
                  title: 'Expert Instructors',
                  desc: 'Experienced doctors, nurses and industry professionals guiding you through every step of your journey.'
                },
                {
                  icon: <Globe className="h-8 w-8 text-[#d946ef]" />,
                  title: 'Global Pathways',
                  desc: 'Training aligned with local and international standards to help you access overseas job opportunities.'
                },
                {
                  icon: <Heart className="h-8 w-8 text-[#f43f5e]" />,
                  title: 'Compassionate Care',
                  desc: 'We teach not only clinical skills, but also empathy, dignity and respect for every patient.'
                }
              ].map((item) => (
                <div key={item.title} className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:border-[#7bffde]/30 dark:border-white/10 dark:bg-[#0f1329] dark:hover:border-[#7bffde]/40 dark:hover:shadow-[0_20px_40px_rgba(123,255,222,0.15)]">
                  {item.icon}
                  <h3 className="mt-4 font-bold group-hover:text-[#0d9488] dark:group-hover:text-[#7bffde] transition-colors">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-white/70">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="px-6 py-16 bg-white dark:bg-[#0a1020]">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Target className="h-10 w-10 text-[#0d9488] dark:text-[#7bffde]" />,
                title: 'Excellence in Training',
                description: 'Structured healthcare curricula, continuous assessments and mentoring to ensure every student is job-ready and confident.'
              },
              {
                icon: <Users className="h-10 w-10 text-[#6366f1]" />,
                title: 'Compassion & Respect',
                description: 'We nurture caregivers who treat every patient and family with kindness, cultural sensitivity and human dignity.'
              },
              {
                icon: <Shield className="h-10 w-10 text-[#d946ef]" />,
                title: 'Patient Safety & Ethics',
                description: 'Clinical practice rooted in international safety guidelines, ethical standards and professional responsibility.'
              }
            ].map((value) => (
              <div key={value.title} className="group text-center p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f1329] transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:border-[#7bffde]/30 dark:hover:border-[#7bffde]/40 dark:hover:shadow-[0_20px_40px_rgba(123,255,222,0.15)]">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-white/10 mb-6 group-hover:scale-110 transition-transform">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-[#0d9488] dark:group-hover:text-[#7bffde] transition-colors">{value.title}</h3>
                <p className="text-slate-600 dark:text-white/70 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Location Section */}
      <section className="px-6 py-16 bg-gradient-to-b from-[#f4f8ff] via-white to-[#e8eeff] dark:from-[#050c1d] dark:via-[#050918] dark:to-[#040714]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-teal-600 dark:text-teal-300">Visit & Connect</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Contact & Location</h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-white/70 max-w-2xl mx-auto">
              Reach out to us for course information, enrollment support or partnership opportunities. We are here to guide your healthcare career.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
            <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-md px-6 py-6 sm:px-8 sm:py-8 shadow-sm dark:border-white/10 dark:bg-[#050918]/90">
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-semibold">Get in Touch</h3>
                <p className="text-sm text-slate-600 dark:text-white/70">
                  Choose the channel that works best for you. Our team will respond as quickly as possible.
                </p>
              </div>

              <div className="space-y-4 text-sm">
                {contact?.showAddress && contact.address && (
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-3 py-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-300">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <p className="text-slate-700 dark:text-white/80 whitespace-pre-line break-words">
                      {contact.address}
                    </p>
                  </div>
                )}

                {contact?.showMobile && contact.mobile && (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-300">
                      <Phone className="h-4 w-4" />
                    </div>
                    <a
                      href={`tel:${contact.mobile}`}
                      className="text-slate-700 dark:text-white/80 hover:text-teal-600 dark:hover:text-teal-300 transition-colors break-words"
                    >
                      {contact.mobile}
                    </a>
                  </div>
                )}

                {contact?.showLandphone && contact.landphone && (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-300">
                      <Phone className="h-4 w-4" />
                    </div>
                    <a
                      href={`tel:${contact.landphone}`}
                      className="text-slate-700 dark:text-white/80 hover:text-teal-600 dark:hover:text-teal-300 transition-colors break-words"
                    >
                      {contact.landphone}
                    </a>
                  </div>
                )}

                {contact?.showEmail && contact.email && (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-300">
                      <Mail className="h-4 w-4" />
                    </div>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-slate-700 dark:text-white/80 hover:text-teal-600 dark:hover:text-teal-300 transition-colors break-words"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}

                {(contact?.showFacebook && contact.facebookUrl) ||
                (contact?.showLinkedin && contact.linkedinUrl) ||
                (contact?.showWhatsapp && contact.whatsapp) ? (
                  <div className="pt-3 border-t border-slate-100 dark:border-white/10 mt-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
                      Social Links
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {contact?.showFacebook && contact.facebookUrl && (
                        <a
                          href={contact.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-white/80 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
                        >
                          <Facebook className="h-4 w-4" />
                          Facebook
                        </a>
                      )}

                      {contact?.showLinkedin && contact.linkedinUrl && (
                        <a
                          href={contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-white/80 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </a>
                      )}

                      {contact?.showWhatsapp && contact.whatsapp && (
                        <a
                          href={contact.whatsapp.startsWith('http') ? contact.whatsapp : `https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-white/80 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {contact?.showMapLocation && contact.mapLocationUrl && (
              <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-[#050918] overflow-hidden shadow-md flex flex-col">
                <div className="h-64 sm:h-80 w-full">
                  <iframe
                    src={getMapEmbedSrc()}
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    aria-label="Organization location on Google Maps"
                  />
                </div>
                <div className="border-t border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#050918] px-4 py-3 flex justify-end">
                  <a
                    href={getMapDirectionsUrl() || contact.mapLocationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-medium text-teal-700 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200 underline-offset-2 hover:underline"
                  >
                    Open directions in Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      
    </main>
  )
}

