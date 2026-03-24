'use client'

import { Calendar, Clock, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatToTitleCase } from '@/lib/utils'

interface DashboardHeaderProps {
  user: any
  onRefresh?: () => void
  isRefreshing?: boolean
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardHeader({ user, onRefresh, isRefreshing }: DashboardHeaderProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const lastLoginText = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Not available'

  const greeting = getGreeting()

  return (
    <div className="relative isolate overflow-hidden rounded-3xl border border-purple-200/50 bg-gradient-to-br from-white/90 to-purple-50/80 shadow-2xl backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-indigo-50/20 to-transparent" aria-hidden="true" />
      <div className="absolute -top-24 -left-20 h-52 w-52 rounded-full bg-purple-200/40 blur-3xl opacity-70" aria-hidden="true" />
      <div className="absolute -bottom-28 right-0 h-56 w-56 rounded-full bg-indigo-200/50 blur-3xl opacity-60" aria-hidden="true" />

      <div className="relative grid gap-4 lg:grid-cols-[1fr,auto] items-center p-4 sm:p-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/60 bg-gradient-to-r from-purple-50 to-indigo-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-purple-700 shadow-md">
            <span className="h-1 w-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-pulse" />
            Welcome back
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight bg-gradient-to-r from-purple-800 to-indigo-700 bg-clip-text text-transparent">
              {greeting}, {user?.firstName || 'there'}.
            </h1>
            <p className="text-sm text-gray-600">Ready to continue your learning journey?</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-200/60 bg-white/90 px-2 py-0.5 text-xs text-purple-800 shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-purple-600" />
              {currentDate}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-200/60 bg-white/90 px-2 py-0.5 text-xs text-purple-800 shadow-sm">
              <Clock className="h-3.5 w-3.5 text-indigo-600" />
              {currentTime}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Last login: {lastLoginText}
            </span>
            <Badge variant="secondary" className="inline-flex items-center gap-1.5 rounded-md border border-purple-200/60 bg-gradient-to-r from-purple-50 to-indigo-50 px-2 py-0.5 text-xs font-medium text-purple-800 shadow-sm">
              {user?.customRole?.name || formatToTitleCase(user?.role) || 'Team Member'}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="group border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 hover:from-purple-100 hover:to-indigo-100 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 transition-transform duration-300 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
