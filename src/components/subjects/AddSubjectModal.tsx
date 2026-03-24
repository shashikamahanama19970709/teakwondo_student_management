'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/Badge'
import { X, Loader2, Plus } from 'lucide-react'
import { useNotify } from '@/lib/notify'

interface AddSubjectModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSubjectAdded: () => void
}

interface SubjectFormData {
  name: string
  code: string
  description: string
  totalLessons: string
  order: string
  status: 'active' | 'draft'
}

const initialFormData: SubjectFormData = {
  name: '',
  code: '',
  description: '',
  totalLessons: '',
  order: '',
  status: 'active'
}

export function AddSubjectModal({ isOpen, onClose, projectId, onSubjectAdded }: AddSubjectModalProps) {
  const [formData, setFormData] = useState<SubjectFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<SubjectFormData>>({})
  const { success: notifySuccess, error: notifyError } = useNotify()

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData)
      setErrors({})
    }
  }, [isOpen])

  // Auto-uppercase subject code
  useEffect(() => {
    if (formData.code) {
      setFormData(prev => ({ ...prev, code: prev.code.toUpperCase() }))
    }
  }, [formData.code])

  const validateForm = (): boolean => {
    const newErrors: Partial<SubjectFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Subject name is required'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Subject code is required'
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Subject code must contain only letters and numbers'
    }

    if (!formData.totalLessons.trim()) {
      newErrors.totalLessons = 'Total lessons is required'
    } else {
      const lessons = parseInt(formData.totalLessons)
      if (isNaN(lessons) || lessons < 1) {
        newErrors.totalLessons = 'Total lessons must be a number greater than 0'
      }
    }

    if (formData.order && (isNaN(parseInt(formData.order)) || parseInt(formData.order) < 0)) {
      newErrors.order = 'Order must be a number 0 or greater'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof SubjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim(),
        totalLessons: parseInt(formData.totalLessons),
        order: formData.order ? parseInt(formData.order) : 0,
        status: formData.status,
        projectId
      }

      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (data.success) {
        notifySuccess({ title: 'Subject Added', message: 'Subject has been added successfully' })
        onSubjectAdded()
        onClose()
      } else {
        if (data.error?.includes('code')) {
          setErrors({ code: 'Subject code must be unique for this course' })
        } else {
          notifyError({ title: 'Failed to Add Subject', message: data.error || 'An error occurred' })
        }
      }
    } catch (error) {
      console.error('Error adding subject:', error)
      notifyError({ title: 'Failed to Add Subject', message: 'Please try again' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.name.trim() && formData.code.trim() && formData.totalLessons.trim()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm border border-white/70 shadow-[0_25px_70px_rgba(15,23,42,0.08)] [&>button]:hidden">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-slate-900">
                Add Subjects to Course
              </DialogTitle>
              <DialogDescription className="text-slate-600 mt-1">
                Create and assign subjects for this course
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-slate-700">
              Subject Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g. Fundamentals of Care"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`transition-colors ${errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-400'}`}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Subject Code */}
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-medium text-slate-700">
              Subject Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              type="text"
              placeholder="e.g. FOC101"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
              className={`transition-colors ${errors.code ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-400'}`}
            />
            {errors.code && (
              <p className="text-sm text-red-600">{errors.code}</p>
            )}
            <p className="text-xs text-slate-500">Auto-uppercase, must be unique per course</p>
          </div>

          {/* Subject Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-slate-700">
              Subject Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what this subject covers..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="resize-none border-slate-200 focus:border-slate-400"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Optional</span>
              <span>{formData.description.length}/500</span>
            </div>
          </div>

          {/* Total Lessons */}
          <div className="space-y-2">
            <Label htmlFor="totalLessons" className="text-sm font-medium text-slate-700">
              Total Lessons <span className="text-red-500">*</span>
            </Label>
            <Input
              id="totalLessons"
              type="number"
              placeholder="e.g. 12"
              min="1"
              value={formData.totalLessons}
              onChange={(e) => handleInputChange('totalLessons', e.target.value)}
              className={`transition-colors ${errors.totalLessons ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-400'}`}
            />
            {errors.totalLessons && (
              <p className="text-sm text-red-600">{errors.totalLessons}</p>
            )}
          </div>

          {/* Order and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order" className="text-sm font-medium text-slate-700">
                Order / Sequence
              </Label>
              <Input
                id="order"
                type="number"
                placeholder="e.g. 1"
                min="0"
                value={formData.order}
                onChange={(e) => handleInputChange('order', e.target.value)}
                className={`transition-colors ${errors.order ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-400'}`}
              />
              {errors.order && (
                <p className="text-sm text-red-600">{errors.order}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'draft') => handleInputChange('status', value)}>
                <SelectTrigger className="border-slate-200 focus:border-slate-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="draft">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-800 text-xs">Draft</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-slate-200 bg-white hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Subject...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </>
              )}
            </Button>
          </div>
        </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}