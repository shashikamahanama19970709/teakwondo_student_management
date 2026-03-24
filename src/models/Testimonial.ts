import mongoose, { Schema, Document } from 'mongoose'

export interface ITestimonial extends Document {
    name: string
    role: string
    message: string
    profile_picture: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

const TestimonialSchema = new Schema<ITestimonial>({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        trim: true,
        maxlength: [100, 'Role cannot exceed 100 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    profile_picture: {
        type: String,
        required: [true, 'Profile picture is required']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

// Index for efficient queries
TestimonialSchema.index({ createdAt: -1 })

// Clear any existing model to force recompile
if (mongoose.models.Testimonial) {
    delete mongoose.models.Testimonial
}

export const Testimonial = mongoose.model<ITestimonial>('Testimonial', TestimonialSchema)
