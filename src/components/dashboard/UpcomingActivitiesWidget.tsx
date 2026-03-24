'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, BookOpen, FileText, AlertCircle, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface ActivityItem {
  id: string
  title: string
  type: 'CLASS' | 'QUIZ' | 'ASSIGNMENT'
  courseName: string
  date: Date
  status: 'UPCOMING' | 'TODAY' | 'OVERDUE'
  roleScope: 'STUDENT' | 'TEACHER' | 'ADMIN'
  description?: string
  batchName?: string
  groupName?: string
  unitId?: string
  quizId?: string
  assignmentId?: string
}

interface UpcomingActivitiesWidgetProps {
  userRole: string
  className?: string
}

export function UpcomingActivitiesWidget({ userRole, className = '' }: UpcomingActivitiesWidgetProps) {
  const router = useRouter()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'CLASS' | 'QUIZ' | 'ASSIGNMENT'>('ALL')
  const [error, setError] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/activities')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      } else {
        setError('Failed to load activities')
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      setError('Failed to load activities')
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = activities.filter(activity => 
    filter === 'ALL' || activity.type === filter
  )

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getActivitiesForDate = (date: Date) => {
    return filteredActivities.filter(activity => {
      const activityDate = new Date(activity.date)
      return activityDate.toDateString() === date.toDateString()
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1)
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1)
      }
      return newMonth
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CLASS':
        return <Calendar className="h-3 w-3" />
      case 'QUIZ':
        return <AlertCircle className="h-3 w-3" />
      case 'ASSIGNMENT':
        return <FileText className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'CLASS':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'QUIZ':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'ASSIGNMENT':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODAY':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'OVERDUE':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActivityTooltip = (activity: ActivityItem) => {
    if (activity.type === 'CLASS') {
      const parts = [
        activity.batchName ? `Batch: ${activity.batchName}` : null,
        activity.courseName ? `Course: ${activity.courseName}` : null,
        activity.groupName ? `Group: ${activity.groupName}` : null,
      ].filter(Boolean)

      if (parts.length > 0) {
        return parts.join(' | ')
      }
    }

    return activity.title
  }

  const getActivityDotColor = (type: string) => {
    switch (type) {
      case 'CLASS':
        return 'bg-purple-500'
      case 'QUIZ':
        return 'bg-red-500'
      case 'ASSIGNMENT':
        return 'bg-green-500'
      default:
        return 'bg-gray-400'
    }
  }

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.type === 'QUIZ' && activity.unitId && activity.quizId) {
      router.push(`/units/view/${activity.unitId}#quiz-${activity.quizId}`)
    } else if (activity.type === 'ASSIGNMENT' && activity.unitId && activity.assignmentId) {
      router.push(`/units/view/${activity.unitId}#assignment-${activity.assignmentId}`)
    }
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []
    const today = new Date()
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-100"></div>)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const dayActivities = getActivitiesForDate(date)
      const isToday = date.toDateString() === today.toDateString()
      const isPast = date < today && !isToday
      
      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-1 overflow-hidden ${
            isToday ? 'bg-blue-50 border-blue-300' : 
            isPast ? 'bg-gray-50' : 'bg-white'
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${
              isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900'
            }`}>
              {day}
            </span>
            {dayActivities.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-1">
                {dayActivities.length}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {dayActivities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {dayActivities.slice(0, 6).map((activity, idx) => (
                  <div
                    key={activity.id ?? idx}
                    className={`w-2.5 h-2.5 rounded-full border border-white shadow-sm ${
                      (activity.type === 'QUIZ' || activity.type === 'ASSIGNMENT') && activity.unitId
                        ? 'cursor-pointer hover:scale-105 transition-transform'
                        : 'cursor-default'
                    }`}
                    title={getActivityTooltip(activity)}
                    onClick={() =>
                      (activity.type === 'QUIZ' || activity.type === 'ASSIGNMENT') && activity.unitId
                        ? handleActivityClick(activity)
                        : undefined
                    }
                    style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.05)' }}
                  >
                    <div className={`w-full h-full rounded-full ${getActivityDotColor(activity.type)}`}></div>
                  </div>
                ))}
                {dayActivities.length > 6 && (
                  <span className="text-[10px] text-gray-500 ml-1">+{dayActivities.length - 6} more</span>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }
    
    return days
  }

  const monthYearString = currentMonth.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Academic Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="h-8 bg-gray-100 animate-pulse"></div>
            ))}
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Academic Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="ALL">All</option>
              <option value="CLASS">Classes</option>
              <option value="QUIZ">Quizzes</option>
              <option value="ASSIGNMENT">Assignments</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchActivities} size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <h3 className="text-lg font-semibold">{monthYearString}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 bg-gray-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {renderCalendar()}
              </div>
            </div>

            {/* Activity Legend */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
                <span>Classes</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                <span>Quizzes</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span>Assignments</span>
              </div>
            </div>

            {/* Today's Highlight */}
            {getActivitiesForDate(new Date()).length > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <h3 className="font-semibold text-red-800">🔥 Happening Today</h3>
                </div>
                <div className="space-y-2">
                  {getActivitiesForDate(new Date()).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-2 text-sm">
                      <div className={`p-1 rounded ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <span className="text-red-700" title={getActivityTooltip(activity)}>
                        {activity.title}
                      </span>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
