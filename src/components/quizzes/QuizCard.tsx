'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { QuizDialog } from './QuizDialog'
import { 
  Clock, 
  Calendar, 
  Users, 
  Play, 
  Edit, 
  Trash2, 
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Quiz {
  _id: string
  quizName: string
  deadline: string
  duration: number
  questions: Array<{
    questionText: string
    type: 'short_answer' | 'multiple_choice'
    points: number
  }>
  maxAttempts?: number
  createdBy: {
    name: string
    email: string
  }
  createdAt: string
  studentAttempts?: Array<{
    attemptNumber: number
    score: number
    maxScore: number
    submittedAt: string
  }>
  attemptsRemaining?: number
  enrollment?: {
    studentId: string
    attempts: Array<{
      attemptNumber: number
      startedAt: string
      submittedAt: string
      score: number
      answers: Array<string | number>
      timeSpent: number
      _id: string
    }>
    _id: string
  }
}

interface QuizCardProps {
  quiz: Quiz
  userRole: 'admin' | 'lecturer' | 'teacher' | 'student'
  onStartQuiz?: (quizId: string) => void
  onEditQuiz?: (quizId: string) => void
  onDeleteQuiz?: (quizId: string) => void
  onViewResults?: (quizId: string) => void
  params?: { unitId: string } // Add params to get unitId
}

export function QuizCard({ 
  quiz, 
  userRole, 
  onStartQuiz, 
  onEditQuiz, 
  onDeleteQuiz, 
  onViewResults,
  params
}: QuizCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showQuizDialog, setShowQuizDialog] = useState(false)

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0)
  const attemptsCount = quiz.enrollment?.attempts?.length || 0
  const maxAttemptsDisplay = quiz.maxAttempts || 'Unlimited'
  const isOverdue = new Date() > new Date(quiz.deadline)
  const attemptsRemaining = quiz.attemptsRemaining ?? 1 // Default to 1 if not provided
  const canAttempt = !isOverdue && attemptsRemaining > 0
  const hasAttempted = (quiz.studentAttempts?.length ?? 0) > 0

  // Debug logging to help identify the issue


  const handleStartQuiz = async () => {
    if (!onStartQuiz) return
    
    setIsLoading(true)
    try {
      await onStartQuiz(quiz._id)
      // Open quiz dialog instead of navigating
      setShowQuizDialog(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitAttempt = async (answers: (string | number)[]) => {
    if (!onStartQuiz) return
    
    
    try {
      // First, fetch unit ID for this quiz using the new endpoint
      const quizResponse = await fetch(`/api/quizzes/${quiz._id}?type=unit`)
      if (!quizResponse.ok) {
        throw new Error('Failed to fetch quiz data')
      }
      const quizData = await quizResponse.json()
      const unitId = quizData.unitId
      
      if (!unitId) {
        throw new Error('Unit ID not found in quiz data')
      }
      
      
      // Now call the attempts API with the correct unit ID
      const response = await fetch(`/api/units/${unitId}/quizzes/${quiz._id}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers,
          startedAt: new Date().toISOString(),
          timeSpent: 0 // Will be calculated by frontend timer
        })
      })
      
 
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to submit quiz attempt')
      }
      
      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error submitting quiz attempt:', error)
      throw error
    }
  }

  const getStatusColor = () => {
    if (isOverdue) return 'bg-red-100 text-red-800'
    if (userRole === 'student' && !canAttempt) return 'bg-gray-100 text-gray-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = () => {
    if (isOverdue) return 'Overdue'
    if (userRole === 'student' && !canAttempt && hasAttempted) return 'Completed'
    if (userRole === 'student' && !canAttempt) return 'No Attempts Left'
    return 'Available'
  }

  const getStatusIcon = () => {
    if (isOverdue) return <XCircle className="h-4 w-4" />
    if (userRole === 'student' && !canAttempt && hasAttempted) return <CheckCircle className="h-4 w-4" />
    if (userRole === 'student' && !canAttempt) return <AlertCircle className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{quiz.quizName}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor()}>
                {getStatusIcon()}
                <span className="ml-1">{getStatusText()}</span>
              </Badge>
              <Badge variant="outline">
                {quiz.questions.length} Questions
              </Badge>
            </div>
          </div>
          
          {userRole !== 'student' && (
            <div className="flex items-center gap-1">
              {onViewResults && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewResults(quiz._id)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              )}
              {onEditQuiz && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditQuiz(quiz._id)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDeleteQuiz && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteQuiz(quiz._id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quiz Details */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{quiz.duration} min</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(quiz.deadline), { addSuffix: true })}</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>{totalPoints} Points</span>
          </div>
          {quiz.maxAttempts && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Max {quiz.maxAttempts} attempts</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Created {formatDistanceToNow(new Date(quiz.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Student-specific info */}
        {userRole === 'student' && quiz.enrollment && quiz.enrollment.attempts && quiz.enrollment.attempts.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Your Quiz Attempts
            </h4>
            <div className="space-y-2">
              {quiz.enrollment.attempts.map((attempt: any, index: number) => (
                <div key={attempt._id || index} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{attempt.attemptNumber}</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">Attempt {attempt.attemptNumber}</div>
                      <div className="text-xs text-gray-600">
                        Submitted {formatDistanceToNow(new Date(attempt.submittedAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900">
                        {attempt.score}%
                      </div>
                      <div className="text-sm text-gray-600">
                        Score
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      attempt.score >= 80 
                        ? 'bg-green-100 text-green-600' 
                        : attempt.score >= 60 
                          ? 'bg-yellow-100 text-yellow-600' 
                          : 'bg-red-100 text-red-600'
                    }`}>
                      <span className="text-sm font-bold">
                        {attempt.score}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-3 p-2 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Attempts: {attemptsCount} / {maxAttemptsDisplay}</span>
                  <span>Remaining: {Math.max(0, (quiz.maxAttempts || 0) - attemptsCount)}</span>
                  <span>Best score: {Math.max(...quiz.enrollment.attempts.map((a: any) => a.score))}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {userRole === 'student' ? (
            <Button
              onClick={handleStartQuiz}
              disabled={!canAttempt || isLoading || (typeof quiz.maxAttempts === 'number' && quiz.enrollment && quiz.enrollment.attempts && quiz.enrollment.attempts.length >= quiz.maxAttempts)}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              {isLoading ? 'Starting...' : 
               hasAttempted ? 'Retake Quiz' : 'Start Quiz'}
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              {onViewResults && (
                <Button
                  variant="outline"
                  onClick={() => onViewResults(quiz._id)}
                  className="flex-1"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Results
                </Button>
              )}
              {onEditQuiz && (
                <Button
                  variant="outline"
                  onClick={() => onEditQuiz(quiz._id)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Deadline warning */}
        {userRole === 'student' && !isOverdue && new Date(quiz.deadline).getTime() - Date.now() < 24 * 60 * 60 * 1000 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Deadline approaching! Submit before {new Date(quiz.deadline).toLocaleDateString()}
          </div>
        )}

        {isOverdue && userRole === 'student' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2 text-sm text-red-800">
            <XCircle className="h-4 w-4 inline mr-1" />
            This quiz deadline has passed
          </div>
        )}
      </CardContent>
    </Card>

    {/* Quiz Dialog */}
    <QuizDialog
      isOpen={showQuizDialog}
      onClose={() => setShowQuizDialog(false)}
      quiz={quiz}
      onSubmitAttempt={handleSubmitAttempt}
    />
    </>
  )
}
