import mongoose, { Schema, Document } from 'mongoose'

export interface ICertification extends Document {
  name: string
  description: string
  status: 'active' | 'inactive' | 'draft'
  isActive: boolean
  organization: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
  issuingOrganization: string
  skills: string[]
  attachments: Array<{
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
    uploadedAt: Date
  }>
  tags: string[]
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  isDeleted: boolean
}

const CertificationSchema = new Schema<ICertification>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: false
  },
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
  issuingOrganization: {
    type: String,
    required: true,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes
CertificationSchema.index({ organization: 1, isDeleted: 1 })
CertificationSchema.index({ organization: 1, status: 1, isDeleted: 1 })
CertificationSchema.index({ organization: 1, name: 1, isDeleted: 1 })
CertificationSchema.index({ organization: 1, issuingOrganization: 1, isDeleted: 1 })

export const Certification = mongoose.models.Certification || mongoose.model<ICertification>('Certification', CertificationSchema)