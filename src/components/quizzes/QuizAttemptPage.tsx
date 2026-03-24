'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Label } from '@/components/ui/label'
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft,
  RotateCcw
} from 'lucide-react'

interface Question {
  questionText: string
  type: 'short_answer' | 'multiple_choice'
  options?: string[]
  points: number
}

interface QuizAttemptPageProps {
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

export function QuizAttemptPage({ quiz, onSubmitAttempt }: QuizAttemptPageProps) {
  const params = useParams()
  const router = useRouter()
  const [answers, setAnswers] = useState<(string | number)[]>(
    new Array(quiz.questions.length).fill('')
  )
  const [timeRemaining, setTimeRemaining] = useState(quiz.duration * 60) // Convert to seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [startTime] = useState(new Date())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Countdown timer
  useEffect(() => {
    if (timeRemaining > 0 && !showResults) {
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
  }, [timeRemaining, showResults])

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
    router.push(`/units/${params.unitId}`)
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (showResults && results) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-4">Quiz Results</CardTitle>
            <div className="flex justify-center mb-4">
              {results.percentage >= 60 ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <AlertCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Score Summary */}
            <div className="text-center space-y-2">
              <div className={`text-4xl font-bold ${getScoreColor(results.percentage)}`}>
                {results.score}/{results.maxScore}
              </div>
              <div className={`text-2xl ${getScoreColor(results.percentage)}`}>
                {results.percentage}%
              </div>
              <div className="text-gray-600">
                Attempt {results.attemptNumber} of 3
              </div>
              <div className="text-gray-600">
                Attempts remaining: {results.attemptsRemaining}
              </div>
            </div>

            {/* Time Statistics */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatTime(results.timeSpent)}</div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatTime(quiz.duration * 60 - results.timeSpent)}</div>
                <div className="text-sm text-gray-600">Time Remaining</div>
              </div>
            </div>

            {/* Question Review */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Question Review</h3>
              {quiz.questions.map((question, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">Question {index + 1}</span>
                          <span className="text-sm text-gray-500">({question.points} points)</span>
                        </div>
                        <p className="text-gray-700 mb-2">{question.questionText}</p>
                        
                        {question.type === 'multiple_choice' && question.options && (
                          <div className="space-y-1 ml-4">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                                <span>{option}</span>
                                {answers[index] === optIndex && (
                                  <span className="text-blue-600 text-sm">(Your answer)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Your answer: </span>
                          <span className="text-gray-600">
                            {question.type === 'multiple_choice' 
                              ? question.options?.[answers[index] as number] || 'Not answered'
                              : answers[index] || 'Not answered'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleRetakeQuiz} variant="outline" className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Unit
              </Button>
              {results.attemptsRemaining > 0 && (
                <Button onClick={handleRetakeQuiz} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Quiz
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with Timer */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{quiz.quizName}</h1>
            <p className="text-gray-600">
              {quiz.questions.length} Questions • {quiz.questions.reduce((sum, q) => sum + q.points, 0)} Points
            </p>
          </div>
          
          <div className={`text-center ${getTimeColor()}`}>
            <Clock className="h-8 w-8 mx-auto mb-1" />
            <div className="text-2xl font-bold">{formatTime(timeRemaining)}</div>
            <div className="text-sm">Time Remaining</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${((quiz.duration * 60 - timeRemaining) / (quiz.duration * 60)) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {quiz.questions.map((question, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Question {index + 1}</span>
                <span className="text-sm font-normal text-gray-500">({question.points} points)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{question.questionText}</p>
              
              {question.type === 'multiple_choice' && question.options ? (
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        id={`question-${index}-option-${optIndex}`}
                        value={optIndex}
                        checked={answers[index] === optIndex}
                        onChange={(e) => handleAnswerChange(index, parseInt(e.target.value))}
                        className="h-4 w-4"
                      />
                      <Label 
                        htmlFor={`question-${index}-option-${optIndex}`}
                        className="flex-1 cursor-pointer p-2 rounded hover:bg-gray-50"
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <textarea
                    value={answers[index] as string}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="Enter your answer here..."
                    className="w-full p-3 border rounded-md min-h-[100px] resize-none"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      <div className="mt-8 flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          size="lg"
          className="px-8"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </div>

      {/* Warning for unanswered questions */}
      {answers.some((answer, index) => {
        if (quiz.questions[index].type === 'multiple_choice') {
          return answer === ''
        } else {
          return !answer || answer.toString().trim() === ''
        }
      }) && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          You have unanswered questions. Make sure to answer all questions before submitting.
        </div>
      )}
    </div>
  )
}
