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

interface EditQuizModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (quizData: {
    quizName: string
    deadline: string
    duration: number
    questions: Question[]
    maxAttempts: number
  }) => void
  quiz: {
    _id: string
    quizName: string
    deadline: string
    duration: number
    questions: Question[]
    maxAttempts?: number
  } | null
}

export function EditQuizModal({ isOpen, onClose, onSubmit, quiz }: EditQuizModalProps) {
  const [quizName, setQuizName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [duration, setDuration] = useState(30)
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [maxAttempts, setMaxAttempts] = useState(3)

  // Initialize form with quiz data when quiz changes
  useEffect(() => {
    if (quiz) {
      setQuizName(quiz.quizName)
      setDeadline(new Date(quiz.deadline).toISOString().slice(0, 16))
      setDuration(quiz.duration)
      setQuestions(quiz.questions)
      setMaxAttempts(quiz.maxAttempts || 3)
    } else {
      // Reset form when no quiz
      setQuizName('')
      setDeadline('')
      setDuration(30)
      setQuestions([])
      setMaxAttempts(3)
    }
    setError('')
  }, [quiz, isOpen])

  const addQuestion = () => {
    const newQuestion: Question = {
      questionText: '',
      type: 'short_answer',
      correctAnswer: '',
      points: 1
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }
    setQuestions(updatedQuestions)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions]
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = []
    }
    updatedQuestions[questionIndex].options!.push('')
    setQuestions(updatedQuestions)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].options![optionIndex] = value
    setQuestions(updatedQuestions)
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options?.filter((_, i) => i !== optionIndex)
    setQuestions(updatedQuestions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!quizName.trim()) {
      setError('Quiz name is required')
      return
    }
    
    if (!deadline) {
      setError('Deadline is required')
      return
    }
    
    if (duration < 1) {
      setError('Duration must be at least 1 minute')
      return
    }

    if (maxAttempts < 1) {
      setError('Max attempts must be at least 1')
      return
    }
    
    if (questions.length === 0) {
      setError('At least one question is required')
      return
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      if (!question.questionText.trim()) {
        setError(`Question ${i + 1} text is required`)
        return
      }
      if (question.type === 'multiple_choice') {
        if (!question.options || question.options.length < 2) {
          setError(`Question ${i + 1} needs at least 2 options`)
          return
        }
        if (question.options.some(opt => !opt.trim())) {
          setError(`Question ${i + 1} has empty options`)
          return
        }
      }
      if (question.correctAnswer === '') {
        setError(`Question ${i + 1} needs a correct answer`)
        return
      }
    }

    setIsLoading(true)
    try {
      await onSubmit({
        quizName: quizName.trim(),
        deadline,
        duration,
        questions,
        maxAttempts
      })
      onClose()
    } catch (error) {
      setError('Failed to update quiz')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Quiz</DialogTitle>
          <DialogDescription className="sr-only">
            Edit existing quiz questions and options
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quiz Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Quiz Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quizName">Quiz Name</Label>
                <Input
                  id="quizName"
                  value={quizName}
                  onChange={(e) => setQuizName(e.target.value)}
                  placeholder="Enter quiz name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                    min="1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="maxAttempts">Max Attempts</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                    min="1"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Questions ({questions.length})
                </div>
                <Button type="button" onClick={addQuestion} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No questions added yet. Click "Add Question" to get started.
                </p>
              ) : (
                questions.map((question, qIndex) => (
                  <Card key={qIndex} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Question Text</Label>
                        <Input
                          value={question.questionText}
                          onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                          placeholder="Enter your question"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Question Type</Label>
                          <select
                            value={question.type}
                            onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="short_answer">Short Answer</option>
                            <option value="multiple_choice">Multiple Choice</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label>Points</Label>
                          <Input
                            type="number"
                            value={question.points}
                            onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                            min="1"
                            required
                          />
                        </div>
                      </div>

                      {question.type === 'multiple_choice' && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Options</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(qIndex)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Option
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {question.options?.map((option, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                  placeholder={`Option ${oIndex + 1}`}
                                  required
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(qIndex, oIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label>Correct Answer</Label>
                        {question.type === 'multiple_choice' ? (
                          <select
                            value={question.correctAnswer}
                            onChange={(e) => updateQuestion(qIndex, 'correctAnswer', parseInt(e.target.value))}
                            className="w-full p-2 border rounded-md"
                            required
                          >
                            <option value="">Select correct answer</option>
                            {question.options?.map((option, index) => (
                              <option key={index} value={index}>
                                {option || `Option ${index + 1}`}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            value={question.correctAnswer as string}
                            onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                            placeholder="Enter correct answer"
                            required
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
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
              {isLoading ? 'Updating...' : 'Update Quiz'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
