import mongoose, { Schema, Document } from 'mongoose'

export interface IAssignmentSubmission extends Document {
  assignmentId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  fileUrl: string // Backblaze B2 URL
  fileName: string
  fileSize: number // in bytes
  fileType: string
  marks?: number
  feedback?: string
  submittedAt: Date
  gradedAt?: Date
  gradedBy?: mongoose.Types.ObjectId
  organization: mongoose.Types.ObjectId
}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>({
  assignmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Assignment ID is required']
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
    trim: true
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [1, 'File size must be at least 1 byte']
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
    trim: true
  },
  marks: {
    type: Number,
    min: [0, 'Marks cannot be negative']
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedAt: {
    type: Date
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  }
}, {
  timestamps: true
})

// Index for efficient queries
AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true })
AssignmentSubmissionSchema.index({ studentId: 1 })
AssignmentSubmissionSchema.index({ submittedAt: -1 })
AssignmentSubmissionSchema.index({ organization: 1 })

export const AssignmentSubmission = mongoose.models.AssignmentSubmission || mongoose.model<IAssignmentSubmission>('AssignmentSubmission', AssignmentSubmissionSchema)
