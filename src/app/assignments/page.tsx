'use client'

import { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { PageContent } from '@/components/ui/PageContent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Calendar, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit, 
  Trash2,
  Clock,
  User,
  BookOpen
} from 'lucide-react'
import { AssignmentCard } from '@/components/assignments/AssignmentCard'
import { EditAssignmentModal } from '@/components/assignments/EditAssignmentModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDistanceToNow } from 'date-fns'

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUnit, setSelectedUnit] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  
  // Modal and dialog states
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; assignmentId: string | null; unitId: string | null }>({ isOpen: false, assignmentId: null, unitId: null })

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    try {
      const res = await fetch('/api/assignments')
      if (!res.ok) throw new Error('Failed to load assignments')
      const data = await res.json()
      setAssignments(data)
    } catch (error) {
      setError('Failed to load assignments')
    } finally {
      setIsLoading(false)
    }
  }

  // Get unique units for filter
  const uniqueUnits = useMemo(() => {
    const units = new Map()
    assignments.forEach(assignment => {
      if (assignment.unit) {
        units.set(assignment.unit._id, assignment.unit.title)
      }
    })
    return Array.from(units.entries()).map(([id, title]) => ({ id, title }))
  }, [assignments])

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesUnit = selectedUnit === 'all' || assignment.unit?._id === selectedUnit
      
      const isOverdue = new Date() > new Date(assignment.deadline)
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'overdue' && isOverdue) ||
                           (statusFilter === 'active' && !isOverdue)
      
      return matchesSearch && matchesUnit && matchesStatus
    })
  }, [assignments, searchTerm, selectedUnit, statusFilter])

  // Pagination
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAssignments.slice(start, start + itemsPerPage)
  }, [filteredAssignments, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage)

  const handleViewAssignment = (assignmentId: string, unitId: string) => {
    window.location.href = `/units/${unitId}/assignments/${assignmentId}`
  }

  const handleEditAssignment = (assignmentId: string) => {
    const assignment = assignments.find(a => a._id === assignmentId)
    if (assignment) {
      setEditingAssignment(assignment)
    }
  }

  const handleUpdateAssignment = async (assignmentData: any) => {
    if (!editingAssignment) return
    
    try {
      const res = await fetch(`/api/units/${editingAssignment.unit._id}/assignments/${editingAssignment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update assignment')
      }
      
      setEditingAssignment(null)
      loadAssignments()
    } catch (error: any) {
      alert(error.message || 'Failed to update assignment')
      throw error
    }
  }

  const handleDeleteAssignment = (assignmentId: string) => {
    const assignment = assignments.find(a => a._id === assignmentId)
    if (assignment) {
      setDeleteDialog({ isOpen: true, assignmentId, unitId: assignment.unit?._id })
    }
  }

  const confirmDeleteAssignment = async () => {
    if (!deleteDialog.assignmentId || !deleteDialog.unitId) return
    
    try {
      const res = await fetch(`/api/units/${deleteDialog.unitId}/assignments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: deleteDialog.assignmentId })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete assignment')
      }
      
      loadAssignments()
    } catch (error: any) {
      alert(error.message || 'Failed to delete assignment')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <MainLayout>
        <PageContent>Loading assignments...</PageContent>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <PageContent>
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </PageContent>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <PageContent>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">All Assignments</h1>
              <p className="text-muted-foreground">
                {assignments.length} total assignments across all units
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    {uniqueUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Items per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 per page</SelectItem>
                    <SelectItem value="12">12 per page</SelectItem>
                    <SelectItem value="24">24 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Assignments List */}
          {paginatedAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <div className="space-y-2">
                  <p className="text-gray-500">No assignments found</p>
                  <p className="text-sm text-gray-400">
                    {searchTerm || selectedUnit !== 'all' || statusFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Create your first assignment to get started'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {paginatedAssignments.map((assignment) => (
                <Card key={assignment._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{assignment.title}</h3>
                          <Badge className={
                            new Date() > new Date(assignment.deadline) 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                          }>
                            {new Date() > new Date(assignment.deadline) ? 'Overdue' : 'Active'}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {assignment.description.replace(/<[^>]*>/g, '')}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{assignment.unit?.title || 'Unknown Unit'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Due: {formatDate(assignment.deadline)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{assignment.createdBy?.name || assignment.createdBy?.email || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAssignment(assignment._id, assignment.unit?._id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAssignment(assignment._id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAssignment(assignment._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAssignments.length)} of {filteredAssignments.length} assignments
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <EditAssignmentModal
          isOpen={!!editingAssignment}
          onClose={() => setEditingAssignment(null)}
          onSubmit={handleUpdateAssignment}
          assignment={editingAssignment}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, assignmentId: null, unitId: null })}
          onConfirm={confirmDeleteAssignment}
          title="Delete Assignment"
          message="Are you sure you want to delete this assignment? This action cannot be undone and all assignment data will be permanently removed."
          confirmText="Delete Assignment"
          cancelText="Cancel"
          variant="danger"
        />
      </PageContent>
    </MainLayout>
  )
}
