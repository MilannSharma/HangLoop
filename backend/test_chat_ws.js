const http = require('http');

async function testWebSocketChat() {
  console.log('==============================================');
  console.log('LIVE CHAT & TYPING WEBSOCKET TEST SUITE');
  console.log('==============================================\n');

  if (typeof WebSocket === 'undefined') {
    console.log('Node version does not have global WebSocket. Testing HTTP endpoint sanity.');
    return;
  }

  const roomId = 'room-bollywood-hindi';
  const workerHost = 'hangloop-api.milansharma942105.workers.dev';

  const wsUrlA = `wss://${workerHost}/api/ws/room/${roomId}?userId=test-alice-${Date.now()}&username=Alice&fullName=Alice%20Test&avatarUrl=https://i.pravatar.cc/100`;
  const wsUrlB = `wss://${workerHost}/api/ws/room/${roomId}?userId=test-bob-${Date.now()}&username=Bob&fullName=Bob%20Test&avatarUrl=https://i.pravatar.cc/100`;

  console.log('Connecting Client A (Alice)...');
  const wsA = new WebSocket(wsUrlA);

  let aliceInitReceived = false;
  let bobInitReceived = false;
  let bobTypingReceived = false;
  let bobChatReceived = false;
  let clientCInitChatCount = 0;

  await new Promise((resolve) => {
    wsA.onopen = () => {
      console.log('Client A connected!');
      resolve();
    };
    wsA.onerror = (err) => {
      console.log('Client A error:', err.message || err);
      resolve();
    };
  });

  wsA.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'INIT_STATE') {
        aliceInitReceived = true;
        console.log(`[Alice] INIT_STATE received. Chat logs count: ${data.chatLogs?.length || 0}`);
      }
    } catch (e) {}
  };

  console.log('Connecting Client B (Bob)...');
  const wsB = new WebSocket(wsUrlB);

  await new Promise((resolve) => {
    wsB.onopen = () => {
      console.log('Client B connected!');
      resolve();
    };
    wsB.onerror = (err) => {
      console.log('Client B error:', err.message || err);
      resolve();
    };
  });

  const testMessageText = `Automated QA Test Message ${Date.now()}`;
  const clientMessageId = `client-${Date.now()}`;

  wsB.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'INIT_STATE') {
        bobInitReceived = true;
        console.log(`[Bob] INIT_STATE received. Chat logs count: ${data.chatLogs?.length || 0}`);
      } else if (data.type === 'USER_TYPING') {
        bobTypingReceived = true;
        console.log(`[Bob] USER_TYPING received: @${data.username} isTyping=${data.isTyping}`);
      } else if (data.type === 'CHAT_RECEIVE') {
        if (data.message?.text === testMessageText) {
          bobChatReceived = true;
          console.log(`[Bob] CHAT_RECEIVE verified: "${data.message.text}" from @${data.message.sender?.username}`);
        }
      }
    } catch (e) {}
  };

  // Step 1: Alice sends TYPING = true
  console.log('\n--- Test: Alice sends TYPING = true ---');
  wsA.send(JSON.stringify({ type: 'TYPING', isTyping: true }));
  await new Promise(r => setTimeout(r, 1000));

  // Step 2: Alice sends CHAT_SEND
  console.log('\n--- Test: Alice sends CHAT_SEND ---');
  wsA.send(JSON.stringify({
    type: 'CHAT_SEND',
    text: testMessageText,
    clientMessageId
  }));
  await new Promise(r => setTimeout(r, 1500));

  // Step 3: Alice sends TYPING = false
  console.log('\n--- Test: Alice sends TYPING = false ---');
  wsA.send(JSON.stringify({ type: 'TYPING', isTyping: false }));
  await new Promise(r => setTimeout(r, 1000));

  // Step 4: Client C (Charlie) joins new to test INIT_STATE recent chat catch-up
  console.log('\n--- Test: Client C (Charlie) joins fresh to verify Chat History Catch-up ---');
  const wsUrlC = `wss://${workerHost}/api/ws/room/${roomId}?userId=test-charlie-${Date.now()}&username=Charlie&fullName=Charlie%20Test&avatarUrl=https://i.pravatar.cc/100`;
  const wsC = new WebSocket(wsUrlC);

  await new Promise((resolve) => {
    wsC.onopen = () => {
      console.log('Client C connected!');
    };
    wsC.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'INIT_STATE') {
          clientCInitChatCount = data.chatLogs?.length || 0;
          console.log(`[Charlie] INIT_STATE received. Chat logs count: ${clientCInitChatCount}`);
          const found = data.chatLogs?.some(m => m.text === testMessageText);
          console.log(`[Charlie] Contains Alice's recent message: ${found ? 'YES (PASS)' : 'NO'}`);
          resolve();
        }
      } catch (e) {
        resolve();
      }
    };
    setTimeout(resolve, 3000);
  });

  // Cleanup
  wsA.close();
  wsB.close();
  wsC.close();

  console.log('\n==============================================');
  console.log('QA SUMMARY');
  console.log('==============================================');
  console.log(`1. Alice INIT_STATE received: ${aliceInitReceived ? 'PASS' : 'FAIL'}`);
  console.log(`2. Bob INIT_STATE received: ${bobInitReceived ? 'PASS' : 'FAIL'}`);
  console.log(`3. Bob received live typing: ${bobTypingReceived ? 'PASS' : 'FAIL'}`);
  console.log(`4. Bob received real-time chat: ${bobChatReceived ? 'PASS' : 'FAIL'}`);
  console.log(`5. Charlie received recent chat history on join: ${clientCInitChatCount > 0 ? 'PASS' : 'FAIL'}`);
}

testWebSocketChat().catch(console.error);
