import mongoose, { Schema, Document } from 'mongoose'

export interface IInquiry extends Document {
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
  status: 'PENDING' | 'ATTENDED' | 'STUDENT_ADDED'
  announcementTitle?: string
  type?: string
  createdAt: Date
  updatedAt: Date
}

const InquirySchema = new Schema<IInquiry>({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['PENDING', 'ATTENDED', 'STUDENT_ADDED'],
    default: 'PENDING'
  },
  announcementTitle: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Index for efficient queries
InquirySchema.index({ status: 1, createdAt: -1 })
InquirySchema.index({ email: 1 })

// Prevent duplicate inquiries from same email within 24 hours (only for announcement inquiries)
InquirySchema.pre('save', async function(next) {
  if (this.isNew && this.announcementTitle !== 'Custom Inquiry') {
    const existingInquiry = await mongoose.model('Inquiry').findOne({
      email: this.email,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    if (existingInquiry) {
      const error = new Error('You have already submitted an inquiry in the last 24 hours')
      return next(error)
    }
  }
  next()
})

// Delete stale cached model so schema changes are always picked up
if (mongoose.models.Inquiry) {
  delete mongoose.models.Inquiry
}

export const Inquiry = mongoose.model<IInquiry>('Inquiry', InquirySchema)