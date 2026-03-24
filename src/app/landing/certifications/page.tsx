'use client'

import { useEffect, useState } from 'react'
import { LandingNavbar } from '@/components/layout/LandingNavbar'
import { useOrganization } from '@/hooks/useOrganization'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Award, Building, Star } from 'lucide-react'

interface LandingCertification {
  _id: string
  name: string
  issuingOrganization: string
  skills?: string[]
  tags?: string[]
}

export default function LandingCertificationsPage() {
  const { organization } = useOrganization()
  const [certifications, setCertifications] = useState<LandingCertification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/certifications/landing?limit=50')
        if (!response.ok) {
          throw new Error('Failed to load certifications')
        }
        const data = await response.json()
        setCertifications(Array.isArray(data.certifications) ? data.certifications : [])
      } catch (err) {
        console.error('Error loading landing certifications:', err)
        setError('Unable to load certifications right now. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchCertifications()
  }, [])

  const orgName = organization?.name || 'Help Line Academy'

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900 transition-colors dark:bg-[#040714] dark:text-white">
      <LandingNavbar />

      <main className="mx-auto max-w-6xl px-4 pt-10 pb-16">
        <section className="mb-10 text-center">
          <Badge className="mb-4 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-[0.2em] bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800">
            Certifications
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            Launch Your Global
            <span className="block text-teal-600 dark:text-teal-400">Career in Caregiving</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Explore the certifications connected to our caregiver training programs.
            These credentials help you stand out for both local and international healthcare careers.
          </p>
        </section>

        {loading && (
          <div className="flex justify-center py-16 text-slate-600 text-sm dark:text-slate-300">
            Loading certifications...
          </div>
        )}

        {!loading && error && (
          <div className="flex justify-center py-16">
            <p className="text-sm px-4 py-3 rounded-xl bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-500/40">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && certifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Award className="h-10 w-10 text-slate-400 dark:text-slate-500 mb-3" />
            <h2 className="text-lg font-semibold mb-1 text-slate-900 dark:text-white">No certifications to show yet</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md">
              Certifications linked to our courses will appear here once they are published.
            </p>
          </div>
        )}

        {!loading && !error && certifications.length > 0 && (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {certifications.map((cert) => (
              <Card
                key={cert._id}
                className="relative overflow-hidden border border-teal-200 bg-white/95 shadow-[0_6px_20px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_35px_rgba(13,148,136,0.25)] dark:border-teal-500/40 dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-slate-950 dark:to-slate-900/90 dark:shadow-xl dark:hover:shadow-teal-500/40"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400" />
                <CardHeader className="pb-3 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                        {cert.name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-[13px] text-slate-600 leading-relaxed dark:text-slate-300/90">
                        Certification aligned with our healthcare training pathways.
                      </CardDescription>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 dark:bg-teal-900/40 dark:border-teal-500/60">
                      <Award className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <Building className="h-3.5 w-3.5 text-teal-700 dark:text-teal-300" />
                    Issuing Organization
                  </div>
                  <p className="text-[13px] text-slate-800 mb-2 dark:text-slate-100">
                    {cert.issuingOrganization}
                  </p>

                  {(cert.skills && cert.skills.length > 0) && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <Star className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                        Key Skills
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cert.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] text-emerald-800 dark:bg-slate-900/80 dark:border-emerald-400/40 dark:text-emerald-100"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(cert.tags && cert.tags.length > 0) && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <Star className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />
                        Tags
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cert.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-cyan-50 border border-cyan-200 px-2.5 py-1 text-[11px] text-cyan-800 dark:bg-slate-900/80 dark:border-cyan-400/40 dark:text-cyan-100"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
