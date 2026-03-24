// Debug script to test tracking API
// Run this in browser console when logged in as a student

const debugTracking = async () => {
  console.log('=== Debugging Student Tracking ===')
  
  try {
    // Step 1: Check if user is authenticated
    console.log('\n1. Checking authentication...')
    const authResponse = await fetch('/api/auth/me')
    if (authResponse.ok) {
      const user = await authResponse.json()
      console.log('✅ User authenticated:', { id: user._id, email: user.email, role: user.role })
    } else {
      console.log('❌ User not authenticated')
      return
    }
    
    // Step 2: Test tracking API with sample data
    console.log('\n2. Testing tracking API...')
    
    // You need to replace these with actual unit and file IDs from your system
    const testUnitId = 'YOUR_UNIT_ID_HERE'
    const testFileId = 'YOUR_FILE_ID_HERE'
    
    const trackingData = {
      studentId: user._id,
      fileId: testFileId,
      fileType: 'document',
      viewCount: 1
    }
    
    console.log('Sending tracking data:', trackingData)
    
    const trackingResponse = await fetch(`/api/units/${testUnitId}/tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData)
    })
    
    if (trackingResponse.ok) {
      console.log('✅ Tracking successful!')
      const result = await trackingResponse.json()
      console.log('Tracking result:', result)
    } else {
      console.log('❌ Tracking failed')
      console.log('Status:', trackingResponse.status)
      console.log('Error:', await trackingResponse.text())
    }
    
    // Step 3: Check if tracking data appears in admin
    console.log('\n3. Instructions to verify in admin:')
    console.log('   1. Go to Course Management admin page')
    console.log('   2. Find the course containing the unit you tested')
    console.log('   3. Check if student progress shows the updated tracking')
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// Instructions
console.log('To use this debug script:')
console.log('1. Log in as a student user')
console.log('2. Navigate to a unit page and get actual unit and file IDs')
console.log('3. Replace YOUR_UNIT_ID_HERE and YOUR_FILE_ID_HERE with real values')
console.log('4. Run: debugTracking()')

// Export for browser console
if (typeof window !== 'undefined') {
  window.debugTracking = debugTracking
}
