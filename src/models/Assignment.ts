import mongoose, { Schema, Document } from 'mongoose'

export interface IAssignment extends Document {
  unitId: mongoose.Types.ObjectId
  title: string
  description: string
  deadline: Date
  createdBy: mongoose.Types.ObjectId
  organization: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const AssignmentSchema = new Schema<IAssignment>({
  unitId: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: [true, 'Unit ID is required']
  },
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [200, 'Assignment title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
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
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  }
}, {
  timestamps: true
})

// Index for efficient queries
AssignmentSchema.index({ unitId: 1 })
AssignmentSchema.index({ deadline: 1 })
AssignmentSchema.index({ createdBy: 1 })
AssignmentSchema.index({ organization: 1 })
AssignmentSchema.index({ createdAt: -1 })

export const Assignment = mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema)
