'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { Calendar } from 'lucide-react'

interface EditAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (assignmentData: {
    title: string
    description: string
    deadline: string
  }) => void
  assignment: {
    _id: string
    title: string
    description: string
    deadline: string
  } | null
  isLoading?: boolean
}

export function EditAssignmentModal({ isOpen, onClose, onSubmit, assignment, isLoading = false }: EditAssignmentModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState('')

  // Initialize form with assignment data when assignment changes
  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title)
      setDescription(assignment.description)
      const deadlineDate = new Date(assignment.deadline)
      if (!isNaN(deadlineDate.getTime())) {
        setDeadline(deadlineDate.toISOString().slice(0, 16))
      } else {
        setDeadline('')
      }
    } else {
      // Reset form when no assignment
      setTitle('')
      setDescription('')
      setDeadline('')
    }
    setError('')
  }, [assignment, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      setError('Assignment title is required')
      return
    }
    
    if (!description.trim()) {
      setError('Assignment description is required')
      return
    }
    
    if (!deadline) {
      setError('Deadline is required')
      return
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        deadline
      })
      onClose()
    } catch (error) {
      setError('Failed to update assignment')
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription className="sr-only">
            Edit existing assignment details, description, and deadline
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Assignment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Assignment Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter assignment title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Enter assignment description and instructions..."
                />
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Assignment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
