const mongoose = require('mongoose');

// Test script to verify student enrollment with groupName
async function testEnrollment() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/help_academy');
    
    // Import models
    const { User } = require('./src/models/User');
    const { UserInvitation } = require('./src/models/UserInvitation');
    const { Project } = require('./src/models/Project');
    
    console.log('Testing student enrollment with groupName...');
    
    // Find a student user
    const student = await User.findOne({ role: 'student' }).populate('enrolledCourses.courseId');
    
    if (!student) {
      console.log('No student found in database');
      return;
    }
    
    console.log('Student found:', {
      id: student._id,
      email: student.email,
      enrolledCourses: student.enrolledCourses
    });
    
    // Check if enrolledCourses has groupName
    if (student.enrolledCourses && student.enrolledCourses.length > 0) {
      student.enrolledCourses.forEach((enrollment, index) => {
        console.log(`Enrollment ${index + 1}:`, {
          courseId: enrollment.courseId._id,
          courseName: enrollment.courseId.name,
          groupName: enrollment.groupName,
          batchId: enrollment.batchId,
          badgeStatus: enrollment.badgeStatus,
          enrolledAt: enrollment.enrolledAt
        });
        
        if (!enrollment.groupName) {
          console.log(`❌ Issue: Enrollment ${index + 1} is missing groupName`);
        } else {
          console.log(`✅ Enrollment ${index + 1} has groupName: ${enrollment.groupName}`);
        }
      });
    } else {
      console.log('❌ Student has no enrolled courses');
    }
    
    // Test invitation acceptance logic
    console.log('\nTesting invitation acceptance logic...');
    
    const invitation = await UserInvitation.findOne({ role: 'student', isAccepted: false });
    
    if (invitation) {
      console.log('Found student invitation:', {
        id: invitation._id,
        email: invitation.email,
        courseId: invitation.courseId,
        groupName: invitation.groupName
      });
      
      // Test the group finding logic
      if (invitation.courseId) {
        const course = await Project.findById(invitation.courseId);
        if (course && course.groups && course.groups.length > 0) {
          console.log('Course groups found:', course.groups.map(g => g.name));
          console.log('Default group would be:', course.groups[0].name);
        } else {
          console.log('❌ No groups found in course');
        }
      }
    } else {
      console.log('No pending student invitation found');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testEnrollment();
