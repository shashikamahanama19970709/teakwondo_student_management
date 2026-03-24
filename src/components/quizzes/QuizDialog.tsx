'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/label'
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  RotateCcw,
  ArrowLeft
} from 'lucide-react'

interface Question {
  questionText: string
  type: 'short_answer' | 'multiple_choice'
  options?: string[]
  points: number
}

interface QuizDialogProps {
  isOpen: boolean
  onClose: () => void
  quiz: {
    _id: string
    quizName: string
    deadline: string
    duration: number
    questions: Question[]
  }
  onSubmitAttempt: (answers: (string | number)[]) => Promise<{
    score: number
    maxScore: number
    percentage: number
    attemptNumber: number
    attemptsRemaining: number
  }>
}

export function QuizDialog({ isOpen, onClose, quiz, onSubmitAttempt }: QuizDialogProps) {
  const [answers, setAnswers] = useState<(string | number)[]>(
    new Array(quiz.questions.length).fill('')
  )
  const [timeRemaining, setTimeRemaining] = useState(quiz.duration * 60) // Convert to seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [startTime] = useState(new Date())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Reset state when quiz changes
  useEffect(() => {
    if (quiz) {
      setAnswers(new Array(quiz.questions.length).fill(''))
      setTimeRemaining(quiz.duration * 60)
      setShowResults(false)
      setResults(null)
      setIsSubmitting(false)
    }
  }, [quiz])

  // Countdown timer
  useEffect(() => {
    if (timeRemaining > 0 && !showResults && isOpen) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Auto-submit when time expires
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timeRemaining, showResults, isOpen])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    if (timeRemaining <= 60) return 'text-red-600' // Last minute
    if (timeRemaining <= 300) return 'text-yellow-600' // Last 5 minutes
    return 'text-green-600'
  }

  const handleAnswerChange = (questionIndex: number, value: string | number) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = value
    setAnswers(newAnswers)
  }

  const handleSubmit = async () => {
    if (isSubmitting || showResults) return

    // Check if all questions are answered
    const unansweredQuestions = answers.filter((answer, index) => {
      if (quiz.questions[index].type === 'multiple_choice') {
        return answer === ''
      } else {
        return !answer || answer.toString().trim() === ''
      }
    })

    if (unansweredQuestions.length > 0 && timeRemaining > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredQuestions.length} unanswered question(s). Are you sure you want to submit?`
      )
      if (!confirmSubmit) return
    }

    setIsSubmitting(true)

    try {
      const timeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000)
      const quizResults = await onSubmitAttempt(answers)
      
      setResults({
        ...quizResults,
        timeSpent,
        unansweredQuestions: unansweredQuestions.length
      })
      setShowResults(true)
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Error submitting quiz. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetakeQuiz = () => {
    setShowResults(false)
    setAnswers(new Array(quiz.questions.length).fill(''))
    setTimeRemaining(quiz.duration * 60)
    setResults(null)
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (showResults && results) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz Results</DialogTitle>
            <DialogDescription>
              Your quiz attempt has been submitted successfully.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Score Summary */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className={`text-4xl font-bold ${getScoreColor(results.percentage)}`}>
                {results.score}/{results.maxScore}
              </div>
              <div className={`text-xl mt-2 ${getScoreColor(results.percentage)}`}>
                {results.percentage}%
              </div>
              <div className="text-gray-600 mt-2">
                Attempt #{results.attemptNumber}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Attempts remaining: {results.attemptsRemaining}
              </div>
            </div>

            {/* Time Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-blue-600 font-medium">Time Spent</div>
                <div className="text-lg font-bold">{formatTime(results.timeSpent)}</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-yellow-600 font-medium">Unanswered</div>
                <div className="text-lg font-bold">{results.unansweredQuestions}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {results.attemptsRemaining > 0 && (
                <Button
                  onClick={handleRetakeQuiz}
                  className="flex-1"
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Quiz
                </Button>
              )}
              <Button
                onClick={onClose}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quiz.quizName}</DialogTitle>
          <DialogDescription>
            Answer all questions and submit before time runs out.
          </DialogDescription>
        </DialogHeader>

        {/* Timer */}
        <div className="sticky top-0 bg-white border-b p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className={`text-lg font-medium ${getTimeColor()}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Question {answers.filter(a => a !== '').length} of {quiz.questions.length}
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6 p-6">
          {quiz.questions.map((question, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <Label className="font-medium text-base">
                  {index + 1}. {question.questionText}
                </Label>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {question.points} points
                </span>
              </div>

              {question.type === 'multiple_choice' && question.options ? (
                <div className="space-y-2 ml-4">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={`q${index}_option${optionIndex}`}
                        name={`question_${index}`}
                        value={optionIndex}
                        checked={answers[index] === optionIndex}
                        onChange={(e) => handleAnswerChange(index, parseInt(e.target.value))}
                        className="w-4 h-4"
                      />
                      <Label 
                        htmlFor={`q${index}_option${optionIndex}`}
                        className="text-sm cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[index] as string || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-3 border rounded-md resize-none h-24"
                  rows={3}
                />
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
