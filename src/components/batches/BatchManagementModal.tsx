'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { X, Loader2, Plus, Calendar, DollarSign, Award, Users, Trash2, Edit } from 'lucide-react'
import { useNotify } from '@/lib/notify'
import { formatDate } from '@/lib/utils'

interface BatchManagementModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  groupName: string
  onBatchCreated: () => void
}

interface Batch {
  _id: string
  batchName: string
  timeline: {
    startDate: string
    endDate: string
  }
  budget: {
    totalBudget: number
    currency: string
    lecturerPayment: number
    materialCost: number
  }
  badge: {
    title: string
    description: string
    status: 'ONGOING' | 'COMPLETED'
  }
  students: string[]
}

interface BatchFormData {
  batchName: string
  startDate: string
  endDate: string
  totalBudget: string
  currency: string
  lecturerPayment: string
  materialCost: string
  badgeTitle: string
  badgeDescription: string
}

const initialFormData: BatchFormData = {
  batchName: '',
  startDate: '',
  endDate: '',
  totalBudget: '',
  currency: 'LKR',
  lecturerPayment: '',
  materialCost: '',
  badgeTitle: '',
  badgeDescription: ''
}

export function BatchManagementModal({ isOpen, onClose, projectId, groupName, onBatchCreated }: BatchManagementModalProps) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<BatchFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<BatchFormData>>({})
  const { success: notifySuccess, error: notifyError } = useNotify()

  // Fetch batches when modal opens
  useEffect(() => {
    if (isOpen && projectId && groupName) {
      fetchBatches()
    }
  }, [isOpen, projectId, groupName])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData)
      setErrors({})
      setShowCreateForm(false)
    }
  }, [isOpen])

  const fetchBatches = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/batches?projectId=${projectId}&groupName=${encodeURIComponent(groupName)}`)
      if (response.ok) {
        const data = await response.json()
        setBatches(data.data || [])
      } else {
        notifyError({ title: 'Failed to load batches', message: 'Please try again' })
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error)
      notifyError({ title: 'Failed to load batches', message: 'Please try again' })
    } finally {
      setLoading(false)
    }
  }

  const generateBatchName = () => {
    const batchNumber = batches.length + 1
    return `Batch ${batchNumber}`
  }

  const handleInputChange = (field: keyof BatchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<BatchFormData> = {}

    if (!formData.batchName.trim()) {
      newErrors.batchName = 'Batch name is required'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date'
      }
    }

    if (!formData.totalBudget.trim()) {
      newErrors.totalBudget = 'Total budget is required'
    } else {
      const budget = parseFloat(formData.totalBudget)
      if (isNaN(budget) || budget < 0) {
        newErrors.totalBudget = 'Total budget must be a valid positive number'
      }
    }

    if (!formData.lecturerPayment.trim()) {
      newErrors.lecturerPayment = 'Lecturer payment is required'
    } else {
      const payment = parseFloat(formData.lecturerPayment)
      if (isNaN(payment) || payment < 0) {
        newErrors.lecturerPayment = 'Lecturer payment must be a valid positive number'
      }
    }

    if (!formData.materialCost.trim()) {
      newErrors.materialCost = 'Material cost is required'
    } else {
      const cost = parseFloat(formData.materialCost)
      if (isNaN(cost) || cost < 0) {
        newErrors.materialCost = 'Material cost must be a valid positive number'
      }
    }

    if (!formData.badgeTitle.trim()) {
      newErrors.badgeTitle = 'Badge title is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setCreating(true)

    try {
      const submitData = {
        projectId,
        groupName,
        batchName: formData.batchName.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalBudget: parseFloat(formData.totalBudget),
        currency: formData.currency,
        lecturerPayment: parseFloat(formData.lecturerPayment),
        materialCost: parseFloat(formData.materialCost),
        badgeTitle: formData.badgeTitle.trim(),
        badgeDescription: formData.badgeDescription.trim()
      }

      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (data.success) {
        notifySuccess({ title: 'Batch Created', message: 'Batch has been created successfully' })
        setFormData(initialFormData)
        setShowCreateForm(false)
        fetchBatches()
        onBatchCreated()
      } else {
        if (data.error?.includes('batch name already exists')) {
          setErrors({ batchName: 'Batch name already exists in this group' })
        } else {
          notifyError({ title: 'Failed to Create Batch', message: data.error || 'An error occurred' })
        }
      }
    } catch (error) {
      console.error('Error creating batch:', error)
      notifyError({ title: 'Failed to Create Batch', message: 'Please try again' })
    } finally {
      setCreating(false)
    }
  }

  const handleAutoGenerateName = () => {
    setFormData(prev => ({ ...prev, batchName: generateBatchName() }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border border-white/70 shadow-[0_25px_70px_rgba(15,23,42,0.08)] [&>button]:hidden">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-slate-900">
                Manage Batches - {groupName}
              </DialogTitle>
              <DialogDescription className="text-slate-600 mt-1">
                Create and manage batches within this group
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
          <div className="space-y-6">
            {/* Create Batch Button */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-600">
                {batches.length} batch{batches.length !== 1 ? 'es' : ''} in this group
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {showCreateForm ? 'Cancel' : 'Create Batch'}
              </Button>
            </div>

            {/* Create Batch Form */}
            {showCreateForm && (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="text-lg text-red-900">Create New Batch</CardTitle>
                  <CardDescription className="text-red-700">
                    Set up timeline, budget, and badge for the new batch
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateBatch} className="space-y-4">
                    {/* Batch Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="batchName" className="text-sm font-medium text-slate-700">
                          Batch Name <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="batchName"
                            value={formData.batchName}
                            onChange={(e) => handleInputChange('batchName', e.target.value)}
                            placeholder="e.g. Batch 1"
                            className={`transition-colors ${errors.batchName ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-400'}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAutoGenerateName}
                            className="px-3"
                          >
                            Auto
                          </Button>
                        </div>
                        {errors.batchName && (
                          <p className="text-sm text-red-600">{errors.batchName}</p>
                        )}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Timeline <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate" className="text-xs text-slate-600">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                            className={`transition-colors ${errors.startDate ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-400'}`}
                          />
                          {errors.startDate && (
                            <p className="text-sm text-red-600">{errors.startDate}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate" className="text-xs text-slate-600">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                            className={`transition-colors ${errors.endDate ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-400'}`}
                          />
                          {errors.endDate && (
                            <p className="text-sm text-red-600">{errors.endDate}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Budget Configuration <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="totalBudget" className="text-xs text-slate-600">Total Budget</Label>
                          <Input
                            id="totalBudget"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.totalBudget}
                            onChange={(e) => handleInputChange('totalBudget', e.target.value)}
                            placeholder="0.00"
                            className={`transition-colors ${errors.totalBudget ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-400'}`}
                          />
                          {errors.totalBudget && (
                            <p className="text-sm text-red-600">{errors.totalBudget}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currency" className="text-xs text-slate-600">Currency</Label>
                          <Select
                            value={formData.currency}
                            onValueChange={(value) => handleInputChange('currency', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LKR">LKR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="INR">INR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lecturerPayment" className="text-xs text-slate-600">Lecturer Payment</Label>
                          <Input
                            id="lecturerPayment"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.lecturerPayment}
                            onChange={(e) => handleInputChange('lecturerPayment', e.target.value)}
                            placeholder="0.00"
                            className={`transition-colors ${errors.lecturerPayment ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-400'}`}
                          />
                          {errors.lecturerPayment && (
                            <p className="text-sm text-red-600">{errors.lecturerPayment}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="materialCost" className="text-xs text-slate-600">Material Cost</Label>
                          <Input
                            id="materialCost"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.materialCost}
                            onChange={(e) => handleInputChange('materialCost', e.target.value)}
                            placeholder="0.00"
                            className={`transition-colors ${errors.materialCost ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-400'}`}
                          />
                          {errors.materialCost && (
                            <p className="text-sm text-red-600">{errors.materialCost}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Badge Configuration <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="badgeTitle" className="text-xs text-slate-600">Badge Title</Label>
                          <Input
                            id="badgeTitle"
                            value={formData.badgeTitle}
                            onChange={(e) => handleInputChange('badgeTitle', e.target.value)}
                            placeholder="e.g. Course Completion Badge"
                            className={`transition-colors ${errors.badgeTitle ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-400'}`}
                          />
                          {errors.badgeTitle && (
                            <p className="text-sm text-red-600">{errors.badgeTitle}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="badgeDescription" className="text-xs text-slate-600">Badge Description</Label>
                          <Input
                            id="badgeDescription"
                            value={formData.badgeDescription}
                            onChange={(e) => handleInputChange('badgeDescription', e.target.value)}
                            placeholder="Description of the achievement"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                        disabled={creating}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={creating}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Batch'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Batches List */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : batches.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No batches created yet. Create your first batch to get started.
                </div>
              ) : (
                <div className="grid gap-4">
                  {batches.map((batch) => (
                    <Card key={batch._id} className="border-slate-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">{batch.batchName}</CardTitle>
                            <Badge
                              variant={batch.badge.status === 'COMPLETED' ? 'default' : 'secondary'}
                              className={batch.badge.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {batch.badge.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Users className="w-4 h-4" />
                            {batch.students.length} students
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Timeline */}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>
                            {formatDate(new Date(batch.timeline.startDate))} - {formatDate(new Date(batch.timeline.endDate))}
                          </span>
                        </div>

                        {/* Badge */}
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{batch.badge.title}</span>
                          {batch.badge.description && (
                            <span className="text-slate-500">- {batch.badge.description}</span>
                          )}
                        </div>

                        {/* Budget Summary */}
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          <span>
                            Total: {batch.budget.currency} {batch.budget.totalBudget.toLocaleString()} |
                            Lecturer: {batch.budget.currency} {batch.budget.lecturerPayment.toLocaleString()} |
                            Materials: {batch.budget.currency} {batch.budget.materialCost.toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}