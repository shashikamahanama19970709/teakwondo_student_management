import mongoose, { Schema, Document } from 'mongoose'

// Group interface
interface IGroup {
  name: string
  type: 'weekdays' | 'weekends' | 'custom'
  days?: string[]
  batches: IBatch[]
}

// Batch interface
interface IBatch {
  name: string
  description?: string
  students: string[]
  startDate: Date
  endDate: Date
  progress: number
  status?: 'active' | 'completed'
}

// Course document interface
interface ICourse extends Document {
  name: string
  description: string
  lecturers: mongoose.Types.ObjectId[]
  certifications: mongoose.Types.ObjectId[]
  units: mongoose.Types.ObjectId[]
  groups: IGroup[]
  organization: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Group schema
const GroupSchema = new Schema<IGroup>({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['weekdays', 'weekends', 'custom'],
    required: true
  },
  days: [{
    type: String
  }],
  batches: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    students: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active'
    }
  }]
}, { _id: true })

// Course schema
const CourseSchema = new Schema<ICourse>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  lecturers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  certifications: [{
    type: Schema.Types.ObjectId,
    ref: 'Certification'
  }],
  units: [{
    type: Schema.Types.ObjectId,
    ref: 'Unit'
  }],
  groups: [GroupSchema],
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Indexes for better performance
CourseSchema.index({ organization: 1, name: 1 })
CourseSchema.index({ createdBy: 1 })
CourseSchema.index({ lecturers: 1 })
CourseSchema.index({ isActive: 1 })

export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema)
export type { ICourse, IGroup, IBatch }
