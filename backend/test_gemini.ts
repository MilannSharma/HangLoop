// Test script to verify Gemini API Key and response generation
declare const process: any;

async function testGeminiFullResponses() {
  console.log('🧪 Testing Live Gemini Character Responses (Kira & Leo)...\n');

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    console.log('⚠️ GEMINI_API_KEY not set in process.env. Pass it via: $env:GEMINI_API_KEY="key"; npx tsx test_gemini.ts');
    return;
  }
  const model = 'gemini-3.6-flash';

  const testPrompts = [
    {
      bot: 'Kira',
      user: 'Milan',
      input: '!kira kesi hai re tuu',
      system: `You are Kira, a fun, lively, playful, sassy, and slightly mischievous female chat character in a live hangout music room. You are chatting with @Milan. Respond in natural witty Hinglish directly to what they said in the CURRENT message. Maximum 200 characters.`
    },
    {
      bot: 'Leo',
      user: 'Milan',
      input: '!leo pizza is better than biryani',
      system: `You are Leo, a sarcastic music and food lover. You are chatting with @Milan. Playfully defend Biryani. Maximum 200 characters.`
    }
  ];

  for (const t of testPrompts) {
    console.log(`\n========================================`);
    console.log(`🤖 Bot: [${t.bot}] | User: [${t.user}]`);
    console.log(`💬 Input: "${t.input}"`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${t.system}\n\nUser (@${t.user}): ${t.input}\n\nRespond directly as ${t.bot}:` }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 120,
            temperature: 0.85
          }
        })
      });

      const data: any = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log(`✨ Status: HTTP ${res.status}`);
      console.log(`📝 Generated Output:\n${reply}`);
    } catch (e: any) {
      console.error(`❌ Error:`, e.message);
    }
  }
}

testGeminiFullResponses();
