'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, BookOpen, FileText, Trophy, Users, FolderOpen, BarChart3 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { UpcomingActivitiesWidget } from '@/components/dashboard/UpcomingActivitiesWidget'
import { LatestQuizzesWidget } from '@/components/dashboard/LatestQuizzesWidget'
import { LatestAssignmentsWidget } from '@/components/dashboard/LatestAssignmentsWidget'
import { PageContent } from '@/components/ui/PageContent'
import { Button } from '@/components/ui/Button'
import { usePermissionContext } from '@/lib/permissions/permission-context'

interface DashboardStats {
  projectsCount: number
  tasksCount: number
  completedTasks: number
  timeEntriesCount: number
  activeProjects: number
  teamMembers: number
}

interface DashboardData {
  stats: DashboardStats
  changes?: any
}

interface RoleBasedData {
  units?: number
  assignments?: { completed: number; pending: number }
  quizzes?: { completed: number; pending: number }
  progress?: number
  totalAssignments?: number
  totalQuizzes?: number
  totalFiles?: number
  users?: { students: number; lecturers: number; teachers: number; total: number }
  batches?: { completed: number; active: number; total: number }
  courses?: { count: number; unitsCount: number; averageUnitsPerCourse: number }
  inquiries?: Record<string, number>
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('student')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [roleBasedData, setRoleBasedData] = useState<RoleBasedData | null>(null)
  const [authError, setAuthError] = useState('')
  const [dataError, setDataError] = useState('')
  const [permissionsRefreshed, setPermissionsRefreshed] = useState(false)
  const [initialPermissionCheckDone, setInitialPermissionCheckDone] = useState(false)
  const [dashboardLoaded, setDashboardLoaded] = useState(false)
  const [isAuthChecking, setIsAuthChecking] = useState(false)
  const router = useRouter()
  const { loading: permissionsLoading, error: permissionsError, permissions, refreshPermissions } = usePermissionContext()

  const loadRoleBasedData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/widgets')
      if (response.ok) {
        const data = await response.json()
        setRoleBasedData(data)
      } else {
        console.error('Failed to load role-based data')
      }
    } catch (error) {
      console.error('Failed to load role-based data:', error)
    }
  }, [])

  const loadDashboardData = useCallback(async (force = false) => {
    // Prevent multiple simultaneous dashboard loads
    if (!force && dashboardLoaded && !isRefreshing) {
      return
    }

    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data.data)
        setDashboardLoaded(true)
        setDataError('')

        // Load role-based data
        await loadRoleBasedData()

        // Quick refresh of permissions after dashboard loads to ensure they're current
        if (!permissionsRefreshed) {
          setTimeout(async () => {
            try {
              await refreshPermissions()
              setPermissionsRefreshed(true)
            } catch (error) {
              console.error('Dashboard: Failed to refresh permissions:', error)
            }
          }, 500) // Small delay to ensure dashboard is fully rendered
        }
      } else {
        setDataError('Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setDataError('Failed to load dashboard data')
    }
  }, [dashboardLoaded, isRefreshing, permissionsRefreshed, refreshPermissions, loadRoleBasedData])

  const checkAuth = useCallback(async (forceLoadDashboard = false) => {
    // Prevent multiple simultaneous auth checks
    if (isAuthChecking && !forceLoadDashboard) {
      return
    }

    try {
      setIsAuthChecking(true)
      const response = await fetch('/api/auth/me')

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setUserRole(userData.role?.toLowerCase() || 'student')
        setAuthError('')

        // Only load dashboard data if not already loaded or if forced
        if (!dashboardLoaded || forceLoadDashboard) {
          await loadDashboardData(forceLoadDashboard)
        } 
      } else if (response.status === 401) {
        // Try to refresh token
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST'
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          setUser(refreshData.user)
          setAuthError('')

          // Only load dashboard data if not already loaded or if forced
          if (!dashboardLoaded || forceLoadDashboard) {
            await loadDashboardData(forceLoadDashboard)
          } 
        } else {
          // Both access and refresh tokens are invalid
          setAuthError('Session expired')
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        }
      } else {
        // Other error, redirect to login
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setAuthError('Authentication failed')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } finally {
      setIsLoading(false)
      setIsAuthChecking(false)
    }
  }, [router, loadDashboardData, isAuthChecking, dashboardLoaded, permissionsLoading, permissions])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await loadDashboardData()
    } finally {
      setIsRefreshing(false)
    }
  }, [loadDashboardData])

  // Initial auth check on mount
  useEffect(() => {
    if (!dashboardLoaded) {
      checkAuth()
    }
  }, []) // Empty dependency array to run only once on mount

  // Ensure permissions are current when component mounts
  useEffect(() => {
    if (!permissionsLoading && permissions && !initialPermissionCheckDone) {
      // Quick check to refresh permissions if needed
      const timer = setTimeout(async () => {
        try {
          await refreshPermissions()
          setPermissionsRefreshed(true)
          setInitialPermissionCheckDone(true)
        } catch (error) {
          console.error('Dashboard: Failed initial permission refresh:', error)
          setInitialPermissionCheckDone(true) // Prevent infinite retries
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [permissionsLoading, permissions, initialPermissionCheckDone, refreshPermissions])

  // Set up periodic auth check to handle token expiration (less frequent)
  useEffect(() => {
    const interval = setInterval(() => {
      checkAuth(true) // Force dashboard reload on periodic checks
    }, 10 * 60 * 1000) // Check every 10 minutes instead of 5

    return () => clearInterval(interval)
  }, []) // Empty dependency array

  // Handle loading states consistently to prevent hydration mismatch
  // Show loading until permissions are loaded, auth check is complete, initial permission check done, organization data is loaded, and dashboard data is ready
  // Ensure permissions are fully available and refreshed before showing dashboard
  const isInitialLoading = permissionsLoading || isLoading  || !permissions || !initialPermissionCheckDone  || (!permissionsRefreshed && dashboardData);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (permissionsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-destructive">Failed to load permissions</p>
          <p className="text-xs text-muted-foreground mt-1">{permissionsError}</p>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{authError}</p>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No user data available</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout>
      <PageContent>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
          <div className="space-y-8 sm:space-y-12 overflow-x-hidden animate-in fade-in-0 duration-700">
            <DashboardHeader user={user} onRefresh={handleRefresh} isRefreshing={isRefreshing} />

            {dataError && (
              <div className="relative overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 p-6 sm:p-8 text-sm text-orange-800 shadow-2xl backdrop-blur-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-orange-50/70 to-white/70" aria-hidden="true" />
                <div className="relative space-y-4">
                  <p className="font-semibold text-lg break-words">⚠️ {dataError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="w-full sm:w-auto border-orange-300 bg-white/90 text-orange-700 hover:bg-white hover:border-orange-400"
                  >
                    Try again
                  </Button>
                </div>
              </div>
            )}

            {/* Stats Section */}
            {userRole !== 'student' && (
              <section className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Dashboard Overview
                  </h2>
                  <p className="text-gray-600 mb-10">Your learning progress and activities at a glance</p>
                </div>

                {/* Admin/Teacher Dashboard Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
                  {/* Users Widget */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Users</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">{roleBasedData?.users?.students || 0}</div>
                        <p className="text-xs text-gray-600">Students</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{roleBasedData?.users?.lecturers || 0}</div>
                        <p className="text-xs text-gray-600">Lecturers</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-purple-600">{roleBasedData?.users?.teachers || 0}</div>
                        <p className="text-xs text-gray-600">Teachers</p>
                      </div>
                    </div>
                  </div>

                  {/* Batches Widget */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 w-10 h-10 rounded-xl flex items-center justify-center">
                        <FolderOpen className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Batches</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{roleBasedData?.batches?.completed || 0}</div>
                        <p className="text-xs text-gray-600">Completed</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-600">{roleBasedData?.batches?.active || 0}</div>
                        <p className="text-xs text-gray-600">Active</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">{roleBasedData?.batches?.total || 0}</div>
                        <p className="text-xs text-gray-600">Total</p>
                      </div>
                    </div>
                  </div>

                  {/* Inquiry Widget */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 w-10 h-10 rounded-xl flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Inquiries</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-600">{roleBasedData?.inquiries?.PENDING || 0}</div>
                        <p className="text-xs text-gray-600">Pending</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{roleBasedData?.inquiries?.ATTENDED || 0}</div>
                        <p className="text-xs text-gray-600">Attended</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">{roleBasedData?.inquiries?.STUDENT_ADDED || 0}</div>
                        <p className="text-xs text-gray-600">Student Added</p>
                      </div>
                    </div>
                  </div>

                  {/* Modules and Units Widget */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 w-10 h-10 rounded-xl flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Courses & Units</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{roleBasedData?.courses?.count || 0}</div>
                        <p className="text-xs text-gray-600">Courses/Modules</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{roleBasedData?.courses?.unitsCount || 0}</div>
                        <p className="text-xs text-gray-600">Total Units</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600 text-center">
                        Average {roleBasedData?.courses?.averageUnitsPerCourse || 0} units per course
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Activities Section */}
            <section className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-800">Recent Activities</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Activities */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
                    <h3 className="text-xl font-semibold">Upcoming Activities</h3>
                    <p className="text-purple-100">Stay ahead of your schedule</p>
                  </div>
                  <div className="p-6">
                    <UpcomingActivitiesWidget userRole={userRole} />
                  </div>
                </div>

                {/* Latest Quizzes */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
                    <h3 className="text-xl font-semibold">Latest Quizzes</h3>
                    <p className="text-emerald-100">Test your knowledge</p>
                  </div>
                  <div className="p-6">
                    <LatestQuizzesWidget userRole={userRole} />
                  </div>
                </div>
              </div>

              {/* Latest Assignments - Full Width */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white">
                  <h3 className="text-xl font-semibold">Latest Assignments</h3>
                  <p className="text-rose-100">Complete your tasks</p>
                </div>
                <div className="p-6">
                  <LatestAssignmentsWidget userRole={userRole} />
                </div>
              </div>
            </section>
          </div>
        </div>
      </PageContent>
    </MainLayout>
  )
}
