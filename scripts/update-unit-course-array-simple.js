// Direct MongoDB update script for unit course array
// Usage: node update-unit-course-array-mongodb.js

const { MongoClient } = require('mongodb');

async function updateUnitCourseArray() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/help-academy';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db();
    const unitsCollection = db.collection('units');
    const coursesCollection = db.collection('courses');
    
    console.log('📚 Updating unit course array...\n');
    
    // Get all courses
    const courses = await coursesCollection.find({}).toArray();
    console.log(`Found ${courses.length} courses`);
    
    let totalUpdates = 0;
    
    // Process each course
    for (const course of courses) {
      console.log(`\n📖 Course: "${course.name}"`);
      
      if (course.units && course.units.length > 0) {
        // Update each unit in this course
        for (const unitId of course.units) {
          try {
            const result = await unitsCollection.updateOne(
              { _id: unitId },
              { 
                $addToSet: { courses: course._id }, // Add course if not already present
                $set: { updatedAt: new Date() }
              }
            );
            
            if (result.modifiedCount > 0) {
              console.log(`  ✅ Added course reference to unit ${unitId}`);
              totalUpdates++;
            }
          } catch (error) {
            console.log(`  ❌ Error updating unit ${unitId}:`, error.message);
          }
        }
      }
    }
    
    // Verify results
    console.log('\n🔍 Verifying updates...');
    const unitsWithCourses = await unitsCollection.countDocuments({
      courses: { $exists: true, $ne: [] }
    });
    
    console.log(`📊 Summary:`);
    console.log(`✅ Total updates performed: ${totalUpdates}`);
    console.log(`📄 Units with course references: ${unitsWithCourses}`);
    
    console.log('\n🎉 Unit course array update completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updateUnitCourseArray();
