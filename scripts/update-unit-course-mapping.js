#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Unit = require('../src/models/Unit').Unit;
const Course = require('../src/models/Course').Course;

async function updateUnitCourseMapping() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/help-academy';
    await mongoose.connect(mongoUri);
    
    console.log('🔗 Connected to database');
    console.log('📚 Starting Unit-Course mapping update...\n');
    
    // Step 1: Get all courses with their units
    const courses = await Course.find({}).populate('units');
    console.log(`Found ${courses.length} courses`);
    
    // Step 2: Update each unit to reference its course
    let updatedUnits = 0;
    let skippedUnits = 0;
    let errors = 0;
    
    for (const course of courses) {
      console.log(`\n📖 Processing course: "${course.name}"`);
      
      if (course.units && course.units.length > 0) {
        for (const unit of course.units) {
          try {
            // Find the unit document
            const unitDoc = await Unit.findById(unit._id);
            
            if (unitDoc) {
              // Check if unit already has this course in its courses array
              const hasCourse = unitDoc.courses && unitDoc.courses.includes(course._id.toString());
              
              if (!hasCourse) {
                // Initialize courses array if it doesn't exist
                if (!unitDoc.courses) {
                  unitDoc.courses = [];
                }
                
                // Add course reference to unit
                unitDoc.courses.push(course._id);
                await unitDoc.save();
                
                console.log(`  ✅ Updated unit "${unit.title}" to reference course "${course.name}"`);
                updatedUnits++;
              } else {
                console.log(`  ⏭️  Unit "${unit.title}" already references course "${course.name}"`);
                skippedUnits++;
              }
            } else {
              console.log(`  ❌ Unit not found: ${unit._id}`);
              errors++;
            }
          } catch (error) {
            console.log(`  ❌ Error updating unit ${unit._id}:`, error.message);
            errors++;
          }
        }
      } else {
        console.log(`  ℹ️  No units found for course: "${course.name}"`);
      }
    }
    
    // Step 3: Summary
    console.log('\n� Update Summary:');
    console.log(`✅ Updated units: ${updatedUnits}`);
    console.log(`⏭️  Skipped units: ${skippedUnits}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📄 Total units processed: ${updatedUnits + skippedUnits + errors}`);
    
    console.log('\n🎉 Unit-Course mapping update completed!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the update
updateUnitCourseMapping();
