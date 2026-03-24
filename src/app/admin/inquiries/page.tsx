'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useOrganization } from '@/hooks/useOrganization'
import { InviteMemberModal } from '@/components/members/InviteMemberModal'
import {
  Plus,
  Search,
  Filter,
  UserPlus,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  Loader2,
  Inbox,
  GraduationCap,
  MessageSquare,
  Mail,
  Phone
} from 'lucide-react'

interface Inquiry {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
  status: 'PENDING' | 'ATTENDED' | 'STUDENT_ADDED'
  announcementTitle?: string
  type?: string
  createdAt: string
  updatedAt: string
}

export default function InquiriesAdminPage() {
  const router = useRouter()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<string>('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    pages: 0
  })

  const { organization } = useOrganization()

  useEffect(() => {
    fetchInquiries()
  }, [pagination.page, statusFilter])

  const fetchInquiries = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/inquiries?${params}`)
      if (!response.ok) throw new Error('Failed to fetch inquiries')
      const data = await response.json()

      setInquiries(data.inquiries)
      setPagination(prev => ({
        ...prev,
        total: data.total,
        pages: data.pages
      }))
    } catch (error) {
      console.error('Error fetching inquiries:', error)
      toast.error('Failed to load inquiries')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchInquiries()
  }

  const handleStatusUpdate = async (inquiryId: string, newStatus: 'PENDING' | 'ATTENDED' | 'STUDENT_ADDED') => {
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')

      // Update local state
      setInquiries(prev => prev.map(inq =>
        inq._id === inquiryId ? { ...inq, status: newStatus } : inq
      ))

      toast.success(`Inquiry marked as ${newStatus.toLowerCase()}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update inquiry status')
    }
  }

  const handleViewMessage = (message: string) => {
    setSelectedMessage(message)
    setShowMessageDialog(true)
  }

  const handleAddAsStudent = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setShowInviteModal(true)
  }

  const handleCreateStudentFromInquiry = async (memberData: any): Promise<{ error?: string } | void> => {
    if (!selectedInquiry) return { error: 'No inquiry selected' }

    try {
      // First check if email already exists
      const checkResponse = await fetch('/api/users/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberData.email })
      })

      if (checkResponse.ok) {
        const { exists } = await checkResponse.json()
        if (exists) {
          return { error: 'A user with this email already exists' }
        }
      }

      // Create the student account
      const createResponse = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...memberData,
          role: 'student',
          organization: organization?.id
        })
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        return { error: errorData.error || 'Failed to create student account' }
      }

      // Update inquiry status to STUDENT_ADDED
      await handleStatusUpdate(selectedInquiry._id, 'STUDENT_ADDED')

      toast.success('Student account created successfully')
      setShowInviteModal(false)
      setSelectedInquiry(null)
      router.push('/team/members')
    } catch (error) {
      console.error('Error creating student:', error)
      return { error: error instanceof Error ? error.message : 'Failed to create student account' }
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { color: 'bg-orange-100 text-orange-800', label: 'Pending' },
      ATTENDED: { color: 'bg-blue-100 text-blue-800', label: 'Attended' },
      STUDENT_ADDED: { color: 'bg-green-100 text-green-800', label: 'Student Added' }
    }
    return badges[status as keyof typeof badges] || badges.PENDING
  }

  const getActionButtons = (inquiry: Inquiry) => {
    switch (inquiry.status) {
      case 'PENDING':
        return (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddAsStudent(inquiry)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 w-full"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Add as Student
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Attended
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark as Attended</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to mark this inquiry as attended? This indicates you have manually handled this inquiry.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleStatusUpdate(inquiry._id, 'ATTENDED')}
                  >
                    Mark as Attended
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      case 'ATTENDED':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusUpdate(inquiry._id, 'PENDING')}
            className="text-gray-600 hover:text-gray-700 w-full"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Mark Pending
          </Button>
        )
      case 'STUDENT_ADDED':
        return (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center text-green-700 dark:text-green-400">
              <GraduationCap className="h-4 w-4 mr-2" />
              <span className="font-medium">Student Created</span>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Inquiry Management</h1>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="status-filter" className="text-sm font-medium">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ATTENDED">Attended</SelectItem>
                  <SelectItem value="STUDENT_ADDED">Student Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full sm:w-auto">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Inquiries Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {inquiries.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="bg-gray-50 p-8 rounded-full mb-4">
                <Inbox className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Inquiries Found</h3>
              <p className="text-center text-gray-600 max-w-md">
                There are currently no inquiries to display. New inquiries will appear here when submitted.
              </p>
            </div>
          ) : (
            inquiries.map((inquiry) => (
              <div
                key={inquiry._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {inquiry.firstName} {inquiry.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {inquiry.type === 'Custom' ? 'Custom Inquiry' : inquiry.announcementTitle || 'General Inquiry'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(inquiry.status).color}`}>
                    {getStatusBadge(inquiry.status).label}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{inquiry.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span>{inquiry.phone}</span>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-4">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {inquiry.message.length > 100 ? `${inquiry.message.substring(0, 100)}...` : inquiry.message}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewMessage(inquiry.message)}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {getActionButtons(inquiry)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} inquiries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-3"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const startPage = Math.max(1, pagination.page - 2)
                  const pageNum = startPage + i
                  if (pageNum > pagination.pages) return null
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Create Student Modal */}
        {showInviteModal && selectedInquiry && (
          <InviteMemberModal
            onClose={() => {
              setShowInviteModal(false)
              setSelectedInquiry(null)
            }}
            onAction={handleCreateStudentFromInquiry}
            initialData={{
              firstName: selectedInquiry.firstName,
              lastName: selectedInquiry.lastName,
              email: selectedInquiry.email,
              phone: selectedInquiry.phone,
              role: 'student'
            }}
            readOnlyFields={['firstName', 'lastName', 'email', 'phone']}
          />
        )}

        {/* Message Dialog */}
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Full Message
              </DialogTitle>
            </DialogHeader>
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <p className="text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                {selectedMessage}
              </p>
            </div>
            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button 
                onClick={() => setShowMessageDialog(false)}
                className="px-6"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}