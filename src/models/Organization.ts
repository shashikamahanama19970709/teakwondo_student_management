import mongoose, { Schema, Document } from 'mongoose'

export interface IOrganization extends Document {
  name: string
  domain?: string
  description?: string
  vision?: string
  mission?: string
  logo?: string
  darkLogo?: string
  logoMode?: 'single' | 'dual' | 'both' |'light' | 'dark'
  timezone: string
  currency: string
  language: string
  industry?: string
  size: 'startup' | 'small' | 'medium' | 'enterprise'
  contactInfo?: {
    facebookUrl?: string
    showFacebook?: boolean
    linkedinUrl?: string
    showLinkedin?: boolean
    whatsapp?: string
    showWhatsapp?: boolean
    email?: string
    showEmail?: boolean
    mobile?: string
    showMobile?: boolean
    landphone?: string
    showLandphone?: boolean
    address?: string
    showAddress?: boolean
    mapLocationUrl?: string
    showMapLocation?: boolean
  }
  settings: {
    allowSelfRegistration: boolean
    defaultUserRole: string
    projectTemplates: mongoose.Types.ObjectId[]
    notifications: {
      retentionDays: number
      autoCleanup: boolean
    }
    timeTracking: {
      allowTimeTracking: boolean
      allowManualTimeSubmission: boolean
      requireApproval: boolean
      allowBillableTime: boolean
      defaultHourlyRate?: number
      maxDailyHours: number
      maxWeeklyHours: number
      maxSessionHours: number
      allowOvertime: boolean
      //requireDescription: boolean
      requireCategory: boolean
      allowFutureTime: boolean
      allowPastTime: boolean
      pastTimeLimitDays: number
      roundingRules: {
        enabled: boolean
        increment: number
        roundUp: boolean
      }
      notifications: {
        onTimerStart: boolean
        onTimerStop: boolean
        onOvertime: boolean
        onApprovalNeeded: boolean
        onTimeSubmitted: boolean
      }
    }
  }
  billing: {
    plan: 'free' | 'starter' | 'professional' | 'enterprise'
    maxUsers: number
    maxProjects: number
    features: string[]
  }
  emailConfig?: {
    provider: 'smtp' | 'azure' | 'sendgrid' | 'mailgun'
    smtp?: {
      host: string
      port: number
      secure: boolean
      username: string
      password: string
      fromEmail: string
      fromName: string
    }
    azure?: {
      connectionString: string
      fromEmail: string
      fromName: string
    }
  }
  databaseConfig?: {
    host: string
    port: number
    database: string
    username: string
    password: string
    authSource: string
    ssl: boolean
    uri: string
  }
  landingPageImages?: {
    heroDashboard?: string
    modulePreview?: string
    stepImages?: {
      step1?: string
      step2?: string
      step3?: string
    }
    showcaseImages?: {
      tasks?: string
      projects?: string
      members?: string
      timeLogs?: string
      reports?: string
    }
  }
  createdAt: Date
  updatedAt: Date
}

const OrganizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true, trim: true },
  domain: String,
  description: String,
  vision: String,
  mission: String,
  logo: String,
  darkLogo: String,
  logoMode: { type: String, enum: ['single', 'dual', 'both', 'light', 'dark'], default: 'single' },
  timezone: { type: String, default: 'UTC' },
  currency: { type: String, default: 'USD' },
  language: { type: String, default: 'en' },
  industry: String,
  size: { 
    type: String, 
    enum: ['startup', 'small', 'medium', 'enterprise'],
    default: 'small'
  },
  contactInfo: {
    facebookUrl: String,
    showFacebook: { type: Boolean, default: false },
    linkedinUrl: String,
    showLinkedin: { type: Boolean, default: false },
    whatsapp: String,
    showWhatsapp: { type: Boolean, default: false },
    email: String,
    showEmail: { type: Boolean, default: false },
    mobile: String,
    showMobile: { type: Boolean, default: false },
    landphone: String,
    showLandphone: { type: Boolean, default: false },
    address: String,
    showAddress: { type: Boolean, default: false },
    mapLocationUrl: String,
    showMapLocation: { type: Boolean, default: false }
  },
  settings: {
    allowSelfRegistration: { type: Boolean, default: false },
    defaultUserRole: { type: String, default: 'student' },
    projectTemplates: [{ type: Schema.Types.ObjectId, ref: 'ProjectTemplate' }],
    notifications: {
      retentionDays: { type: Number, default: 30, min: 1, max: 365 },
      autoCleanup: { type: Boolean, default: true }
    },
    timeTracking: {
      allowTimeTracking: { type: Boolean, default: true },
      allowManualTimeSubmission: { type: Boolean, default: true },
      requireApproval: { type: Boolean, default: false },
      allowBillableTime: { type: Boolean, default: true },
      defaultHourlyRate: { type: Number, min: 0 },
      maxDailyHours: { type: Number, default: 12, min: 1, max: 24 },
      maxWeeklyHours: { type: Number, default: 60, min: 1, max: 168 },
      maxSessionHours: { type: Number, default: 8, min: 1, max: 24 },
      allowOvertime: { type: Boolean, default: false },
     // requireDescription: { type: Boolean, default: true },
      requireCategory: { type: Boolean, default: false },
      allowFutureTime: { type: Boolean, default: false },
      allowPastTime: { type: Boolean, default: true },
      pastTimeLimitDays: { type: Number, default: 30, min: 1, max: 365 },
      roundingRules: {
        enabled: { type: Boolean, default: false },
        increment: { type: Number, default: 15, min: 1, max: 60 },
        roundUp: { type: Boolean, default: true }
      },
      notifications: {
        onTimerStart: { type: Boolean, default: false },
        onTimerStop: { type: Boolean, default: true },
        onOvertime: { type: Boolean, default: true },
        onApprovalNeeded: { type: Boolean, default: true },
        onTimeSubmitted: { type: Boolean, default: true }
      }
    }
  },
  billing: {
    plan: { 
      type: String, 
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'free'
    },
    maxUsers: { type: Number, default: 5 },
    maxProjects: { type: Number, default: 3 },
    features: [String]
  },
  emailConfig: {
    provider: { type: String, enum: ['smtp', 'azure', 'sendgrid', 'mailgun'] },
    smtp: {
      host: String,
      port: Number,
      secure: Boolean,
      username: String,
      password: String,
      fromEmail: String,
      fromName: String
    },
    azure: {
      connectionString: String,
      fromEmail: String,
      fromName: String
    }
  },
  databaseConfig: {
    host: String,
    port: Number,
    database: String,
    username: String,
    password: String,
    authSource: String,
    ssl: Boolean,
    uri: String
  },
  landingPageImages: {
    heroDashboard: String,
    modulePreview: String,
    stepImages: {
      step1: String,
      step2: String,
      step3: String
    },
    showcaseImages: {
      tasks: String,
      projects: String,
      members: String,
      timeLogs: String,
      reports: String
    }
  }
}, {
  timestamps: true,
  strict: false // Allow saving fields not explicitly defined in schema (for flexibility)
})

export const Organization = mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema)
