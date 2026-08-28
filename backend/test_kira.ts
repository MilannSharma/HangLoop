// Comprehensive 24-Point Verification Test Suite for Hangloop Final V2 AI Engine
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
  console.log('🧪 Starting Final V2 AI Engine (Cloudflare + Gemini Fallback) Verification Tests...\n');
  const mockEnv = { AI: null, DB: null, GEMINI_API_KEY: null };

  // TEST 1: !kira kesi hai re tuu (Must answer wellbeing, NO 14-hour assumption)
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

  // TEST 2: !kira how are you? (Natural English)
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

  // TEST 3: !kira kya kar rahi ho? (Natural Hinglish)
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

  // TEST 4: !kira you're cute (Playful response)
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

  // TEST 5: !kira chalo date pe (Playful fictional response)
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

  // TEST 6: !kira tu annoying hai 😂 (Mock offended)
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

  // TEST 7: !kira sorry yaar (Natural acceptance)
  const t7 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_7',
    username: 'Milan',
    rawText: '!kira sorry yaar',
    env: mockEnv
  });
  assert(
    t7.success === true &&
    t7.reply.includes('maaf'),
    'TEST 7: Kira accepts apology naturally'
  );

  // TEST 8: !kira I'm angry at you (Appropriate reaction)
  const t8 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_8',
    username: 'Milan',
    rawText: "!kira I'm angry at you",
    env: mockEnv
  });
  assert(
    t8.success === true &&
    (t8.reply.includes('kaand') || t8.reply.includes('bata')),
    "TEST 8: Kira acknowledges anger appropriately"
  );

  // TEST 9: !kira I'm feeling really low (Warm response)
  const t9 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_9',
    username: 'Milan',
    rawText: "!kira I'm feeling really low",
    env: mockEnv
  });
  assert(
    t9.success === true &&
    t9.reply.includes('sun rahi hu'),
    'TEST 9: Kira responds warmly to sad/low message'
  );

  // TEST 10: !kira I'm bored (Fun interaction)
  const t10 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_10',
    username: 'Milan',
    rawText: "!kira I'm bored",
    env: mockEnv
  });
  assert(
    t10.success === true &&
    (t10.reply.includes('same') || t10.reply.includes('bakchodi')),
    'TEST 10: Kira provides fun interaction on bored'
  );

  // TEST 11: !leo I'm tired (MUST NOT mention 14 hours!)
  const t11 = await processAIBotMessage({
    botName: 'Leo',
    userId: 'u_11',
    username: 'Milan',
    rawText: "!leo I'm tired",
    env: mockEnv
  });
  assert(
    t11.success === true &&
    !t11.reply.includes('14') &&
    !t11.reply.toLowerCase().includes('windows') &&
    (t11.reply.includes('thak') || t11.reply.includes('hectic') || t11.reply.includes('chill')),
    'TEST 11: Leo responds to tired with ZERO 14-hour/Windows update assumptions'
  );

  // TEST 12: !kira I got a new job! (Celebration)
  const t12 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_12',
    username: 'Milan',
    rawText: '!kira I got a new job!',
    env: mockEnv
  });
  assert(
    t12.success === true &&
    (t12.reply.includes('congrats') || t12.reply.includes('party')),
    'TEST 12: Kira congratulates on new job'
  );

  // TEST 13: !kira pizza is better than biryani (Playful food debate)
  const t13 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_13',
    username: 'Milan',
    rawText: '!kira pizza is better than biryani',
    env: mockEnv
  });
  assert(
    t13.success === true &&
    t13.reply.includes('Biryani'),
    'TEST 13: Kira defends Biryani in food debate'
  );

  // TEST 14: !kira nice song (Music appreciation)
  const t14 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_14',
    username: 'Milan',
    rawText: '!kira nice song',
    env: mockEnv
  });
  assert(
    t14.success === true &&
    (t14.reply.includes('vibe') || t14.reply.includes('banger')),
    'TEST 14: Kira acknowledges nice song without forced questions'
  );

  // TEST 15: !kira my friend got a new job and I'm tired (Understands primary intent)
  const t15 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_15',
    username: 'Milan',
    rawText: "!kira my friend got a new job and I'm tired",
    env: mockEnv
  });
  assert(
    t15.success === true &&
    (t15.reply.includes('congrats') || t15.reply.includes('aaram')),
    'TEST 15: Kira handles compound intent accurately'
  );

  // TEST 16: !kira weather is weird today
  const t16 = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_16',
    username: 'Milan',
    rawText: '!kira weather is weird today',
    env: mockEnv
  });
  assert(
    t16.success === true &&
    t16.reply.toLowerCase().includes('weather'),
    'TEST 16: Kira responds to weather topic'
  );

  // TEST 17: Sequential Independent Requests
  const seq1 = await processAIBotMessage({ botName: 'Kira', userId: 'u_s1', username: 'Milan', rawText: '!kira kesi hai?', env: mockEnv });
  const seq2 = await processAIBotMessage({ botName: 'Kira', userId: 'u_s2', username: 'Milan', rawText: '!kira kya kar rahi ho?', env: mockEnv });
  const seq3 = await processAIBotMessage({ botName: 'Kira', userId: 'u_s3', username: 'Milan', rawText: '!kira joke suna', env: mockEnv });
  assert(seq1.reply.includes('badiya') || seq1.reply.includes('mast'), 'TEST 17a: Seq 1 answers wellbeing');
  assert(seq2.reply.includes('chill') || seq2.reply.includes('dekh rahi'), 'TEST 17b: Seq 2 answers activity independently');
  assert(seq3.reply.includes('Teacher') || seq3.reply.includes('Friend') || seq3.reply.includes('battery'), 'TEST 17c: Seq 3 tells joke independently');

  // TEST 18: Cross-User Isolation (User A dog vs User B greeting)
  const uA = await processAIBotMessage({ botName: 'Kira', userId: 'u_dog_a', username: 'UserA', rawText: '!kira my dog is sick', env: mockEnv });
  const uB = await processAIBotMessage({ botName: 'Kira', userId: 'u_dog_b', username: 'UserB', rawText: '!kira kesi hai?', env: mockEnv });
  assert(
    !uB.reply.toLowerCase().includes('dog') &&
    !uB.reply.toLowerCase().includes('sick'),
    'TEST 18: User B is 100% isolated from User A context'
  );

  // TEST 19 & 20: Fallback Hierarchy (Cloudflare Fail -> Gemini Fallback -> Local Fallback)
  const mockGeminiEnv = {
    AI: {
      run: async () => { throw new Error('Cloudflare AI Down'); }
    },
    GEMINI_API_KEY: 'test-key-mock'
  };

  // Mock global fetch for Gemini
  const originalFetch = globalThis.fetch;
  let geminiReceivedPayload: any = null;
  globalThis.fetch = async (url: any, init: any) => {
    if (String(url).includes('generateContent')) {
      geminiReceivedPayload = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '@Milan Gemini reply with zero memory! 😌' }] } }]
        })
      } as any;
    }
    return originalFetch(url, init);
  };

  const geminiRes = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_gem_test',
    username: 'Milan',
    rawText: '!kira kesi ho',
    env: mockGeminiEnv
  });

  assert(
    geminiRes.success === true &&
    geminiRes.provider === 'gemini' &&
    geminiReceivedPayload !== null &&
    geminiReceivedPayload.contents[0].parts[0].text.includes('User (@Milan): kesi ho'),
    'TEST 19: When Cloudflare fails, Gemini is called and receives ONLY current message'
  );

  // Restore fetch & test local fallback when Gemini also fails
  globalThis.fetch = async () => { throw new Error('Gemini Down'); };
  const localRes = await processAIBotMessage({
    botName: 'Kira',
    userId: 'u_local_test',
    username: 'Milan',
    rawText: '!kira kesi ho',
    env: mockGeminiEnv
  });
  globalThis.fetch = originalFetch;

  assert(
    localRes.success === true &&
    localRes.provider === 'local_fallback' &&
    localRes.reply.includes('@Milan'),
    'TEST 20: When both Cloudflare & Gemini fail, Local Fallback is reliably used'
  );

  // TEST 21: Length strictly <= 300 characters
  const longRaw = 'word '.repeat(100);
  const clamped = sanitizeBotResponse(longRaw, 'Kira', 'TestUser');
  assert(clamped.length <= 300, `TEST 21: Response length strictly <= 300 chars (Got: ${clamped.length})`);

  // TEST 22: 5-Second Cooldown Funny Warning
  const cd1 = await processAIBotMessage({ botName: 'Kira', userId: 'u_cd', username: 'Speedy', rawText: '!kira hi', env: mockEnv });
  const cd2 = await processAIBotMessage({ botName: 'Kira', userId: 'u_cd', username: 'Speedy', rawText: '!kira hi again', env: mockEnv });
  assert(cd2.reason === 'rate_limited' && cd2.reply.includes('saans toh lene deee re baba'), 'TEST 22: 5s Cooldown produces exact funny warning');

  // TEST 23: Natural Short Response Allowed
  const shortMsg = sanitizeBotResponse('😂 true', 'Kira', 'Milan');
  assert(shortMsg === '😂 true', 'TEST 23: Short responses permitted with no artificial minimum length');

  // TEST 24: Leo Sarcastic Brotherly Persona
  const leoDebate = await processAIBotMessage({ botName: 'Leo', userId: 'u_leo_deb', username: 'Milan', rawText: '!leo I am bored', env: mockEnv });
  assert(leoDebate.reply.includes('debate') || leoDebate.reply.includes('music'), 'TEST 24: Leo maintains distinct chill music persona');

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runTests();
