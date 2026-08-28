const BASE_URL = 'https://hangloop-api.milansharma942105.workers.dev';

async function runTests() {
  console.log('--- Testing Google Auth & Username Verification Endpoints ---\n');

  // Test 1: Check reserved username
  try {
    const res = await fetch(`${BASE_URL}/api/auth/check-username?username=admin`);
    const data = await res.json();
    console.log('Test 1 (Reserved Username "admin"):', data.available === false ? 'PASSED' : 'FAILED', data);
  } catch (e) {
    console.error('Test 1 error:', e.message);
  }

  // Test 2: Check invalid length username
  try {
    const res = await fetch(`${BASE_URL}/api/auth/check-username?username=ab`);
    const data = await res.json();
    console.log('Test 2 (Short Username "ab"):', data.available === false ? 'PASSED' : 'FAILED', data);
  } catch (e) {
    console.error('Test 2 error:', e.message);
  }

  // Test 3: Check valid available username
  try {
    const uniqueUsername = 'test_user_' + Date.now().toString(36);
    const res = await fetch(`${BASE_URL}/api/auth/check-username?username=${uniqueUsername}`);
    const data = await res.json();
    console.log(`Test 3 (Unique Username "${uniqueUsername}"):`, data.available === true ? 'PASSED' : 'FAILED', data);
  } catch (e) {
    console.error('Test 3 error:', e.message);
  }

  // Test 4: Reject invalid Google ID token on /api/auth/google
  try {
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'invalid_dummy_token_12345' })
    });
    const data = await res.json();
    console.log('Test 4 (Invalid Google Token Rejection):', res.status === 401 ? 'PASSED' : 'FAILED', data);
  } catch (e) {
    console.error('Test 4 error:', e.message);
  }

  console.log('\n--- All Unit/Integration API Checks Complete ---');
}

runTests();
