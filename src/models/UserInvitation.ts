import mongoose, { Schema, Document } from 'mongoose'

export interface IUserInvitation extends Document {
  email: string
  organization: mongoose.Types.ObjectId
  invitedBy: mongoose.Types.ObjectId
  role: 'admin' | 'lecturer' | 'minor_staff' | 'student'
  customRole?: mongoose.Types.ObjectId
  courseId?: mongoose.Types.ObjectId // For students
  groupName?: string // For students
  token: string
  expiresAt: Date
  isAccepted: boolean
  acceptedAt?: Date
  firstName?: string
  lastName?: string
  createdAt: Date
  updatedAt: Date
}

const UserInvitationSchema = new Schema<IUserInvitation>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    maxlength: 100
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'lecturer', 'minor_staff', 'student'],
    required: false,
    default: 'student'
  },
  customRole: {
    type: Schema.Types.ObjectId,
    ref: 'CustomRole'
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  groupName: {
    type: String,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  acceptedAt: Date,
  firstName: String,
  lastName: String
}, {
  timestamps: true
})

// Indexes
UserInvitationSchema.index({ email: 1, organization: 1 })
UserInvitationSchema.index({ expiresAt: 1 })
UserInvitationSchema.index({ isAccepted: 1 })

export const UserInvitation = mongoose.models.UserInvitation || mongoose.model<IUserInvitation>('UserInvitation', UserInvitationSchema)
