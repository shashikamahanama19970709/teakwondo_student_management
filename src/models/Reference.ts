import mongoose, { Schema, Document } from 'mongoose'

export interface IReference extends Document {
  taskId: mongoose.Types.ObjectId
  name: string
  originalName: string
  url: string
  size: number
  type: string
  mimeType: string
  uploadedBy: mongoose.Types.ObjectId
  uploadedAt: Date
  isVideo: boolean
  thumbnailUrl?: string
}

const ReferenceSchema = new Schema<IReference>({
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  originalName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['image', 'video', 'document', 'other'],
    default: 'other'
  },
  mimeType: {
    type: String,
    required: true,
    trim: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  isVideo: {
    type: Boolean,
    default: false
  },
  thumbnailUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Indexes for performance
ReferenceSchema.index({ taskId: 1, uploadedAt: -1 })
ReferenceSchema.index({ uploadedBy: 1 })

// Pre-save middleware to determine type and isVideo
ReferenceSchema.pre('save', function(next) {
  const mimeType = this.mimeType.toLowerCase()

  if (mimeType.startsWith('image/')) {
    this.type = 'image'
    this.isVideo = false
  } else if (mimeType.startsWith('video/')) {
    this.type = 'video'
    this.isVideo = true
  } else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
    this.type = 'document'
    this.isVideo = false
  } else {
    this.type = 'other'
    this.isVideo = false
  }

  next()
})

export default mongoose.models.Reference || mongoose.model<IReference>('Reference', ReferenceSchema)