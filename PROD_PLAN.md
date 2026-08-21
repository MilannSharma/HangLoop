# Production Tasks, Fixes & Features — Hangloop Live Music Platform

## 1. YouTube Playback Engine Fixes
- Fix YouTube IFrame Player API initialization in `YouTubePlayer.tsx`.
- Enable HTML5 parameters: `playsinline=1&autoplay=1&enablejsapi=1&origin=...`.
- Handle YouTube player state transitions:
  - `ENDED` (`state === 0`): Triggers `onEnded` callback to advance to next queued/theme song.
  - `ERROR` (`state === -1` or `onError`): Auto-skips broken, deleted, or age-restricted videos without getting room stuck.
- Ensure position seeking syncs automatically when joining or tapping **🔴 LIVE**.

---

## 2. Live Room Artwork Thumbnails
- Generate 5 distinct, high-quality 8K abstract neon/music artwork thumbnails using `generate_image`:
  1. `room-bollywood-hindi` (Bollywood Hindi Music Live)
  2. `room-hollywood-music` (Hollywood Music Live)
  3. `room-old-hindi` (Old Hindi Songs Live)
  4. `room-punjabi-hits` (Punjabi Hits Live)
  5. `room-lofi-chill` (Lo-Fi / Chill Music Live)
- Update D1 `rooms` database records with the new image asset URLs.

---

## 3. Real Gmail SMTP Email OTP Verification
- Configure Cloudflare Worker secrets:
  - `GMAIL_EMAIL`: `milansharma942105@gmail.com`
  - `GMAIL_APP_PASSWORD`: `edgzgqgartojdvfa`
- Implement `gmailMailer.ts` in Cloudflare Worker using `cloudflare:sockets` connecting to `smtp.gmail.com:465` (SSL).
- Generate cryptographically secure 6-digit OTPs.
- Store SHA-256 OTP hashes in D1 table `email_verifications` with 10-minute expiry, max 3 verification attempts, and 60s resend cooldown.
- Send real HTML email to user's registered Gmail address.

---

## 4. Multi-Step Registration & Policy Acceptance
- **Step 1**: Enter Full Name
- **Step 2**: Enter Unique Username (validated against D1 `users` table)
- **Step 3**: Enter Unique Email Address
- **Step 4**: Enter 6-digit OTP received in Gmail
- **Step 5**: Accept Legal Policies (Community Rules, Terms & Conditions, Privacy Policy)
- **Step 6**: Account Created with Immutable System `User ID` (e.g., `ULP8F2K9X7`).

---

## 5. User Identity & Privacy Rules
- **Chat**: Displays user's **Full Name / Display Name** (e.g. `Ashish`). Internal User IDs are hidden in chat.
- **Profile Screen**: Displays **Name**, **@username**, and immutable **User ID** (`ULP8F2K9X7`).

---

## 6. Login Persistence & Logout
- Persist session token securely in `AsyncStorage` / `localStorage`.
- App launch validates existing session via `GET /api/auth/session`.
- User stays logged in across app closes/restarts.
- Logout action clears session token and returns user to Login screen.

---

## 7. Zero Mock Data Policy Audit
- Purge all static demo arrays, placeholder accounts, fake viewer counts, and dummy API responses.
- All application data sourced 100% from live Cloudflare D1/R2/Worker APIs.
