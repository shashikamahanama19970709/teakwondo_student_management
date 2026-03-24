const { MongoClient } = require('mongodb');

async function updateUnitCourseArray() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('help-academy');
    const unitsCollection = db.collection('units');
    const coursesCollection = db.collection('courses');
    
    console.log('📚 Starting unit course array update...\n');
    
    // Step 1: Get all courses with their units
    const courses = await coursesCollection.find({}).toArray();
    console.log(`Found ${courses.length} courses`);
    
    // Step 2: Build unit-to-courses mapping
    const unitToCoursesMap = {};
    
    for (const course of courses) {
      console.log(`\n📖 Processing course: "${course.name}"`);
      
      if (course.units && course.units.length > 0) {
        for (const unitId of course.units) {
          const unitIdStr = unitId.toString();
          
          if (!unitToCoursesMap[unitIdStr]) {
            unitToCoursesMap[unitIdStr] = [];
          }
          
          // Add course to unit's course array
          if (!unitToCoursesMap[unitIdStr].includes(course._id)) {
            unitToCoursesMap[unitIdStr].push(course._id);
          }
        }
        
        console.log(`  📄 Units in course: ${course.units.length}`);
      } else {
        console.log(`  ℹ️  No units found for course: "${course.name}"`);
      }
    }
    
    // Step 3: Update all units with their course references
    let updatedUnits = 0;
    let errors = 0;
    
    console.log('\n🔄 Updating units collection...');
    
    for (const [unitId, courseIds] of Object.entries(unitToCoursesMap)) {
      try {
        const result = await unitsCollection.updateOne(
          { _id: require('mongodb').ObjectId(unitId) },
          { 
            $set: { 
              courses: courseIds,
              updatedAt: new Date()
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`  ✅ Updated unit ${unitId} with ${courseIds.length} course references`);
          updatedUnits++;
        } else {
          console.log(`  ⏭️  Unit ${unitId} already has course references`);
        }
      } catch (error) {
        console.log(`  ❌ Error updating unit ${unitId}:`, error.message);
        errors++;
      }
    }
    
    // Step 4: Verify the updates
    console.log('\n🔍 Verifying updates...');
    const updatedUnitsData = await unitsCollection.find({
      courses: { $exists: true, $ne: [] }
    }).toArray();
    
    console.log(`Found ${updatedUnitsData.length} units with course references`);
    
    for (const unit of updatedUnitsData.slice(0, 5)) { // Show first 5 for brevity
      console.log(`📄 Unit "${unit.title}" has ${unit.courses?.length || 0} course references`);
    }
    
    // Step 5: Summary
    console.log('\n📊 Update Summary:');
    console.log(`✅ Updated units: ${updatedUnits}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📄 Total units with course references: ${updatedUnitsData.length}`);
    
    console.log('\n🎉 Unit course array update completed!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the update
updateUnitCourseArray();
