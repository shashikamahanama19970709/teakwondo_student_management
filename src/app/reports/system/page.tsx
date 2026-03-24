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
  Activity,
  TrendingUp,
  Server,
  Database,
  Users,
  BarChart3,
  PieChart,
  Target,
  Clock,
  Zap,
  Shield,
  HardDrive
} from 'lucide-react'

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalCourseModules: number
  totalLessons: number
  systemUptime: number
  averageResponseTime: number
  errorRate: number
  storageUsed: number
  storageTotal: number
}

interface ReportData {
  metrics: SystemMetrics
  performanceData: {
    responseTimes: number[]
    errorRates: number[]
    userActivity: number[]
  }
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical'
    uptime: number
    lastBackup: string
    securityStatus: 'secure' | 'warning' | 'compromised'
  }
}

export default function SystemReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const { setItems } = useBreadcrumb()

  useEffect(() => {
    setItems([
      { label: 'Reports', href: '/reports' },
      { label: 'System Reports' }
    ])
  }, [setItems])

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setError(null)
        const response = await fetch('/api/reports/system')
        if (response.ok) {
          const data = await response.json()
          setReportData(data)
        } else {
          const message = `Failed to fetch system report (${response.status})`
          console.error(message)
          setError(message)
          setReportData(null)
        }
      } catch (error) {
        console.error('Failed to fetch system report:', error)
        setError('Failed to fetch system report')
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
              <p className="text-muted-foreground">Loading system reports...</p>
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
                <h1 className="text-2xl font-bold tracking-tight">System Reports</h1>
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
              <h1 className="text-2xl font-bold tracking-tight">System Reports</h1>
              <p className="text-muted-foreground">
                System performance, health, and usage analytics
              </p>
            </div>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* System Health Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health Status
              </CardTitle>
              <CardDescription>Current system status and key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    reportData?.systemHealth.status === 'healthy' ? 'bg-green-500' :
                    reportData?.systemHealth.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm font-medium capitalize">
                    {reportData?.systemHealth.status || 'Unknown'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Uptime: </span>
                  <span className="font-medium">{reportData?.systemHealth.uptime || 0}%</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Last Backup: </span>
                  <span className="font-medium">
                    {reportData?.systemHealth.lastBackup ?
                      new Date(reportData.systemHealth.lastBackup).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Security: </span>
                  <Badge variant={
                    reportData?.systemHealth.securityStatus === 'secure' ? 'default' :
                    reportData?.systemHealth.securityStatus === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {reportData?.systemHealth.securityStatus || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.metrics.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData?.metrics.activeUsers || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.metrics.systemUptime || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.metrics.averageResponseTime || 0}ms</div>
                <p className="text-xs text-muted-foreground">
                  API responses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.metrics.storageUsed || 0}GB
                </div>
                <p className="text-xs text-muted-foreground">
                  of {reportData?.metrics.storageTotal || 0}GB total
                </p>
                <Progress
                  value={((reportData?.metrics.storageUsed || 0) / (reportData?.metrics.storageTotal || 1)) * 100}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="justify-center py-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Overview</CardTitle>
                    <CardDescription>System content statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Course Modules</span>
                        <span className="text-sm font-medium">{reportData?.metrics.totalCourseModules || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Lessons</span>
                        <span className="text-sm font-medium">{reportData?.metrics.totalLessons || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Error Rate</span>
                        <span className="text-sm font-medium">{(reportData?.metrics.errorRate || 0) * 100}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Activity</CardTitle>
                    <CardDescription>Recent user engagement metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Activity Trends</h3>
                      <p className="text-muted-foreground">
                        User activity charts will be displayed here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>System performance and response times</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {reportData?.metrics.averageResponseTime || 0}ms
                        </div>
                        <p className="text-sm text-muted-foreground">Avg Response Time</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {reportData?.metrics.systemUptime || 0}%
                        </div>
                        <p className="text-sm text-muted-foreground">System Uptime</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {(reportData?.metrics.errorRate || 0) * 100}%
                        </div>
                        <p className="text-sm text-muted-foreground">Error Rate</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                  <CardDescription>System usage patterns and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Usage Trends</h3>
                    <p className="text-muted-foreground">
                      Detailed usage analytics and trends will be displayed here
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