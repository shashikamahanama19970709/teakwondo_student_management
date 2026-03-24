const mongoose = require('mongoose')

// Define schemas inline since we can't import TypeScript files
const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  description: String,
  totalLessons: { type: Number, required: true },
  duration: {
    hours: Number,
    weeks: Number
  },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { timestamps: true })

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['draft', 'planning', 'active', 'on_hold', 'completed', 'cancelled'], default: 'planning' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  isDraft: { type: Boolean, default: false },
  isBillableByDefault: { type: Boolean, default: true },
  organization: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }]
}, { timestamps: true })

const Subject = mongoose.model('Subject', subjectSchema)
const Project = mongoose.model('Project', projectSchema)

async function addSampleSubjects() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27018/helplineacademy')

    // Find the Care Giver L 3 course
    const course = await Project.findOne({ name: /Care Giver L 3/i })
    if (!course) {
      console.log('Care Giver L 3 course not found')
      return
    }

    console.log('Found course:', course.name, course._id)

    // Check if subjects already exist
    const existingSubjects = await Subject.find({ project: course._id })
    if (existingSubjects.length > 0) {
      console.log('Subjects already exist for this course:', existingSubjects.map(s => s.name))
      return
    }

    // Sample subjects for Care Giver L 3 course
    const sampleSubjects = [
      {
        name: 'Introduction to Caregiving',
        code: 'CG-L3-001',
        description: 'Basic principles and responsibilities of professional caregiving',
        totalLessons: 5,
        duration: { hours: 10, weeks: 1 },
        order: 1,
        status: 'active',
        project: course._id,
        organization: course.organization,
        createdBy: course.createdBy
      },
      {
        name: 'Patient Safety and Hygiene',
        code: 'CG-L3-002',
        description: 'Maintaining patient safety and proper hygiene practices',
        totalLessons: 8,
        duration: { hours: 16, weeks: 2 },
        order: 2,
        status: 'active',
        project: course._id,
        organization: course.organization,
        createdBy: course.createdBy
      },
      {
        name: 'Basic Medical Knowledge',
        code: 'CG-L3-003',
        description: 'Fundamental medical concepts and terminology',
        totalLessons: 10,
        duration: { hours: 20, weeks: 2 },
        order: 3,
        status: 'active',
        project: course._id,
        organization: course.organization,
        createdBy: course.createdBy
      },
      {
        name: 'Communication Skills',
        code: 'CG-L3-004',
        description: 'Effective communication with patients and healthcare teams',
        totalLessons: 6,
        duration: { hours: 12, weeks: 1 },
        order: 4,
        status: 'active',
        project: course._id,
        organization: course.organization,
        createdBy: course.createdBy
      },
      {
        name: 'Emergency Response',
        code: 'CG-L3-005',
        description: 'Handling emergency situations and basic first aid',
        totalLessons: 7,
        duration: { hours: 14, weeks: 2 },
        order: 5,
        status: 'active',
        project: course._id,
        organization: course.organization,
        createdBy: course.createdBy
      }
    ]

    // Create subjects
    const createdSubjects = await Subject.insertMany(sampleSubjects)
    console.log('Created subjects:', createdSubjects.map(s => ({ name: s.name, code: s.code })))

    // Update project with subject references
    await Project.findByIdAndUpdate(course._id, {
      $push: { subjects: { $each: createdSubjects.map(s => s._id) } }
    })

    console.log('Successfully added sample subjects to Care Giver L 3 course')

  } catch (error) {
    console.error('Error adding sample subjects:', error)
  } finally {
    await mongoose.disconnect()
  }
}
