'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Loader2, Clock, Users, Calendar, ArrowLeft, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Quiz {
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
}

export default function QuizViewPage() {
  const params = useParams()
  const quizId = params.id as string
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/quizzes/${quizId}`)
        if (response.ok) {
          const data = await response.json()
          setQuiz(data.quiz)
        } else {
          setError('Quiz not found')
        }
      } catch (error) {
        setError('Failed to load quiz')
      } finally {
        setLoading(false)
      }
    }

    if (quizId) {
      fetchQuiz()
    }
  }, [quizId])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (error || !quiz) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {error || 'Quiz Not Found'}
            </h2>
            <p className="text-gray-600 mb-6">
              The quiz you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.quizName}</h1>
              <p className="text-gray-600">Quiz Details and Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Quiz
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Quiz
            </Button>
          </div>
        </div>

        {/* Quiz Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Course Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{quiz.course.name}</p>
                <Link href={`/courses/${quiz.course._id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Course
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Unit Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{quiz.unit.title}</p>
                <p className="text-sm text-gray-600">{quiz.unit.description}</p>
                <Link href={`/units/${quiz.unit._id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Unit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quiz Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Duration: {quiz.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{quiz.questions.length} questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Deadline: {new Date(quiz.deadline).toLocaleDateString()}
                  </span>
                </div>
                <Badge variant="outline" className="w-full justify-center">
                  {new Date(quiz.deadline) > new Date() ? 'Active' : 'Expired'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions Section */}
        <Card>
          <CardHeader>
            <CardTitle>Questions ({quiz.questions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quiz.questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Question {index + 1}</span>
                      <Badge variant="outline" className="text-xs">
                        {question.type === 'multiple_choice' ? 'Multiple Choice' : 'Short Answer'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {question.points} points
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-900 mb-3">{question.questionText}</p>
                  
                  {question.type === 'multiple_choice' && question.options && (
                    <div className="space-y-2 ml-4">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                            question.correctAnswer === optionIndex 
                              ? 'bg-green-100 border-green-500 text-green-700' 
                              : 'border-gray-300 text-gray-500'
                          }`}>
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span className={question.correctAnswer === optionIndex ? 'font-medium text-green-700' : ''}>
                            {option}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'short_answer' && (
                    <div className="ml-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-green-800">Correct Answer:</p>
                        <p className="text-green-700">{question.correctAnswer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
