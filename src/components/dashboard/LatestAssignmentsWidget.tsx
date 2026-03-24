'use client'

import { useState, useEffect } from 'react'
import { FileText, Clock, Calendar, Users, Eye, Plus, Download, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { AddAssignmentModal } from '@/components/assignments/AddAssignmentModal'
import { EditAssignmentModal } from '@/components/assignments/EditAssignmentModal'

interface AssignmentItem {
  _id: string
  title: string
  description?: string
  course: {
    _id: string
    name: string
  }
  unit: {
    _id: string
    name: string
  }
  dueDate: Date
  isActive: boolean
  batchName?: string
  groupName?: string
  createdBy: {
    _id: string
    firstName: string
    lastName: string
  }
  submissions?: any[]
  maxScore?: number
  submission?: {
    fileName: string
    fileSize: number
    submittedAt: string
    fileUrl: string
  }
}

interface LatestAssignmentsWidgetProps {
  userRole: string
  className?: string
}

export function LatestAssignmentsWidget({ userRole, className = '' }: LatestAssignmentsWidgetProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [assignmentModalSource, setAssignmentModalSource] = useState('')
  const [assignmentModalCourseId, setAssignmentModalCourseId] = useState('')
  const [assignmentModalUnitId, setAssignmentModalUnitId] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<AssignmentItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchLatestAssignments()
  }, [])

  const fetchLatestAssignments = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/assignments/latest')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to load assignments')
      }
    } catch (error) {
      console.error('Error fetching latest assignments:', error)
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignmentSubmit = async (assignmentData: any) => {
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update the unit with the new assignment if unit is specified
        if (assignmentData.unit) {
          try {
            const updateResponse = await fetch(`/api/units/${assignmentData.unit}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                $push: { assignments: result.assignment._id }
              })
            })
            
            if (updateResponse.ok) {
              console.log('Assignment added to unit successfully')
            }
          } catch (error) {
            console.error('Error updating unit:', error)
          }
        }
        
        setIsAssignmentModalOpen(false)
        fetchLatestAssignments() // Refresh the assignments list
      } else {
        alert('Failed to create assignment')
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
      alert('Failed to create assignment')
    }
  }

  const handleEditAssignment = async (assignmentData: any) => {
    if (!selectedAssignment) return

    try {
      const response = await fetch(`/api/units/${selectedAssignment.unit._id}/assignments/${selectedAssignment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData)
      })

      if (response.ok) {
        setIsEditModalOpen(false)
        setSelectedAssignment(null)
        fetchLatestAssignments() // Refresh assignments list
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update assignment')
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      alert('Failed to update assignment')
    }
  }

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/units/${assignmentToDelete.unit._id}/assignments/${assignmentToDelete._id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setShowDeleteDialog(false)
        setAssignmentToDelete(null)
        fetchLatestAssignments() // Refresh assignments list
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete assignment')
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Failed to delete assignment')
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (dueDate?: Date) => {
    if (!dueDate) return 'bg-gray-100 text-gray-800 border-gray-200'
    const now = new Date()
    const due = new Date(dueDate)
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0) {
      return 'bg-red-100 text-red-800 border-red-200'
    } else if (daysUntilDue <= 1) {
      return 'bg-orange-100 text-orange-800 border-orange-200'
    } else if (daysUntilDue <= 3) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    } else {
      return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const getStatusText = (dueDate?: Date) => {
    if (!dueDate) return 'No due date'
    const now = new Date()
    const due = new Date(dueDate)
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0) {
      return 'Overdue'
    } else if (daysUntilDue === 0) {
      return 'Due Today'
    } else if (daysUntilDue === 1) {
      return 'Due Tomorrow'
    } else {
      return `Due in ${daysUntilDue} days`
    }
  }

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Latest Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Latest Assignments
            </CardTitle>
            {(userRole === 'admin' || userRole === 'teacher') && (
              <Button size="sm" className="flex items-center gap-1" onClick={() => {
                setIsAssignmentModalOpen(true)
                setAssignmentModalSource('dashboard')
                setAssignmentModalCourseId('')
                setAssignmentModalUnitId('')
              }}>
                <Plus className="h-3 w-3" />
                Create Assignment
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchLatestAssignments} size="sm" className="mt-2">
                Retry
              </Button>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No assignments available.</p>
              {(userRole === 'admin' || userRole === 'teacher') && (
                <Button size="sm" className="mt-4" onClick={() => {
                  setIsAssignmentModalOpen(true)
                  setAssignmentModalSource('dashboard')
                  setAssignmentModalCourseId('')
                  setAssignmentModalUnitId('')
                }}>
                  Create Your First Assignment
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.filter(assignment => assignment && assignment._id).slice(0, 4).map((assignment) => (
                <div
                  key={assignment._id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-green-100 text-green-800">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{assignment.title || 'Untitled Assignment'}</h4>
                      {assignment.dueDate && (
                        <Badge variant="outline" className={`text-xs ${getStatusColor(assignment.dueDate)}`}>
                          {getStatusText(assignment.dueDate)}
                        </Badge>
                      )}
                    </div>
                   
                    {assignment.batchName && (
                      <p className="text-xs text-gray-500 mb-1">Batch: {assignment.batchName}</p>
                    )}
                    {assignment.maxScore && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span>Max Score: {assignment.maxScore}</span>
                        {assignment.submissions && (
                          <span>• {assignment.submissions.length} submissions</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      Due: {formatDate(assignment.dueDate || new Date())}
                    </div>
                    {userRole === 'student' && assignment.submission && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-3 w-3 text-green-600" />
                          <span className="font-medium text-green-800">Submitted</span>
                        </div>
                        <p className="text-gray-700">{assignment.submission.fileName}</p>
                        <p className="text-gray-600">Size: {(assignment.submission.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1"
                          onClick={() => window.open(`/api/download/${assignment.submission!.fileUrl.split('/').slice(-2).join('/')}`, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {(userRole === 'admin' || userRole === 'teacher') && (
                      <Link href={`/units/${assignment.unit._id}/assignments/${assignment._id}`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
                      )}
                      {(userRole === 'admin' || userRole === 'teacher') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            setSelectedAssignment(assignment)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      )}
                      {(userRole === 'admin' || userRole === 'teacher') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setAssignmentToDelete(assignment)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      )}
                      {userRole === 'student' && (
                        <Link href={`/assignments/${assignment._id}/submit`}>
                          <Button size="sm" className="text-xs">
                            Submit
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {assignments.length > 0 && (
                <div className="text-center pt-2">
                  {(userRole === 'admin' || userRole === 'teacher') && (
                    <Link href="/assignments">
                      <Button variant="outline" size="sm">
                        View All Assignments
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <AddAssignmentModal 
        isOpen={isAssignmentModalOpen} 
        onClose={() => {
          setIsAssignmentModalOpen(false)
          setAssignmentModalSource('')
          setAssignmentModalCourseId('')
          setAssignmentModalUnitId('')
        }} 
        onSubmit={handleAssignmentSubmit}
        preSelectedCourse={assignmentModalCourseId}
        preSelectedUnit={assignmentModalUnitId}
        source={assignmentModalSource}
      />
      <EditAssignmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedAssignment(null)
        }}
        onSubmit={handleEditAssignment}
        assignment={selectedAssignment ? {
          _id: selectedAssignment._id,
          title: selectedAssignment.title,
          description: selectedAssignment.description || '',
          deadline: selectedAssignment.dueDate ? new Date(selectedAssignment.dueDate).toISOString() : ''
        } : null}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && assignmentToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Assignment
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900">"{assignmentToDelete.title}"</span>? 
                This action cannot be undone and will permanently remove the assignment and all associated submissions.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false)
                    setAssignmentToDelete(null)
                  }}
                  className="flex-1"
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAssignment}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Assignment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
