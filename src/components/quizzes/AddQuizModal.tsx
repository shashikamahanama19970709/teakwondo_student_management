'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { X, Plus, Trash2, Clock, Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog'

interface Question {
  questionText: string
  type: 'short_answer' | 'multiple_choice'
  options?: string[]
  correctAnswer: string | number
  points: number
}

interface AddQuizModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (quizData: {
    quizName: string
    deadline: string
    duration: number
    questions: Question[]
    course: string
    unit: string
    maxAttempts: number
  }) => void
  preSelectedCourse?: string
  preSelectedUnit?: string
  source?: string
}

export function AddQuizModal({ isOpen, onClose, onSubmit, preSelectedCourse, preSelectedUnit, source }: AddQuizModalProps) {
  const [quizName, setQuizName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [duration, setDuration] = useState(30) // Default 30 minutes
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentStep, setCurrentStep] = useState<'details' | 'questions'>('details')
  const [selectedCourse, setSelectedCourse] = useState(preSelectedCourse || '')
  const [selectedUnit, setSelectedUnit] = useState(preSelectedUnit || '')
  const [courses, setCourses] = useState<any[]>([])
  const [availableUnits, setAvailableUnits] = useState<any[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [maxAttempts, setMaxAttempts] = useState('')

  // Fetch courses and units on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/system/courses')
        
        if (response.ok) {
          const data = await response.json()
          setCourses(data.courses || [])
        } else {
          const errorData = await response.json()
          console.error('Failed to fetch courses:', response.status, errorData)
          setError(`Failed to fetch courses: ${errorData.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
        setError('Network error while fetching courses')
      }
    }

    fetchCourses()
  }, [])

  // Update available units when course is selected
  useEffect(() => {
    if (selectedCourse) {
      const selectedCourseData = courses.find(course => course._id === selectedCourse)
    
      const units = selectedCourseData?.units || []
     
      setAvailableUnits(units)
      
      // Reset selected unit if it's not in the new list
      if (!units.find((unit: any) => unit._id === selectedUnit)) {
        setSelectedUnit('')
      }
    } else {
      setAvailableUnits([])
      setSelectedUnit('')
    }
  }, [selectedCourse, courses, selectedUnit])

  // Handle pre-selected unit
  useEffect(() => {
    if (preSelectedUnit && availableUnits.length > 0) {
      setSelectedUnit(preSelectedUnit)
    }
  }, [preSelectedUnit, availableUnits])

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId)
    setSelectedUnit('')
  }

  // Custom classes for consistent styling like announcement popup
  const inputClasses = "h-[44px] border border-[#E5E7EB] rounded-[8px] px-[12px] text-[14px] transition-all duration-200 focus:border-[#2563EB] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-white/10 dark:text-white dark:focus:border-[#7bffde] dark:focus:shadow-[0_0_0_3px_rgba(123,255,222,0.12)] w-full"
  const textareaClasses = "min-h-[120px] resize-y border border-[#E5E7EB] rounded-[8px] p-[12px] text-[14px] transition-all duration-200 focus:border-[#2563EB] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-white/10 dark:text-white dark:focus:border-[#7bffde] dark:focus:shadow-[0_0_0_3px_rgba(123,255,222,0.12)] w-full"
  const labelClasses = "text-[13px] font-medium text-slate-700 block mb-[6px] dark:text-slate-300"
  const selectClasses = "h-[44px] border border-[#E5E7EB] rounded-[8px] px-[12px] text-[14px] transition-all duration-200 focus:border-[#2563EB] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] bg-white text-slate-900 dark:bg-slate-800 dark:border-white/10 dark:text-white dark:focus:border-[#7bffde] dark:focus:shadow-[0_0_0_3px_rgba(123,255,222,0.12)] w-full"

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if course and unit are either selected or pre-selected
    const hasCourse = selectedCourse || preSelectedCourse
    const hasUnit = selectedUnit || preSelectedUnit
    
    if (quizName.trim() && deadline && duration > 0 && hasCourse && hasUnit && maxAttempts && parseInt(maxAttempts) > 0) {
      setCurrentStep('questions')
    } else {
      setError('Please fill in all required fields, including max attempts (at least 1)')
    }
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      questionText: '',
      type: 'short_answer',
      correctAnswer: '',
      points: 1
    }
    setQuestions([...questions, newQuestion])
    setError('') // Clear error when adding a question
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }
    
    // Clear error when user starts fixing questions
    setError('')
    
    // If changing question type to multiple choice, initialize options
    if (field === 'type' && value === 'multiple_choice') {
      updatedQuestions[index].options = ['', '', '', '']
      updatedQuestions[index].correctAnswer = 0
    } else if (field === 'type' && value === 'short_answer') {
      updatedQuestions[index].options = undefined
      updatedQuestions[index].correctAnswer = ''
    }
    
    setQuestions(updatedQuestions)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions]
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = ['', '', '', '']
    }
    updatedQuestions[questionIndex].options![optionIndex] = value
    setQuestions(updatedQuestions)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate questions
    if (questions.length === 0) {
      setError('Please add at least one question before creating the quiz')
      return
    }

    const incompleteQuestions = questions.filter((q, index) => {
      
      if (!q.questionText || !q.questionText.trim()) {
        return true
      }
      
      if (q.type === 'multiple_choice') {
        // For multiple choice, correctAnswer should be a number (0-3)
        if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
          return true
        }
        if (!q.options || q.options.length !== 4) {
          return true
        }
        if (q.options.some(opt => !opt.trim())) {
          return true
        }
      } else {
        // For short answer, correctAnswer should be a non-empty string
        if (!q.correctAnswer || !q.correctAnswer.toString().trim()) {
          return true
        }
      }
      
     
      return false
    })

  

    if (incompleteQuestions.length > 0) {
      const questionNumbers = incompleteQuestions.map((_, index) => {
        const originalIndex = questions.indexOf(incompleteQuestions[index])
        return originalIndex + 1
      }).join(', ')
      
      setError(`Please complete question${incompleteQuestions.length > 1 ? 's' : ''} ${questionNumbers}. All questions must have text and correct answers.`)
      return
    }

    try {
      setIsLoading(true)

      await onSubmit({
        quizName: quizName.trim(),
        deadline,
        duration,
        questions,
        course: selectedCourse || preSelectedCourse || '',
        unit: selectedUnit || preSelectedUnit || '',
        maxAttempts: parseInt(maxAttempts)
      })
    } catch (submitError) {
      console.error('Failed to submit quiz:', submitError)
      setError('Failed to create quiz. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setQuizName('')
    setDeadline('')
    setDuration(30)
    setQuestions([])
    setCurrentStep('details')
    setSelectedCourse(preSelectedCourse || '')
    setSelectedUnit(preSelectedUnit || '')
    setError('')
    setMaxAttempts('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-4xl w-full p-0 rounded-[12px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] border-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-[4%] data-[state=open]:slide-in-from-top-[4%] dark:bg-slate-900 max-h-[90vh] flex flex-col transition-all duration-150 ease-out">
        <DialogHeader className="px-[24px] pt-[24px] pb-[16px] text-left flex-shrink-0 border-b border-gray-100 dark:border-gray-800">
          <span className="text-[12px] tracking-[0.08em] text-[#6B7280] font-semibold uppercase block mb-[4px] dark:text-slate-400">CREATE NEW QUIZ</span>
          <DialogTitle className="text-[20px] font-semibold text-[#111827] dark:text-white mt-0">Create New Quiz</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new quiz with questions and options for students to answer
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {currentStep === 'details' ? (
          <form onSubmit={handleSubmitDetails} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-[24px] py-[16px]">
            {/* SECTION A — Quiz Details */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.04em]">Quiz Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
                <div>
                  <Label htmlFor="quizName" className="text-[13px] font-medium text-gray-700 block mb-1.5">Quiz Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="quizName"
                    value={quizName}
                    onChange={(e) => setQuizName(e.target.value)}
                    placeholder="e.g., Chapter 1 Quiz, Midterm Exam"
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
                      onChange={(e) => handleCourseChange(e.target.value)}
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
                      {(() => {
                      return availableUnits.map((unit: any) => (
                        <option key={unit._id} value={unit._id}>
                          {unit.title}
                        </option>
                      ))
                    })()}
                    </select>
                  </div>
                )}

                <div>
                  <Label htmlFor="duration" className="text-[13px] font-medium text-gray-700 block mb-1.5">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Duration (minutes) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="180"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                    className="h-10 px-3 border border-gray-200 rounded-lg text-[14px] transition-all duration-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="maxAttempts" className="text-[13px] font-medium text-gray-700 block mb-1.5">Max Attempts <span className="text-red-500">*</span></Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    min="1"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                    placeholder="e.g., 3"
                    className="h-10 px-3 border border-gray-200 rounded-lg text-[14px] transition-all duration-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12"
                    required
                  />
                </div>

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
          </div>

          {/* Actions Footer */}
          <div className="px-[24px] py-[24px] border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-[44px] px-[20px] font-medium text-[14px] rounded-[8px] transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white h-[44px] px-[20px] font-medium text-[14px] rounded-[8px] transition-all duration-200"
            >
              Continue to Questions
            </Button>
          </div>
        </form>
        ) : (
          <form onSubmit={handleSubmitQuiz} className="flex flex-col flex-1 overflow-hidden h-full">
            {/* Quiz Summary */}
            <Card className="bg-gray-50 flex-shrink-0">
              <CardContent className="pt-4">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Quiz:</span> {quizName}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {duration} minutes
                  </div>
                  <div>
                    <span className="font-medium">Max Attempts:</span> {maxAttempts}
                  </div>
                  <div>
                    <span className="font-medium">Deadline:</span> {new Date(deadline).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-[24px] py-[16px]">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white">Questions ({questions.length})</h3>
                </div>

                {questions.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-8 pb-8 text-center">
                      <p className="text-gray-500 mb-4">No questions added yet</p>
                      <Button type="button" onClick={addQuestion} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Question
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {questions.map((question, index) => (
                      <div key={index} className="space-y-4">
                        <Card>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-4">
                              <h4 className="font-medium">Question {index + 1}</h4>
                              <Button
                                type="button"
                                onClick={() => removeQuestion(index)}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Question Type</Label>
                                  <select
                                    value={question.type}
                                    onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                                    className={selectClasses}
                                  >
                                    <option value="short_answer">Short Answer</option>
                                    <option value="multiple_choice">Multiple Choice</option>
                                  </select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Points</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={question.points}
                                    onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value) || 1)}
                                    className={inputClasses}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Question Text</Label>
                                <textarea
                                  value={question.questionText}
                                  onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                                  placeholder="Enter your question here..."
                                  className={textareaClasses}
                                  required
                                />
                              </div>

                              {question.type === 'multiple_choice' ? (
                                <div className="space-y-3">
                                  <Label>Options (A, B, C, D)</Label>
                                  {question.options?.map((option, optIndex) => (
                                    <div key={optIndex} className="flex items-center gap-2">
                                      <span className="w-8 font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                                      <Input
                                        value={option}
                                        onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                        placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                        className={inputClasses}
                                        required
                                      />
                                      <input
                                        type="radio"
                                        name={`correct-${index}`}
                                        checked={question.correctAnswer === optIndex}
                                        onChange={() => updateQuestion(index, 'correctAnswer', optIndex)}
                                        className="ml-2"
                                      />
                                      <span className="text-sm text-gray-500">Correct</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Label>Correct Answer</Label>
                                  <Input
                                    value={question.correctAnswer as string}
                                    onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                                    placeholder="Enter correct answer"
                                    className={inputClasses}
                                    required
                                  />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Add Question Button after each question */}
                        <div className="flex justify-center py-6">
                          <Button 
                            type="button" 
                            onClick={addQuestion} 
                            className="w-full max-w-xs bg-[#60A5FA] hover:bg-[#3B82F6] text-white h-10 px-[20px] font-medium text-[14px] rounded-lg transition-all duration-200 shadow-sm border-0"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-[24px] py-[24px] border-t border-slate-100 flex justify-between gap-3 flex-shrink-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCurrentStep('details')}
                className="h-[44px] px-[20px] font-medium text-[14px] rounded-[8px] transition-all duration-200"
              >
                Back to Details
              </Button>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  className="h-[44px] px-[20px] font-medium text-[14px] rounded-[8px] transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || questions.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-[44px] px-[20px] font-medium text-[14px] rounded-[8px] transition-all duration-200"
                >
                  {isLoading ? 'Creating...' : 'Create Quiz'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
