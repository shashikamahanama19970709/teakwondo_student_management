import mongoose, { Schema, Document } from 'mongoose'

// ── Sub-menu item ────────────────────────────────────────────────────────────
export interface INavbarSubItem extends Document {
    heading: mongoose.Types.ObjectId
    organization: mongoose.Types.ObjectId
    title: string
    slug: string
    icon?: string          // lucide icon name string, e.g. "GraduationCap"
    description?: string
    date?: Date
    images: string[]       // uploaded file URLs
    videos: string[]       // uploaded file URLs
    order: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

const NavbarSubItemSchema = new Schema<INavbarSubItem>({
    heading: { type: Schema.Types.ObjectId, ref: 'NavbarHeading', required: true },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    icon: { type: String, trim: true },
    description: { type: String, trim: true },
    date: { type: Date },
    images: [{ type: String }],
    videos: [{ type: String }],
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true })

NavbarSubItemSchema.index({ heading: 1, organization: 1 })
NavbarSubItemSchema.index({ slug: 1, organization: 1 })

// ── Heading ──────────────────────────────────────────────────────────────────
export interface INavbarHeading extends Document {
    organization: mongoose.Types.ObjectId
    name: string
    slug: string
    isDefault: boolean     // Features and Courses are default (cannot be deleted)
    defaultType?: 'features' | 'courses'  // only set when isDefault === true
    order: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

const NavbarHeadingSchema = new Schema<INavbarHeading>({
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
    defaultType: { type: String, enum: ['features', 'courses'] },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true })

NavbarHeadingSchema.index({ organization: 1 })
NavbarHeadingSchema.index({ slug: 1, organization: 1 }, { unique: true })

// Guard against stale cached models in dev hot-reload
if (mongoose.models.NavbarSubItem) delete mongoose.models.NavbarSubItem
if (mongoose.models.NavbarHeading) delete mongoose.models.NavbarHeading

export const NavbarSubItem = mongoose.model<INavbarSubItem>('NavbarSubItem', NavbarSubItemSchema)
export const NavbarHeading = mongoose.model<INavbarHeading>('NavbarHeading', NavbarHeadingSchema)
