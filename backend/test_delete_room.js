/**
 * Automated Verification for Admin Live Room Deletion
 */

const https = require('https');
const WebSocket = require('ws');

const BASE_URL = 'https://hangloop-api.milansharma942105.workers.dev';
const WS_URL = 'wss://hangloop-api.milansharma942105.workers.dev';
const SUPER_ADMIN_EMAIL = 'milansharma942105@gmail.com';

function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = https.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, text: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTest() {
  console.log('🚀 Testing Admin Live Room Deletion Flow...\n');

  // 1. Login Super Admin
  const loginRes = await makeRequest('/api/auth/login', 'POST', { email: SUPER_ADMIN_EMAIL });
  const adminToken = loginRes.data?.token;
  if (!adminToken) {
    console.error('❌ Login failed');
    process.exit(1);
  }
  console.log('1️⃣ Super Admin authenticated successfully');

  // 2. Create Temporary Custom Room
  const createRes = await makeRequest(
    '/api/admin/rooms/create',
    'POST',
    {
      name: 'Temp Delete Test Room ' + Math.floor(Math.random() * 1000),
      theme: 'BOLLYWOOD',
      play_source_type: 'YOUTUBE_URL',
      source_youtube_url: 'https://www.youtube.com/watch?v=2g811Eo7K8U',
      tags: ['Test', 'Delete'],
    },
    adminToken
  );

  const roomId = createRes.data?.roomId || createRes.data?.room?.id;
  console.log('2️⃣ Created temporary room:', roomId);

  // 3. Connect WebSocket Client
  const ws = new WebSocket(`${WS_URL}/api/ws/room/${roomId}?userId=qa-del-user&username=QADelUser`);
  let roomEndedReceived = false;

  await new Promise((resolve, reject) => {
    ws.on('open', () => {
      console.log('3️⃣ WebSocket client connected & open');
      resolve();
    });
    ws.on('error', reject);
  });

  const pRoomEnded = new Promise((resolve) => {
    ws.on('message', (msgStr) => {
      try {
        const msg = JSON.parse(msgStr.toString());
        console.log('   [WS Event Received]:', msg.type);
        if (msg.type === 'ROOM_ENDED') {
          console.log('   [WS Event] ROOM_ENDED message:', msg.message);
          roomEndedReceived = true;
          resolve(true);
        }
      } catch (e) {}
    });

    ws.on('close', (code, reason) => {
      console.log(`   [WS Event] Closed (code: ${code}, reason: ${reason})`);
      resolve(true);
    });
  });

  // 4. Delete Room via Admin Endpoint
  console.log('4️⃣ Deleting room via POST /api/admin/rooms/delete...');
  const deleteRes = await makeRequest('/api/admin/rooms/delete', 'POST', { roomId }, adminToken);
  console.log('   Delete response:', deleteRes.status, deleteRes.data);

  if (!deleteRes.data?.success) {
    console.error('❌ Room deletion endpoint failed:', deleteRes);
    process.exit(1);
  }

  // 5. Await WebSocket event or close
  await Promise.race([pRoomEnded, new Promise((_, reject) => setTimeout(() => reject('WS timeout'), 5000))]);
  console.log('5️⃣ WebSocket client received ROOM_ENDED or clean close event!');

  // 6. Verify Room is gone from /api/rooms
  const roomsRes = await makeRequest('/api/rooms', 'GET');
  const found = (roomsRes.data?.rooms || []).find((r) => r.id === roomId);
  if (!found) {
    console.log('6️⃣ Verified room is completely removed from /api/rooms listing!');
  } else {
    console.error('❌ Room still present in /api/rooms list');
    process.exit(1);
  }

  console.log('\n🎉 ALL DELETE TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
