// Quick test to verify student tracking is working
// Run this in browser console when logged in as a student

console.log('=== Testing Student Tracking ===');

// Test 1: Check if we can access the tracking API
async function testTrackingAPI() {
  try {
    // First, get current user info
    const userResponse = await fetch('/api/auth/me');
    if (!userResponse.ok) {
      console.log('❌ Not authenticated');
      return;
    }
    
    const user = await userResponse.json();
    console.log('✅ User authenticated:', user.email, user.role);
    
    // Test tracking with a sample unit and file (you need to replace these)
    const unitId = 'YOUR_UNIT_ID'; // Replace with actual unit ID
    const fileId = 'YOUR_FILE_ID'; // Replace with actual file ID
    
    if (unitId === 'YOUR_UNIT_ID') {
      console.log('⚠️ Please replace YOUR_UNIT_ID and YOUR_FILE_ID with actual values');
      console.log('📝 To get these values:');
      console.log('   1. Go to a unit page');
      console.log('   2. Open browser dev tools');
      console.log('   3. Click on a file to view it');
      console.log('   4. Check the Network tab for the tracking API call');
      console.log('   5. Copy the unitId and fileId from the URL');
      return;
    }
    
    const trackingData = {
      studentId: user._id,
      fileId: fileId,
      fileType: 'document',
      viewCount: 1
    };
    
    console.log('📤 Sending tracking data:', trackingData);
    
    const response = await fetch(`/api/units/${unitId}/tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData)
    });
    
    if (response.ok) {
      console.log('✅ Tracking successful!');
      const result = await response.json();
      console.log('📊 Tracking result:', result);
    } else {
      console.log('❌ Tracking failed');
      console.log('Status:', response.status);
      console.log('Error:', await response.text());
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test 2: Check if MediaLightbox is working
function testMediaLightbox() {
  console.log('🔍 Testing MediaLightbox...');
  
  // Look for MediaLightbox in the DOM
  const lightbox = document.querySelector('[role="dialog"]');
  if (lightbox) {
    console.log('✅ MediaLightbox found in DOM');
  } else {
    console.log('ℹ️ MediaLightbox not currently visible');
    console.log('💡 To test MediaLightbox:');
    console.log('   1. Go to /units/view/[unit-id]');
    console.log('   2. Click on any file');
    console.log('   3. Check console for tracking messages');
  }
}

// Test 3: Manual tracking verification
async function verifyTrackingInAdmin() {
  console.log('🔍 Verifying tracking in admin...');
  
  // This should be run by an admin user
  const adminResponse = await fetch('/api/auth/me');
  if (!adminResponse.ok) return;
  
  const admin = await adminResponse.json();
  if (admin.role !== 'admin') {
    console.log('ℹ️ This test requires admin privileges');
    return;
  }
  
  console.log('✅ Admin user confirmed');
  console.log('📝 To verify tracking in admin:');
  console.log('   1. Go to Course Management');
  console.log('   2. Click "Refresh Progress" button');
  console.log('   3. Check if student progress shows updated data');
  console.log('   4. Look for view counts and completion percentages');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running all tracking tests...\n');
  
  await testTrackingAPI();
  testMediaLightbox();
  await verifyTrackingInAdmin();
  
  console.log('\n✅ Tests completed!');
  console.log('📖 For detailed implementation guide, see: TRACKING_IMPLEMENTATION_SUMMARY.md');
}

// Export functions for browser console
if (typeof window !== 'undefined') {
  window.testTrackingAPI = testTrackingAPI;
  window.testMediaLightbox = testMediaLightbox;
  window.verifyTrackingInAdmin = verifyTrackingInAdmin;
  window.runAllTests = runAllTests;
  
  console.log('🔧 Test functions exported to window:');
  console.log('   - testTrackingAPI()');
  console.log('   - testMediaLightbox()');
  console.log('   - verifyTrackingInAdmin()');
  console.log('   - runAllTests()');
  console.log('\n🚀 Run runAllTests() to execute all tests');
}
