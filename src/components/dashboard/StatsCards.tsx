'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { FolderOpen, CheckSquare, Users, TrendingUp, TrendingDown } from 'lucide-react'
import { usePermissions } from '@/lib/permissions/permission-hooks'
import { Permission } from '@/lib/permissions/permission-definitions'

interface StatsCardsProps {
  stats?: {
    activeProjects: number
    completedTasks: number
    teamMembers: number
    hoursTracked: number
    projectsCount: number
    tasksCount: number
    timeEntriesCount: number
  }
  changes?: {
    activeProjects: number
    completedTasks: number
    teamMembers: number
    hoursTracked: number
  }
  isLoading?: boolean
}

export function StatsCards({ stats, changes, isLoading }: StatsCardsProps) {
  const { hasPermission } = usePermissions()

  const changeChipStyles = {
    positive: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    negative: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
    neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
  }

  const cardThemes = [
    {
      gradient: 'from-sky-50/90 via-white to-white',
      beam: 'from-sky-500/25 via-transparent to-transparent',
      iconBg: 'bg-sky-500/10 text-sky-700'
    },
    {
      gradient: 'from-emerald-50/90 via-white to-white',
      beam: 'from-emerald-500/25 via-transparent to-transparent',
      iconBg: 'bg-emerald-500/10 text-emerald-700'
    },
    {
      gradient: 'from-indigo-50/90 via-white to-white',
      beam: 'from-indigo-500/20 via-transparent to-transparent',
      iconBg: 'bg-indigo-500/10 text-indigo-700'
    },
    {
      gradient: 'from-amber-50/90 via-white to-white',
      beam: 'from-amber-500/20 via-transparent to-transparent',
      iconBg: 'bg-amber-500/10 text-amber-700'
    }
  ]

  const formatChange = (change: number, _previousValue: number, isDuration: boolean = false) => {
    if (change === 0) {
      return null // Return null to hide change indicator when no change
    }
    
    if (isDuration) {
      const hours = Math.floor(Math.abs(change) / 60)
      const mins = Math.floor(Math.abs(change) % 60)
      const sign = change > 0 ? '+' : '-'
      if (hours > 0) {
        return `${sign}${hours}h ${mins}m`
      }
      return `${sign}${mins}m`
    }
    
    return change > 0 ? `+${change}` : `${change}`
  }

  const getChangeType = (change: number) => {
    if (change === 0) return 'neutral'
    return change > 0 ? 'positive' : 'negative'
  }

  const getChangePercentage = (change: number, lastMonthValue: number) => {
    if (change === 0 || lastMonthValue === 0 || Math.abs(change) < 0.01) return null
    const percentage = Math.round((change / lastMonthValue) * 100)
    // Only show percentage if it's meaningful (at least 1% change)
    return Math.abs(percentage) >= 1 ? `${Math.abs(percentage)}%` : null
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-4 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-white" aria-hidden="true" />
            <CardContent className="relative space-y-4 p-0">
              <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-9 w-16 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats || !changes) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card className="rounded-2xl border border-slate-100 bg-white/90 p-4 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur-sm">
          <CardContent className="p-0 text-center text-sm text-slate-500">No data available</CardContent>
        </Card>
      </div>
    )
  }

  // Calculate last month values for percentage calculation
  const lastMonthActiveProjects = stats.activeProjects - changes.activeProjects
  const lastMonthCompletedTasks = stats.completedTasks - changes.completedTasks
  const lastMonthTeamMembers = stats.teamMembers - changes.teamMembers

  const statsData = [
    {
      title: 'Active Course Module',
      value: stats.activeProjects,
      formattedValue: stats.activeProjects.toString(),
      change: formatChange(changes.activeProjects, lastMonthActiveProjects),
      changePercentage: getChangePercentage(changes.activeProjects, lastMonthActiveProjects),
      changeType: getChangeType(changes.activeProjects),
      icon: FolderOpen,
      description: stats.activeProjects === 0 
        ? 'No active course modules. Start a new course module to begin tracking progress.'
        : stats.activeProjects === 1 
        ? '1 course module currently in progress'
        : `${stats.activeProjects} course modules currently in progress`,
      emptyMessage: 'No active course modules'
    },
    {
      title: 'Completed Lessons',
      value: stats.completedTasks,
      formattedValue: stats.completedTasks.toString(),
      change: formatChange(changes.completedTasks, lastMonthCompletedTasks),
      changePercentage: getChangePercentage(changes.completedTasks, lastMonthCompletedTasks),
      changeType: getChangeType(changes.completedTasks),
      icon: CheckSquare,
      description: stats.completedTasks === 0
        ? 'No lessons completed this month. Keep pushing forward!'
        : stats.completedTasks === 1
        ? '1 lesson completed this month'
        : `${stats.completedTasks} lessons completed this month`,
      emptyMessage: 'No completed lessons this month'
    },
    {
      title: 'Team Members',
      value: stats.teamMembers,
      formattedValue: stats.teamMembers.toString(),
      change: formatChange(changes.teamMembers, lastMonthTeamMembers),
      changePercentage: getChangePercentage(changes.teamMembers, lastMonthTeamMembers),
      changeType: getChangeType(changes.teamMembers),
      icon: Users,
      description: stats.teamMembers === 0
        ? 'No active team members. Invite members to collaborate.'
        : stats.teamMembers === 1
        ? '1 active team member'
        : `${stats.teamMembers} active team members in your organization`,
      emptyMessage: 'No team members'
    }
  ]

  // Filter out team members widget if user doesn't have permission
  const filteredStatsData = statsData.filter(stat => {
    if (stat.title === 'Team Members') {
      return hasPermission(Permission.TEAM_MEMBER_WIDGET_VIEW)
    }
    return true
  })

  // Determine grid columns based on number of cards
  const gridCols = filteredStatsData.length === 3 
    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' 
    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'

  return (
    <div className={`grid ${gridCols} gap-4 sm:gap-6`}>
      {filteredStatsData.map((stat, index) => {
        const Icon = stat.icon
        const hasChange = stat.change !== null
        const ChangeIcon = stat.changeType === 'positive' ? TrendingUp : 
                         stat.changeType === 'negative' ? TrendingDown : 
                         TrendingUp
        const isEmpty = stat.value === 0
        const theme = cardThemes[index % cardThemes.length]
        
        return (
          <Card
            key={index}
            className={`group relative overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(15,23,42,0.08)] ${isEmpty ? 'opacity-80' : ''}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} aria-hidden="true" />
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.beam}`} aria-hidden="true" />
            <CardContent className="relative p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-[13px] font-semibold tracking-[-0.01em] text-slate-600">{stat.title}</p>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className={`text-3xl sm:text-4xl font-semibold leading-none text-slate-900 ${isEmpty ? 'text-slate-400' : ''}`}>
                      {stat.formattedValue}
                    </span>
                    {hasChange ? (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${changeChipStyles[stat.changeType as keyof typeof changeChipStyles]}`}>
                        <ChangeIcon className="h-3.5 w-3.5" />
                        {stat.change}
                        {stat.changePercentage && <span className="text-[11px] opacity-80">({stat.changePercentage})</span>}
                        <span className="text-slate-500">vs last month</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                        No change vs last month
                      </span>
                    )}
                  </div>
                </div>
                <span className={`grid h-11 w-11 place-items-center rounded-full ${theme.iconBg} shadow-[0_12px_35px_rgba(15,23,42,0.12)] ring-1 ring-white/70`}>
                  <Icon className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
                </span>
              </div>

              <p className="text-sm leading-relaxed text-slate-600">
                {stat.description}
              </p>

              {isEmpty && (
                <p className="text-xs text-slate-500">{stat.emptyMessage}</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
