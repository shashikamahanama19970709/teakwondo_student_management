import mongoose, { Schema, Document } from 'mongoose'

export interface ISubject extends Document {
  name: string
  code: string
  description?: string
  totalLessons: number
  order: number
  status: 'active' | 'draft'
  project: mongoose.Types.ObjectId
  organization: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const SubjectSchema = new Schema<ISubject>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  totalLessons: {
    type: Number,
    required: true,
    min: 1
  },
  order: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'draft'],
    default: 'active'
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  organization: {
    type: Schema.Types.ObjectId,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Compound index to ensure unique subject codes per project
SubjectSchema.index({ project: 1, code: 1 }, { unique: true })

// Index for efficient queries
SubjectSchema.index({ project: 1, order: 1 })
SubjectSchema.index({ organization: 1 })

// Ensure the model is registered
const Subject = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema)

export { Subject }