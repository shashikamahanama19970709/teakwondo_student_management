const mongoose = require('mongoose')

// Define Subject schema inline
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

// Define Project schema inline
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['draft', 'planning', 'active', 'on_hold', 'completed', 'cancelled'], default: 'planning' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  isDraft: { type: Boolean, default: false },
  organization: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }]
}, { timestamps: true })

const Subject = mongoose.model('Subject', subjectSchema)
const Project = mongoose.model('Project', projectSchema)

async function checkSubjects() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27018/helplineacademy')
    console.log('Connected to database')

    // Find all projects
    const projects = await Project.find({})
    console.log(`Found ${projects.length} projects:`)
    projects.forEach(p => {
      console.log(`- ${p.name} (${p._id})`)
    })

    // Find projects with 'Care Giver' in the name
    const caregiverProjects = await Project.find({ name: /Care Giver/i })
    console.log(`\nFound ${caregiverProjects.length} Care Giver projects:`)
    caregiverProjects.forEach(p => {
      console.log(`- ${p.name} (${p._id})`)
      console.log(`  Status: ${p.status}`)
      console.log(`  Subjects array: ${p.subjects}`)
    })

    // Find all subjects
    const allSubjects = await Subject.find({})
    console.log(`\nFound ${allSubjects.length} subjects in database:`)
    allSubjects.forEach(s => {
      console.log(`- ${s.name} (${s.code}) - Project: ${s.project}`)
    })

    // Check subjects for Care Giver projects
    for (const project of caregiverProjects) {
      const subjects = await Subject.find({ project: project._id })
      console.log(`\nSubjects for ${project.name}: ${subjects.length}`)
      subjects.forEach(s => {
        console.log(`  - ${s.name} (${s.code})`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from database')
  }
}
checkSubjects()