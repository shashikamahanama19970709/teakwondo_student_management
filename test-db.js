const mongoose = require('mongoose');

async function test() {
    await mongoose.connect('mongodb://localhost:27017/teakwondo_student_management');
    const db = mongoose.connection.db;
    const announcements = await db.collection('announcements').find().toArray();
    console.log(announcements.map(a => a.featureImageUrl));
    process.exit(0);
}

test();
