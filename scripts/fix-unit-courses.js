const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const Unit = require('../src/models/Unit');

async function fixUnitCourses() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all units with corrupted courses data
    const corruptedUnits = await Unit.find({
      $or: [
        { courses: { $type: 'array', $eq: [] } }, // Empty arrays are fine
        { courses: { $exists: false } }, // Missing courses field
        { 
          courses: { 
            $type: 'array',
            $not: { $elemMatch: { $type: 'string' } }
          } 
        } // Arrays with non-string elements
      ]
    });

    console.log(`Found ${corruptedUnits.length} units with corrupted courses data`);

    for (const unit of corruptedUnits) {
      console.log(`\nProcessing unit: ${unit.title} (${unit._id})`);
      console.log(`Current courses:`, unit.courses);

      // Filter out invalid values
      const validCourses = unit.courses?.filter(course => 
        course !== undefined && 
        course !== null && 
        course !== '' &&
        typeof course === 'string'
      ) || [];

      console.log(`Valid courses after filtering:`, validCourses);

      // Update the unit with clean courses array
      await Unit.findByIdAndUpdate(unit._id, {
        courses: validCourses
      });

      console.log(`✅ Fixed unit: ${unit.title}`);
    }

    console.log('\n✅ All units have been fixed!');
    
  } catch (error) {
    console.error('Error fixing unit courses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
fixUnitCourses();
