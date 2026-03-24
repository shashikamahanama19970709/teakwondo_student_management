import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-utils'
import connectDB from '@/lib/db-config'
import { Unit } from '@/models/Unit'
import { Course } from '@/models/Course'
import { User } from '@/models/User'
import mongoose from 'mongoose'

// GET /api/assignments - Get all assignments across all units for the user's organization
export async function GET(
  request: NextRequest,
) {
  try {
    await connectDB()

    // Authenticate user
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult

    // Get user from database
    const userDoc = await User.findById(user.id)
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const organizationId = userDoc.organization!

    // Get all units for the organization
    const units = await Unit.find({ 
      organization: organizationId 
    }).populate('assignments.createdBy', 'name email')
      .populate('courses', 'title')

    if (!units || units.length === 0) {
      return NextResponse.json([])
    }

    // Collect all assignments from all units
    const allAssignments: any[] = []

    units.forEach((unit: any) => {
      if (unit.assignments && unit.assignments.length > 0) {
        unit.assignments.forEach((assignment: any) => {
          allAssignments.push({
            ...assignment.toObject(),
            unit: {
              _id: unit._id,
              title: unit.title,
              courses: unit.courses
            }
          })
        })
      }
    })

    // Sort assignments by creation date (newest first)
    const sortedAssignments = allAssignments.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json(sortedAssignments)
  } catch (error) {
    console.error('Error fetching all assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    
    const authResult = await authenticateUser()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult
    
    const { title, description, deadline, course, unit } = await request.json()

    // Validate required fields
    if (!title || !description || !deadline || !course || !unit) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, description, deadline, course, unit' 
      }, { status: 400 })
    }

    await connectDB()

    // Get user's role and courses
    const userWithRole = await User.findById(user.id)
    const userRole = userWithRole?.role?.toLowerCase() || 'student'

    // Use raw MongoDB query to work with units collection like quizzes
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    
    const unitsCollection = db.collection('units')

    let assignmentData: any = null

    if (userRole === 'student') {
      // Students can only create assignments if they're enrolled in course
      const courses = await Course.find({
        isActive: true,
        'groups.batches.students': user.id
      }).select('_id name').lean()
      
      const courseIds = courses.map(course => course._id)
     
      
      if (!courseIds.includes(course)) {
       
        return NextResponse.json(
          { error: 'You are not enrolled in this course' },
          { status: 403 }
        )
      }
      
      // Find unit and add assignment to it
      const units = await unitsCollection
        .find({
          _id: unit,
          courses: { $in: courseIds }
        })
        .toArray()

     

      if (units.length > 0) {
        const unitDoc = units[0]
     
        
        const newAssignment = {
          _id: new mongoose.Types.ObjectId(),
          title,
          description,
          dueDate: new Date(deadline),
          isActive: true,
          createdBy: user.id,
          createdAt: new Date()
        }

      

        // Add assignment to unit
        const updateResult = await unitsCollection.updateOne(
          { _id: unit },
          { 
            $push: { assignments: newAssignment as any }
          }
        )

    

        assignmentData = {
          ...newAssignment,
          unit: {
            _id: unitDoc._id,
            title: unitDoc.title,
            description: unitDoc.description
          },
          course: courses.find((c: any) => unitDoc.courses.includes(c._id))
        }
      }

    } else if (userRole === 'admin') {
 
      // Admins can create assignments for any course
      const allCourses = await Course.find({ isActive: true }).select('_id name').lean()
    
      
      // Find unit and add assignment to it
      const units = await unitsCollection
        .find({ _id: unit })
        .toArray()

    
      const allUnits = await unitsCollection.find({}).project({ _id: 1 }).toArray()
      allUnits.forEach((u: any) => console.log('  -', u._id.toString(), 'type:', typeof u._id))
      
      if (units.length > 0) {
        const unitDoc = units[0]
        
        
        const newAssignment = {
          _id: new mongoose.Types.ObjectId(),
          title,
          description,
          dueDate: new Date(deadline),
          isActive: true,
          createdBy: user.id,
          createdAt: new Date()
        }



        // Add assignment to unit
        const updateResult = await unitsCollection.updateOne(
          { _id: unit },
          { 
            $push: { assignments: newAssignment as any }
          }
        )

    

        assignmentData = {
          ...newAssignment,
          unit: {
            _id: unitDoc._id,
            title: unitDoc.title,
            description: unitDoc.description
          },
          course: allCourses.find((c: any) => unitDoc.courses.includes(c._id))
        }
      } else {
        const unitObjectId = new mongoose.Types.ObjectId(unit)
       
        
        const unitsWithObjectId = await unitsCollection
          .find({ _id: unitObjectId })
          .toArray()
        
      
        if (unitsWithObjectId.length > 0) {
      
          const unitDoc = unitsWithObjectId[0]
          
          const newAssignment = {
            _id: new mongoose.Types.ObjectId(),
            title,
            description,
            dueDate: new Date(deadline),
            isActive: true,
            createdBy: user.id,
            createdAt: new Date()
          }

          const updateResult = await unitsCollection.updateOne(
            { _id: unitObjectId },
            { 
              $push: { assignments: newAssignment as any }
            }
          )


          assignmentData = {
            ...newAssignment,
            unit: {
              _id: unitDoc._id,
              title: unitDoc.title,
              description: unitDoc.description
            },
            course: allCourses.find((c: any) => unitDoc.courses.includes(c._id))
          }
        }
      }

    } else {
      // Teachers can create assignments for courses they're assigned to
      const courses = await Course.find({
        isActive: true,
        lecturers: user.id
      }).select('_id name').lean()
      
      const courseIds = courses.map(course => course._id)

      
      if (!courseIds.includes(course)) {
      
        return NextResponse.json(
          { error: 'You are not assigned to this course' },
          { status: 403 }
        )
      }
      
      // Find unit and add assignment to it
      const units = await unitsCollection
        .find({
          _id: unit,
          courses: { $in: courseIds }
        })
        .toArray()

   

      if (units.length > 0) {
        const unitDoc = units[0]
   
        
        const newAssignment = {
          _id: new mongoose.Types.ObjectId(),
          title,
          description,
          dueDate: new Date(deadline),
          isActive: true,
          createdBy: user.id,
          createdAt: new Date()
        }

    
        // Add assignment to unit
        const updateResult = await unitsCollection.updateOne(
          { _id: unit },
          { 
            $push: { assignments: newAssignment as any }
          }
        )

     

        assignmentData = {
          ...newAssignment,
          unit: {
            _id: unitDoc._id,
            title: unitDoc.title,
            description: unitDoc.description
          },
          course: courses.find((c: any) => unitDoc.courses.includes(c._id))
        }
      } 
    }

    if (!assignmentData) {
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Assignment created successfully', 
      assignment: assignmentData
    }, { status: 201 })

  } catch (error) {
    console.error('💥 Error creating assignment:', error)
    if (error instanceof Error) {
      console.error('💥 Error stack:', error.stack)
    }
    return NextResponse.json({ 
      error: 'Failed to create assignment' 
    }, { status: 500 })
  }
}
