import connectDB from '../lib/db-config'
import { Subject } from '../models/Subject'

async function testSubjectModel() {
  try {
    console.log('Testing Subject model...')

    await connectDB()
    console.log('Database connected')

    // Try to create a test subject
    const testSubject = new Subject({
      name: 'Test Subject',
      code: 'TEST001',
      totalLessons: 10,
      project: '507f1f77bcf86cd799439011', // dummy ObjectId
      organization: '507f1f77bcf86cd799439011', // dummy ObjectId
      createdBy: '507f1f77bcf86cd799439011' // dummy ObjectId
    })

    console.log('Subject instance created:', testSubject)

    // Don't actually save it, just test instantiation
    console.log('Subject model test passed')

  } catch (error) {
    console.error('Subject model test failed:', error)
  }
}

testSubjectModel()