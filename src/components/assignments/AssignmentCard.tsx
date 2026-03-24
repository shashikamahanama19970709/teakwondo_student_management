'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Calendar, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Image,
  Archive,
  Eye
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { FileUploader } from '@/components/ui/FileUploader'
import { useToast } from '@/components/ui/Toast'

interface Assignment {
  _id: string
  title: string
  description: string
  deadline: string
  createdBy: {
    name: string
    email: string
  }
  createdAt: string
  enrollment?: {
    _id: string
    studentId: string
    submittedAt?: string
    fileUrl?: string
    fileName?: string
    fileSize?: number
    fileType?: string
    deletedAt?: string
  }[]
}

interface StudentSubmission {
  _id: string
  studentId: string
  submittedAt?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  deletedAt?: string
  mark?: number
}

interface AssignmentCardProps {
  assignment: Assignment
  userRole: 'admin' | 'lecturer' | 'teacher' | 'student'
  userId: string
  studentSubmission?: StudentSubmission
  onUploadSubmission?: (assignmentId: string, file: File, onProgress?: (progress: number) => void) => Promise<void>
  onEditAssignment?: (assignmentId: string) => void
  onDeleteAssignment?: (assignmentId: string) => void
  onViewSubmissions?: (assignmentId: string) => void
  onDownloadFile?: (file: any, fileUrl: string, fileName: string) => void
  onViewAssignment?: (assignmentId: string) => void
  onDeleteSubmission?: (assignmentId: string) => Promise<void>
}

export function AssignmentCard({ 
  assignment, 
  userRole, 
  userId,
  studentSubmission,
  onUploadSubmission, 
  onEditAssignment, 
  onDeleteAssignment, 
  onViewSubmissions,
  onDownloadFile,
  onViewAssignment,
  onDeleteSubmission
}: AssignmentCardProps) {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const { showToast } = useToast()

  // Fetch submissions for this assignment
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (userRole === 'student') {
        try {
          setLoadingSubmissions(true)
          const response = await fetch(`/api/assignments/${assignment._id}/submit`)
          if (response.ok) {
            const data = await response.json()
            setSubmissions(data)
          }
        } catch (error) {
          console.error('Error fetching submissions:', error)
        } finally {
          setLoadingSubmissions(false)
        }
      }
    }

    fetchSubmissions()
  }, [assignment._id, userRole])

  // Find student's active submission
  const currentStudentSubmission = submissions.find(
    submission => !submission.deletedAt && submission.submittedAt && submission.fileUrl
  )

  const formatDeadline = (deadline: string) => {
    try {
      const date = new Date(deadline)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      console.error('Error formatting deadline:', error)
      return 'Date error'
    }
  }

  const isOverdue = new Date() > new Date(assignment.deadline)
  const isGraded = userRole === 'student' && currentStudentSubmission && currentStudentSubmission.mark !== undefined
  const hasSubmitted = !!currentStudentSubmission

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return <FileText className="h-4 w-4" />
    return <Archive className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileUpload = async (file: File) => {
    if (!onUploadSubmission) return

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-zip-compressed'
    ]

    if (!allowedTypes.includes(file.type)) {
      showToast({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please upload PDF, DOCX, TXT, images, or ZIP files.'
      })
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'File Too Large',
        message: 'File size must be less than 10MB'
      })
      return
    }

    try {
      // If replacing existing submission, delete it first
      if (hasSubmitted && currentStudentSubmission) {
        
        // Delete the current active submission
        const submissionId = currentStudentSubmission._id
        const deleteRes = await fetch(`/api/assignments/${assignment._id}/submit?submissionId=${submissionId}`, {
          method: 'DELETE'
        })
        if (!deleteRes.ok) {
          console.warn('Failed to delete existing submission, but continuing with upload')
        }
      }

      // Upload the new file
      await onUploadSubmission(assignment._id, file)
      
      // Refresh submissions after successful upload
      const response = await fetch(`/api/assignments/${assignment._id}/submit`)
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
        showToast({
          type: 'success',
          title: hasSubmitted ? 'Submission Replaced' : 'Assignment Submitted',
          message: hasSubmitted 
            ? 'Your assignment submission has been successfully replaced.'
            : 'Your assignment has been successfully submitted.'
        })
      } else {
        showToast({
          type: 'error',
          title: 'Upload Failed',
          message: 'Submission was uploaded but failed to refresh the display.'
        })
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload submission.'
      })
    }
  }

  const getStatusColor = () => {
    if (isOverdue) return 'bg-red-100 text-red-800'
    if (userRole === 'student' && hasSubmitted) return 'bg-green-100 text-green-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getStatusText = () => {
    if (isOverdue) return 'Overdue'
    if (userRole === 'student' && hasSubmitted) return 'Submitted'
    return 'Pending'
  }

  const getStatusIcon = () => {
    if (isOverdue) return <XCircle className="h-4 w-4" />
    if (userRole === 'student' && hasSubmitted) return <CheckCircle className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl font-bold text-gray-900 mb-1">{assignment.title}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${getStatusColor()} px-3 py-1 rounded-full text-xs font-medium`}>
                    {getStatusIcon()}
                    <span className="ml-1">{getStatusText()}</span>
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 rounded-full text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {assignment.deadline ? formatDeadline(assignment.deadline) : 'No deadline'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          {userRole !== 'student' && (
            <div className="flex items-center gap-1">
              {onViewAssignment && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewAssignment(assignment._id)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full p-2"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onViewSubmissions && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewSubmissions(assignment._id)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full p-2"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              )}
              {onEditAssignment && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditAssignment(assignment._id)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full p-2"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDeleteAssignment && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteAssignment(assignment._id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {/* Assignment Description */}
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Assignment Description
          </h3>
          <div 
            className="text-sm text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: assignment.description.length > 300 
                ? assignment.description.substring(0, 300) + '...' 
                : assignment.description 
            }} 
          />
          {assignment.description.length > 300 && (
            <Button
              variant="link"
              size="sm"
              onClick={() => onViewAssignment?.(assignment._id)}
              className="text-blue-600 hover:text-blue-700 p-0 h-auto text-xs mt-2"
            >
              Read more
            </Button>
          )}
        </div>

        {/* Assignment Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${isGraded ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100' : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-100'} p-4 rounded-lg`}>
            <div className="flex items-center gap-2 mb-1">
              {isGraded ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">Score</span>
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-700">Deadline</span>
                </>
              )}
            </div>
            <div className="text-sm font-medium text-gray-900">
              {isGraded ? currentStudentSubmission?.mark : new Date(assignment.deadline).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {isGraded ? 'Graded by instructor' : new Date(assignment.deadline).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs font-semibold text-green-700">Status</span>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {isGraded ? 'Graded' : isOverdue ? 'Overdue' : hasSubmitted ? 'Submitted' : 'Pending'}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {isGraded ? 'Graded by instructor' : hasSubmitted ? 'Completed on time' : isOverdue ? 'Past due date' : 'Awaiting submission'}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-purple-700">Created By</span>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {assignment.createdBy.name}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Student Submission Section */}
        {userRole === 'student' && (
          <div className="border-t pt-6">
            {hasSubmitted && currentStudentSubmission ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Your Submission
                  </h3>
                  <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">
                    {isGraded ? 'Graded' : 'Submitted'}
                  </Badge>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        {getFileIcon(currentStudentSubmission.fileType || '')}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{currentStudentSubmission.fileName}</div>
                        <div className="text-sm text-gray-600">
                          {formatFileSize(currentStudentSubmission.fileSize || 0)} • 
                          Submitted {currentStudentSubmission.submittedAt ? formatDistanceToNow(new Date(currentStudentSubmission.submittedAt), { addSuffix: true }) : 'Unknown time'}
                        
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {onDownloadFile && currentStudentSubmission.fileUrl && currentStudentSubmission.fileName && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownloadFile(currentStudentSubmission, currentStudentSubmission.fileUrl!, currentStudentSubmission.fileName!)}
                          className="bg-white hover:bg-gray-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      {onDeleteSubmission && !isOverdue && !isGraded && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (onDeleteSubmission) {
                              try {
                                await onDeleteSubmission(assignment._id)
                                // Refresh submissions after deletion
                                const response = await fetch(`/api/assignments/${assignment._id}/submit`)
                                if (response.ok) {
                                  const data = await response.json()
                                  setSubmissions(data)
                                  showToast({
                                    type: 'success',
                                    title: 'Submission Deleted',
                                    message: 'Your assignment submission has been successfully deleted.'
                                  })
                                } else {
                                  showToast({
                                    type: 'error',
                                    title: 'Refresh Failed',
                                    message: 'Submission was deleted but failed to refresh the display.'
                                  })
                                }
                              } catch (error: any) {
                                showToast({
                                  type: 'error',
                                  title: 'Delete Failed',
                                  message: error.message || 'Failed to delete submission.'
                                })
                              }
                            }
                          }}
                          className="bg-white hover:bg-gray-50 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Show file uploader if not graded */}
            {!isGraded ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mt-2">
                    <Upload className="h-5 w-5 text-blue-600" />
                    {hasSubmitted ? 'Submit Another Version' : 'Submit Your Work'}
                  </h3>
                  <Badge className={`${isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'} px-3 py-1 rounded-full text-xs`}>
                    {isOverdue ? 'Overdue' : 'Pending'}
                  </Badge>
                </div>
              
                {!isOverdue && (
                  <FileUploader
                    onUpload={handleFileUpload}
                    maxSize={10 * 1024 * 1024} // 10MB
                    acceptedTypes={[
                      'application/pdf',
                      'application/msword',
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                      'text/plain',
                      'image/jpeg',
                      'image/png',
                      'image/gif',
                      'application/zip',
                      'application/x-zip-compressed'
                    ]}
                    className="w-full"
                  />
                )}

                {isOverdue && (
                  <div className="text-center py-8 text-gray-500">
                    <Upload className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Submission deadline has passed</p>
                  </div>
                )}
              </div>
            ) : null}

          </div>
        )}

        {/* Admin/Lecturer Actions */}
        {userRole !== 'student' && (
          <div className="flex gap-3 pt-4 border-t">
            {onViewSubmissions && (
              <Button
                variant="outline"
                onClick={() => onViewSubmissions(assignment._id)}
                className="flex-1 bg-white hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                View Submissions
              </Button>
            )}
            {onEditAssignment && (
              <Button
                variant="outline"
                onClick={() => onEditAssignment(assignment._id)}
                className="flex-1 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Assignment
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
