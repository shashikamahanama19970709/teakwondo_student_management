'use client'

import { Badge } from '@/components/ui/Badge'
import { formatToTitleCase } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useDateTime } from '@/components/providers/DateTimeProvider'
import { Progress } from '@/components/ui/Progress'
import { Calendar, Users, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RecentProjectsProps {
  projects?: any[]
  isLoading?: boolean
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900'
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900'
    case 'planning':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900'
    case 'on_hold':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900'
    case 'completed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900'
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900'
  }
}

export function RecentProjects({ projects, isLoading }: RecentProjectsProps) {
  const router = useRouter()
  const { formatDate } = useDateTime()

  // Filter and sort active projects by start date (most recent first), limit to 3
  const recentActiveProjects = projects
    ?.filter(project => project.status === 'active')
    ?.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    ?.slice(0, 3) || []

  // Calculate remaining days for active courses
  const calculateRemainingDays = (courseEndDate: string, status: string) => {
    if (status !== 'active' || !courseEndDate) return null
    
    const endDate = new Date(courseEndDate)
    const currentDate = new Date()
    const diffTime = endDate.getTime() - currentDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : null
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-white" aria-hidden="true" />
              <div className="relative space-y-3">
                <div className="h-5 w-32 bg-slate-100 rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                  <div className="h-2 w-full bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!recentActiveProjects || recentActiveProjects.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
        <Button disabled
          variant="outline"
          size="sm"
          className="border-slate-200 bg-white/90 text-slate-800 hover:bg-white"
        >
          View All
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {recentActiveProjects.map((project) => {
          // Map to strict data-binding fields
          const card = {
            courseTitle: project.name,
            moduleName: project.description,
            status: project.status,
            progressPercentage: project.progress?.completionPercentage,
            completedDays: project.progress?.completedDays,
            totalDays: project.progress?.totalDays,
            courseStartDate: project.startDate,
            courseEndDate: project.endDate,
            enrolledCount: project.enrollment?.totalEnrolled
          }

          const remainingDays = card.status === 'active' && card.courseEndDate 
            ? calculateRemainingDays(card.courseEndDate, card.status) 
            : null

          return (
            <div
              key={project._id}
              className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(15,23,42,0.08)] cursor-pointer"
              onClick={() => {}}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-white" aria-hidden="true" />
              <div className="relative space-y-3">
                {/* Course Name */}
                {card.courseTitle && (
                  <h4
                    className="text-base font-semibold text-slate-900 truncate"
                    title={card.courseTitle}
                  >
                    {card.courseTitle}
                  </h4>
                )}

                {/* Timeline */}
                {card.courseStartDate && card.courseEndDate && (
                  <div className="flex items-center text-sm text-slate-600">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {formatDate(card.courseStartDate)} – {formatDate(card.courseEndDate)}
                    </span>
                  </div>
                )}

                {/* Remaining Days */}
                {remainingDays && (
                  <div className="flex items-center text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 font-medium">
                      {remainingDays} days left
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
