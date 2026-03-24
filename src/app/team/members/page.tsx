'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { GravatarAvatar } from '@/components/ui/GravatarAvatar'
import { formatToTitleCase } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDateTime } from '@/components/providers/DateTimeProvider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  Loader2,
  Grid3x3,
  List,
  X,
  Camera
} from 'lucide-react'
import { InviteMemberModal } from '@/components/members/InviteMemberModal'
import { EditMemberModal } from '@/components/members/EditMemberModal'
import { ProfilePictureUpload } from '@/components/members/ProfilePictureUpload'
import { usePermissions } from '@/lib/permissions/permission-context'
import { Permission } from '@/lib/permissions/permission-definitions'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { useNotify } from '@/lib/notify'

interface Member {
  _id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  profile_picture?: string
  role: string
  customRole?: {
    _id: string
    name: string
    description?: string
  }
  isActive: boolean
  createdAt: string
  lastLogin?: string
  projectManager?: {
    _id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  humanResourcePartner?: {
    _id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  memberId?: string
  username?: string
  passwordDisplay?: string
  enrolledCourses?: Array<{
    courseId: string
    groupName?: string
    enrolledAt: string
  }>
  studentRegistrationNo?: string
}

interface PendingInvitation {
  _id: string
  email: string
  role: string
  customRole?: {
    _id: string
    name: string
  }
  invitedBy: {
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
  expiresAt: string
}

export default function MembersPage() {
  const router = useRouter()
  const { formatDate } = useDateTime()
  const [members, setMembers] = useState<Member[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [authError, setAuthError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [activeTab, setActiveTab] = useState('students')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [invitationViewMode, setInvitationViewMode] = useState<'grid' | 'list'>('grid')
  const { hasPermission, loading: permissionsLoading } = usePermissions()
  const { success: notifySuccess, error: notifyError } = useNotify()

  // Pagination states
  const [membersPagination, setMembersPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const [invitationsPagination, setInvitationsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const canViewMembers = hasPermission(Permission.TEAM_READ) || hasPermission(Permission.USER_READ)
  const canInviteMembers = hasPermission(Permission.TEAM_INVITE) || hasPermission(Permission.USER_INVITE)
  const canEditMembers = hasPermission(Permission.TEAM_EDIT)
  const canDeleteMembers = hasPermission(Permission.TEAM_REMOVE)

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== '' || roleFilter !== 'all' || statusFilter !== 'all'

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  const [organizationRoles, setOrganizationRoles] = useState<Array<{ id: string; name: string; key: string; isSystem?: boolean }>>([])
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)
  const [removingMember, setRemovingMember] = useState(false)
  const [showCancelInvitationConfirm, setShowCancelInvitationConfirm] = useState(false)
  const [invitationToCancel, setInvitationToCancel] = useState<PendingInvitation | null>(null)
  const [cancelingInvitation, setCancelingInvitation] = useState(false)
  const [profilePictureUpload, setProfilePictureUpload] = useState<{ isOpen: boolean; memberId: string; currentPicture?: string }>({
    isOpen: false,
    memberId: ''
  })

  // Load available organization roles (both system and custom) from the central roles API
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await fetch('/api/roles')
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          // Load all roles (system and custom)
          const allRoles = data.data.map((role: any) => ({
            id: role._id,
            name: role.name,
            key: role._id, // Use _id as the key (e.g., 'admin', 'project_manager')
            isSystem: role.isSystem
          }))
          setOrganizationRoles(allRoles)
        }
      } catch (err) {
        console.error('Failed to load organization roles', err)
      }
    }

    loadRoles()
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')

      if (response.ok) {
        setAuthError('')
        await fetchMembers()
      } else if (response.status === 401) {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST'
        })

        if (refreshResponse.ok) {
          setAuthError('')
          await fetchMembers()
        } else {
          setAuthError('Session expired')
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setAuthError('Authentication failed')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const fetchMembers = async () => {
    try {
      setLoading(true)

      // Build query parameters for server-side filtering
      const params = new URLSearchParams({
        page: membersPagination.page.toString(),
        limit: membersPagination.limit.toString(),
      })

      if (searchQuery) params.append('search', searchQuery)

      // Add role filter based on active tab
      if (activeTab === 'students') {
        params.append('role', 'student')
      } else if (activeTab === 'staff') {
        // For staff, we want all roles except student
        // Since the API might not support excluding roles, we'll filter on client side for staff
        // But for now, let's fetch all and filter client-side
      }

      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/members?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setMembers(data.data.members)
        setPendingInvitations(data.data.pendingInvitations)

        // Update pagination with server response
        if (data.data.pagination) {
          setMembersPagination(prev => ({
            ...prev,
            total: data.data.pagination.total,
            totalPages: data.data.pagination.totalPages
          }))
        }
      } else {
        notifyError({ title: data.error || 'Failed to fetch members' })
      }
    } catch (err) {
      notifyError({ title: 'Failed to fetch members' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMember = async (memberData: any): Promise<{ error?: string } | void> => {
    if (!canInviteMembers) {
      const errorMsg = 'You do not have permission to create members.'
      notifyError({ title: errorMsg })
      return { error: errorMsg }
    }

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(memberData)
      })

      const data = await response.json()

      if (data.success) {
        setShowInviteModal(false)
        notifySuccess({ title: 'Member account created successfully' })
        // Refresh members list
        await fetchMembers()
        return
      } else {
        const errorMsg = data.error || 'Failed to create member account'
        notifyError({ title: errorMsg })
        return { error: errorMsg }
      }
    } catch (err) {
      const errorMsg = 'Failed to create member account'
      notifyError({ title: errorMsg })
      return { error: errorMsg }
    }
  }

  const handleUpdateMember = async (memberId: string, updates: any) => {
    const member = members.find((m) => m._id === memberId)
    if (!member) {
      notifyError({ title: 'Member not found' })
      return
    }

    const requiresAdminAccess = member.role === 'admin'
    if (!canEditMembers) {
      notifyError({ title: 'You do not have permission to edit this member.' })
      return
    }

    try {
      const response = await fetch('/api/members', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId,
          updates
        })
      })

      const data = await response.json()

      if (data.success) {
        setEditingMember(null)
        notifySuccess({ title: 'Team member updated successfully' })
        fetchMembers()
      } else {
        notifyError({ title: data.error || 'Failed to update member' })
      }
    } catch (err) {
      notifyError({ title: 'Failed to update member' })
    }
  }

  const handleCancelInvitationClick = (invitation: PendingInvitation) => {
    setInvitationToCancel(invitation)
    setShowCancelInvitationConfirm(true)
  }

  const handleCancelInvitationConfirm = async () => {
    if (!invitationToCancel) return

    try {
      setCancelingInvitation(true)
      const response = await fetch(`/api/members/cancel-invitation?invitationId=${invitationToCancel._id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        notifySuccess({ title: 'Invitation cancelled successfully' })
        await fetchMembers()
      } else {
        notifyError({ title: data.error || 'Failed to cancel invitation' })
      }
    } catch (err) {
      notifyError({ title: 'Failed to cancel invitation' })
    } finally {
      setCancelingInvitation(false)
      setShowCancelInvitationConfirm(false)
      setInvitationToCancel(null)
    }
  }

  const handleCancelInvitationCancel = () => {
    if (cancelingInvitation) return
    setShowCancelInvitationConfirm(false)
    setInvitationToCancel(null)
  }

  const handleProfilePictureUpload = async (memberId: string, profilePictureUrl: string) => {
    try {
      const response = await fetch('/api/members', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId,
          updates: { profile_picture: profilePictureUrl }
        })
      })

      const data = await response.json()

      if (data.success) {
        notifySuccess({ title: 'Profile picture updated successfully' })
        await fetchMembers()
      } else {
        notifyError({ title: data.error || 'Failed to update profile picture' })
      }
    } catch (err) {
      notifyError({ title: 'Failed to update profile picture' })
    }
  }

  const handleRemoveMemberClick = (member: Member) => {
    if (!canDeleteMembers) {
      notifyError({ title: 'You do not have permission to delete team members.' })
      return
    }
    setMemberToRemove(member)
    setShowRemoveConfirm(true)
  }

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return

    // Double-check permission before making API call
    if (!canDeleteMembers) {
      notifyError({ title: 'Insufficient permissions to remove member' })
      return
    }

    try {
      setRemovingMember(true)
      const response = await fetch(`/api/members?memberId=${memberToRemove._id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        notifySuccess({ title: 'Member removed successfully' })
        await fetchMembers()
      } else {
        notifyError({ title: data.error || 'Failed to remove member' })
      }
    } catch (err) {
      notifyError({ title: 'Failed to remove member' })
    } finally {
      setRemovingMember(false)
      setShowRemoveConfirm(false)
      setMemberToRemove(null)
    }
  }

  const handleRemoveCancel = () => {
    if (removingMember) return
    setShowRemoveConfirm(false)
    setMemberToRemove(null)
  }

  // Server handles filtering, no client-side filtering needed
  const filteredMembers = members

  // Fetch members whenever filters or pagination changes
  useEffect(() => {
    if (!loading && !authError) {
      fetchMembers()
    }
  }, [searchQuery, roleFilter, statusFilter, membersPagination.page, membersPagination.limit])

  // Update invitations pagination when invitations change
  useEffect(() => {
    const total = pendingInvitations.length
    const totalPages = Math.ceil(total / invitationsPagination.limit)
    setInvitationsPagination(prev => ({
      ...prev,
      total,
      totalPages,
      page: Math.min(prev.page, totalPages || 1)
    }))
  }, [pendingInvitations.length, invitationsPagination.limit])

  // Reset page to 1 when filters change (but not limit)
  useEffect(() => {
    setMembersPagination(prev => ({ ...prev, page: 1 }))
  }, [searchQuery, roleFilter, statusFilter])

  // Keep localSearch in sync with searchQuery
  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  // Add debouncing for search with 1000ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch)
    }, 1000)

    return () => clearTimeout(timer)
  }, [localSearch])

  // Fetch members when filters change
  useEffect(() => {
    if (!loading && !authError) {
      fetchMembers()
    }
  }, [searchQuery, roleFilter, statusFilter, membersPagination.page, membersPagination.limit, activeTab])

  // Server returns paginated data, use it directly and filter by tab
  const paginatedMembers = activeTab === 'staff'
    ? members.filter(member => ['admin', 'lecturer', 'minor_staff'].includes(member.role) || member.customRole)
    : members

  // Client-side pagination for invitations
  const paginatedInvitations = pendingInvitations.slice(
    (invitationsPagination.page - 1) * invitationsPagination.limit,
    invitationsPagination.page * invitationsPagination.limit
  )

  const handleInlineRoleChange = async (member: Member, newRole: string) => {
    if (newRole === member.role) return

    // Prevent assigning admin role without proper permission
    if (newRole === 'admin' && !canEditMembers) {
      notifyError({ title: 'You do not have permission to assign admin role.' })
      return
    }

    await handleUpdateMember(member._id, { role: newRole })
    // Optional inline success message
    notifySuccess({ title: 'Member role updated successfully.' })
  }

  // Generate a consistent color for custom roles based on their ID
  const getCustomRoleColor = (customRoleId: string): string => {
    // Hash function to convert ID to a number
    let hash = 0
    for (let i = 0; i < customRoleId.length; i++) {
      hash = customRoleId.charCodeAt(i) + ((hash << 5) - hash)
      hash = hash & hash // Convert to 32-bit integer
    }

    // Use absolute value and modulo to get a consistent index
    const index = Math.abs(hash) % 12

    // Palette of distinct colors (avoiding red which is for admin)
    const colorPalette = [
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900',
      'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 hover:bg-cyan-100 dark:hover:bg-cyan-900',
      'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900',
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900',
      'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200 hover:bg-lime-100 dark:hover:bg-lime-900',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900',
      'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900',
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900',
      'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 hover:bg-pink-100 dark:hover:bg-pink-900',
      'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900',
      'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900',
      'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-violet-900',
    ]

    return colorPalette[index]
  }

  const getRoleColor = (role: string, customRoleId?: string) => {
    // If custom role exists, use custom role color
    if (customRoleId) {
      return getCustomRoleColor(customRoleId)
    }

    // Otherwise, use predefined role colors
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900'
      case 'project_manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900'
      case 'team_member': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900'
      case 'client': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900'
    }
  }

  const getMemberRoleLabel = (member: Member) => member.customRole?.name || formatToTitleCase(member.role)

  const getInvitationRoleLabel = (invitation: PendingInvitation) =>
    invitation.customRole?.name || formatToTitleCase(invitation.role)

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading members...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (authError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{authError}</p>
            <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!permissionsLoading && !canViewMembers) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-foreground">Access restricted</p>
            <p className="text-sm text-muted-foreground">You do not have permission to view team members.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const handleOpenInviteModal = () => {
    if (!canInviteMembers) {
      notifyError({ title: 'You do not have permission to invite members.' })
      return
    }
    setShowInviteModal(true)
  }

  const canEditMemberRecord = (member: Member) => {
    if (member.role === 'admin' || member.role === 'human_resource') {
      return canEditMembers
    }
    return canEditMembers
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground break-words">Team Members</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 break-words">Manage your team members and invitations</p>
          </div>
          <div className="flex-shrink-0">
            <Button onClick={handleOpenInviteModal} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 overflow-x-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="truncate">Students</span>
              <span className="ml-1 flex-shrink-0">({members.filter(m => m.role === 'student').length})</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="truncate">Staff</span>
              <span className="ml-1 flex-shrink-0">({members.filter(m => m.role !== 'student').length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-4 mt-4 overflow-x-hidden">
            <Card className="overflow-x-hidden">
              <CardHeader className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg sm:text-xl break-words">Students</CardTitle>
                      <CardDescription className="text-xs sm:text-sm break-words">
                        Manage student accounts and their access
                      </CardDescription>
                    </div>
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
                      <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                        <TabsTrigger value="grid" className="text-xs sm:text-sm">
                          <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                          Grid
                        </TabsTrigger>
                        <TabsTrigger value="list" className="text-xs sm:text-sm">
                          <List className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                          List
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="flex flex-col gap-2 sm:gap-3">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none flex-shrink-0" />
                      <Input
                        ref={searchInputRef}
                        placeholder="Search students..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="pl-10 w-full text-sm sm:text-base min-h-[44px] touch-target"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] text-sm min-h-[44px] touch-target">
                          <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent className="z-[10050]">
                          <SelectItem value="all">All Student Roles</SelectItem>
                          {organizationRoles.filter(role => role.key === 'student').map((role) => (
                            <SelectItem key={role.id} value={role.key}>
                              {formatToTitleCase(role.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] text-sm min-h-[44px] touch-target">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent className="z-[10050]">
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {/* Results Count */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <div className="text-sm text-muted-foreground">
                    {hasActiveFilters ? (
                      <span>
                        Showing <span className="font-medium text-foreground">{paginatedMembers.length}</span> students
                        <span className="ml-2 text-xs">
                          {searchQuery && `• "${searchQuery}"`}
                          {roleFilter !== 'all' && roleFilter && `• ${organizationRoles.find(r => r.key === roleFilter)?.name || formatToTitleCase(roleFilter.replace(/_/g, ' '))}`}
                          {statusFilter !== 'all' && `• ${statusFilter === 'active' ? 'Active' : 'Inactive'}`}
                        </span>
                      </span>
                    ) : (
                      <span>
                        <span className="font-medium text-foreground">{paginatedMembers.length}</span> students total
                      </span>
                    )}
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                {paginatedMembers.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <Users className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50 flex-shrink-0" />
                    <p className="text-sm sm:text-base break-words">No students found</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedMembers.map((member) => (
                      <Card key={member._id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col items-center text-center space-y-3">
                            <div className="relative">
                              <GravatarAvatar
                                user={{
                                  firstName: member.firstName,
                                  lastName: member.lastName,
                                  email: member.email,
                                  avatar: member.avatar,
                                  profile_picture: member.profile_picture
                                }}
                                className="h-16 w-16 sm:h-20 sm:w-20"
                              />
                              <div className="absolute -bottom-1 -right-1">
                                {member.isActive ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 bg-background rounded-full" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500 bg-background rounded-full" />
                                )}
                              </div>
                              <button
                                onClick={() => setProfilePictureUpload({
                                  isOpen: true,
                                  memberId: member._id,
                                  currentPicture: member.profile_picture
                                })}
                                className="absolute -bottom-2 -left-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-lg transition-colors"
                                title="Change profile picture"
                              >
                                <Camera className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="w-full space-y-1">
                              <h3 className="font-semibold text-base sm:text-lg truncate" title={`${member.firstName} ${member.lastName}`}>
                                {member.firstName} {member.lastName}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">
                                ID: {member?.memberId ? member.memberId : '-'}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate" title={member.email}>
                                {member.email}
                              </p>
                            </div>
                            <div className="w-full space-y-2">
                              <div className="flex items-center justify-center">
                                <Badge className={`${getRoleColor(member.role, member.customRole?._id)} text-xs sm:text-sm flex-shrink-0`}>
                                  {getMemberRoleLabel(member)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Joined {formatDate(member.createdAt)}
                              </p>
                            </div>
                            {(canEditMemberRecord(member) || (canDeleteMembers && member.role !== 'admin' && member.role !== 'human_resource' && member.isActive)) && (
                              <div className="flex items-center gap-2 w-full pt-2 border-t">
                                {canEditMemberRecord(member) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingMember(member)}
                                    className="flex-1 text-xs sm:text-sm min-h-[36px]"
                                  >
                                    Edit
                                  </Button>
                                )}
                                {canDeleteMembers && member.isActive && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveMemberClick(member)}
                                    className="flex-1 text-xs sm:text-sm min-h-[36px]"
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paginatedMembers.map((member) => (
                      <Card key={member._id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                              <GravatarAvatar
                                user={{
                                  firstName: member.firstName,
                                  lastName: member.lastName,
                                  email: member.email,
                                  avatar: member.avatar,
                                  profile_picture: member.profile_picture
                                }}
                                className="h-12 w-12"
                              />
                              <div className="absolute -bottom-1 -right-1">
                                {member.isActive ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 bg-background rounded-full" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 bg-background rounded-full" />
                                )}
                              </div>
                              <button
                                onClick={() => setProfilePictureUpload({
                                  isOpen: true,
                                  memberId: member._id,
                                  currentPicture: member.profile_picture
                                })}
                                className="absolute -bottom-1 -left-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 shadow-lg transition-colors"
                                title="Change profile picture"
                              >
                                <Camera className="h-2.5 w-2.5" />
                              </button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate" title={`${member.firstName} ${member.lastName}`}>
                                  {member.firstName} {member.lastName}
                                </h3>
                                <Badge className={`${getRoleColor(member.role, member.customRole?._id)} text-xs`}>
                                  {getMemberRoleLabel(member)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mb-1">
                                ID: {member?.memberId ? member.memberId : '-'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.email}
                              </p>
                            </div>
                            {(canEditMemberRecord(member) || (canDeleteMembers && member.role !== 'admin' && member.role !== 'human_resource' && member.isActive)) && (
                              <div className="flex items-center gap-2">
                                {canEditMemberRecord(member) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingMember(member)}
                                    className="text-xs"
                                  >
                                    Edit
                                  </Button>
                                )}
                                {canDeleteMembers && member.isActive && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveMemberClick(member)}
                                    className="text-xs"
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Members Pagination Controls */}
                {membersPagination.total > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Items per page:</span>
                        <Select
                          value={membersPagination.limit.toString()}
                          onValueChange={(value) => {
                            const newLimit = parseInt(value)
                            setMembersPagination(prev => ({
                              ...prev,
                              limit: newLimit,
                              page: 1
                            }))
                          }}
                        >
                          <SelectTrigger className="w-16 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Showing {((membersPagination.page - 1) * membersPagination.limit) + 1} to {Math.min(membersPagination.page * membersPagination.limit, membersPagination.total)} of {membersPagination.total}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMembersPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={membersPagination.page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {membersPagination.page} of {membersPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMembersPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={membersPagination.page === membersPagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4 mt-4 overflow-x-hidden">
            <Card className="overflow-x-hidden">
              <CardHeader className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg sm:text-xl break-words">Staff Members</CardTitle>
                      <CardDescription className="text-xs sm:text-sm break-words">
                        Manage staff accounts including teachers, admins, and other roles
                      </CardDescription>
                    </div>
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
                      <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                        <TabsTrigger value="grid" className="text-xs sm:text-sm">
                          <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                          Grid
                        </TabsTrigger>
                        <TabsTrigger value="list" className="text-xs sm:text-sm">
                          <List className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                          List
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="flex flex-col gap-2 sm:gap-3">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none flex-shrink-0" />
                      <Input
                        ref={searchInputRef}
                        placeholder="Search staff members..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="pl-10 w-full text-sm sm:text-base min-h-[44px] touch-target"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] text-sm min-h-[44px] touch-target">
                          <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent className="z-[10050]">
                          <SelectItem value="all">All Roles</SelectItem>
                          {organizationRoles.filter(role => role.key !== 'student').map((role) => (
                            <SelectItem key={role.id} value={role.key}>
                              {formatToTitleCase(role.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] text-sm min-h-[44px] touch-target">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent className="z-[10050]">
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {/* Results Count */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <div className="text-sm text-muted-foreground">
                    {hasActiveFilters ? (
                      <span>
                        Showing <span className="font-medium text-foreground">{paginatedMembers.length}</span> staff members
                        <span className="ml-2 text-xs">
                          {searchQuery && `• "${searchQuery}"`}
                          {roleFilter !== 'all' && roleFilter && `• ${organizationRoles.find(r => r.key === roleFilter)?.name || formatToTitleCase(roleFilter.replace(/_/g, ' '))}`}
                          {statusFilter !== 'all' && `• ${statusFilter === 'active' ? 'Active' : 'Inactive'}`}
                        </span>
                      </span>
                    ) : (
                      <span>
                        <span className="font-medium text-foreground">{paginatedMembers.length}</span> staff members total
                      </span>
                    )}
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                {paginatedMembers.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <UserCheck className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50 flex-shrink-0" />
                    <p className="text-sm sm:text-base break-words">No staff members found</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedMembers.map((member) => (
                      <Card key={member._id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col items-center text-center space-y-3">
                            <div className="relative">
                              <GravatarAvatar
                                user={{
                                  firstName: member.firstName,
                                  lastName: member.lastName,
                                  email: member.email,
                                  avatar: member.avatar,
                                  profile_picture: member.profile_picture
                                }}
                                className="h-16 w-16 sm:h-20 sm:w-20"
                              />
                              <div className="absolute -bottom-1 -right-1">
                                {member.isActive ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 bg-background rounded-full" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500 bg-background rounded-full" />
                                )}
                              </div>
                               <button
                                onClick={() => setProfilePictureUpload({
                                  isOpen: true,
                                  memberId: member._id,
                                  currentPicture: member.profile_picture
                                })}
                                className="absolute -bottom-1 -left-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 shadow-lg transition-colors"
                                title="Change profile picture"
                              >
                                <Camera className="h-2.5 w-2.5" />
                              </button>
                            </div>
                            <div className="w-full space-y-1">
                              <h3 className="font-semibold text-base sm:text-lg truncate" title={`${member.firstName} ${member.lastName}`}>
                                {member.firstName} {member.lastName}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">
                                ID: {member?.memberId ? member.memberId : '-'}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate" title={member.email}>
                                {member.email}
                              </p>
                            </div>
                            <div className="w-full space-y-2">
                              <div className="flex items-center justify-center">
                                <Badge className={`${getRoleColor(member.role, member.customRole?._id)} text-xs sm:text-sm flex-shrink-0`}>
                                  {getMemberRoleLabel(member)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Joined {formatDate(member.createdAt)}
                              </p>
                            </div>
                            {(canEditMemberRecord(member) || (canDeleteMembers && member.role !== 'admin' && member.role !== 'human_resource' && member.isActive)) && (
                              <div className="flex items-center gap-2 w-full pt-2 border-t">
                                {canEditMemberRecord(member) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingMember(member)}
                                    className="flex-1 text-xs sm:text-sm min-h-[36px]"
                                  >
                                    Edit
                                  </Button>
                                )}
                                {canDeleteMembers && member.isActive && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveMemberClick(member)}
                                    className="flex-1 text-xs sm:text-sm min-h-[36px]"
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paginatedMembers.map((member) => (
                      <Card key={member._id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                              <GravatarAvatar
                                user={{
                                  firstName: member.firstName,
                                  lastName: member.lastName,
                                  email: member.email,
                                  avatar: member.avatar,
                                  profile_picture: member.profile_picture
                                }}
                                className="h-12 w-12"
                              />
                              <div className="absolute -bottom-1 -right-1">
                                {member.isActive ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 bg-background rounded-full" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 bg-background rounded-full" />
                                )}
                              </div>
                              <button
                                onClick={() => setProfilePictureUpload({
                                  isOpen: true,
                                  memberId: member._id,
                                  currentPicture: member.profile_picture
                                })}
                                className="absolute -bottom-1 -left-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 shadow-lg transition-colors"
                                title="Change profile picture"
                              >
                                <Camera className="h-2.5 w-2.5" />
                              </button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate" title={`${member.firstName} ${member.lastName}`}>
                                  {member.firstName} {member.lastName}
                                </h3>
                                <Badge className={`${getRoleColor(member.role, member.customRole?._id)} text-xs`}>
                                  {getMemberRoleLabel(member)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mb-1">
                                ID: {member?.memberId ? member.memberId : '-'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.email}
                              </p>
                            </div>
                            {(canEditMemberRecord(member) || (canDeleteMembers && member.role !== 'admin' && member.role !== 'human_resource' && member.isActive)) && (
                              <div className="flex items-center gap-2">
                                {canEditMemberRecord(member) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingMember(member)}
                                    className="text-xs"
                                  >
                                    Edit
                                  </Button>
                                )}
                                {canDeleteMembers && member.isActive && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveMemberClick(member)}
                                    className="text-xs"
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {showInviteModal && (
          <InviteMemberModal
            onClose={() => setShowInviteModal(false)}
            onAction={handleCreateMember}
          />
        )}

        {editingMember && (
          <EditMemberModal
            member={editingMember}
            onClose={() => setEditingMember(null)}
            onUpdate={handleUpdateMember}
          />
        )}

        {showRemoveConfirm && (
          <ConfirmationModal
            isOpen={showRemoveConfirm}
            onClose={handleRemoveCancel}
            onConfirm={confirmRemoveMember}
            title="Remove Team Member"
            description={
              memberToRemove
                ? `Are you sure you want to remove ${memberToRemove.firstName} ${memberToRemove.lastName} from the team? This action cannot be undone.`
                : 'Are you sure you want to remove this team member?'
            }
            confirmText="Remove Member"
            cancelText="Cancel"
            variant="destructive"
            isLoading={removingMember}
          />
        )}

        {showCancelInvitationConfirm && (
          <ConfirmationModal
            isOpen={showCancelInvitationConfirm}
            onClose={handleCancelInvitationCancel}
            onConfirm={handleCancelInvitationConfirm}
            title="Cancel invitation"
            description={
              invitationToCancel
                ? `Are you sure you want to cancel the invitation for ${invitationToCancel.email}? This action cannot be undone.`
                : 'Are you sure you want to cancel this invitation?'
            }
            confirmText="Cancel Invitation"
            cancelText="Keep Invitation"
            variant="destructive"
            isLoading={cancelingInvitation}
          />
        )}

        <ProfilePictureUpload
          isOpen={profilePictureUpload.isOpen}
          memberId={profilePictureUpload.memberId}
          currentProfilePicture={profilePictureUpload.currentPicture}
          onClose={() => setProfilePictureUpload({ isOpen: false, memberId: '' })}
          onSuccess={(profilePictureUrl) => handleProfilePictureUpload(profilePictureUpload.memberId, profilePictureUrl)}
        />
      </div>
    </MainLayout>
  )
}
