'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { useBreadcrumb } from '@/contexts/BreadcrumbContext'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import {
  CheckSquare,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Clock,
  CheckCircle
} from 'lucide-react'

interface Lesson {
  _id: string
  title: string
  status: string
  courseModule: string
  assignedTo?: string
  completedBy: number
  totalAssigned: number
  dueDate?: string
  completedDate?: string
}

interface ReportData {
  totalLessons: number
  completedLessons: number
  inProgressLessons: number
  overdueLessons: number
  totalStudents: number
  averageCompletionTime: number
  completionRate: number
  lessons: Lesson[]
}

export default function LessonsReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const { setItems } = useBreadcrumb()

  useEffect(() => {
    setItems([
      { label: 'Reports', href: '/reports' },
      { label: 'Lessons Reports' }
    ])
  }, [setItems])

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setError(null)
        const response = await fetch('/api/reports/lessons')
        if (response.ok) {
          const data = await response.json()
          setReportData(data)
        } else {
          const message = `Failed to fetch lessons report (${response.status})`
          console.error(message)
          setError(message)
          setReportData(null)
        }
      } catch (error) {
        console.error('Failed to fetch lessons report:', error)
        setError('Failed to fetch lessons report')
        setReportData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [])

  if (loading) {
    return (
      <MainLayout>
        <PageWrapper>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading lessons reports...</p>
            </div>
          </div>
        </PageWrapper>
      </MainLayout>
    )
  }

  if (error || !reportData) {
    return (
      <MainLayout>
        <PageWrapper>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Lessons Reports</h1>
                <p className="text-muted-foreground">Report data is not available right now.</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Unable to load data</CardTitle>
                <CardDescription>{error ?? 'Please try again later.'}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </PageWrapper>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <PageWrapper>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Lessons Reports</h1>
              <p className="text-muted-foreground">
                Detailed analytics for lesson completion and student engagement
              </p>
            </div>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.totalLessons || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across all modules
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.completionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {reportData?.completedLessons || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Currently enrolled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.averageCompletionTime || 0} days</div>
                <p className="text-xs text-muted-foreground">
                  Per lesson
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="justify-center py-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lessons">Lesson Details</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Lesson Status Distribution</CardTitle>
                    <CardDescription>Current status of all lessons</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Completed</span>
                        </div>
                        <span className="text-sm font-medium">{reportData?.completedLessons || 0}</span>
                      </div>
                      <Progress value={((reportData?.completedLessons || 0) / (reportData?.totalLessons || 1)) * 100} />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">In Progress</span>
                        </div>
                        <span className="text-sm font-medium">{reportData?.inProgressLessons || 0}</span>
                      </div>
                      <Progress value={((reportData?.inProgressLessons || 0) / (reportData?.totalLessons || 1)) * 100} />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-500" />
                          <span className="text-sm">Overdue</span>
                        </div>
                        <span className="text-sm font-medium">{reportData?.overdueLessons || 0}</span>
                      </div>
                      <Progress value={((reportData?.overdueLessons || 0) / (reportData?.totalLessons || 1)) * 100} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Completion Trends</CardTitle>
                    <CardDescription>Lesson completion over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Completion Analytics</h3>
                      <p className="text-muted-foreground">
                        Trend charts will be displayed here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="lessons" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Details</CardTitle>
                  <CardDescription>Detailed breakdown of each lesson</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {reportData?.lessons?.map((lesson) => (
                      <div key={lesson._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium">{lesson.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{lesson.courseModule}</span>
                            <Badge variant={
                              lesson.status === 'completed' ? 'default' :
                              lesson.status === 'in_progress' ? 'secondary' : 'destructive'
                            }>
                              {lesson.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {lesson.completedBy}/{lesson.totalAssigned} completed
                          </div>
                          <Progress
                            value={(lesson.completedBy / lesson.totalAssigned) * 100}
                            className="w-24 mt-1"
                          />
                        </div>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-8">
                        No lessons data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                  <CardDescription>Student performance and engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Performance Metrics</h3>
                    <p className="text-muted-foreground">
                      Detailed performance analytics will be displayed here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageWrapper>
    </MainLayout>
  )
}