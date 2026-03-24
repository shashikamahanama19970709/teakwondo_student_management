import mongoose, { Schema, Document } from 'mongoose'

export interface IStudentTracking extends Document {
  studentId: mongoose.Types.ObjectId
  unitId: mongoose.Types.ObjectId
  fileId: string
  fileType: 'video' | 'image' | 'document'
  organization: mongoose.Types.ObjectId
  // Video tracking
  durationWatched?: number
  completionPercentage?: number
  lastWatchedAt?: Date
  // Document/Image tracking
  viewCount?: number
  firstViewedAt?: Date
  lastViewedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const StudentTrackingSchema = new Schema<IStudentTracking>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  unitId: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  fileId: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['video', 'image', 'document'],
    required: true
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  // Video tracking fields
  durationWatched: {
    type: Number,
    default: 0
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  lastWatchedAt: {
    type: Date
  },
  // Document/Image tracking fields
  viewCount: {
    type: Number,
    default: 0
  },
  firstViewedAt: {
    type: Date
  },
  lastViewedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
StudentTrackingSchema.index({ studentId: 1, unitId: 1, fileId: 1 })
StudentTrackingSchema.index({ unitId: 1, fileId: 1 })
StudentTrackingSchema.index({ organization: 1, studentId: 1 })
StudentTrackingSchema.index({ fileType: 1, lastViewedAt: 1 })

export const StudentTracking = mongoose.models.StudentTracking || mongoose.model<IStudentTracking>('StudentTracking', StudentTrackingSchema)