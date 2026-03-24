import mongoose, { Schema, Document } from 'mongoose'

export interface IAnnouncement extends Document {
  title: string
  description: string
  featureImageUrl?: string
  signedUrl?: string
  happeningDate: Date
  expireDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  featureImageUrl: {
    type: String,
    required: false,
    default: null
  },
  happeningDate: {
    type: Date,
    required: [true, 'Happening date is required']
  },
  expireDate: {
    type: Date,
    required: [true, 'Expire date is required'],
    validate: {
      validator: function(this: IAnnouncement, value: Date) {
        return value > this.happeningDate
      },
      message: 'Expire date must be after happening date'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for efficient queries
AnnouncementSchema.index({ isActive: 1, expireDate: 1, happeningDate: 1 })

// Pre-save validation
AnnouncementSchema.pre('save', function(next) {
  if (this.expireDate <= this.happeningDate) {
    next(new Error('Expire date must be after happening date'))
  } else {
    next()
  }
})

export const Announcement = mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema)