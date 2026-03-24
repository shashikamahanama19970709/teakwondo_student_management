'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Clock, Users, Eye, Edit, Trash2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

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
  createdBy: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt?: string
  unit: {
    _id: string
    title: string
    description: string
  }
  course?: {
    _id: string
    name: string
  }
}

export default function AllQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<QuizItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    fetchAllQuizzes()
    fetchUserRole()
  }, [])

  useEffect(() => {
    // Filter quizzes based on search term
    if (searchTerm.trim() === '') {
      setFilteredQuizzes(quizzes)
    } else {
      const filtered = quizzes.filter(quiz =>
        quiz.quizName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.unit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quiz.course?.name && quiz.course.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredQuizzes(filtered)
    }
  }, [searchTerm, quizzes])

  const fetchAllQuizzes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/quizzes')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data.quizzes || [])
        setFilteredQuizzes(data.quizzes || [])
      } else {
        setError('Failed to load quizzes')
      }
    } catch (error) {
      console.error('Error fetching all quizzes:', error)
      setError('Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.role?.toLowerCase() || 'student')
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const handleDeleteQuiz = async (unitId: string, quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) {
      return
    }

    try {
      const response = await fetch(`/api/units/${unitId}/quizzes?quizId=${quizId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchAllQuizzes() // Refresh the list
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete quiz')
      }
    } catch (error) {
      console.error('Error deleting quiz:', error)
      alert('Failed to delete quiz')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (deadline: string) => {
    const now = new Date()
    const end = new Date(deadline)
    
    if (now <= end) {
      return 'bg-green-100 text-green-800 border-green-200'
    } else {
      return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getStatusText = (deadline: string) => {
    const now = new Date()
    const end = new Date(deadline)
    
    if (now <= end) {
      return 'Active'
    } else {
      return 'Expired'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">All Quizzes</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAllQuizzes}>Retry</Button>
          </CardContent>
        </Card>
      ) : filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              {searchTerm ? 'No quizzes found matching your search.' : 'No quizzes available.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{quiz.quizName}</h3>
                      <Badge variant="outline" className={getStatusColor(quiz.deadline)}>
                        {getStatusText(quiz.deadline)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <p><strong>Unit:</strong> {quiz.unit.title}</p>
                      {quiz.course && <p><strong>Course:</strong> {quiz.course.name}</p>}
                      <p><strong>Created by:</strong> {quiz.createdBy?.name || 'Unknown'}</p>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {quiz.duration} minutes
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {quiz.questions?.length || 0} questions
                      </div>
                      <div>
                        Deadline: {quiz.deadline ? formatDate(quiz.deadline) : 'No deadline'}
                      </div>
                    </div>

                    <div className="text-xs text-gray-400">
                      Created: {formatDate(quiz.createdAt)}
                      {quiz.updatedAt && ` • Updated: ${formatDate(quiz.updatedAt)}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/units/${quiz.unit._id}/quizzes?quizId=${quiz._id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    
                    {(userRole !=='student' ) && (
                      <>
                        <Link href={`/units/${quiz.unit._id}/quizzes?quizId=${quiz._id}&edit=true`}>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteQuiz(quiz.unit._id, quiz._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
