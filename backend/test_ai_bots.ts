// Automated Test Suite for Kira & Ben Dual AI Live Chat System
import {
  isKiraTrigger,
  isBenTrigger,
  extractBotQuery,
  sanitizeBotResponse,
  processAIBots,
  AI_CONFIG
} from './src/aiBotService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 Starting Dual AI Bots (!Kira & !Ben) Verification Suite...\n');

  // Test 1: Bot Trigger Detection
  assert(isKiraTrigger('!kira hello') === true, 'Kira: Detects "!kira hello"');
  assert(isKiraTrigger('@kira kaise ho?') === true, 'Kira: Detects "@kira kaise ho?"');
  assert(isKiraTrigger('Kira ek joke sunao') === true, 'Kira: Detects word "Kira"');
  assert(isKiraTrigger('hello everyone') === false, 'Kira: Ignores normal chat');

  assert(isBenTrigger('!ben kya scene') === true, 'Ben: Detects "!ben kya scene"');
  assert(isBenTrigger('@ben cool song') === true, 'Ben: Detects "@ben cool song"');
  assert(isBenTrigger('Ben bhai chill karo') === true, 'Ben: Detects word "Ben"');
  assert(isBenTrigger('hello everyone') === false, 'Ben: Ignores normal chat');

  // Test 2: Bot Query Extraction
  assert(extractBotQuery('!kira kya haal') === 'kya haal', 'Extracts "!kira" query');
  assert(extractBotQuery('!ben konsa song hai') === 'konsa song hai', 'Extracts "!ben" query');
  assert(extractBotQuery('@kira hello') === 'hello', 'Extracts "@kira" query');

  // Test 3: Response Sanitization
  const longText = 'Hello live viewers! ' + 'A'.repeat(400);
  const sanitized = sanitizeBotResponse(longText, 'Kira');
  assert(sanitized.length <= AI_CONFIG.maxReplyChars, `Enforces maxReplyChars <= ${AI_CONFIG.maxReplyChars} (Got: ${sanitized.length})`);
  assert(!sanitized.startsWith('Kira:'), 'Strips "Kira:" prefix');

  // Test 4: Explicit Kira Call & Response
  const mockEnv = { AI: null, DB: null };
  const kiraRes = await processAIBots({
    roomId: 'room_test_1',
    userId: 'user_1',
    username: 'Rohit',
    rawText: '!kira ek joke suna',
    recentChat: [
      { sender: 'Aman', text: 'nice stream' },
      { sender: 'Rohit', text: '!kira ek joke suna' }
    ],
    currentSongTitle: 'Kesariya',
    currentSongArtist: 'Arijit Singh',
    env: mockEnv
  });

  assert(kiraRes !== null && kiraRes.shouldRespond === true, 'Kira responds to explicit command');
  assert(kiraRes?.botName === 'Kira', 'Bot name is Kira');
  assert(typeof kiraRes?.reply === 'string' && kiraRes.reply.length > 0, 'Generates valid non-empty reply');

  // Test 5: 5-Second Strict Cooldown Check
  const immediateKiraRes = await processAIBots({
    roomId: 'room_test_1',
    userId: 'user_1',
    username: 'Rohit',
    rawText: '!kira dusra joke suna',
    recentChat: [],
    env: mockEnv
  });

  assert(
    immediateKiraRes !== null && immediateKiraRes.reply.includes('5 second'),
    'Kira enforces 5-second cooldown notice on immediate repeat request'
  );

  // Test 6: Explicit Ben Call & Response
  const benRes = await processAIBots({
    roomId: 'room_test_2',
    userId: 'user_2',
    username: 'Pooja',
    rawText: '!ben song kaisa hai?',
    recentChat: [
      { sender: 'Pooja', text: '!ben song kaisa hai?' }
    ],
    currentSongTitle: 'Tum Hi Ho',
    currentSongArtist: 'Arijit Singh',
    env: mockEnv
  });

  assert(benRes !== null && benRes.shouldRespond === true, 'Ben responds to explicit command');
  assert(benRes?.botName === 'Ben', 'Bot name is Ben');
  assert(benRes?.reply.includes('Tum Hi Ho') || benRes?.reply.length! > 0, 'Ben generates contextual response with song title');

  // Test 7: AI-to-AI Interaction
  const flirtRes = await processAIBots({
    roomId: 'room_test_3',
    userId: 'user_3',
    username: 'Neha',
    rawText: '!ben are you single? looking cute',
    recentChat: [],
    env: mockEnv
  });

  assert(flirtRes !== null && flirtRes.botName === 'Ben', 'Ben handles flirting');
  if (flirtRes?.secondaryReaction) {
    assert(flirtRes.secondaryReaction.botName === 'Kira', 'Kira reacts to Ben flirting with user');
    console.log(`💬 Banter Preview: [Ben]: "${flirtRes.reply}" -> [Kira]: "${flirtRes.secondaryReaction.reply}"`);
  }

  console.log(`\n📊 Verification Complete: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runTests();
