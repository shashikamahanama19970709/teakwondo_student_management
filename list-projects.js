const mongoose = require('mongoose');

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/teakwondo_student_management');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const projects = await db.collection('projects').find({is_deleted: {$ne: true}}).toArray();

    console.log('All projects:');
    projects.forEach(project => {
      console.log(`ID: ${project._id}, Name: ${project.name}, Organization: ${project.organization}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

test();