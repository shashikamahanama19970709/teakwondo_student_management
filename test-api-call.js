// Test script to simulate the subjects API call
const testData = {
  name: 'Test Subject',
  code: 'TEST001',
  description: 'A test subject',
  totalLessons: 10,
  duration: {
    hours: 20,
    weeks: 4
  },
  order: 1,
  status: 'active',
  projectId: '507f1f77bcf86cd799439011' // dummy ObjectId
};

console.log('Test data:', JSON.stringify(testData, null, 2));

// Simulate the fetch call
console.log('Making API call to /api/subjects...');

// In a real scenario, this would be:
// fetch('/api/subjects', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify(testData)
// })

console.log('Test script completed - check server logs for detailed error information');