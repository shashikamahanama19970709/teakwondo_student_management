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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import {
  Users,
  TrendingUp,
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Clock,
  UserCheck,
  Award
} from 'lucide-react'

interface TeamMember {
  _id: string
  name: string
  email: string
  role: string
  avatar?: string
  lessonsCompleted: number
  lessonsAssigned: number
  averageScore: number
  lastActive: string
  joinDate: string
  status: 'active' | 'inactive'
}

interface ReportData {
  totalMembers: number
  activeMembers: number
  totalLessonsCompleted: number
  averageCompletionRate: number
  averageScore: number
  topPerformers: TeamMember[]
  members: TeamMember[]
}

export default function TeamMembersReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const { setItems } = useBreadcrumb()

  useEffect(() => {
    setItems([
      { label: 'Reports', href: '/reports' },
      { label: 'Team Members Reports' }
    ])
  }, [setItems])

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setError(null)
        const response = await fetch('/api/reports/team-members')
        if (response.ok) {
          const data = await response.json()
          setReportData(data)
        } else {
          const message = `Failed to fetch team members report (${response.status})`
          console.error(message)
          setError(message)
          setReportData(null)
        }
      } catch (error) {
        console.error('Failed to fetch team members report:', error)
        setError('Failed to fetch team members report')
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
              <p className="text-muted-foreground">Loading team members reports...</p>
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
                <h1 className="text-2xl font-bold tracking-tight">Team Members Reports</h1>
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
              <h1 className="text-2xl font-bold tracking-tight">Team Members Reports</h1>
              <p className="text-muted-foreground">
                Comprehensive analytics for team member performance and engagement
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
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.totalMembers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData?.activeMembers || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.totalLessonsCompleted || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total across team
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Completion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.averageCompletionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Team average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.averageScore || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Performance score
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="justify-center py-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Member Details</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Activity</CardTitle>
                    <CardDescription>Member activity and engagement levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Active Members</span>
                        </div>
                        <span className="text-sm font-medium">{reportData?.activeMembers || 0}</span>
                      </div>
                      <Progress value={((reportData?.activeMembers || 0) / (reportData?.totalMembers || 1)) * 100} />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">Inactive Members</span>
                        </div>
                        <span className="text-sm font-medium">
                          {(reportData?.totalMembers || 0) - (reportData?.activeMembers || 0)}
                        </span>
                      </div>
                      <Progress value={(((reportData?.totalMembers || 0) - (reportData?.activeMembers || 0)) / (reportData?.totalMembers || 1)) * 100} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>Highest performing team members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData?.topPerformers?.slice(0, 3).map((member, index) => (
                        <div key={member._id} className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-medium">
                            {index + 1}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.averageScore}% avg score</p>
                          </div>
                        </div>
                      )) || (
                        <p className="text-muted-foreground text-center py-4">
                          No top performers data available
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Member Details</CardTitle>
                  <CardDescription>Detailed breakdown of each team member</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {reportData?.members?.map((member) => (
                      <div key={member._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <h4 className="font-medium">{member.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{member.email}</span>
                              <Badge variant="outline">{member.role}</Badge>
                              <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                                {member.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-sm font-medium">
                            {member.lessonsCompleted}/{member.lessonsAssigned} lessons
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.averageScore}% avg score
                          </div>
                          <Progress
                            value={(member.lessonsCompleted / member.lessonsAssigned) * 100}
                            className="w-24 mt-1"
                          />
                        </div>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-8">
                        No team members data available
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
                  <CardDescription>Team performance trends and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Performance Trends</h3>
                    <p className="text-muted-foreground">
                      Detailed performance analytics and trends will be displayed here
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