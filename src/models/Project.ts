import mongoose, { Schema, Document } from 'mongoose'

export interface IProject extends Document {
  name: string
  description: string
  status: 'draft' | 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  isDraft: boolean
  isBillableByDefault: boolean
  organization: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
  teamMembers: Array<{
    memberId: mongoose.Types.ObjectId
    hourlyRate?: number
    rateType?: 'hourly' | 'monthly'
  }>
  memberRates?: Array<{
    user: mongoose.Types.ObjectId
    hourlyRate: number
  }>
  client?: mongoose.Types.ObjectId
  projectNumber: number
  // Project-specific roles for team members
  projectRoles: {
    user: mongoose.Types.ObjectId
    role: 'project_manager' | 'project_member' | 'project_viewer' | 'project_client' | 'project_account_manager' | 'project_qa_lead' | 'project_tester'
    assignedBy: mongoose.Types.ObjectId
    assignedAt: Date
  }[]
  accountManager?: mongoose.Types.ObjectId
  settings: {
    allowTimeTracking: boolean
    allowManualTimeSubmission: boolean
    allowExpenseTracking: boolean
    requireApproval: boolean
    notifications: {
      taskUpdates: boolean
      budgetAlerts: boolean
      deadlineReminders: boolean
    }
    kanbanStatuses?: Array<{
      key: string
      title: string
      color?: string
      order: number
    }>
  }
  tags: string[]
  groups: Array<{
    name: string
    schedule: {
      type: 'weekdays' | 'weekends' | 'custom'
      days?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[]
    }
    startTime: string
    endTime: string
    batches: Array<{
      batchName: string
      timeline: {
        startDate: Date
        endDate: Date
      }
      budget: {
        totalBudget: number
        currency: string
        lecturerPayment: number
        materialCost: number
      }
   
      students: mongoose.Types.ObjectId[]
    }>
  }>
  certificates: mongoose.Types.ObjectId[] // References to Certification documents
  subjects?: mongoose.Types.ObjectId[] // References to Subject documents
  customFields: Record<string, any>
  attachments: {
    name: string
    url: string
    size: number
    type: string
    uploadedBy: mongoose.Types.ObjectId
    uploadedAt: Date
  }[]
  externalLinks?: {
    figma?: string[]
    documentation?: string[]
  }
  // Test management - versions array
  versions: {
    name: string
    version: string
    description?: string
    releaseDate?: Date
    isReleased: boolean
    createdBy: mongoose.Types.ObjectId
    createdAt: Date
  }[]
  archived: boolean
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema = new Schema<IProject>({
  name: { type: String, required: true, trim: true },
  description: String,
  status: { 
    type: String, 
    enum: ['draft', 'planning', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  isDraft: { type: Boolean, default: false },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectNumber: { type: Number, required: true },
  teamMembers: [{
    memberId: { type: Schema.Types.ObjectId, ref: 'User' },
    hourlyRate: { type: Number, min: 0 },
    rateType: { type: String, enum: ['hourly', 'monthly'], default: 'hourly' }
  }],
  isBillableByDefault: { type: Boolean, default: true },
  memberRates: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    hourlyRate: Number
  }],
  client: { type: Schema.Types.ObjectId, ref: 'User' },
  // Project-specific roles
  projectRoles: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { 
      type: String, 
      enum: ['project_manager', 'project_member', 'project_viewer', 'project_client', 'project_account_manager', 'project_qa_lead', 'project_tester'],
      required: true 
    },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedAt: { type: Date, default: Date.now }
  }],
  accountManager: { type: Schema.Types.ObjectId, ref: 'User' },
  settings: {
    allowTimeTracking: { type: Boolean, default: true },
    allowManualTimeSubmission: { type: Boolean, default: true },
    allowExpenseTracking: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    notifications: {
      taskUpdates: { type: Boolean, default: true },
      budgetAlerts: { type: Boolean, default: true },
      deadlineReminders: { type: Boolean, default: true }
    },
    kanbanStatuses: [{
      key: { type: String, required: true },
      title: { type: String, required: true },
      color: String,
      order: { type: Number, required: true }
    }]
  },
  tags: [{ type: String, trim: true }],
  groups: {
    type: [{
      name: { type: String, required: true, trim: true },
      schedule: {
        type: { 
          type: String, 
          enum: ['weekdays', 'weekends', 'custom'], 
          default: 'weekdays' 
        },
        days: [{ 
          type: String, 
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }]
      },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      batches: {
        type: [{
          batchName: { type: String, required: true, trim: true },
          timeline: {
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true }
          },
          budget: {
            totalBudget: { type: Number, required: true, min: 0 },
            currency: { type: String, required: true, default: 'USD' },
            lecturerPayment: { type: Number, required: true, min: 0 },
            materialCost: { type: Number, required: true, min: 0 }
          },
         
          students: [{ type: Schema.Types.ObjectId, ref: 'User' }]
        }],
        default: []
      }
    }],
    default: []
  },
  certificates: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Certification' }],
    default: []
  },
  subjects: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    default: []
  },
  customFields: { type: Schema.Types.Mixed, default: {} },
  attachments: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  externalLinks: {
    figma: { type: [String], default: [] },
    documentation: { type: [String], default: [] }
  },
  // Test management - versions array
  versions: [{
    name: { type: String, required: true, trim: true, maxlength: 200 },
    version: { type: String, required: true, trim: true, maxlength: 50 },
    description: { type: String, maxlength: 1000 },
    releaseDate: Date,
    isReleased: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  archived: { type: Boolean, default: false }
}, {
  timestamps: true,
  minimize: false // Prevent Mongoose from removing empty objects
})

  // Indexes
ProjectSchema.index({ organization: 1, status: 1 })
ProjectSchema.index({ organization: 1, priority: 1 })
ProjectSchema.index({ createdBy: 1 })
ProjectSchema.index({ teamMembers: 1 })
ProjectSchema.index({ archived: 1 })
ProjectSchema.index({ organization: 1, archived: 1 })
ProjectSchema.index({ organization: 1, projectNumber: 1 }, { unique: true })

export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema)
