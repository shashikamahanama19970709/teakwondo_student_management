import mongoose, { Schema, Document } from 'mongoose'

export interface IQuestion {
  questionText: string
  type: 'short_answer' | 'multiple_choice'
  options?: string[] // For MCQ
  correctAnswer: string | number // For MCQ: index, for short answer: text
  points?: number
}

export interface IQuiz extends Document {
  unitId: mongoose.Types.ObjectId
  quizName: string
  deadline: Date
  duration: number // in minutes
  questions: IQuestion[]
  createdBy: mongoose.Types.ObjectId
  organization: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const QuestionSchema = new Schema<IQuestion>({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [1000, 'Question text cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['short_answer', 'multiple_choice'],
    required: [true, 'Question type is required']
  },
  options: [{
    type: String,
    trim: true,
    maxlength: [200, 'Option cannot exceed 200 characters']
  }],
  correctAnswer: {
    type: Schema.Types.Mixed, // Can be string (for short answer) or number (for MCQ index)
    required: [true, 'Correct answer is required']
  },
  points: {
    type: Number,
    default: 1,
    min: [1, 'Points must be at least 1']
  }
})

const QuizSchema = new Schema<IQuiz>({
  unitId: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: [true, 'Unit ID is required']
  },
  quizName: {
    type: String,
    required: [true, 'Quiz name is required'],
    trim: true,
    maxlength: [200, 'Quiz name cannot exceed 200 characters']
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  questions: [QuestionSchema],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
QuizSchema.index({ unitId: 1 })
QuizSchema.index({ deadline: 1 })
QuizSchema.index({ createdBy: 1 })
QuizSchema.index({ organization: 1 })
QuizSchema.index({ createdAt: -1 })

export const Quiz = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema)
