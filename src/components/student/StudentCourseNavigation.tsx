'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  FileText,
  Loader2,
  AlertCircle,
  LayoutDashboard
} from 'lucide-react'

interface Unit {
  _id: string
  title: string
  description: string
  files?: any[]
  quizzes?: any[]
  assignments?: any[]
  createdAt?: string
  updatedAt?: string
}

interface Course {
  courseId: string
  courseName: string
  courseDescription: string
  groupName?: string
  badgeStatus: 'NOT_EARNED' | 'EARNED'
  enrolledAt: string
  units?: Unit[]
  unitsLoading?: boolean
  unitsError?: string
}

interface StudentCourseNavigationProps {
  collapsed: boolean
}

export function StudentCourseNavigation({ collapsed }: StudentCourseNavigationProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [expandedCourses, setExpandedCourses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    fetchStudentCourses()
  }, [])

  const fetchUnitsForCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/units/by-course/${courseId}`)
      
      if (!response.ok) {
        return []
      }
      
      const data = await response.json()
      
      return data.data || []
    } catch (error) {
      console.error(`Error fetching units for course ${courseId}:`, error)
      return []
    }
  }

  const fetchStudentCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/courses')
      
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }
      
      const data = await response.json()
     
      
      // Set initial courses data
      const initialCourses = (data.courses || []).map((course: any) => ({
        ...course,
        unitsLoading: true,
        unitsError: null,
        units: [] // Start with empty units, will be populated below
      }))
      
      setCourses(initialCourses)
      setError(null)
      
      // Fetch units for each course
      const coursesWithUnits = await Promise.all(
        initialCourses.map(async (course: Course) => {
          const units = await fetchUnitsForCourse(course.courseId)
          return {
            ...course,
            unitsLoading: false,
            units: units,
            unitsError: units.length === 0 ? 'No units available' : null
          }
        })
      )
      
      // Update courses with units
      setCourses(coursesWithUnits)
      
      // Log final results
      coursesWithUnits.forEach((course, index) => {
        console.log(`Course ${index + 1}: ${course.courseName} - ${course.units?.length || 0} units`)
      })
      
    } catch (err) {
      console.error('StudentCourseNavigation - Fetch error:', err)
      setError('Unable to load courses')
    } finally {
      setLoading(false)
    }
  }

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  if (collapsed) {
    return (
      <div className="px-2 space-y-1">
        {/* Dashboard Link */}
        <Button
          variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
          className="w-full justify-center px-2 rounded-xl"
          title="Dashboard"
          asChild
        >
          <Link href="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
          </Link>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-center px-2 rounded-xl"
          title="My Courses"
        >
          <BookOpen className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading courses...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center space-x-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="px-3 py-2">
        <div className="text-sm text-muted-foreground">
          No courses enrolled
        </div>
      </div>
    )
  }

  return (
    <div className="px-2 py-2 space-y-1">
      {/* Dashboard Link */}
      <Button
        variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
        className={cn(
          'w-full justify-start text-sm h-10 px-3 rounded-lg',
          pathname === '/dashboard' && 'bg-secondary text-secondary-foreground'
        )}
        asChild
      >
        <Link 
          href="/dashboard"
          prefetch
          onMouseEnter={() => router.prefetch('/dashboard')}
        >
          <LayoutDashboard className="h-4 w-4 mr-2 flex-shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </Link>
      </Button>
      
      <div className="px-1 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        My Courses
      </div>
      
      {courses.map((course) => {
        if (!course || !course.courseId) return null
        
        const isExpanded = expandedCourses.includes(course.courseId)
        const hasUnits = course.units && course.units.length > 0
        const isLoading = course.unitsLoading
        const hasError = course.unitsError

        return (
          <div key={course.courseId} className="space-y-1">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start text-sm h-auto py-2 px-3 rounded-lg',
                'hover:bg-muted/50'
              )}
              onClick={() => !isLoading && hasUnits && toggleCourse(course.courseId)}
              disabled={isLoading}
            >
              <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium truncate">{course.courseName || 'Untitled Course'}</div>
                <div className="text-xs text-muted-foreground ml-2">
                  {course.units?.length || 0} units
                </div>
                {course.groupName && (
                  <div className="text-xs text-muted-foreground">
                    {course.groupName}
                  </div>
                )}
                {isLoading && (
                  <div className="text-xs text-muted-foreground">
                    Loading units...
                  </div>
                )}
                {hasError && (
                  <div className="text-xs text-destructive">
                    {hasError}
                  </div>
                )}
              </div>
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              )}
              {!isLoading && hasUnits && (
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform flex-shrink-0',
                    isExpanded && 'rotate-90'
                  )}
                />
              )}
            </Button>

            {/* Units */}
            {!isLoading && hasUnits && isExpanded && (
              <div className="ml-6 space-y-1">
                {(course.units || []).map((unit) => {
                  if (!unit || !unit._id) return null
                  
                  const isActive = pathname === `/units/${unit._id}` 
                  
                  return (
                    <Button
                      key={unit._id}
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start text-sm h-8 px-3 rounded-md',
                        isActive && 'bg-secondary text-secondary-foreground'
                      )}
                      asChild
                    >
                      <Link 
                        href={`/units/view/${unit._id}`}
                        prefetch
                        onMouseEnter={() => router.prefetch(`/units/view/${unit._id}`)}
                      >
                        <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="truncate">{unit.title || 'Untitled Unit'}</span>
                      </Link>
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
