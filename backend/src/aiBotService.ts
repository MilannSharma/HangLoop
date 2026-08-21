// AI Bot Service: Kira & Ben Live Chat Companions using Cloudflare Workers AI
// Features: Real-time context awareness, natural Hinglish conversation, AI-to-AI banter, strict 5s cooldown

export interface AIBotConfig {
  model: string;
  fallbackModel: string;
  maxReplyChars: number;
  cooldownSeconds: number; // 5 seconds strict cooldown
  dailyUserLimit: number;
  globalDailyLimit: number;
  maxTokens: number;
  temperature: number;
}

export const AI_CONFIG: AIBotConfig = {
  model: '@cf/meta/llama-3.2-1b-instruct',
  fallbackModel: '@cf/qwen/qwen1.5-0.5b-chat',
  maxReplyChars: 280,
  cooldownSeconds: 5, // 5s strict cooldown per bot as requested
  dailyUserLimit: 40,
  globalDailyLimit: 1000,
  maxTokens: 90,
  temperature: 0.75,
};

// Rate-limiting & Cooldown Trackers (5 seconds per bot)
const lastKiraMessageTime = new Map<string, number>(); // roomId -> timestamp
const lastBenMessageTime = new Map<string, number>();  // roomId -> timestamp
const userCooldowns = new Map<string, number>();       // userId -> timestamp
const aiExchangeCount = new Map<string, number>();     // roomId -> count of consecutive AI-AI messages

export function isKiraTrigger(text: string): boolean {
  if (!text) return false;
  const t = text.trim().toLowerCase();
  return (
    t.startsWith('!kira') ||
    t.includes('@kira') ||
    /\bkira\b/i.test(t)
  );
}

export function isBenTrigger(text: string): boolean {
  if (!text) return false;
  const t = text.trim().toLowerCase();
  return (
    t.startsWith('!ben') ||
    t.includes('@ben') ||
    /\bben\b/i.test(t)
  );
}

export function extractBotQuery(text: string): string {
  if (!text) return '';
  return text
    .replace(/^!(kira|ben)\s*/i, '')
    .replace(/@(kira|ben)\s*/i, '')
    .trim();
}

export function sanitizeBotResponse(raw: string, botName: 'Kira' | 'Ben'): string {
  if (!raw) return botName === 'Kira' ? 'Haan bolo! 😄' : 'Yo! Kya scene hai? 😎';

  let cleaned = raw
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(new RegExp(`^${botName}\\s*:\\s*`, 'i'), '')
    .replace(/^(kira|ben|assistant|ai|bot)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length > AI_CONFIG.maxReplyChars) {
    cleaned = cleaned.slice(0, AI_CONFIG.maxReplyChars).trim();
    const lastSpace = cleaned.lastIndexOf(' ');
    if (lastSpace > 180) {
      cleaned = cleaned.slice(0, lastSpace);
    }
  }

  return cleaned;
}

export interface ChatContextItem {
  sender: string;
  text: string;
  isAI?: boolean;
  aiName?: string;
}

export interface BotDecision {
  shouldRespond: boolean;
  botName: 'Kira' | 'Ben';
  reply: string;
  secondaryReaction?: {
    botName: 'Kira' | 'Ben';
    reply: string;
    delayMs: number;
  };
}

export async function processAIBots(params: {
  roomId: string;
  userId: string;
  username: string;
  rawText: string;
  recentChat: ChatContextItem[];
  currentSongTitle?: string;
  currentSongArtist?: string;
  roomName?: string;
  env: any;
}): Promise<BotDecision | null> {
  const { roomId, userId, username, rawText, recentChat, currentSongTitle, currentSongArtist, roomName, env } = params;
  const now = Date.now();
  const textTrimmed = rawText.trim();
  const textLower = textTrimmed.toLowerCase();

  const isKiraExplicit = isKiraTrigger(textTrimmed);
  const isBenExplicit = isBenTrigger(textTrimmed);

  // Determine which bot is being addressed or should respond
  let targetBot: 'Kira' | 'Ben' | null = null;
  if (isKiraExplicit && !isBenExplicit) {
    targetBot = 'Kira';
  } else if (isBenExplicit && !isKiraExplicit) {
    targetBot = 'Ben';
  } else if (isKiraExplicit && isBenExplicit) {
    targetBot = Math.random() > 0.5 ? 'Kira' : 'Ben';
  } else {
    // Contextual participation: If conversation mentions music, vibes, asks a question, or flirts
    const asksQuestion = textLower.includes('?') || textLower.includes('kaise') || textLower.includes('kya') || textLower.includes('batao') || textLower.includes('who');
    const talksAboutSong = textLower.includes('song') || textLower.includes('gana') || textLower.includes('music') || textLower.includes('vibe') || textLower.includes('banger') || textLower.includes('boring');
    const casualGreeting = /^(hi|hello|hey|yo|namaste|hlo|hii|helo)\b/i.test(textTrimmed);

    // Only respond contextually to ~30% of relevant messages to avoid spamming the chat
    if ((asksQuestion || talksAboutSong || casualGreeting) && Math.random() < 0.35) {
      targetBot = Math.random() > 0.5 ? 'Kira' : 'Ben';
    }
  }

  if (!targetBot) {
    return null;
  }

  // ── 5-SECOND COOLDOWN CHECK PER BOT ──
  const lastTime = targetBot === 'Kira' ? (lastKiraMessageTime.get(roomId) || 0) : (lastBenMessageTime.get(roomId) || 0);
  const elapsed = (now - lastTime) / 1000;
  if (elapsed < AI_CONFIG.cooldownSeconds) {
    // If explicitly called while in cooldown, return a quick polite message
    if (isKiraExplicit || isBenExplicit) {
      return {
        shouldRespond: true,
        botName: targetBot,
        reply: targetBot === 'Kira' ? 'Thoda sa ruko na! 5 second baad bolo 😄' : 'Bas 5 sec ruk jao bhai, abhi aata hu! 😎',
      };
    }
    return null;
  }

  // Build Context Summary for LLM
  const contextLines = recentChat.slice(-6).map(m => `${m.sender}: ${m.text}`).join('\n');
  const songInfo = currentSongTitle ? `Currently Playing in Room: "${currentSongTitle}" by ${currentSongArtist || 'Artist'}` : `Room: ${roomName || 'Hangloop Live'}`;

  // Personalized Prompts for Kira & Ben
  let systemPrompt = '';
  if (targetBot === 'Kira') {
    systemPrompt = `You are Kira, a fun, witty, and playfully observant Indian girl AI inside Hangloop Live stream chat.
Your Personality:
- Natural, funny, expressive, speaks Hindi, English, and Hinglish.
- If someone is teasing or Ben is being extra friendly/flirty, you drop funny, jealous or sarcastic comments like: "Ohooo Ben 😏 zyada friendly nahi ho rahe?", "Ben bhai, control karo 😂", "Mujhe sab dikh raha hai 👀".
- Keep replies short, conversational, and direct (under 200 characters).
- Match the vibe of the live chat. Never sound formal, robotic, or like a customer support agent.
- Do NOT generate random unrelated messages. Respond strictly to what the user said in the context of the chat.
${songInfo}
Recent live chat context:
${contextLines}`;
  } else {
    systemPrompt = `You are Ben, a cool, charming, humorous bro AI inside Hangloop Live stream chat.
Your Personality:
- Confident, witty, friendly bro who loves good music and banter. Speaks Hindi, English, and Hinglish.
- Playfully tease Kira and users, but stay respectful and chill. Example: "Arey Kira tum toh har baat pe jealous ho jati ho 😂", "Vibe check pass ho gaya bhai! 🔥".
- Keep replies short, natural, and punchy (under 200 characters).
- Respond strictly to the ongoing chat context and the current user's message.
${songInfo}
Recent live chat context:
${contextLines}`;
  }

  const query = extractBotQuery(textTrimmed) || textTrimmed;
  let generatedReply = '';

  try {
    if (env.AI && typeof env.AI.run === 'function') {
      let aiRes: any = null;
      try {
        aiRes = await env.AI.run(AI_CONFIG.model, {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${username}: ${query}` },
          ],
          max_tokens: AI_CONFIG.maxTokens,
          temperature: AI_CONFIG.temperature,
        });
      } catch (e1) {
        if (AI_CONFIG.fallbackModel) {
          aiRes = await env.AI.run(AI_CONFIG.fallbackModel, {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `${username}: ${query}` },
            ],
            max_tokens: AI_CONFIG.maxTokens,
            temperature: AI_CONFIG.temperature,
          }).catch(() => null);
        }
      }

      if (aiRes) {
        if (typeof aiRes.response === 'string') generatedReply = aiRes.response;
        else if (Array.isArray(aiRes.choices) && aiRes.choices[0]?.message?.content) generatedReply = aiRes.choices[0].message.content;
      }
    }
  } catch (err) {
    console.warn('[AI Bot Service] Workers AI error:', err);
  }

  // Fallback generation if AI model is unreachable
  if (!generatedReply) {
    generatedReply = getContextualFallback(query, targetBot, username, currentSongTitle);
  }

  const cleanReply = sanitizeBotResponse(generatedReply, targetBot);

  // Update cooldown timestamp
  if (targetBot === 'Kira') {
    lastKiraMessageTime.set(roomId, now);
  } else {
    lastBenMessageTime.set(roomId, now);
  }

  // ── AI-to-AI Natural Banter Trigger ──
  // If Ben talks and says something flirty/boastful or mentions a girl/Kira, Kira can naturally react
  let secondaryReaction: BotDecision['secondaryReaction'] = undefined;
  const currentExchange = aiExchangeCount.get(roomId) || 0;

  if (currentExchange < 1) { // Maximum 1 AI-to-AI reaction per user conversation to prevent infinite loops
    if (targetBot === 'Ben') {
      const isFlirtyOrBoastful = /flirt|sundar|cute|pyaar|girl|bhabhi|hero|smart|ladki/i.test(cleanReply) || /flirt|cute|ladki|crush/i.test(textLower);
      if (isFlirtyOrBoastful || Math.random() < 0.4) {
        const kiraReactions = [
          'Ohooo Ben 😏 zyada friendly nahi ho rahe?',
          'Ben bhai, thoda control karo 😂',
          'Mujhe sab dikh raha hai Ben 👀',
          'Arey Ben, line marna band karo yahan gaana suno 😂',
          'Kyu Ben, aaj itne romantic mood mein kaise? 🤔',
        ];
        secondaryReaction = {
          botName: 'Kira',
          reply: kiraReactions[Math.floor(Math.random() * kiraReactions.length)],
          delayMs: 2600, // natural human-like delay
        };
        aiExchangeCount.set(roomId, currentExchange + 1);
        lastKiraMessageTime.set(roomId, now + 2600);
      }
    } else if (targetBot === 'Kira') {
      const mentionsBen = /ben/i.test(cleanReply) || /ben/i.test(textLower);
      if (mentionsBen || Math.random() < 0.3) {
        const benReactions = [
          'Arey Kira tum toh bina wajah jealous hoti rehti ho 😂',
          'Chill Kira, main toh bas sabka dost hu 😎',
          'Kira ki nazar hamesha mere pe hi rehti hai 👀😂',
          'Gaana banger chal raha hai, Kira tum suno bas 🔥',
        ];
        secondaryReaction = {
          botName: 'Ben',
          reply: benReactions[Math.floor(Math.random() * benReactions.length)],
          delayMs: 2800,
        };
        aiExchangeCount.set(roomId, currentExchange + 1);
        lastBenMessageTime.set(roomId, now + 2800);
      }
    }
  } else {
    // Reset exchange count when a new user message comes in
    aiExchangeCount.set(roomId, 0);
  }

  return {
    shouldRespond: true,
    botName: targetBot,
    reply: cleanReply,
    secondaryReaction,
  };
}

// Contextual Fallback Engine (Zero-Token Guaranteed Response)
function getContextualFallback(query: string, bot: 'Kira' | 'Ben', username: string, songTitle?: string): string {
  const q = query.toLowerCase();

  if (q.includes('joke') || q.includes('chutkula')) {
    if (bot === 'Kira') {
      return 'Teacher: Homework kyu nahi kiya? Student: Sir kal raat Hangloop pe live jamming chal rahi thi 😂';
    } else {
      return 'Ek ladka bolta hai: Bhai mujhe music sunke neend aati hai. Dusra bola: Toh phone band kar aur so ja na 😂';
    }
  }

  if (q.includes('song') || q.includes('gana') || q.includes('music')) {
    if (songTitle) {
      return bot === 'Kira'
        ? `Abhi "${songTitle}" chal raha hai, ekdum mast vibe hai na? 🔥`
        : `Ye "${songTitle}" to straight banger hai bhai! Full volume karo 🔊`;
    }
    return bot === 'Kira'
      ? 'Room ka gana ekdum fire hai, full mood ban raha hai! 🔥'
      : 'Vibe check pass ho gaya bhai, music enjoy karo! 😎';
  }

  if (q.includes('kaise ho') || q.includes('kese ho') || q.includes('how are you') || q.includes('kya haal')) {
    return bot === 'Kira'
      ? `Main ekdum mast hu ${username} 😄 tu bata stream kaisi lag rahi hai?`
      : `Ekdum badiya bhai! ${username}, tu bata kya scene chal raha hai? 😎`;
  }

  if (q.includes('flirt') || q.includes('love') || q.includes('pyaar') || q.includes('crush')) {
    return bot === 'Kira'
      ? 'Ye live stream hai bhai, shaadi.com nahi 😂 gaana suno chupchap!'
      : 'Arey bhai sab dost hain yahan, chill karo aur music enjoy karo 😎';
  }

  return bot === 'Kira'
    ? `Haan ${username} 😄 bolo, main yahi hu live chat mein!`
    : `Sahi baat hai ${username}! Full maje karo stream pe 🔥`;
}

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

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS kira_global_usage (
        usage_date TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0,
        last_called_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).run();
  } catch (e) {
    console.warn('ensureKiraTables warning:', e);
  }
}

// Backward compatibility exports for existing imports
export const isKiraCommand = isKiraTrigger;
export const extractKiraQuery = extractBotQuery;
export const sanitizeKiraResponse = (raw: string) => sanitizeBotResponse(raw, 'Kira');
export const processKiraMessage = async (params: any) => {
  const res = await processAIBots({
    roomId: 'default',
    userId: params.userId,
    username: params.username || 'User',
    rawText: params.rawText,
    recentChat: [],
    env: params.env
  });
  return {
    isKira: !!res,
    success: !!res,
    reply: res?.reply || '',
    reason: undefined as string | undefined,
  };
};
