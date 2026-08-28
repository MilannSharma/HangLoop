// Comprehensive Verification Suite for 5-Key Gemini Primary Engine
declare const process: any;
import {
  isKiraCommand,
  extractKiraQuery,
  isLeoCommand,
  extractLeoQuery,
  isAIBotCommand,
  sanitizeBotResponse,
  processAIBotMessage,
  processKiraMessage,
  AI_BOT_CONFIG
} from './src/kiraService.ts';

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
  console.log('🧪 Starting 5-Key Gemini Primary Engine Verification Tests...\n');
  const mockEnv = { AI: null, DB: null, GEMINI_API_KEY: false }; // Tests local fallback when API explicitly false

  // TEST 1: Wellbeing with zero assumptions
  const t1 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_1',
    username: 'Milan',
    rawText: '!kira kesi hai re tuu',
    env: mockEnv
  });
  assert(
    t1.success === true &&
    t1.reply.includes('@Milan') &&
    (t1.reply.includes('badiya') || t1.reply.includes('mast')) &&
    !t1.reply.includes('14') &&
    !t1.reply.includes('exam'),
    'TEST 1: Kira answers wellbeing directly for @Milan with zero assumptions'
  );

  // TEST 2: Natural English
  const t2 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_2',
    username: 'Milan',
    rawText: '!kira how are you?',
    env: mockEnv
  });
  assert(
    t2.success === true &&
    t2.reply.includes('good') &&
    t2.reply.includes('day'),
    'TEST 2: Kira responds in natural English'
  );

  // TEST 3: Natural Hinglish
  const t3 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_3',
    username: 'Milan',
    rawText: '!kira kya kar rahi ho?',
    env: mockEnv
  });
  assert(
    t3.success === true &&
    (t3.reply.includes('chill') || t3.reply.includes('dekh rahi') || t3.reply.includes('gaane')),
    'TEST 3: Kira responds in natural Hinglish'
  );

  // TEST 4: Playful response
  const t4 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_4',
    username: 'Milan',
    rawText: "!kira you're cute",
    env: mockEnv
  });
  assert(
    t4.success === true &&
    (t4.reply.includes('sweet') || t4.reply.includes('achaaa')),
    'TEST 4: Kira responds playfully to cute compliment'
  );

  // TEST 5: Date banter
  const t5 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_5',
    username: 'Milan',
    rawText: '!kira chalo date pe',
    env: mockEnv
  });
  assert(
    t5.success === true &&
    t5.reply.includes('coffee') &&
    t5.reply.includes('interview'),
    'TEST 5: Kira responds to date with coffee interview banter'
  );

  // TEST 6: Mock offense
  const t6 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_6',
    username: 'Milan',
    rawText: '!kira tu annoying hai 😂',
    env: mockEnv
  });
  assert(
    t6.success === true &&
    (t6.reply.includes('WOW') || t6.reply.includes('buri')),
    'TEST 6: Kira responds with mock offense'
  );

  // TEST 7: Leo tired with zero 14-hour assumption
  const t7 = await processAIBotMessage({
    botName: 'Leo',
    userId: 'u_7',
    username: 'Milan',
    rawText: "!leo I'm tired",
    env: mockEnv
  });
  assert(
    t7.success === true &&
    !t7.reply.includes('14') &&
    !t7.reply.toLowerCase().includes('windows') &&
    (t7.reply.includes('thak') || t7.reply.includes('hectic') || t7.reply.includes('chill')),
    'TEST 7: Leo responds to tired with ZERO 14-hour/Windows update assumptions'
  );

  // TEST 8: Live Primary Gemini Pool with Auto-Failover
  // Mock global fetch to verify round-robin and auto-failover across keys
  const originalFetch = globalThis.fetch;
  let keyAttempts: string[] = [];

  globalThis.fetch = async (url: any, init: any) => {
    const urlStr = String(url);
    if (urlStr.includes('generateContent')) {
      const keyParam = new URL(urlStr).searchParams.get('key') || '';
      keyAttempts.push(keyParam);

      // Simulate 429 on first key, 200 on second key
      if (keyAttempts.length === 1) {
        return { status: 429, ok: false } as any;
      }
      return {
        status: 200,
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '@Milan Gemini Primary live response 😌' }] } }]
        })
      } as any;
    }
    return originalFetch(url, init);
  };

  const liveGeminiRes = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_gem_pool',
    username: 'Milan',
    rawText: '!kira kesi ho',
    env: { AI: null, DB: null }
  });

  globalThis.fetch = originalFetch;

  assert(
    liveGeminiRes.success === true &&
    liveGeminiRes.provider === 'gemini' &&
    keyAttempts.length === 2,
    'TEST 8: Gemini Primary automatically fails over to next key on 429 rate limit'
  );

  // TEST 9: Cloudflare Fallback when all Gemini keys fail
  globalThis.fetch = async () => { throw new Error('All Gemini keys down'); };

  let cfCalled = false;
  const mockCFEnv = {
    AI: {
      run: async () => {
        cfCalled = true;
        return { response: '@Milan Cloudflare Secondary live response 🚀' };
      }
    },
    DB: null
  };

  const cfRes = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_cf_fallback',
    username: 'Milan',
    rawText: '!kira kesi ho',
    env: mockCFEnv
  });

  globalThis.fetch = originalFetch;

  assert(
    cfRes.success === true &&
    cfRes.provider === 'cloudflare' &&
    cfCalled === true,
    'TEST 9: When Gemini Pool fails, Cloudflare Workers AI is called as Secondary'
  );

  // TEST 10: Local Fallback when both Gemini and Cloudflare fail
  globalThis.fetch = async () => { throw new Error('All down'); };
  const mockFailEnv = {
    AI: { run: async () => { throw new Error('CF down'); } },
    DB: null
  };

  const localRes = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_local_last',
    username: 'Milan',
    rawText: '!kira kesi ho',
    env: mockFailEnv
  });
  globalThis.fetch = originalFetch;

  assert(
    localRes.success === true &&
    localRes.provider === 'local_fallback' &&
    localRes.reply.includes('@Milan'),
    'TEST 10: When Gemini and Cloudflare both fail, Local Intent Engine returns witty response'
  );

  // TEST 11: 5s Cooldown Warning
  const cd1 = await processAIBotMessage({ botName: 'Kira', userId: 'u_cd', username: 'Speedy', rawText: '!kira hi', env: mockEnv });
  const cd2 = await processAIBotMessage({ botName: 'Kira', userId: 'u_cd', username: 'Speedy', rawText: '!kira hi again', env: mockEnv });
  assert(cd2.reason === 'rate_limited' && cd2.reply.includes('saans toh lene deee re baba'), 'TEST 11: 5s Cooldown produces exact funny warning');

  // TEST 12: Strict <= 300 char clamp
  const longRaw = 'word '.repeat(100);
  const clamped = sanitizeBotResponse(longRaw, 'Kira', 'TestUser');
  assert(clamped.length <= 300, `TEST 12: Response length strictly <= 300 chars (Got: ${clamped.length})`);

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runTests();
