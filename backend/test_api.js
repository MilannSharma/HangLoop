const https = require('https');

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'hangloop-api.milansharma942105.workers.dev',
      port: 443,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('==========================================');
  console.log('PRODUCTION REST API AUTOMATED QA SUITE');
  console.log('==========================================\n');

  // Test 1: GET /api/rooms
  console.log('TEST 1: GET /api/rooms');
  const t1 = await makeRequest('/api/rooms');
  console.log(`Status: ${t1.status}`);
  console.log(`Rooms Count: ${t1.data?.rooms?.length}`);
  console.log(`First Room Viewers: ${t1.data?.rooms[0]?.active_viewers}`);
  console.log(`Result: ${t1.status === 200 && t1.data?.rooms?.length === 5 ? 'PASS' : 'FAIL'}\n`);

  // Test 2: POST /api/presence/heartbeat
  console.log('TEST 2: POST /api/presence/heartbeat');
  const t2 = await makeRequest('/api/presence/heartbeat', 'POST', {
    roomId: 'room-bollywood-hindi',
    userId: 'usr-qa-test-1',
    username: 'qa_auditor',
    sessionId: 'sess-qa-test-1'
  });
  console.log(`Status: ${t2.status}`);
  console.log(`Response:`, t2.data);
  console.log(`Result: ${t2.status === 200 && t2.data?.success ? 'PASS' : 'FAIL'}\n`);

  // Test 3: POST /api/queue/add (Valid Song)
  console.log('TEST 3: POST /api/queue/add (Valid Bollywood Song)');
  const t3 = await makeRequest('/api/queue/add', 'POST', {
    roomId: 'room-bollywood-hindi',
    videoId: 'v7TK_w8-v0A',
    theme: 'BOLLYWOOD'
  });
  console.log(`Status: ${t3.status}`);
  console.log(`Validation Output:`, t3.data);
  console.log(`Result: ${t3.status === 200 && t3.data?.valid ? 'PASS' : 'FAIL'}\n`);

  // Test 4: POST /api/queue/add (Invalid Off-Theme Song Rejection)
  console.log('TEST 4: POST /api/queue/add (Invalid Hollywood Song in Bollywood Room)');
  const t4 = await makeRequest('/api/queue/add', 'POST', {
    roomId: 'room-bollywood-hindi',
    videoId: '09R8_2nJtjg',
    theme: 'BOLLYWOOD'
  });
  console.log(`Status: ${t4.status}`);
  console.log(`Validation Output:`, t4.data);
  console.log(`Result: ${t4.status === 400 && t4.data?.valid === false ? 'PASS' : 'FAIL'}\n`);

  // Test 5: POST /api/user/report
  console.log('TEST 5: POST /api/user/report');
  const t5 = await makeRequest('/api/user/report', 'POST', {
    reporter_id: 'usr-qa-1',
    target_id: 'usr-spammer',
    reason: 'Spam',
    details: 'Automated QA report test'
  });
  console.log(`Status: ${t5.status}`);
  console.log(`Response:`, t5.data);
  console.log(`Result: ${t5.status === 200 && t5.data?.success ? 'PASS' : 'FAIL'}\n`);

  // Test 6: POST /api/user/block
  console.log('TEST 6: POST /api/user/block');
  const t6 = await makeRequest('/api/user/block', 'POST', {
    blocker_id: 'usr-qa-1',
    blocked_id: 'usr-spammer'
  });
  console.log(`Status: ${t6.status}`);
  console.log(`Response:`, t6.data);
  console.log(`Result: ${t6.status === 200 && t6.data?.success ? 'PASS' : 'FAIL'}\n`);

  console.log('==========================================');
  console.log('ALL AUTOMATED API TESTS COMPLETED');
  console.log('==========================================');
}

runTests().catch(console.error);
