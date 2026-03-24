const mongoose = require('mongoose');

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/teakwondo_student_management');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const projects = await db.collection('projects').find({is_deleted: {$ne: true}}).limit(5).toArray();
    console.log('Found', projects.length, 'projects');

    if (projects.length > 0) {
      console.log('Sample project:', {
        id: projects[0]._id,
        name: projects[0].name,
        organization: projects[0].organization
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

test();