import mongoose, { Schema, Document } from 'mongoose'

export interface IFileEnrollment {
  studentId: mongoose.Types.ObjectId
  viewedAt: Date
  viewCount: number
}

export interface IQuizAttempt {
  attemptNumber: number
  startedAt: Date
  submittedAt?: Date
  score?: number
  answers: (string | number)[]
  timeSpent?: number // in minutes
}

export interface IQuizEnrollment {
  studentId: mongoose.Types.ObjectId
  attempts: IQuizAttempt[]
}

export interface IAssignmentEnrollment {
  studentId: mongoose.Types.ObjectId
  submittedAt?: Date
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  deletedAt?: Date // For tracking deleted submissions
  mark?: number // Assignment mark given by teacher/admin
}

export interface IQuestion {
  questionText: string
  type: 'short_answer' | 'multiple_choice'
  options?: string[] // For MCQ
  correctAnswer: string | number // For MCQ: index, for short answer: text
  points?: number
}

export interface IQuiz {
  _id?: mongoose.Types.ObjectId
  quizName: string
  deadline: Date
  duration: number // in minutes
  questions: IQuestion[]
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  maxAttempts?: number
  enrollment?: IQuizEnrollment[]
}

export interface IAssignment {
  _id?: mongoose.Types.ObjectId
  title: string
  description: string
  deadline: Date
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  enrollment?: IAssignmentEnrollment[]
}

export interface IUnit extends Document {
  title: string
  description: string
  courses: mongoose.Types.ObjectId[]
  files: {
    fileId: string
    fileUrl: string
    fileName: string
    fileType: 'video' | 'image' | 'document'
    title: string
    description: string
  }[]
  quizzes: IQuiz[]
  assignments: IAssignment[]
  organization: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const UnitSchema = new Schema<IUnit>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  courses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course' // Fixed: Reference Course collection instead of Project
  }],
  files: [{
    fileId: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['video', 'image', 'document'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'File title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'File description cannot exceed 500 characters']
    },
    enrollment: [{
      studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      viewedAt: {
        type: Date,
        default: Date.now
      },
      viewCount: {
        type: Number,
        default: 1,
        min: [1, 'View count must be at least 1']
      }
    }]
  }],
  quizzes: [{
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
    maxAttempts: {
      type: Number,
      min: [1, 'Max attempts must be at least 1']
    },
    questions: [{
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
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    enrollment: [{
      studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      attempts: [{
        attemptNumber: {
          type: Number,
          required: true,
          min: [1, 'Attempt number must be at least 1']
        },
        startedAt: {
          type: Date,
          required: true
        },
        submittedAt: {
          type: Date
        },
        score: {
          type: Number,
          min: [0, 'Score must be at least 0']
        },
        answers: [{
          type: Schema.Types.Mixed // Can be string or number
        }],
        timeSpent: {
          type: Number,
          min: [0, 'Time spent must be at least 0 minutes']
        }
      }]
    }]
  }],
  assignments: [{
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [200, 'Assignment title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Assignment description cannot exceed 1000 characters']
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required']
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    enrollment: [{
      studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      submittedAt: {
        type: Date
      },
      fileUrl: {
        type: String
      },
      fileName: {
        type: String
      },
      fileSize: {
        type: Number,
        min: [0, 'File size must be at least 0']
      },
      fileType: {
        type: String
      },
      deletedAt: {
        type: Date
      },
      mark: {
        type: Number,
        min: [0, 'Mark must be at least 0']
      }
    }]
  }],
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  }
}, {
  timestamps: true
})

// Index for efficient queries
UnitSchema.index({ title: 1 })
UnitSchema.index({ courses: 1 })
UnitSchema.index({ organization: 1 })
UnitSchema.index({ createdAt: -1 })

export const Unit = mongoose.models.Unit || mongoose.model<IUnit>('Unit', UnitSchema)