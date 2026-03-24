import mongoose, { Schema, Document } from 'mongoose'

export interface IQuizAttempt extends Document {
  quizId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  answers: (string | number)[] // Array of answers matching question order
  score: number
  maxScore: number
  attemptNumber: number
  submittedAt: Date
  startedAt: Date
  timeSpent: number // in seconds
  organization: mongoose.Types.ObjectId
}

const QuizAttemptSchema = new Schema<IQuizAttempt>({
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: [true, 'Quiz ID is required']
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  answers: [{
    type: Schema.Types.Mixed // Can be string (for short answer) or number (for MCQ)
  }],
  score: {
    type: Number,
    default: 0,
    min: [0, 'Score cannot be negative']
  },
  maxScore: {
    type: Number,
    required: [true, 'Max score is required'],
    min: [1, 'Max score must be at least 1']
  },
  attemptNumber: {
    type: Number,
    required: [true, 'Attempt number is required'],
    min: [1, 'Attempt number must be at least 1']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date,
    required: [true, 'Start time is required']
  },
  timeSpent: {
    type: Number, // in seconds
    required: [true, 'Time spent is required'],
    min: [0, 'Time spent cannot be negative']
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
QuizAttemptSchema.index({ quizId: 1, studentId: 1 })
QuizAttemptSchema.index({ studentId: 1 })
QuizAttemptSchema.index({ submittedAt: -1 })
QuizAttemptSchema.index({ organization: 1 })

// Compound index to enforce max 3 attempts per student per quiz
QuizAttemptSchema.index(
  { quizId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true }
)

export const QuizAttempt = mongoose.models.QuizAttempt || mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema)
