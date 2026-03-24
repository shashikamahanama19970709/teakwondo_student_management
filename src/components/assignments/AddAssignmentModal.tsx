'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { Calendar } from 'lucide-react'

interface AddAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (assignmentData: {
    title: string
    description: string
    deadline: string
    course: string
    unit: string
  }) => void
  isLoading?: boolean
  preSelectedCourse?: string
  preSelectedUnit?: string
  source?: string
  onAssignmentCreated?: () => void // Add this callback
}

export function AddAssignmentModal({ isOpen, onClose, onSubmit, isLoading = false, preSelectedCourse, preSelectedUnit, source, onAssignmentCreated }: AddAssignmentModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [selectedCourse, setSelectedCourse] = useState(preSelectedCourse || '')
  const [selectedUnit, setSelectedUnit] = useState(preSelectedUnit || '')
  const [courses, setCourses] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])

  // Fetch courses and units on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/system/courses')
        if (response.ok) {
          const data = await response.json()
          setCourses(data.courses || [])
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      }
    }

    fetchCourses()
  }, [])

  // Fetch units when course is selected
  useEffect(() => {
    if (selectedCourse) {
      const fetchUnits = async () => {
        try {
          const response = await fetch(`/api/units?courseId=${selectedCourse}`)
          if (response.ok) {
            const data = await response.json()
           
            setUnits(data.data || [])
          
          } else {
            console.error('Failed to fetch units:', response.statusText, response.status)
          }
        } catch (error) {
          console.error('Error fetching units:', error)
        }
      }

      fetchUnits()
    } else {
      setUnits([])
      setSelectedUnit('')
    }
  }, [selectedCourse])

  // Custom classes for consistent styling like announcement popup
  const inputClasses = "h-[44px] border border-[#E5E7EB] rounded-[8px] px-[12px] text-[14px] transition-all duration-200 focus:border-[#2563EB] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-white/10 dark:text-white dark:focus:border-[#7bffde] dark:focus:shadow-[0_0_0_3px_rgba(123,255,222,0.12)] w-full"
  const labelClasses = "text-[13px] font-medium text-slate-700 block mb-[6px] dark:text-slate-300"

  // Handle pre-selected unit
  useEffect(() => {
    if (preSelectedUnit && units.length > 0) {
      setSelectedUnit(preSelectedUnit)
    }
  }, [preSelectedUnit, units])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if course and unit are either selected or pre-selected
    const hasCourse = selectedCourse || preSelectedCourse
    const hasUnit = selectedUnit || preSelectedUnit
    
    if (!title.trim() || !description.trim() || !deadline || !hasCourse || !hasUnit) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch(`/api/units/${hasUnit}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          deadline
        })
      })

      if (response.ok) {
        // Call the callback if provided
        if (onAssignmentCreated) {
          onAssignmentCreated()
        }

        // Reset form and close modal
        setTitle('')
        setDescription('')
        setDeadline('')
        setSelectedCourse(preSelectedCourse || '')
        setSelectedUnit(preSelectedUnit || '')
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create assignment')
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
      alert('Failed to create assignment')
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setDeadline('')
    setSelectedCourse(preSelectedCourse || '')
    setSelectedUnit(preSelectedUnit || '')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[720px] max-h-[90vh] overflow-hidden p-0 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] bg-white border-0 flex flex-col transition-all duration-180 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]">
        <DialogHeader className="px-7 py-6 border-b border-slate-100 flex-shrink-0">
          <DialogTitle className="text-[20px] font-semibold text-gray-900">
            Create New Assignment
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create a new assignment with title, description, and deadline for students
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-7 py-6 space-y-7 overflow-y-auto flex-1">
            {/* SECTION A — Assignment Details */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.04em]">Assignment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
                <div>
                  <Label htmlFor="title" className="text-[13px] font-medium text-gray-700 block mb-1.5">Assignment Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Chapter 1 Assignment, Midterm Project"
                    className="h-10 px-3 border border-gray-200 rounded-lg text-[14px] transition-all duration-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12"
                    required
                  />
                </div>

                {(!preSelectedCourse) && (
                  <div>
                    <Label htmlFor="course" className="text-[13px] font-medium text-gray-700 block mb-1.5">Course <span className="text-red-500">*</span></Label>
                    <select
                      id="course"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="h-10 px-3 border border-gray-200 rounded-lg text-[14px] bg-white transition-all duration-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12"
                      required
                    >
                      <option value="">Select a course</option>
                      {courses.map(course => (
                        <option key={course._id} value={course._id}>
                          {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(!preSelectedUnit) && (
                  <div>
                    <Label htmlFor="unit" className="text-[13px] font-medium text-gray-700 block mb-1.5">Unit <span className="text-red-500">*</span></Label>
                    <select
                      id="unit"
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="h-10 px-3 border border-gray-200 rounded-lg text-[14px] bg-white transition-all duration-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12 disabled:bg-gray-50 disabled:text-gray-500"
                      disabled={!selectedCourse}
                      required
                    >
                      <option value="">Select a unit</option>
                      {units.map(unit => (
                        <option key={unit._id} value={unit._id}>
                          {unit.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="md:col-span-2">
                  <Label htmlFor="deadline" className="text-[13px] font-medium text-gray-700 block mb-1.5">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Deadline <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="h-10 px-3 border border-gray-200 rounded-lg text-[14px] bg-white transition-all duration-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12"
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECTION B — Description */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.04em]">Description</h3>
              <div>
                <Label htmlFor="description" className="text-[13px] font-medium text-gray-700 block mb-1.5">Assignment Description <span className="text-red-500">*</span></Label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Enter assignment description..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="sticky bottom-0 bg-white border-t border-slate-100 flex justify-end space-x-3 px-7 py-4 flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="text-[#374151] bg-transparent hover:bg-gray-100 h-10 px-5 font-medium text-[14px] rounded-lg transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !deadline || !selectedCourse || !selectedUnit || isLoading}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:bg-[#CBD5E1] disabled:text-gray-500 disabled:border-transparent disabled:cursor-not-allowed h-10 px-[20px] font-medium text-[14px] rounded-lg transition-all duration-200 shadow-sm"
            >
              {isLoading ? 'Creating Assignment...' : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
