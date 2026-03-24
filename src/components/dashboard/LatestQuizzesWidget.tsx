'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Clock, Users, Eye, Plus, Edit, Play, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { AddQuizModal } from '@/components/quizzes/AddQuizModal'
import { EditQuizModal } from '@/components/quizzes/EditQuizModal'
import { QuizDialog } from '@/components/quizzes/QuizDialog'

interface QuizItem {
  _id: string
  quizName: string
  deadline: string
  duration: number
  questions: Array<{
    questionText: string
    type: 'short_answer' | 'multiple_choice'
    options?: string[]
    correctAnswer: string | number
    points: number
  }>
  maxAttempts?: number
  createdBy: string
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
  startDate?: Date
  endDate?: Date
  isActive?: boolean
  batchName?: string
  groupName?: string
}

interface LatestQuizzesWidgetProps {
  userRole: string
  className?: string
}

export function LatestQuizzesWidget({ userRole, className = '' }: LatestQuizzesWidgetProps) {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<QuizItem | null>(null)
  const [quizModalSource, setQuizModalSource] = useState<string>('')
  const [quizModalCourseId, setQuizModalCourseId] = useState<string>('')
  const [quizModalUnitId, setQuizModalUnitId] = useState<string>('')
  const [canAttempt, setCanAttempt] = useState(true)
  const [hasAttempted, setHasAttempted] = useState(false)
  const [startLoading, setStartLoading] = useState(false)
  const [showQuizDialog, setShowQuizDialog] = useState(false)
  const [selectedQuizForDialog, setSelectedQuizForDialog] = useState<QuizItem | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [quizToDelete, setQuizToDelete] = useState<QuizItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetchLatestQuizzes()
  }, [])

  const fetchLatestQuizzes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/quizzes/latest')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data.quizzes || [])
      } else {
        setError('Failed to load quizzes')
      }
    } catch (error) {
      console.error('Error fetching latest quizzes:', error)
      setError('Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  const handleQuizSubmit = async (quizData: any) => {
    try {
      // Ensure we have a unit ID
      if (!quizData.unit) {
        alert('Please select a unit for the quiz')
        return
      }

      // Map the data to match the new API expectations
      const apiData = {
        quizName: quizData.title || quizData.quizName,
        deadline: quizData.endDate || quizData.deadline,
        duration: quizData.duration,
        questions: quizData.questions,
        maxAttempts: quizData.maxAttempts
      }

      const response = await fetch(`/api/units/${quizData.unit}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      })

      if (response.ok) {
        setIsQuizModalOpen(false)
        fetchLatestQuizzes() // Refresh quizzes list
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create quiz')
      }
    } catch (error) {
      console.error('Error creating quiz:', error)
      alert('Failed to create quiz')
    }
  }

  const handleEditQuiz = async (quizData: any) => {
    try {
      if (!selectedQuiz) return

      const apiData = {
        quizName: quizData.quizName,
        deadline: quizData.deadline,
        duration: quizData.duration,
        questions: quizData.questions,
        maxAttempts: quizData.maxAttempts
      }

      const response = await fetch(`/api/units/${selectedQuiz.unit._id}/quizzes?quizId=${selectedQuiz._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      })

      if (response.ok) {
        setIsEditModalOpen(false)
        setSelectedQuiz(null)
        fetchLatestQuizzes() // Refresh quizzes list
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update quiz')
      }
    } catch (error) {
      console.error('Error updating quiz:', error)
      alert('Failed to update quiz')
    }
  }

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/units/${quizToDelete.unit._id}/quizzes?quizId=${quizToDelete._id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setShowDeleteDialog(false)
        setQuizToDelete(null)
        fetchLatestQuizzes() // Refresh quizzes list
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete quiz')
      }
    } catch (error) {
      console.error('Error deleting quiz:', error)
      alert('Failed to delete quiz')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleStartQuiz = async (quizId: string) => {
    setStartLoading(true)
    const quiz = quizzes.find(q => q._id === quizId)
    if (quiz) {
      setSelectedQuizForDialog(quiz)
      setShowQuizDialog(true)
    }
    setStartLoading(false)
  }

  const handleSubmitAttempt = async (answers: (string | number)[]) => {
    if (!selectedQuizForDialog) return

    try {
      const quizResponse = await fetch(`/api/quizzes/${selectedQuizForDialog._id}?type=unit`)
      if (!quizResponse.ok) throw new Error('Failed to fetch quiz data')
      const quizData = await quizResponse.json()
      const unitId = quizData.unitId
      if (!unitId) throw new Error('Unit ID not found')

      const response = await fetch(`/api/units/${unitId}/quizzes/${selectedQuizForDialog._id}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers,
          startedAt: new Date().toISOString(),
          timeSpent: 0
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit quiz attempt')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error submitting quiz attempt:', error)
      throw error
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

  const getStatusColor = (startDate: Date, endDate: Date) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (now < start) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    } else if (now >= start && now <= end) {
      return 'bg-green-100 text-green-800 border-green-200'
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (startDate: Date, endDate: Date) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (now < start) {
      return 'Upcoming'
    } else if (now >= start && now <= end) {
      return 'Active'
    } else {
      return 'Ended'
    }
  }

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Latest Quizzes
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
              <AlertCircle className="h-5 w-5" />
              Latest Quizzes
            </CardTitle>
            {(userRole === 'admin' || userRole === 'teacher') && (
              <Button size="sm" className="flex items-center gap-1" onClick={() => {
                setIsQuizModalOpen(true)
                setQuizModalSource('dashboard')
                setQuizModalCourseId('')
                setQuizModalUnitId('')
              }}>
                <Plus className="h-3 w-3" />
                Create Quiz
              </Button>
            )}
            
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchLatestQuizzes} size="sm" className="mt-2">
                Retry
              </Button>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No quizzes available.</p>
              {(userRole === 'admin' || userRole === 'teacher') && (
                <Button size="sm" className="mt-4" onClick={() => {
                  setIsQuizModalOpen(true)
                  setQuizModalSource('dashboard')
                  setQuizModalCourseId('')
                  setQuizModalUnitId('')
                }}>
                  Create Your First Quiz
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.slice(0, 4).map((quiz) => (
                <div
                  key={quiz._id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-red-100 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{quiz.quizName}</h4>
                      <Badge variant="outline" className={`text-xs ${quiz.deadline && new Date(quiz.deadline) > new Date() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {quiz.deadline && new Date(quiz.deadline) > new Date() ? 'Active' : 'Expired'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{quiz.course.name}</p>
                    {quiz.batchName && (
                      <p className="text-xs text-gray-500 mb-1">Batch: {quiz.batchName}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {quiz.duration} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {quiz.questions?.length || 0} questions
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>Deadline: {quiz.deadline ? new Date(quiz.deadline).toLocaleDateString() : 'No deadline'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                     
                       {userRole === 'student' ? (
                        <Button
                          onClick={() => handleStartQuiz(quiz._id)}
                          disabled={!canAttempt || startLoading}
                          className="flex-1"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {startLoading ? 'Starting...' : 
                           hasAttempted ? 'Retake Quiz' : 'Start Quiz'}
                        </Button>
                      ) : null}
                      {(userRole === 'admin' || userRole === 'teacher') && (              
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            setSelectedQuiz(quiz)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      )}
                      {(userRole === 'admin' || userRole === 'teacher') && (
                        <Link href={`/units/${quiz.unit._id}/quizzes?quizId=${quiz._id}`}>
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
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setQuizToDelete(quiz)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {quizzes.length > 0 && (
                <div className="text-center pt-2">
                  {userRole === 'admin' || userRole === 'teacher' ? (
                    <Link href="/quizzes">
                      <Button variant="outline" size="sm">
                        View All Quizzes
                      </Button>
                    </Link>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <AddQuizModal 
        isOpen={isQuizModalOpen} 
        onClose={() => {
          setIsQuizModalOpen(false)
          setQuizModalSource('')
          setQuizModalCourseId('')
          setQuizModalUnitId('')
        }} 
        onSubmit={handleQuizSubmit}
        preSelectedCourse={quizModalCourseId}
        preSelectedUnit={quizModalUnitId}
        source={quizModalSource}
      />
      <EditQuizModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedQuiz(null)
        }}
        onSubmit={handleEditQuiz}
        quiz={selectedQuiz}
      />
      {selectedQuizForDialog && (
        <QuizDialog
          isOpen={showQuizDialog}
          onClose={() => setShowQuizDialog(false)}
          quiz={selectedQuizForDialog}
          onSubmitAttempt={handleSubmitAttempt}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && quizToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Quiz
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900">"{quizToDelete.quizName}"</span>? 
                This action cannot be undone and will permanently remove the quiz and all associated attempts.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false)
                    setQuizToDelete(null)
                  }}
                  className="flex-1"
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteQuiz}
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
                      Delete Quiz
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
