// Test script for student progress tracking
// Run this script to test if the tracking functionality is working correctly

const testStudentTracking = async () => {
  console.log('=== Testing Student Progress Tracking ===')
  
  try {
    // Test 1: Test tracking API endpoint
    console.log('\n1. Testing tracking API endpoint...')
    
    const testTrackingData = {
      studentId: 'test-student-id',
      fileId: 'test-file-id',
      fileType: 'video',
      durationWatched: 120,
      completionPercentage: 25
    }
    
    const trackingResponse = await fetch('http://localhost:3000/api/units/test-unit-id/tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testTrackingData)
    })
    
    if (trackingResponse.ok) {
      console.log('✅ Tracking API endpoint working')
      const result = await trackingResponse.json()
      console.log('   Tracking result:', result)
    } else {
      console.log('❌ Tracking API endpoint failed')
      console.log('   Status:', trackingResponse.status)
      console.log('   Error:', await trackingResponse.text())
    }
    
    // Test 2: Test fetching tracking data
    console.log('\n2. Testing fetch tracking data...')
    
    const fetchResponse = await fetch('http://localhost:3000/api/units/test-unit-id/tracking?fileId=test-file-id')
    
    if (fetchResponse.ok) {
      console.log('✅ Fetch tracking data working')
      const trackingData = await fetchResponse.json()
      console.log('   Tracking data:', trackingData)
    } else {
      console.log('❌ Fetch tracking data failed')
      console.log('   Status:', fetchResponse.status)
      console.log('   Error:', await fetchResponse.text())
    }
    
    // Test 3: Test MediaLightbox integration
    console.log('\n3. Testing MediaLightbox integration...')
    console.log('📝 Manual test required:')
    console.log('   1. Go to http://localhost:3000/units/view/test-unit-id')
    console.log('   2. Click on any file to open MediaLightbox')
    console.log('   3. Check browser console for tracking messages')
    console.log('   4. Check network tab for tracking API calls')
    
    console.log('\n=== Test Complete ===')
    console.log('📝 Next steps:')
    console.log('   1. Verify tracking data appears in Course Management admin panel')
    console.log('   2. Test with different file types (video, image, document)')
    console.log('   3. Test video progress tracking (should update every 5 seconds)')
    console.log('   4. Test document/image view tracking (should track on view)')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Instructions for running the test
console.log('To run this test:')
console.log('1. Make sure your development server is running (npm run dev)')
console.log('2. Open browser console and paste this script')
console.log('3. Call testStudentTracking() function')
console.log('\nExample: testStudentTracking()')

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testStudentTracking = testStudentTracking
}
