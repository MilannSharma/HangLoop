# 🎵 Hangloop — Production Audit & Fix Plan
**Codebase actually inspected on:** backend/src (RoomDurableObject.ts, index.ts, adminAuth.ts, catalogService.ts, themeValidator.ts, gmailMailer.ts) + mobile/src (YouTubePlayer.tsx, RoomScreen.tsx, websocket.ts)

Yeh document sirf theory nahi hai — har finding actual code line dekhkar likha gaya hai. Priority order tumhare stated goal ke hisaab se hai: **(1) 24/7 non-stop YouTube-Music-jaisa continuous playback, (2) smooth chat, (3) baaki sab production hardening.**

---

## 🔴 PRIORITY #1 — "Song play karne mein issue" ka ASLI root cause mil gaya

Yeh do bugs milkar exactly wahi symptom create karte hain jo tum face kar rahe ho: gaane beech mein kat jaana, ajeeb time pe skip ho jaana, ya do gaane jaldi-jaldi badal jaana.

### Bug A — Har gaane ki duration galat hai (hardcoded `240` seconds)

Poora playback engine ek formula pe chalta hai:

```
DO ek alarm set karta hai = Date.now() + currentVideo.durationSeconds * 1000
```

Jab yeh alarm fire hota hai, server **force** se agla gaana chala deta hai — chahe client mein video abhi bhi chal raha ho. Poora system iss `durationSeconds` field ki accuracy pe depend karta hai.

Maine check kiya ki yeh duration kahan se aati hai — **kahin bhi actual YouTube video ki real duration fetch nahi ki ja rahi**:

- `backend/src/themeValidator.ts` → `validateVideoPlayable()` sirf oEmbed (jo duration deta hi nahi) aur YouTube API ko `part=snippet,status` ke saath call karta hai — `contentDetails` (jisme asli duration hoti hai, e.g. `PT4M28S`) kabhi request hi nahi hoti.
- `backend/src/catalogService.ts` line 243 → `const duration = Number(songData.duration_seconds) || 240;` — agar duration nahi di gayi, seedha 240 (4 min) hardcode.
- Saare seed/population scripts (`populate_100_bollywood.js`, `populate_bollywood_catalog.js`, `search_and_populate_100.js`) → literally SQL query mein `240` hardcoded hai har gaane ke liye, chahe woh gaana 2:30 ka ho ya 7:53 ka (jaise "Kun Faya Kun").

**Matlab:** agar real gaana 5 minute ka hai aur system 4 minute maan raha hai → server 1 minute pehle hi agla gaana force kar dega, sabke liye beech mein kat jayega. Agar real gaana 3 minute ka hai aur system 4 minute maanta hai → gaana khatam ho chuka (client TRACK_ENDED bhej chuka), lekin purani alarm abhi bhi 1 minute baad fire hogi (dekho Bug B), jisse extra skip ho jayega.

**Fix:**
1. YouTube API call mein `part=snippet,contentDetails,status` use karo (abhi sirf `snippet,status` hai).
2. `contentDetails.duration` (ISO 8601, e.g. `PT4M28S`) ko seconds mein parse karke DB mein save karo — kabhi bhi `|| 240` fallback pe permanently mat chhodo.
3. Ek one-time backfill script chalao jo saare 600 existing catalog songs ki asli duration YouTube API se fetch karke update kare.
4. Agar YouTube API key na ho (quota khatam), toh `240` fallback ke bajaye us gaane ko catalog rotation se **temporarily exclude** karo jab tak real duration na mil jaaye — galat duration se better hai gaana skip karna.

### Bug B — DO ka "Alarm" purane duration pe hi set raha jata hai, cancel nahi hota

Yeh is se bhi zyada serious hai. Room ke andar 3 alag mechanism gaana advance kar sakte hain:
1. `alarm()` — server ka apna internal timer (scheduled `durationSeconds` ke baad)
2. `TRACK_ENDED` — jab client ka YouTube player khud khatam hota hai
3. `HEARTBEAT` watchdog — har 10 sec check karta hai ki seek duration se zyada toh nahi ho gaya

Maine `RoomDurableObject.ts` mein confirm kiya: jab `TRACK_ENDED` ya `TRACK_FAILED` case gaana advance karta hai, **yeh purani scheduled alarm ko kabhi cancel/reschedule nahi karta**. Sirf `alarm()` function khud, aur `syncTimeline()` (jo sirf naye WebSocket connection pe chalta hai) hi naya alarm set karte hain.

Toh scenario yeh banta hai:
```
T+0:00  Song A start hota hai, duration=240 maan ke alarm set hoti hai T+4:00 pe
T+3:10  Song A (real duration 190s) client pe khatam ho jata hai
        → client TRACK_ENDED bhejta hai → server Song B start kar deta hai
        → LEKIN T+4:00 wali purani alarm abhi bhi pending hai!
T+4:00  Purani alarm fire hoti hai → alarm() blindly advanceQueue() call karta hai
        → Song B (jo abhi-abhi shuru hua tha) turant kaat ke Song C force ho jata hai
```

Isse gaane bilkul random, unpredictable point pe skip hote hain — bilkul wahi behavior jo tum experience kar rahe ho.

**Fix (code-level):**
```typescript
// RoomDurableObject.ts mein ek naya field add karo:
private currentAlarmVideoId: string = '';

// har jagah jahan advanceQueue() call hoti hai (TRACK_ENDED, TRACK_FAILED, PLAYER_ACTION.SKIP,
// alarm() ke andar bhi) — advanceQueue() ke turant baad naye track ke liye alarm RESCHEDULE karo:
private async rescheduleAlarm() {
  const durationMs = (this.playbackState.currentVideo?.durationSeconds || 240) * 1000;
  this.currentAlarmVideoId = this.playbackState.currentVideo?.videoId || '';
  await this.state.storage.setAlarm(Date.now() + durationMs);
}

// alarm() ke andar sabse pehle check karo ki yeh alarm still valid hai ya stale ho chuki:
async alarm() {
  // Agar current video already change ho chuka hai kisi aur trigger se, yeh stale alarm hai — skip
  if (this.currentAlarmVideoId && this.currentAlarmVideoId !== this.playbackState.currentVideo?.videoId) {
    console.log('[Alarm] Stale alarm detected, skipping duplicate advance.');
    return; // reschedule nahi karni, kyunki jisne advance kiya usne already reschedule kar diya hoga
  }
  await this.advanceQueue();
  this.broadcast({ type: 'PLAYBACK_SYNC', playbackState: this.getNormalizedPlaybackState() });
  await this.rescheduleAlarm();
}
```
Aur `TRACK_ENDED`, `TRACK_FAILED`, `PLAYER_ACTION` (SKIP case) — teeno jagah `advanceQueue()` ke turant baad `await this.rescheduleAlarm();` call karna zaroori hai.

**Yeh 2 fixes (duration accuracy + alarm versioning) karne se 24/7 continuous playback bilkul YouTube-Music-radio jaisa smooth ho jayega — yeh sabse pehle karna hai, baaki sab uske baad.**

---

## 🟠 PRIORITY #2 — Chat "easily, koi dikkat na ho" ke liye

### Bug C — Koi bhi user khud ko Moderator/Super Admin bana sakta hai (client-trusted flag)

`mobile/src/services/websocket.ts` mein WebSocket connect karte waqt client apna khud ka moderator status URL query string mein bhejta hai:
```
...&isModerator=${this.user.is_moderator ? 'true' : 'false'}&isSuperAdmin=...
```

Aur server side (`RoomDurableObject.ts` → `handleWebSocket`) mein:
```typescript
const isModeratorParam = url.searchParams.get('isModerator') === 'true';
let isModerator = isModeratorParam;   // ⚠️ client ki value directly trust ho rahi hai
```
Yeh sirf DB check hone par `true` ki taraf upgrade hoti hai, lekin agar DB check fail ho ya user na mile, **client ki bheji hui value hi reh jaati hai** — kabhi `false` pe reset nahi hoti.

**Matlab:** koi bhi user (ya koi bhi jo directly WebSocket URL bana le) `isModerator=true&isSuperAdmin=true` bhej ke us room mein turant sabko kick, timeout, chat delete, aur naye moderators assign kar sakta hai — bina kisi login/permission ke. Agar yeh room mein exploit hota hai, chat turant chaos ho jayega (mass kicks/timeouts) — exactly "chat mein dikkat" wali situation.

**Fix:** `isModerator`/`isSuperAdmin` ko query param se kabhi initialize mat karo. Default hamesha `false` rakho, aur sirf tab `true` karo jab D1 se confirm ho:
```typescript
let isModerator = false;
let isSuperAdmin = false;
// ... DB check ke baad hi true set karna, jaisa already ho raha hai upgrade ke liye
```
Client is field ko WS URL mein bheje bhi na — server khud userId se DB lookup karke decide kare.

### Bug D — Chat par koi rate-limit / spam-guard nahi hai

`CHAT_SEND` case mein sirf character-limit (300) aur active-timeout check hai. Koi per-user rate limit nahi — ek user 1 second mein 50 messages bhej sakta hai, jisse:
- Room ka WebSocket broadcast queue flood ho jata hai (sabke liye lag)
- D1 mein `chat_messages` insert bhi flood hota hai

**Fix:** DO ke andar ek simple in-memory `Map<userId, lastMessageTimestamps[]>` rakho, aur `1 message / 1.5 second` jaisi limit lagao. Zyada bhejne par silently drop ya "Slow down" error bhejo.

### Bug E — Chat history limit inconsistent

Alag-alag jagah alag numbers hain: `chatLogs` array max **50** rakhta hai (`if (this.chatLogs.length > 50) this.chatLogs.shift()`), lekin naye user ko join pe sirf **30** messages bheje jaate hain (`this.chatLogs.slice(-30)`), jabki `PROD_PLAN.md` mein requirement **20** likhi hai. Functionally bug nahi hai, lekin design intent clear nahi — decide karo ek consistent number (20 ya 30) aur sab jagah same use karo.

---

## 🟡 Security Bugs (backend) — recap, Gmail wala part chhod ke

Yeh pehle discuss ho chuke the, yahan reference ke liye summary:

1. **Admin auth bypass** (`backend/src/adminAuth.ts`) — "self-healing fallback" kisi bhi random Bearer token ko automatically Super Admin bana deta tha. *(Agar already fix kar diya hai, toh confirm kar lena ki poora self-healing block hata diya gaya — sirf ek real login se hi admin session banni chahiye.)*
2. **Session token predictable** — `'token-' + userId + '-' + Date.now()` guessable format hai. `crypto.randomUUID()` use karo.
3. Do points upar (Bug C) bhi isi security category mein aata hai — client-trusted moderator flag.

---

## 🔵 Database / Catalog Layer

| Issue | Detail |
|---|---|
| **Duration hardcoded 240s** | Upar Bug A mein detail — yeh sabse critical hai |
| **Theme matching weak** | `themeValidator.ts` ka `validateVideoTheme()` sirf keyword string-match karta hai title/description/tags mein. False positives/negatives dono possible — e.g. koi cover video jisme "Arijit" mention ho woh BOLLYWOOD theme match kar jayega chahe woh actually kisi aur genre ka ho |
| **No re-verification pipeline** | Ek baar `PLAYABLE` mark hone ke baad, koi scheduled job nahi hai jo periodically dobara check kare ki video abhi bhi available/embeddable hai. Agar YouTube pe video delete/private ho jaye, catalog ko kabhi pata nahi chalega jab tak koi user use na kare aur `TRACK_FAILED` trigger na ho |
| **Missing indexes** | `schema.sql` mein `room_queue`, `room_presence`, `chat_messages(room_id, created_at)` par koi explicit index nahi hai (sirf `music_catalog` aur `song_requests` par hai). Rooms busy hone par yeh queries slow ho sakti hain |
| **Schema duplication** | `backend/schema.sql` aur `backend/src/index.ts` ke `ensureAllTables()` — dono jagah tables define ho rahi hain (kabhi drift ho sakta hai agar ek update ho aur dusri na ho) |

---

## 🟣 Race Conditions / Concurrency

Playback ke alawa bhi kuch jagah concurrent triggers clash kar sakte hain:
- `HEARTBEAT` watchdog aur `TRACK_ENDED`/alarm same waqt fire ho sakte hain — abhi guard sirf `lastAdvancedVideoId` string-compare se hai jo mostly kaam karta hai lekin bulletproof nahi (upar wali alarm-versioning fix isko bhi solid kar degi).
- `ADD_QUEUE` mein duplicate submission guard nahi hai — same user 2 baar tap kare toh same gaana 2 baar queue mein add ho sakta hai.

---

## ✅ Action Plan — Ab Exactly Kya Order Mein Karna Hai

### Phase 1 — Playback Engine Fix (SABSE PEHLE, kyunki yeh core complaint hai)
1. YouTube API call mein `contentDetails` add karo, real duration parse karo.
2. Existing 600 catalog songs ka one-time duration backfill script chalao.
3. `RoomDurableObject.ts` mein alarm-versioning fix karo (Bug B ka code upar diya hai).
4. Local/staging mein 2-3 rooms banake kam se kam 30-40 minute continuous chalne do, dekho koi mid-song cut ya double-skip toh nahi ho raha.

### Phase 2 — Chat Hardening
1. `isModerator`/`isSuperAdmin` client se accept karna band karo (Bug C fix).
2. Per-user chat rate-limit lagao (Bug D fix).
3. Chat history limit ek consistent number pe finalize karo.

### Phase 3 — Security (agar abhi tak nahi kiya)
1. Admin auth self-healing bypass confirm-fix.
2. Session token ko `crypto.randomUUID()` se replace karo.

### Phase 4 — Database Cleanup
1. Missing indexes add karo (`room_queue(room_id, status, position)`, `chat_messages(room_id, created_at)`, `room_presence(room_id)`).
2. `schema.sql` aur `ensureAllTables()` ko ek hi source of truth bana do (ya toh migrations se manage karo, ya dono sync rakho).

### Phase 5 — Baaki Production Checklist (pehle diya gaya, abhi bhi valid)
1. Admin routes (`/api/admin/*`) properly locked hain — confirm.
2. Rate limiting on `ADD_QUEUE`/`CHAT_SEND` — WebSocket abuse guard.
3. Error monitoring (`wrangler tail` se aage — Sentry/Logpush).
4. **YouTube ToS risk** — 24/7 continuous server-side streaming heavy YouTube embedding hai; official partner agreement ke bina long-term risk hai, business decision ke taur pe soch lena.
5. D1 backup strategy (`wrangler d1 export` scheduled).
6. Mobile app build (Expo EAS) + Privacy Policy/Terms (chat + live streaming ke liye zaroori) + store submission.

### Phase 6 — Load Testing (production claim karne se pehle)
Chhote se shuru karo — 10 users ek room mein, phir 100, dekho WebSocket/DO/D1 latency kaisi rehti hai. "10k users ready" tabhi bolna jab actually test kiya ho, sirf architecture ki wajah se assume mat karna.

---

## Summary — Sabse zaroori 2 lines

> **Song skip/cut hone ka asli reason:** har gaane ki duration hardcoded `240` seconds hai (real duration kahin fetch hi nahi ho rahi), aur DO ka alarm client-driven advance ke baad cancel/reschedule nahi hota — dono milke random skips create karte hain.

> **Chat mein dikkat aane ka asli reason (security angle se):** moderator/admin status client khud WebSocket URL mein bhejta hai aur server usi pe trust karta hai — koi bhi khud ko moderator bana ke chat disrupt kar sakta hai.

Yeh dono fix karne ke baad hi baaki production-readiness (monitoring, load testing, app store) pe jaana sahi order hoga.
