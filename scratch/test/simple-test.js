import 'dotenv/config';

console.log('🧪 Simple OAuth Test');
console.log('Environment check:');
console.log('- CLIENT_ID exists:', !!process.env.GOOGLE_APP_SCRIPT_API_CLIENT_ID);
console.log('- CLIENT_SECRET exists:', !!process.env.GOOGLE_APP_SCRIPT_API_CLIENT_SECRET);
console.log('- REFRESH_TOKEN exists:', !!process.env.GOOGLE_APP_SCRIPT_API_REFRESH_TOKEN);

// Test OAuth helper import
try {
  const { getAuthHeaders } = await import('./lib/oauth-helper.js');
  console.log('✅ OAuth helper imported successfully');
  
  const headers = await getAuthHeaders();
  console.log('✅ Headers obtained:', Object.keys(headers));
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
