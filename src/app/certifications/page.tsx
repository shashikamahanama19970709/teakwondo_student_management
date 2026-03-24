'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatToTitleCase } from '@/lib/utils'
import { useOrganization } from '@/hooks/useOrganization'
import { useNotify } from '@/lib/notify'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PermissionGate, PermissionButton } from '@/lib/permissions/permission-components'
import { Permission } from '@/lib/permissions/permission-definitions'
import { useRoleAccess } from '@/lib/permissions/role-hooks'
import { PageContent } from '@/components/ui/PageContent'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { ResponsiveDialog } from '@/components/ui/ResponsiveDialog'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Award,
  AlertTriangle,
  Loader2,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Building
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu'

interface Certification {
  _id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'draft'
  isActive: boolean
  issuingOrganization: string
  skills: string[]
  tags: string[]
  attachments: Array<{
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
    uploadedAt: string
  }>
  createdBy: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface CertificationFormData {
  name: string
  description: string
  issuingOrganization: string
  skills: string[]
  tags: string[]
  attachments: Array<{
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
    uploadedAt: string
  }>
}

export default function CertificationsPage() {
  const router = useRouter()
  const { success: notifySuccess, error: notifyError } = useNotify()
  const roleAccess = useRoleAccess()
  const isStudent = roleAccess.isStudent()

  // State
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [localSearch, setLocalSearch] = useState('')
  const [authError, setAuthError] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [certificationToDelete, setCertificationToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CertificationFormData>({
    name: '',
    description: '',
    issuingOrganization: '',
    skills: [],
    tags: [],
    attachments: []
  })

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(localSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch])

  // Fetch certifications
  const fetchCertifications = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (debouncedSearchQuery) params.set('search', debouncedSearchQuery)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const response = await fetch(`/api/certifications?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()
        setCertifications(data.certifications)
        setAuthError('')
      } else if (response.status === 401) {
        setAuthError('Session expired')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setAuthError('Failed to load certifications')
      }
    } catch (error) {
      console.error('Error fetching certifications:', error)
      setAuthError('Failed to load certifications')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchQuery, statusFilter, router])

  // Initial load and when filters change
  useEffect(() => {
    fetchCertifications()
  }, [fetchCertifications])

  // Handle create/edit certification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.issuingOrganization.trim()) {
      notifyError({ title: 'Please fill in all required fields' })
      return
    }

    try {
      setIsSubmitting(true)

      const url = editingCertification
        ? `/api/certifications/${editingCertification._id}`
        : '/api/certifications'

      const method = editingCertification ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        notifySuccess(data.message || `Certification ${editingCertification ? 'updated' : 'created'} successfully`)

        // Reset form and close modal
        setFormData({
          name: '',
          description: '',
          issuingOrganization: '',
          skills: [],
          tags: [],
          attachments: []
        })
        setCreateModalOpen(false)
        setEditingCertification(null)

        // Refresh certifications
        fetchCertifications()
      } else {
        const errorData = await response.json()
        notifyError({ title: errorData.error || 'Failed to save certification' })
      }
    } catch (error) {
      console.error('Error saving certification:', error)
      notifyError({ title: 'Failed to save certification' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete certification
  const handleDelete = async () => {
    if (!certificationToDelete) return

    try {
      setIsDeleting(true)

      const response = await fetch(`/api/certifications/${certificationToDelete}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        notifySuccess({ title: 'Certification deleted successfully' })
        setDeleteModalOpen(false)
        setCertificationToDelete(null)
        fetchCertifications()
      } else {
        const errorData = await response.json()
        notifyError(errorData.error || 'Failed to delete certification')
      }
    } catch (error) {
      console.error('Error deleting certification:', error)
      notifyError({ title: 'Failed to delete certification' })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle restore certification
  const handleRestore = async (certificationId: string) => {
    try {
      const response = await fetch(`/api/certifications/${certificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'restore' })
      })

      if (response.ok) {
        const data = await response.json()
        notifySuccess(data.message || 'Certification restored successfully')
        fetchCertifications()
      } else {
        const errorData = await response.json()
        notifyError(errorData.error || 'Failed to restore certification')
      }
    } catch (error) {
      console.error('Error restoring certification:', error)
      notifyError({ title: 'Failed to restore certification' })
    }
  }

  // Handle status toggle
  const handleStatusToggle = async (certification: Certification) => {
    const newStatus = certification.status === 'active' ? 'inactive' : 'active'

    try {
      const response = await fetch(`/api/certifications/${certification._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...certification,
          status: newStatus
        })
      })

      if (response.ok) {
        const data = await response.json()
        notifySuccess({ title: `Certification ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully` })
        fetchCertifications()
      } else {
        const errorData = await response.json()
        notifyError(errorData.error || 'Failed to update certification status')
      }
    } catch (error) {
      console.error('Error updating certification status:', error)
      notifyError({ title: 'Failed to update certification status' })
    }
  }

  // Handle edit
  const handleEdit = (certification: Certification) => {
    setEditingCertification(certification)
    setFormData({
      name: certification.name,
      description: certification.description || '',
      issuingOrganization: certification.issuingOrganization,
      skills: certification.skills,
      tags: certification.tags,
      attachments: certification.attachments
    })
    setCreateModalOpen(true)
  }

  // Get status badge styles
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'draft':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-3 w-3" />
      case 'inactive':
        return <Pause className="h-3 w-3" />
      case 'draft':
        return <FileText className="h-3 w-3" />
      default:
        return null
    }
  }

  if (authError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <PageContent>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Certifications</h1>
              <p className="text-muted-foreground">
                Manage your organization's certifications and credentials
              </p>
            </div>

            {!isStudent && (
              <Button
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            )}
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search certifications..."
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Certifications Grid */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : certifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No certifications found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first certification'
                  }
                </p>
                {!isStudent && (
                  <PermissionButton
                    permission={Permission.CERTIFICATION_CREATE}
                    onClick={() => setCreateModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Certification
                  </PermissionButton>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {certifications.map((certification) => (
                <div key={certification._id} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
                  {/* Header Section with Provider */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {certification.name}
                          </h3>
                          <div className="flex items-center mt-1">
                            <Building className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600 truncate">
                              {certification.issuingOrganization}
                            </span>
                          </div>
                          {/* Status Chip under Provider */}
                          <div className="mt-3">
                            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              certification.status === 'active'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
                                : certification.status === 'draft'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {getStatusIcon(certification.status)}
                              <span className="ml-1.5">
                                {formatToTitleCase(certification.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          
                          <DropdownMenuItem onClick={() => handleEdit(certification)} className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleStatusToggle(certification)}
                            className="cursor-pointer"
                          >
                            {certification.status === 'active' ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => {
                              setCertificationToDelete(certification._id)
                              setDeleteModalOpen(true)
                            }}
                            className="text-red-600 cursor-pointer focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Highlighted Certification Info Block */}
                  <div className="px-6 pb-6">
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-100">
                      {certification.description && (
                        <p className="text-sm text-gray-700 leading-relaxed mb-3 overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const
                        }}>
                          {certification.description}
                        </p>
                      )}

                      {certification.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {certification.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-200 shadow-sm">
                              {skill}
                            </span>
                          ))}
                          {certification.skills.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-gray-500 border border-gray-200 shadow-sm">
                              +{certification.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {!certification.description && certification.skills.length === 0 && (
                        <div className="text-center py-2">
                          <p className="text-xs text-gray-500">No additional details available</p>
                        </div>
                      )}
                    </div>

                    {/* Footer with metadata */}
                    <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                      <span>Created {new Date(certification.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-2"></div>
                        {certification.attachments?.length || 0} files
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        <ResponsiveDialog
          open={createModalOpen}
          onOpenChange={(open) => {
            setCreateModalOpen(open)
            if (!open) {
              setEditingCertification(null)
              setFormData({
                name: '',
                description: '',
                issuingOrganization: '',
                skills: [],
                tags: [],
                attachments: []
              })
            }
          }}
          title={editingCertification ? 'Edit Certification' : 'Create Certification'}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Certification Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter certification name"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="issuingOrganization" className="text-sm font-medium">
                  Issuing Organization *
                </label>
                <Input
                  id="issuingOrganization"
                  value={formData.issuingOrganization}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuingOrganization: e.target.value }))}
                  placeholder="Enter issuing organization"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter certification description"
                  className="min-h-[80px] px-3 py-2 text-sm border border-input rounded-md"
                  rows={3}
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingCertification ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingCertification ? 'Update Certification' : 'Create Certification'
                )}
              </Button>
            </div>
          </form>
        </ResponsiveDialog>

        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Certification"
          description="Are you sure you want to delete this certification? This action cannot be undone."
          confirmText="Delete"
          onConfirm={handleDelete}
          isLoading={isDeleting}
          variant="destructive"
        />
      </PageContent>
    </MainLayout>
  )
}