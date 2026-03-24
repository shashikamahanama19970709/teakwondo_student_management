'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, Users, Edit, Save, X, FileText, Eye } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Assignment {
  _id: string
  title: string
  description: string
  deadline: string
  maxScore?: number
  createdBy: {
    _id: string
    firstName: string
    lastName: string
  }
  createdAt: string
  unit: {
    _id: string
    title: string
    description: string
  }
  course: {
    _id: string
    name: string
  }
}

export default function AssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.id as string

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    deadline: '',
    maxScore: ''
  })

  useEffect(() => {
    fetchAssignment()
    fetchUserRole()
  }, [assignmentId])

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/role')
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.role)
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const fetchAssignment = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/assignments/${assignmentId}`)
      if (response.ok) {
        const data = await response.json()
        setAssignment(data)
        setEditForm({
          title: data.title,
          description: data.description,
          deadline: data.deadline ? format(new Date(data.deadline), "yyyy-MM-dd'T'HH:mm") : '',
          maxScore: data.maxScore?.toString() || ''
        })
      } else {
        setError('Assignment not found')
      }
    } catch (error) {
      console.error('Error fetching assignment:', error)
      setError('Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (assignment) {
      setEditForm({
        title: assignment.title,
        description: assignment.description,
        deadline: assignment.deadline ? format(new Date(assignment.deadline), "yyyy-MM-dd'T'HH:mm") : '',
        maxScore: assignment.maxScore?.toString() || ''
      })
    }
  }

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          deadline: editForm.deadline,
          maxScore: editForm.maxScore ? parseInt(editForm.maxScore) : undefined
        })
      })

      if (response.ok) {
        const updatedAssignment = await response.json()
        setAssignment(updatedAssignment)
        setIsEditing(false)
      } else {
        alert('Failed to update assignment')
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      alert('Failed to update assignment')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Assignment Not Found</h1>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
          ← Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input
                        id="deadline"
                        type="datetime-local"
                        value={editForm.deadline}
                        onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxScore">Max Score (Optional)</Label>
                      <Input
                        id="maxScore"
                        type="number"
                        value={editForm.maxScore}
                        onChange={(e) => setEditForm({ ...editForm, maxScore: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-2xl mb-2">{assignment.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: {format(new Date(assignment.deadline), 'PPP p')}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {assignment.course.name}
                    </div>
                    {assignment.maxScore && (
                      <Badge variant="outline">
                        Max Score: {assignment.maxScore}
                      </Badge>
                    )}
                  </div>
                  {assignment.description && (
                    <p className="text-gray-700">{assignment.description}</p>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSaveEdit} size="sm">
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  {(userRole === 'admin' || userRole === 'teacher') && (
                    <Button onClick={handleEdit} variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  {userRole === 'student' && (
                    <Link href={`/assignments/${assignment._id}/submit`}>
                      <Button size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        Submit Assignment
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>

        {!isEditing && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Course Information</h3>
                <p className="text-sm text-gray-600">{assignment.course.name}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Unit Information</h3>
                <p className="text-sm text-gray-600">{assignment.unit.title}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
