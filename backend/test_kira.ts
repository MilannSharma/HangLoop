// Comprehensive Verification Test Suite for Kira AI
import { isKiraCommand, extractKiraQuery, sanitizeKiraResponse, processKiraMessage, KIRA_CONFIG } from './src/kiraService';

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
  console.log('🧪 Starting Kira AI Verification Tests...\n');

  // Test 1: Command detection
  assert(isKiraCommand('!kira hello') === true, 'Detects "!kira hello"');
  assert(isKiraCommand('!KIRA hello') === true, 'Detects uppercase "!KIRA hello"');
  assert(isKiraCommand('!Kira kese ho bhai') === true, 'Detects mixed case "!Kira kese ho bhai"');
  assert(isKiraCommand('!kira') === true, 'Detects standalone "!kira"');
  assert(isKiraCommand('hello everyone') === false, 'Ignores normal message "hello everyone"');
  assert(isKiraCommand('kya haal hai') === false, 'Ignores normal message "kya haal hai"');
  assert(isKiraCommand('nice stream') === false, 'Ignores normal message "nice stream"');
  assert(isKiraCommand('') === false, 'Ignores empty string');

  // Test 2: Query Extraction
  assert(extractKiraQuery('!kira hello') === 'hello', 'Extracts query "hello"');
  assert(extractKiraQuery('!KIRA    kya scene hai  ') === 'kya scene hai', 'Extracts and trims query');
  assert(extractKiraQuery('!kira') === '', 'Extracts empty string for standalone "!kira"');

  // Test 3: Empty Command Processing (NO AI call)
  const mockEnv = { AI: null, DB: null };
  const emptyRes = await processKiraMessage({
    userId: 'user_test_1',
    rawText: '!kira',
    env: mockEnv
  });
  assert(emptyRes.isKira === true && emptyRes.reply === 'Haan bhai 😄 bolo!', 'Empty command returns instant friendly message');

  // Test 4: Sanitization & Hard 300-character safety limit
  const longText = 'A'.repeat(500);
  const sanitized = sanitizeKiraResponse(longText);
  assert(sanitized.length <= 300, `Sanitization enforces <= 300 chars (Got: ${sanitized.length})`);

  // Test 5: User 15-second Cooldown
  const res1 = await processKiraMessage({
    messageId: 'msg_101',
    userId: 'user_cooldown_test',
    rawText: '!kira ek joke suna',
    env: mockEnv
  });
  assert(res1.success === true, 'First request succeeds');

  const res2 = await processKiraMessage({
    messageId: 'msg_102',
    userId: 'user_cooldown_test',
    rawText: '!kira dusra joke suna',
    env: mockEnv
  });
  assert(res2.success === false && res2.reason === 'rate_limited' && res2.reply === 'Thoda ruk bhai 😄', 'Immediate 2nd request is rate-limited with "Thoda ruk bhai 😄"');

  // Test 6: Duplicate message idempotency
  const dupRes = await processKiraMessage({
    messageId: 'msg_101',
    userId: 'user_other',
    rawText: '!kira ek joke suna',
    env: mockEnv
  });
  assert(dupRes.reason === 'duplicate', 'Duplicate message ID returns cached reply');

  // Test 7: Normal chat message safety
  const normalRes = await processKiraMessage({
    userId: 'user_regular',
    rawText: 'hello everyone in chat',
    env: mockEnv
  });
  assert(normalRes.isKira === false && normalRes.reply === '', 'Normal chat message produces no Kira output');

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runTests();
