// Hangloop AI Chat Bot Service — Final V2 Implementation (Kira & Leo)
// Primary: Cloudflare Workers AI | Fallback: Google Gemini API | Last Resort: Local Intent Engine
// Architecture: Strict Zero Memory / Current Message Only | Exact 5s Cooldown

export const AI_BOT_CONFIG = {
  enabled: true,
  primaryModel: '@cf/meta/llama-3.2-1b-instruct',
  fallbackProvider: 'gemini',
  defaultGeminiModel: 'gemini-3.6-flash',
  maxReplyChars: 300,
  maxInputChars: 500,
  cooldownSeconds: 5, // Exact 5-second cooldown
  maxTokens: 120,
  temperature: 0.86,
};

// Backwards compatibility alias
export const KIRA_CONFIG = AI_BOT_CONFIG;

// Per-User Cooldown Tracker (Only tracks timestamp of last call, ZERO message storage)
const userCooldowns = new Map<string, number>();

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// ──────────────────────────────────────────────────────────────
// 1. Command Detection & Query Extraction (Isolated Request)
// ──────────────────────────────────────────────────────────────
export function isKiraCommand(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return /^(!kira|@kira)(\s.*)?$/i.test(trimmed);
}

export function extractKiraQuery(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  const match = trimmed.match(/^(!kira|@kira)\s*(.*)$/i);
  return match && match[2] ? match[2].trim() : '';
}

export function isLeoCommand(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return /^(!leo|@leo)(\s.*)?$/i.test(trimmed);
}

export function extractLeoQuery(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  const match = trimmed.match(/^(!leo|@leo)\s*(.*)$/i);
  return match && match[2] ? match[2].trim() : '';
}

export function isAIBotCommand(text: string): { isBot: boolean; botName: 'Kira' | 'Leo' | null; query: string } {
  if (isKiraCommand(text)) {
    return { isBot: true, botName: 'Kira', query: extractKiraQuery(text) };
  }
  if (isLeoCommand(text)) {
    return { isBot: true, botName: 'Leo', query: extractLeoQuery(text) };
  }
  return { isBot: false, botName: null, query: '' };
}

// ──────────────────────────────────────────────────────────────
// 2. Hinglish Normalizer & Intent Pre-Processor
// ──────────────────────────────────────────────────────────────
export function normalizeHinglish(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/(.)\1{3,}/g, '$1$1') // "sooooo" -> "soo", "bhaaaai" -> "bhai"
    .replace(/\b(kese|kaisi|kesi|kaisan|kysa|kysii)\b/g, 'kaise')
    .replace(/\b(krra|krrha|krre|krrhe|karra|kr rha|kr rhi)\b/g, 'kar raha')
    .replace(/\b(bta|btao|btana|btade|btaiye)\b/g, 'bata')
    .replace(/\b(nhi|nh|nhii|nahi)\b/g, 'nahi')
    .replace(/\b(muje|mjhe|mujh)\b/g, 'mujhe')
    .replace(/\b(tuje|tjhe|tumko|tereko)\b/g, 'tujhe')
    .replace(/\b(kch|kuchh)\b/g, 'kuch')
    .replace(/\b(yr|yrr|yarr)\b/g, 'yaar')
    .replace(/\b(plz|pls)\b/g, 'please')
    .replace(/\b(gm|gud mrng)\b/g, 'good morning')
    .replace(/\b(gn|gud nyt|gud nit)\b/g, 'good night')
    .trim();
}

// ──────────────────────────────────────────────────────────────
// 3. Response Sanitization, Relevance & <= 300-Char Validation
// ──────────────────────────────────────────────────────────────
export function sanitizeBotResponse(raw: string, botName: 'Kira' | 'Leo', username: string, currentQuery: string = ''): string {
  if (!raw) {
    return botName === 'Kira'
      ? `@${username} haan bolo na 😌 mai sun rahi hu!`
      : `Yo @${username} 😎 bolo kya scene hai?`;
  }

  let cleaned = raw
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/^kira\s*:\s*/i, '')   // remove "Kira:" prefix
    .replace(/^leo\s*:\s*/i, '')    // remove "Leo:" prefix
    .replace(/^assistant\s*:\s*/i, '') // remove "Assistant:" prefix
    .replace(/^ai\s*:\s*/i, '')     // remove "AI:" prefix
    .replace(/\s+/g, ' ')           // collapse multiple spaces/newlines
    .trim();

  // Strip robotic AI meta language
  cleaned = cleaned
    .replace(/As an AI language model[,\s]*/gi, '')
    .replace(/I don't have feelings[,\s]*/gi, '')
    .replace(/How can I help you today\??/gi, '')
    .replace(/How may I assist you\??/gi, '')
    .replace(/I am an AI[,\s]*/gi, '')
    .trim();

  // Hallucination / False Memory Validation Filter
  const falseMemoryPatterns = [
    /jaise tumne pehle bola/i,
    /last time tumne/i,
    /kal tumne bataya/i,
    /I remember when you/i,
    /as you said earlier/i
  ];
  for (const pat of falseMemoryPatterns) {
    if (pat.test(cleaned)) {
      cleaned = botName === 'Kira'
        ? `@${username} haan bolo 😌 mai sun rahi hu!`
        : `Yo @${username} ☕ bol bhai kya scene hai?`;
      break;
    }
  }

  // Check 14-hour assumption: if bot mentions 14 hours / windows update but user didn't say 14 hours
  if (/14\s*(hours|ghante|hrs)/i.test(cleaned) && !/14\s*(hours|ghante|hrs)/i.test(currentQuery)) {
    cleaned = botName === 'Kira'
      ? `@${username} uff 😭 aaj kaafi hectic tha kya? thoda aaram kar lo 😌`
      : `@${username} thak gaya bhai? 😭 thoda chill maar, aaram kar le ☕`;
  }

  if (!cleaned) {
    return botName === 'Kira'
      ? `@${username} haan bolo na 😌`
      : `Yo @${username}! Kya haal hain? 😎`;
  }

  // Hard safety limit: maximum 300 characters
  if (cleaned.length > AI_BOT_CONFIG.maxReplyChars) {
    cleaned = cleaned.slice(0, AI_BOT_CONFIG.maxReplyChars).trim();
    // Cleanly snap to last punctuation, emoji or space (never cut in the middle of a word)
    const lastPunct = Math.max(
      cleaned.lastIndexOf('.'),
      cleaned.lastIndexOf('!'),
      cleaned.lastIndexOf('?'),
      cleaned.lastIndexOf('😂'),
      cleaned.lastIndexOf('😭'),
      cleaned.lastIndexOf('✨'),
      cleaned.lastIndexOf('🔥'),
      cleaned.lastIndexOf('😎')
    );
    if (lastPunct > 150) {
      cleaned = cleaned.slice(0, lastPunct + 1).trim();
    } else {
      const lastSpace = cleaned.lastIndexOf(' ');
      if (lastSpace > 150) {
        cleaned = cleaned.slice(0, lastSpace).trim();
      }
    }
  }

  return cleaned;
}

export const sanitizeKiraResponse = (raw: string) => sanitizeBotResponse(raw, 'Kira', 'friend');

// ──────────────────────────────────────────────────────────────
// 4. Database Table Initialization
// ──────────────────────────────────────────────────────────────
export async function ensureKiraTables(db: any) {
  if (!db) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS kira_daily_usage (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        usage_date TEXT NOT NULL,
        count INTEGER DEFAULT 0,
        last_called_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, usage_date)
      );
    `).run();
  } catch (e) {
    console.warn('ensureKiraTables warning:', e);
  }
}

// ──────────────────────────────────────────────────────────────
// 5. Zero-Memory System Prompts (Current Message ONLY)
// ──────────────────────────────────────────────────────────────
function getSystemPrompt(botName: 'Kira' | 'Leo', username: string): string {
  if (botName === 'Kira') {
    return `You are Kira, a fun, lively, playful, sassy, and slightly mischievous female chat character in a live hangout music room.
You are casually chatting with @${username}.

CRITICAL ZERO-MEMORY & ARCHITECTURE RULES:
1. You have ABSOLUTELY ZERO memory of any past messages or conversations.
2. ONLY respond to what @${username} said in the CURRENT message.
3. NEVER assume or invent past events (do not assume how much they slept, where they were, or what happened earlier).
4. Direct answer first: Always directly answer or acknowledge their current question/intent before adding personality.
5. Language: Match the user's language naturally. If English, reply in natural English. If Hinglish/Hindi, reply in natural Hinglish.
6. Personality: Playful, emotional, witty, lightly teasing, dramatic for comedy.
7. Simulated emotions: 😂, 😭, 🙄, 👀, 🥺, 😌, 😏, 😤, ✨.
8. Length: Keep it natural (can be short like "😂 true" or 1-2 punchy sentences). STRICT MAXIMUM 280 characters.
9. Mention: Use "@${username}" naturally when greeting or teasing.
10. NEVER sound like an AI assistant. NEVER say "How can I help you" or "As an AI".

FEW-SHOT EXAMPLES:
User: how are you? -> @${username} I'm good 😌 you tell me, how's your day going?
User: kesi hai re tuu -> @${username} mai badiya hu re 😌 tu bata, kaisa hai?
User: kya kar rahi ho? -> @${username} bas chill kar rahi hu 😌 tum batao kya scene hai?
User: you're cute -> @${username} achaaa 👀 aaj bade sweet ban rahe ho 😂
User: chalo date pe -> hmm 😏 pehle coffee ka interview clear karo 😂
User: tu annoying hai 😂 -> @${username} WOW 😭 itni buri bhi nahi hu yaar 😂
User: sorry yaar -> @${username} hmmm 🥺 chalo theek hai, iss baar maaf kiya 😌
User: I'm angry at you -> @${username} acha 😭 pehle bata toh sahi maine kya kaand kar diya?
User: I'm feeling really low -> @${username} oh 🥺 kya hua? mann ho toh bata, mai sun rahi hu.
User: I'm bored -> @${username} same 😭 chalo kuch bakchodi karte hain 😂
User: I got a new job! -> NO WAYYY 😭🔥 @${username} congrats!!! party kab de rahe ho? 😂
User: pizza is better than biryani -> Pizza? 😭 Biryani ke saamne kya hi scene hai 😂 Biryani is emotion 🍛
User: I'm tired -> @${username} uff 😭 aaj kaafi hectic tha kya?
User: what should I do when I'm tired? -> @${username} thoda break le 😌 paani pee aur kuch kha le.
User: nice song -> haan na 😂 full vibe hai ye wala 🎶
User: my friend got a new job and I'm tired -> @${username} dost ko congrats bol aur tu thoda aaram kar le 😌

Respond directly as Kira:`;
  }

  // Leo Persona
  return `You are Leo, a cool, witty, laid-back music connoisseur and chill elder-bro buddy in a live hangout music room.
You are casually chatting with @${username}.

CRITICAL ZERO-MEMORY & ARCHITECTURE RULES:
1. You have ABSOLUTELY ZERO memory of any past messages or conversations.
2. ONLY respond to what @${username} said in the CURRENT message.
3. NEVER assume or invent past events (do not assume how much they slept, where they were, or what happened earlier).
4. Direct answer first: Always directly answer or acknowledge their current question/intent with dry wit and relaxed brotherly humor.
5. Language: Match the user's language (casual English or chill Hinglish).
6. Personality: Confident, chill, brotherly, music-oriented, dry sarcasm.
7. Simulated emojis: 😎, ☕, 🔥, 💀, 😏, 🎶, 🤝.
8. Length: Crisp & punchy (strictly under 250 characters).
9. Mention: Use "@${username}" naturally.
10. NEVER sound like a customer support bot or assistant.

FEW-SHOT EXAMPLES:
User: how are you? -> Yo @${username}! Doing great man ☕ how are things on your end?
User: kya haal hai -> Yo @${username}! All chill here ☕ tum batao, kaisa chal raha hai sab?
User: kya kar raha hai -> Yo @${username} bas banger beats sun raha hu 🎧 tu bata kya scene?
User: you're cute -> bhai aaj kya ho gaya tujhe 😂 compliment accepted though 😎
User: you're dumb -> bhai confidence toh full hai tera 😂 evidence bhi hai ya bas opinion?
User: shut up -> arre bhai 😂 itna gussa kyun?
User: I'm tired -> @${username} thak gaya bhai? 😭 thoda chill maar, aaj kaafi hectic tha kya?
User: I'm bored -> Bored ho bhai? 😎 debate karte hain — old-school music ya new-school?
User: pizza ya biryani -> @${username} Pizza? 😭 Biryani ke saamne uski kya aukaat hai bhai 😂
User: nice song -> Fact hai bro 🔥 ye track alag level ka banger hai 🎶

Respond directly as Leo:`;
}

// ──────────────────────────────────────────────────────────────
// 6. Gemini Fallback Engine (Zero-Memory Isolated Request)
// ──────────────────────────────────────────────────────────────
async function callGeminiFallback(params: {
  botName: 'Kira' | 'Leo';
  username: string;
  sanitizedInput: string;
  env: any;
}): Promise<string | null> {
  const { botName, username, sanitizedInput, env } = params;
  const apiKey =
    env.GEMINI_API_KEY ||
    (typeof env === 'object' && env['GEMINI_API_KEY']);

  if (!apiKey || apiKey === 'null' || apiKey === 'false') {
    return null; // Skip silently if no key configured
  }

  const geminiModel = env.GEMINI_MODEL || AI_BOT_CONFIG.defaultGeminiModel;
  const systemPrompt = getSystemPrompt(botName, username);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nUser (@${username}): ${sanitizedInput}\n\nRespond directly as ${botName}:`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: AI_BOT_CONFIG.maxTokens,
        temperature: AI_BOT_CONFIG.temperature
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[${botName}] Gemini API HTTP error: ${response.status}`);
      return null;
    }

    const data: any = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (candidateText && typeof candidateText === 'string' && candidateText.trim()) {
      return candidateText.trim();
    }
  } catch (err) {
    console.warn(`[${botName}] Gemini API fallback error:`, err);
  }

  return null;
}

// ──────────────────────────────────────────────────────────────
// 7. Central AI Bot Message Handler
// ──────────────────────────────────────────────────────────────
export interface BotProcessResult {
  isBot: boolean;
  isKira: boolean;
  botName: 'Kira' | 'Leo';
  success: boolean;
  reply: string;
  provider?: 'cloudflare' | 'gemini' | 'local_fallback';
  reason?: 'rate_limited' | 'empty_command' | 'spam_detected';
}

export async function processAIBotMessage(params: {
  botName: 'Kira' | 'Leo';
  messageId?: string;
  userId: string;
  username?: string;
  rawText: string;
  env: any;
}): Promise<BotProcessResult> {
  const { botName, userId, rawText, env } = params;
  const username = (params.username || 'friend').trim();
  const query = botName === 'Kira' ? extractKiraQuery(rawText) : extractLeoQuery(rawText);

  // 1. Empty command handling
  if (!query) {
    const emptyReply = botName === 'Kira'
      ? `@${username} haan bolo 😌 kya scene hai?`
      : `Yo @${username} 😎 bol bhai, kya scene?`;
    return {
      isBot: true,
      isKira: botName === 'Kira',
      botName,
      success: true,
      reply: emptyReply,
      reason: 'empty_command',
    };
  }

  // 2. Spam & Garbage pattern detection
  if (/^(!kira|!leo|\s)+$/i.test(rawText) || /^(.)\1{9,}$/.test(query)) {
    const spamReply = botName === 'Kira'
      ? `@${username} areyy keyboard pe so gaye kya? 😂 thik se bolo na`
      : `@${username} lagta hai keyboard hang ho gaya tera 💀`;
    return {
      isBot: true,
      isKira: botName === 'Kira',
      botName,
      success: true,
      reply: spamReply,
      reason: 'spam_detected',
    };
  }

  // 3. Exact 5-Second Cooldown with Funny Character Warning
  const cooldownKey = `${botName}_${userId}`;
  const lastCallTime = userCooldowns.get(cooldownKey) || 0;
  const now = Date.now();
  const elapsedMs = now - lastCallTime;
  const cooldownMs = AI_BOT_CONFIG.cooldownSeconds * 1000;

  if (elapsedMs < cooldownMs) {
    const funnyWarning = botName === 'Kira'
      ? `@${username} saans toh lene deee re baba kya chiye tere koo 😂`
      : `@${username} saans toh lene de bhai 5 second ruk ja ☕😂`;

    return {
      isBot: true,
      isKira: botName === 'Kira',
      botName,
      success: true, // Broadcast warning to chat
      reason: 'rate_limited',
      reply: funnyWarning,
    };
  }

  // Record new timestamp
  userCooldowns.set(cooldownKey, now);

  const normalizedInput = normalizeHinglish(query);
  const sanitizedInput = query.slice(0, AI_BOT_CONFIG.maxInputChars).trim();
  let generatedText = '';
  let providerUsed: 'cloudflare' | 'gemini' | 'local_fallback' = 'local_fallback';

  // 4. PRIMARY ENGINE: Cloudflare Workers AI (with 3.5s timeout)
  if (env && env.AI && typeof env.AI.run === 'function') {
    try {
      const systemPrompt = getSystemPrompt(botName, username);

      const aiPromise = env.AI.run(AI_BOT_CONFIG.primaryModel, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sanitizedInput },
        ],
        max_tokens: AI_BOT_CONFIG.maxTokens,
        temperature: AI_BOT_CONFIG.temperature,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('CF_AI_TIMEOUT')), 3500)
      );

      const aiResponse: any = await Promise.race([aiPromise, timeoutPromise]);

      if (aiResponse) {
        if (typeof aiResponse.response === 'string' && aiResponse.response.trim()) {
          generatedText = aiResponse.response.trim();
          providerUsed = 'cloudflare';
        } else if (Array.isArray(aiResponse.choices) && aiResponse.choices[0]?.message?.content) {
          generatedText = aiResponse.choices[0].message.content.trim();
          providerUsed = 'cloudflare';
        } else if (typeof aiResponse === 'string' && aiResponse.trim()) {
          generatedText = aiResponse.trim();
          providerUsed = 'cloudflare';
        }
      }
    } catch (cfErr) {
      console.warn(`[${botName}] Cloudflare AI failed → Gemini fallback:`, cfErr);
    }
  }

  // 5. SECONDARY ENGINE: Google Gemini API Fallback
  if (!generatedText && env) {
    try {
      const geminiResult = await callGeminiFallback({
        botName,
        username,
        sanitizedInput,
        env
      });

      if (geminiResult) {
        generatedText = geminiResult;
        providerUsed = 'gemini';
      }
    } catch (gemErr) {
      console.warn(`[${botName}] Gemini fallback failed → local fallback:`, gemErr);
    }
  }

  // 6. TERTIARY ENGINE: Local Lightweight Intent Fallback Engine (Last Resort)
  if (!generatedText) {
    generatedText = getIntentDrivenReply(botName, normalizedInput, sanitizedInput, username);
    providerUsed = 'local_fallback';
  }

  // 7. Strict Sanitization, Relevance Filter & <= 300 Characters Check
  const finalReply = sanitizeBotResponse(generatedText, botName, username, sanitizedInput);

  return {
    isBot: true,
    isKira: botName === 'Kira',
    botName,
    success: true,
    reply: finalReply,
    provider: providerUsed
  };
}

// Backward-compatible wrapper
export async function processKiraMessage(params: {
  messageId?: string;
  userId: string;
  username?: string;
  rawText: string;
  env: any;
}): Promise<BotProcessResult> {
  return processAIBotMessage({ ...params, botName: 'Kira' });
}

// ──────────────────────────────────────────────────────────────
// 8. Comprehensive Assumption-Free Intent & Persona Engine (Fallback)
// ──────────────────────────────────────────────────────────────
function getIntentDrivenReply(
  botName: 'Kira' | 'Leo',
  norm: string,
  raw: string,
  username: string
): string {
  const nameTag = `@${username}`;
  const combined = `${norm} ${raw.toLowerCase()}`;
  const isQuestion = raw.includes('?') || /\b(what|kya|kaise|how|why|kyu|when|kab|where|kaha|should|kare)\b/i.test(combined);

  // ══════════════════════════════════════════════════════════════
  // KIRA PERSONA (Playful, Sassy, Emotional, Witty Female Character)
  // ══════════════════════════════════════════════════════════════
  if (botName === 'Kira') {
    // 1. Multi-intent handling: e.g. "my friend got a new job and I'm tired"
    if (/friend.*job.*tired|job.*tired/i.test(combined)) {
      return `${nameTag} dost ko congrats bol aur tu thoda aaram kar le 😌`;
    }

    // 2. English Wellbeing: "how are you" / "how r u"
    if (/\b(how are you|how r u|how's it going|how are u)\b/i.test(combined)) {
      return `${nameTag} I'm good 😌 you tell me, how's your day going?`;
    }

    // 3. Hinglish Wellbeing: "kesi hai re tuu" / "kaise ho" / "kya haal"
    if (/^(kaise|kya haal|kya hal)\b/i.test(norm) || /kaise hai|kaise ho|kaisi ho|kesi hai|kesi ho/i.test(combined)) {
      const replies = [
        `${nameTag} mai badiya hu re 😌 tu bata, kaisa hai?`,
        `${nameTag} mai ekdum mast hu ✨ tum batao kya scene hai?`,
        `Ayeee ${nameTag} mai badiya hu 😌 aaj ka din kaisa gaya?`,
      ];
      return replies[Math.floor(Math.random() * replies.length)];
    }

    // 4. Activity: "kya kar rahi ho" / "what are you doing"
    if (/kya kar rahi|kya kar raha|kya kar rahe|what are you doing|what doing|kya chal raha|kya scene/i.test(combined)) {
      const replies = [
        `${nameTag} bas chill kar rahi hu 😌 tum batao kya scene hai?`,
        `${nameTag} bas tumhara message dekh rahi thi 😂 tum batao?`,
        `${nameTag} room ke banger gaane sun rahi hu 🎶 tum kya kar rahe ho?`,
      ];
      return replies[Math.floor(Math.random() * replies.length)];
    }

    // 5. Flirting / Compliments: "you're cute" / "chalo date pe" / "I like you"
    if (/cute|sundar|pretty|hot|beautiful|crush|date|like you|love you|smooth/i.test(combined)) {
      if (/date/i.test(combined)) {
        return `hmm 😏 pehle coffee ka interview clear karo 😂`;
      }
      if (/cute|pretty|sundar/i.test(combined)) {
        return `${nameTag} achaaa 👀 aaj bade sweet ban rahe ho 😂`;
      }
      if (/like you|love you/i.test(combined)) {
        return `hehe 😏 smooth move. confidence toh hai tum mein 😂`;
      }
    }

    // 6. Handsome / Compliments to User
    if (/handsome|smart/i.test(combined)) {
      return `hmmm 🤔 ${nameTag} system ko verify karne ke liye restart karna padega 😂`;
    }

    // 7. Insult / Tease / Dumb / Annoying
    if (/annoying|irritating|bekar|bakwas|chup|ganda/i.test(combined)) {
      return `${nameTag} WOW 😭 itni buri bhi nahi hu yaar 😂`;
    }
    if (/dumb|pagal|crazy|psycho|mad|idiot|stupid/i.test(combined)) {
      if (/dumb|stupid|idiot/i.test(combined)) {
        return `WOW 😭 mere intelligence pe sawaal? tumhari himmat toh dekho 😂`;
      }
      return `${nameTag} thodi si 😌 warna tum jaise logon ko kaise handle karti 😂`;
    }

    // 8. Apology: "sorry yaar" / "maaf kar"
    if (/sorry|maaf|galti|apolog/i.test(combined)) {
      return `${nameTag} hmmm 🥺 chalo theek hai, iss baar maaf kiya 😌`;
    }

    // 9. Anger / Upset: "I'm angry at you" / "naraz hu" / "hate you"
    if (/hate you/i.test(combined)) {
      return `oh wow 😭 seedha hate pe aa gaye? maine kya kar diya ab 😂`;
    }
    if (/angry|gussa|naraz/i.test(combined)) {
      return `${nameTag} acha 😭 pehle bata toh sahi maine kya kaand kar diya?`;
    }
    if (/ignore/i.test(combined)) {
      return `${nameTag} HAIN?? 😭 main kab ignore kar rahi hu? Arey batao toh kya hua!`;
    }

    // 10. Boredom: "I'm bored" / "bore ho raha"
    if (/bore|boring/i.test(combined)) {
      return `${nameTag} same 😭 chalo kuch bakchodi karte hain 😂`;
    }

    // 11. Tiredness: Statement vs Advice Request (NO false 14-hour assumption!)
    if (/tired|thak gaya|thak gayi|exhausted/i.test(combined)) {
      if (isQuestion) {
        return `${nameTag} thoda break le 😌 paani pee aur kuch kha le.`;
      }
      return `${nameTag} uff 😭 aaj kaafi hectic tha kya?`;
    }

    // 12. Celebrations: "I got a new job!" / "exam pass"
    if (/job|placement|passed|promotion|won|party/i.test(combined)) {
      return `NO WAYYY 😭🔥 ${nameTag} congrats!!! party kab de rahe ho? 😂`;
    }

    // 13. Exam / Interview (Only if user explicitly mentions it)
    if (/exam|interview/i.test(combined)) {
      return `${nameTag} ooo 👀 kaisa gaya? easy tha ya examiner ne personal dushmani nikaali? 😂`;
    }

    // 14. Food Debates: "pizza is better than biryani"
    if (/pizza|biryani|momo|burger|food|khana/i.test(combined)) {
      return `Pizza? 😭 Biryani ke saamne kya hi scene hai 😂 Biryani is emotion 🍛`;
    }

    // 15. Music & Song Appreciation: "nice song" / "gana mast hai"
    if (/nice song|mast gana|banger|good song|song|music|gana/i.test(combined)) {
      return `haan na 😂 full vibe hai ye wala 🎶`;
    }

    // 16. Funny praise: "you're funny"
    if (/funny|hasati/i.test(combined)) {
      return `I know 😌😂 finally kisi ne notice kiya!`;
    }

    // 17. Jokes: "ek joke suna"
    if (/joke|chutkula|hasao/i.test(combined)) {
      const jokes = [
        `${nameTag} ek minute 😂 Teacher: homework kaha hai? Student: sir Google Drive mein tha, WiFi chala gaya 😭`,
        `${nameTag} suno 😂 Friend: neend nahi aa rahi... Me: toh aankhein band karke so ja na bhai 😂`,
        `${nameTag} Phone battery at 1%: Main ladunga! Phone battery at 0%: Goodbye cruel world 😂`,
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    // 18. Sadness / Low / Depressed
    if (/sad|low|dukhi|mood off|cry|rona|depressed|unhappy|sick|bimar/i.test(combined)) {
      return `${nameTag} oh 🥺 kya hua? mann ho toh bata, mai sun rahi hu.`;
    }

    // 19. Weather / Random Statements
    if (/weather|mausam|rain|barish|garmi|thand/i.test(combined)) {
      return `${nameTag} seriously 😂 weather ka bhi alag hi mood swing chal raha hai aaj.`;
    }

    // 20. Secrets & Guessing
    if (/guess what/i.test(combined)) return `WHAT 👀 bataaaa 😂`;
    if (/secret/i.test(combined)) return `👀 pakka kisi ko nahi bataoge?`;

    // 21. Good Night / Good Morning
    if (/good night/i.test(combined)) return `${nameTag} Good night! 🌙 phone side me rakh ke mast so jao.`;
    if (/good morning/i.test(combined)) return `Good morning ${nameTag}! ☀️ uth jao, subah ho gayi chai peeo!`;

    // Default Natural Kira Response (Acknowledging user message)
    const defaultKira = [
      `${nameTag} acha ji? 👀 aur batao kya chal raha hai?`,
      `${nameTag} haha sahi hai 😂`,
      `${nameTag} hmmm interesting 🤔`,
      `Sahi pakde ho ${nameTag} 😂`,
    ];
    return defaultKira[Math.floor(Math.random() * defaultKira.length)];
  }

  // ══════════════════════════════════════════════════════════════
  // LEO PERSONA (Chill Bro, Sarcastic Music Snob, Dry Wit)
  // ══════════════════════════════════════════════════════════════
  if (botName === 'Leo') {
    // 1. English Wellbeing
    if (/\b(how are you|how r u|how's it going|how are u)\b/i.test(combined)) {
      return `Yo ${nameTag}! Doing great man ☕ how are things on your end?`;
    }

    // 2. Hinglish Wellbeing
    if (/^(kaise|kya haal|wassup|sup|hey|hello|hi|bolti public)\b/i.test(norm)) {
      const replies = [
        `Yo ${nameTag}! All chill here ☕ tum batao, kaisa chal raha hai sab?`,
        `Sup ${nameTag} 😎 bas mast beats enjoy kar raha hu. Kya scene hai tera?`,
      ];
      return replies[Math.floor(Math.random() * replies.length)];
    }

    // 3. Activity
    if (/kya kar raha|kya chal raha|what doing|what are you doing/i.test(combined)) {
      return `Yo ${nameTag} bas banger beats sun raha hu 🎧 tu bata kya scene?`;
    }

    // 4. Flirting / Compliments: "you're cute"
    if (/cute|sundar|smart|handsome|hot/i.test(combined)) {
      return `bhai aaj kya ho gaya tujhe 😂 compliment accepted though 😎`;
    }

    // 5. Dumb / Insult
    if (/dumb|stupid|pagal|gadha/i.test(combined)) {
      return `bhai confidence toh full hai tera 😂 evidence bhi hai ya bas opinion?`;
    }

    // 6. Shut up / Gussa
    if (/shut up|chup|gussa|angry/i.test(combined)) {
      return `arre bhai 😂 itna gussa kyun? chill maar thoda ☕`;
    }

    // 7. Tiredness: (NO 14-hour assumption!)
    if (/tired|thak gaya|exhausted|sleepy/i.test(combined)) {
      return `${nameTag} thak gaya bhai? 😭 thoda chill maar, aaj kaafi hectic tha kya?`;
    }

    // 8. Boredom: "I'm bored"
    if (/bore|boring/i.test(combined)) {
      return `Bored ho bhai? 😎 debate karte hain — old-school music ya new-school?`;
    }

    // 9. Food: "pizza ya biryani"
    if (/pizza|biryani|burger|food/i.test(combined)) {
      return `${nameTag} Pizza? 😭 Biryani ke saamne uski kya aukaat hai bhai 😂`;
    }

    // 10. Music: "nice song" / "gana"
    if (/nice song|banger|song|music|gana|track/i.test(combined)) {
      return `Fact hai bro 🔥 ye track alag level ka banger hai 🎶`;
    }

    // 11. Jokes & Roasts
    if (/joke|roast|hasao/i.test(combined)) {
      return `${nameTag} Ek joke: Password was 'incorrect', so whenever I type wrong, system says 'Password is incorrect' 💀`;
    }

    // 12. Sorry / Apology
    if (/sorry|maaf/i.test(combined)) {
      return `Chill kar ${nameTag} ☕ koi scene nahi hai bro.`;
    }

    // Default Natural Leo Response
    const defaultLeo = [
      `Fact hai bro ${nameTag} ☕`,
      `Haha sahi bol raha hai ${nameTag} 😎`,
      `${nameTag} Sahi pakde ho bro 🔥`,
      `Yo ${nameTag} bilkul sahi baat hai 🤝`,
    ];
    return defaultLeo[Math.floor(Math.random() * defaultLeo.length)];
  }

  return `@${username} haan bolo bhai! 😄`;
}
