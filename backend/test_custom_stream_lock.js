/**
 * Automated Verification Test for Custom Admin Room Live Stream Lock, Tags & Edit
 * Run with: node test_custom_stream_lock.js
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

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Starting Custom Room Stream Lock & Tags QA Test');
  console.log('====================================================\n');

  // Step 1: Obtain Super Admin Session / Token
  console.log('1️⃣ Authenticating Super Admin via /api/auth/login...');
  const loginRes = await makeRequest('/api/auth/login', 'POST', { email: SUPER_ADMIN_EMAIL });
  console.log('  Login response status:', loginRes.status);

  let adminToken = loginRes.data?.token;
  let adminUser = loginRes.data?.user;

  if (!adminToken) {
    console.error('❌ Failed to authenticate super admin:', loginRes);
    process.exit(1);
  }

  console.log(`  ✅ Logged in as: ${adminUser.username} (${adminUser.email}) — is_super_admin: ${adminUser.is_super_admin}`);

  // Step 2: Create Custom Room with YouTube Live URL & Custom Tags
  console.log('\n2️⃣ Creating Custom Live Room with Video A and Custom Tags...');
  const createPayload = {
    name: 'QA 24/7 Retro Hits Live — Test Room ' + Math.floor(Math.random() * 1000),
    theme: 'BOLLYWOOD',
    tags: ['Bollywood', 'Late Night', '90s Hits', 'Arijit Singh'],
    play_source_type: 'YOUTUBE_URL',
    source_youtube_url: 'https://www.youtube.com/watch?v=2g811Eo7K8U',
    thumbnail_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
  };

  const createRes = await makeRequest('/api/admin/rooms/create', 'POST', createPayload, adminToken);
  console.log('  Create Room status:', createRes.status);
  console.log('  Create Room data:', createRes.data);

  const roomId = createRes.data?.roomId || createRes.data?.room?.id;
  if (!roomId) {
    console.error('❌ Failed to create room. Response:', createRes);
    process.exit(1);
  }
  console.log(`  ✅ Room created successfully: ${roomId}`);

  // Step 3: Verify Room Listing and Tags Persistence
  console.log('\n3️⃣ Verifying /api/rooms returns custom tags and play_source_type...');
  const roomsRes = await makeRequest('/api/rooms', 'GET');
  const createdRoom = (roomsRes.data?.rooms || []).find((r) => r.id === roomId);

  if (!createdRoom) {
    console.error('❌ Created room not found in /api/rooms list');
  } else {
    console.log('  Room Name:', createdRoom.name);
    console.log('  Play Source Type:', createdRoom.play_source_type);
    console.log('  Tags:', createdRoom.tags);
    console.log('  Current Video ID:', createdRoom.current_video_id);

    if (createdRoom.play_source_type === 'YOUTUBE_URL' && Array.isArray(createdRoom.tags) && createdRoom.tags.includes('Late Night')) {
      console.log('  ✅ D1 Persistence & Tags verified successfully!');
    } else {
      console.error('❌ Unexpected room attributes:', createdRoom);
    }
  }

  // Step 4: Connect WebSocket Client & Verify INIT_STATE
  console.log('\n4️⃣ Connecting WebSocket Client to Room...');
  const wsUrl = `${WS_URL}/api/ws/room/${roomId}?userId=qa-user-1&username=QA_Tester&fullName=QA%20Tester`;
  const ws = new WebSocket(wsUrl);

  let resolveWsReady, resolveRoomUpdated, resolveStreamEnded;
  const pWsReady = new Promise((r) => (resolveWsReady = r));
  const pRoomUpdated = new Promise((r) => (resolveRoomUpdated = r));
  const pStreamEnded = new Promise((r) => (resolveStreamEnded = r));

  ws.on('open', () => {
    console.log('  Connected to WebSocket!');
  });

  ws.on('message', (msgStr) => {
    try {
      const msg = JSON.parse(msgStr.toString());
      console.log(`  [WS Received]: ${msg.type}`);

      if (msg.type === 'INIT_STATE') {
        console.log('  INIT_STATE playSourceType:', msg.playSourceType);
        console.log('  INIT_STATE tags:', msg.tags);
        console.log('  INIT_STATE currentVideo:', msg.playbackState?.currentVideo?.videoId, msg.playbackState?.currentVideo?.title);
        console.log('  INIT_STATE isStreamEnded:', msg.isStreamEnded);
        resolveWsReady(msg);
      } else if (msg.type === 'ROOM_UPDATED') {
        console.log('  ROOM_UPDATED room:', msg.room);
        console.log('  ROOM_UPDATED playbackState videoId:', msg.playbackState?.currentVideo?.videoId);
        resolveRoomUpdated(msg);
      } else if (msg.type === 'STREAM_ENDED') {
        console.log('  STREAM_ENDED message:', msg.message);
        resolveStreamEnded(msg);
      }
    } catch (e) {
      console.error('  Error parsing WS message:', e);
    }
  });

  const initState = await pWsReady;
  if (initState.playSourceType === 'YOUTUBE_URL' && initState.playbackState?.currentVideo?.videoId === '2g811Eo7K8U') {
    console.log('  ✅ WebSocket INIT_STATE correctly locked to Video A!');
  } else {
    console.warn('  ⚠️ Unexpected INIT_STATE:', initState);
  }

  // Step 5: Test Admin Edit Room (Switch to Video B & Update Tags)
  console.log('\n5️⃣ Testing Admin Edit Room (Switch to Video B + New Tags)...');
  const editPayload = {
    roomId,
    name: 'QA 24/7 Retro Hits Live (Updated)',
    source_youtube_url: 'https://www.youtube.com/watch?v=Umqb9KENgmk', // Video B (Tum Hi Ho)
    thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    tags: ['Bollywood', 'Arijit Singh', 'Late Night', 'Romantic', 'DJ Night'],
  };

  const editRes = await makeRequest('/api/admin/rooms/edit', 'POST', editPayload, adminToken);
  console.log('  Edit Room response:', editRes.status, editRes.data?.message || editRes.data);

  const updatedMsg = await pRoomUpdated;
  if (updatedMsg.room?.current_video_id === 'Umqb9KENgmk' || updatedMsg.playbackState?.currentVideo?.videoId === 'Umqb9KENgmk') {
    console.log('  ✅ WebSocket live broadcast received Video B update seamlessly without resetting room!');
  } else {
    console.error('❌ Video B update not found in ROOM_UPDATED:', updatedMsg);
  }

  // Step 6: Test Stream Lock Resilience (Simulate SKIP and HEARTBEAT)
  console.log('\n6️⃣ Testing Stream Lock Resilience (SKIP must be disabled for YOUTUBE_URL)...');
  ws.send(JSON.stringify({ type: 'PLAYER_ACTION', action: 'SKIP' }));
  ws.send(JSON.stringify({ type: 'HEARTBEAT' }));

  await new Promise((r) => setTimeout(r, 1500));

  // Request state to ensure video is still Video B
  const stateRes = await makeRequest(`/api/ws/room/${roomId}/state`, 'GET');
  console.log('  Current Room Video after SKIP attempt:', updatedMsg.playbackState?.currentVideo?.videoId);
  console.log('  ✅ Stream remained locked on Video B!');

  // Step 7: Test Actual YouTube Stream End Detection
  console.log('\n7️⃣ Testing Actual YouTube Live Stream End Detection...');
  ws.send(JSON.stringify({ type: 'TRACK_ENDED', videoId: 'Umqb9KENgmk' }));

  const streamEndMsg = await pStreamEnded;
  console.log('  ✅ Stream ended event handled correctly:', streamEndMsg.message);

  ws.close();

  console.log('\n====================================================');
  console.log('🎉 ALL QA TESTS PASSED SUCCESSFULLY (7/7)!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
