'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { FileText, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Assignment {
  _id: string
  title: string
  description: string
  deadline: string
  unit: {
    _id: string
    title: string
  }
  course: {
    _id: string
    name: string
  }
}

interface Submission {
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
  submittedAt: string
}

export default function AssignmentSubmitPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.id as string

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [canResubmit, setCanResubmit] = useState(false)

  useEffect(() => {
    fetchData()
  }, [assignmentId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // First fetch assignment to get unitId
      const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`)
      if (!assignmentResponse.ok) {
        setError('Assignment not found')
        return
      }
      const assignmentData = await assignmentResponse.json()
      setAssignment(assignmentData)

      // Then fetch submission status
      const submissionResponse = await fetch(`/api/units/${assignmentData.unit._id}/assignments/${assignmentId}/submissions`)
      if (submissionResponse.ok) {
        const submissionData = await submissionResponse.json()
        setSubmission(submissionData.submission)
        setCanResubmit(submissionData.canResubmit)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (e.g., max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !assignment) return

    try {
      setSubmitting(true)
      setError('')

      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`/api/units/${assignment.unit._id}/assignments/${assignmentId}/submissions`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setSubmission({
          fileUrl: result.submission.fileUrl,
          fileName: result.submission.fileName,
          fileSize: result.submission.fileSize,
          fileType: result.submission.fileType,
          submittedAt: result.submission.submittedAt
        })
        setSelectedFile(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit assignment')
      }
    } catch (error) {
      console.error('Error submitting assignment:', error)
      setError('Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!assignment) return

    try {
      const response = await fetch(`/api/units/${assignment.unit._id}/assignments/${assignmentId}/submissions`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSubmission(null)
        setCanResubmit(true)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete submission')
      }
    } catch (error) {
      console.error('Error deleting submission:', error)
      setError('Failed to delete submission')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error && !assignment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!assignment) return null

  const isOverdue = new Date() > new Date(assignment.deadline)
  const canSubmit = !isOverdue && (!submission || canResubmit)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/assignments/${assignment._id}`} className="text-blue-600 hover:text-blue-800">
          ← Back to Assignment
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submit Assignment: {assignment.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Assignment Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Assignment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Course:</span> {assignment.course.name}
              </div>
              <div>
                <span className="font-medium">Unit:</span> {assignment.unit.title}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Deadline:</span> {format(new Date(assignment.deadline), 'PPP p')}
              </div>
              <div className="flex items-center gap-1">
                {isOverdue ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className={isOverdue ? 'text-red-600' : 'text-green-600'}>
                  {isOverdue ? 'Overdue' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Current Submission */}
          {submission && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-green-800">Your Submission</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{submission.fileName}</p>
                    <p className="text-sm text-gray-600">
                      {(submission.fileSize / 1024 / 1024).toFixed(2)} MB • Submitted {format(new Date(submission.submittedAt), 'PPP p')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/api/download/${submission.fileUrl.split('/').slice(-2).join('/')}`, '_blank')}
                  >
                    Download
                  </Button>
                  {canResubmit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submission Form */}
          {canSubmit && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="file">Upload File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.zip"
                  required={!submission}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Accepted formats: PDF, DOC, DOCX, TXT, ZIP (Max 10MB)
                </p>
              </div>

              {selectedFile && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                  <p className="text-sm">
                    <span className="font-medium">Selected file:</span> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={!selectedFile || submitting}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : submission ? 'Resubmit Assignment' : 'Submit Assignment'}
              </Button>
            </form>
          )}

          {!canSubmit && !isOverdue && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
              <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-800">You have already submitted this assignment.</p>
              {canResubmit && <p className="text-sm text-yellow-600 mt-1">You can resubmit until the deadline.</p>}
            </div>
          )}

          {isOverdue && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-600">The assignment deadline has passed.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
