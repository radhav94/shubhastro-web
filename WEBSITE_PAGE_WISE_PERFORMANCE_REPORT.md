# ShubhTalk — Website Performance Audit (Page-Wise)

**Product:** ShubhTalk (shubhastro.ai) — astrology consultation platform
**Stack:** React 19.1.1 · Vite 7.1.7 · Redux Toolkit + RTK Query · React Router v7 · SCSS Modules + Tailwind
**Audit date:** 2 Sep 2026
**Branch audited:** `new-clarity-changes` (dev build, `npm run build-dev`)
**Author:** Frontend Performance audit

---

## 0. How to read this document

This report is split so each audience can jump to what they need:

- **Section 1 — Executive summary (PM / CTO / Management):** what's slow, why, business impact, and the fix order in plain language.
- **Section 2 — Measured evidence (all):** hard numbers from the production build. No estimates.
- **Section 3 — Root-cause analysis (Frontend):** exactly which code and config causes the cost, with file paths and line-level reasoning.
- **Section 4 — Frontend vs Backend split (Backend / Frontend):** what is a frontend problem and what is API/gateway latency. We do **not** blame the frontend for backend time.
- **Section 5 — Prioritized fix plan (Frontend):** P0→P3, each with risk, effort, expected win, and verification steps.
- **Section 6 — Field metrics (to be collected):** the per-page Core Web Vitals table. **These cells must be filled from a browser tool (Lighthouse / PageSpeed / RUM). They are intentionally left blank — this audit runs in a build environment with no browser and will not fabricate field numbers.**

A note on discipline used throughout: every claim here is backed either by a build artifact (`dist/`), the bundle sourcemap, or a source file. Where a number can only come from a real browser session, it is marked **[TOOL-COLLECTED]** and left for you to fill.

---

## 1. Executive summary

### The one-line version

Every page on the site waits for one big JavaScript file and one big CSS file to download, parse, and run **before anything route-specific can paint**. That shared file is bigger than it needs to be because build config only splits three libraries out of it, and because a few always-on features (real-time chat socket, push-notification setup) are wired so they load on page one even when the visitor never uses them.

### What the visitor feels

- **First load is heavy.** ~510 KB of gzipped JavaScript plus ~62 KB of gzipped CSS must arrive and execute before the first route renders. On a mid-range Android phone over mobile data — which the Clarity sessions show is the dominant audience (Instagram / Facebook in-app browsers) — that is the main "site feels slow to open" cost.
- **Layout jumps around (CLS).** Fonts swap in after first paint and some below-the-fold sections don't reserve their height, so content shifts. The user's own field data shows catastrophic CLS (3–4) on astrologer routes.
- **Taps feel laggy (INP).** Field data shows INP around 968 ms on astrologer routes — nearly 1 second between a tap and the screen responding. This is an interactivity problem, separate from load size, and must be profiled before fixing.

### Why (root cause, plain language)

1. ~~**The build only splits 3 libraries** (React, Redux, Router) into their own cacheable files. Everything else in `node_modules` collapses into one 898 KB entry file that blocks every page.~~ — **This was measured and is NOT the problem.** Splitting them out was implemented and made first load 2.7% *worse* (see P0-1). The 898 KB file is a symptom; the disease is how much code is statically reachable from the entry. Chunking relocates bytes, it does not remove them.
2. **A real-time chat socket library loads on page one for everyone**, because a global hook (`useAstrologerStatusSocket`) imported at the top of `App.jsx` pulls in the whole `socket.io-client` + `engine.io-client` stack. Most first-time visitors from an ad never open a chat before this cost is paid. — *code, medium-risk fix*
3. ~~**Push-notification / Firebase messaging code is reachable from the entry path**… the module still bundles into the entry chunk.~~ — **Fixed, −14.9 KB gz off the critical path (−3.6%). See P0-3.** The stated cause was wrong: the `App.jsx` import accounted for only 477 B of it. Firebase was in the entry chunk because the statically-imported **landing page** (`HomeV2`) renders `GuestKundliAuthModal`, which imported `services/firebase` at top level — and that module runs `initializeApp()`/`getMessaging()` at module scope, so it *executed* during first paint too.
4. **Fonts swap after paint** and some async sections don't reserve space → layout shift (CLS). — *low-risk fix*

**The transferable lesson:** find what makes code *reachable* from the entry graph, and cut that edge. Do not reach for `manualChunks`. Both remaining wins (P0-2 socket, and anything else eagerly reachable from `HomeV2`/`Paths.js`) are of the first kind.

### The fix order (business framing)

| Priority | Fix | Effort | Risk | Expected win |
|---|---|---|---|---|
| **P0** | Widen build config to split heavy libraries out of the shared entry file | Low (config only) | Low | Smaller, better-cached first load on **every** page; repeat visits especially |
| **P0** | Stop loading the chat socket + push stack on page one for visitors who aren't chatting | Medium | Medium | Cuts entry JS parse/exec on the highest-traffic entry pages |
| **P1** | Kill font-swap layout shift (reserve font metrics) | Low | Low | Fixes the catastrophic CLS on astrologer routes |
| **P1** | Reserve height for below-the-fold async sections | Low–Med | Low | Further CLS reduction |
| **P2** | Profile and fix INP (~968 ms) — measure before touching code | Med | Med | Faster tap response on astrologer routes |
| **P3** | Trim per-route CSS | Med | Low | Marginal, do last |

**Nothing here removes Clarity, analytics, tracking pixels, or any API.** All those stay exactly as they are.

---

## 2. Measured evidence (from the production build)

All figures below are from the actual `dist/` output of `npm run build-dev` on 2 Sep 2026. Gzip sizes are what the browser actually downloads.

### 2.1 The entry path (loads on *every* page, before first route paint)

| Asset | Raw | Gzip | Blocking? |
|---|---:|---:|---|
| `index-*.js` (entry chunk) | 898 KB | **294 KB** | Yes — blocks all routes |
| `index-*.css` (entry CSS) | 328 KB | **62 KB** | Yes — render-blocking |
| `react-vendor-*.js` | 186 KB | 59 KB | Yes |
| `redux-vendor-*.js` | 87 KB | 30 KB | Yes |
| `router-vendor-*.js` | 79 KB | 27 KB | Yes |
| `proxy-*.js` (RTK Query) | 114 KB | 37 KB | Yes |
| **Entry-path total** | **~1.69 MB** | **~509 KB JS + 62 KB CSS** | **Before first route paints** |

### 2.2 Largest route chunks (correctly lazy-loaded — NOT in the entry path)

These are big but **only load when their route is visited**. This part of the code-splitting is working well and should not be touched.

| Chunk | Raw | Loads on |
|---|---:|---|
| `VideoCallChat` | 1.39 MB | Video call screen only |
| `InteractiveLiveStreaming` | 1.26 MB | Live streaming only |
| `useFaceDetection` | 643 KB | Face-reading AI feature only |
| `OrderDetails` | 559 KB | Order detail screen only |
| `ProductList` | 239 KB | Shop listing only |
| `LazyCalendar` | 185 KB | Calendar feature only |

### 2.3 Bundle shape

- **298** JS chunks, **174** CSS files (route-level splitting is granular — good).
- **176** lazily-loaded screens across **227** route path entries in `src/utils/routes/Paths.js`.
- Verdict: **route-level lazy loading is already correct.** The problem is not "not enough splitting" — it's that the *shared entry chunk* is bloated. See 3.1.

### 2.4 What's actually inside the 898 KB entry chunk (from sourcemap)

Reading `dist/assets/index-*.js.map` `sources`, the entry chunk contains **31 node_modules packages** it should not need on page one. Top contributors by number of modules pulled in:

| Package | Modules in entry | Notes |
|---|---:|---|
| `lodash-es` | 119 | Transitive (not imported directly in `src/`) — dragged in by other deps |
| `axios` | 50 | HTTP client — used app-wide, reasonable to share but should be its own chunk |
| `lucide-react` | 24 | Icon set |
| `engine.io-client` | 12 | **Socket transport — should not be on page one** |
| `socket.io-client` | 6 | **Real-time chat — should not be on page one** |
| `react-icons` | 5 | Icon set |
| `engine.io-parser` / `socket.io-parser` | 8 | Socket stack |
| `@firebase/messaging` + `@firebase/*` | ~10 | **Push notifications — should not be on page one** |
| `formik`, `yup`, `property-expr`, `tiny-case`, `toposort` | 5 | Form validation — only forms need it |
| `react-hot-toast`, `goober` | 2 | Toasts |
| `dayjs` | 1 | Date lib |

The socket stack (`socket.io-client` + `engine.io-client` + parsers + component-emitter) and the Firebase messaging stack together are the clearest "does not belong in the first-paint path" offenders. Root cause traced in 3.2.

---

## 3. Root-cause analysis (Frontend)

### 3.1 The build only splits three libraries — everything else collapses into the entry chunk

**File:** `vite.config.js`, `build.rollupOptions.output.manualChunks`

Current logic only creates separate chunks for:

- `react` / `react-dom` / `scheduler` → `react-vendor`
- `@reduxjs` / `redux` / `react-redux` → `redux-vendor`
- `react-router` → `router-vendor`

Every other `node_modules` import with no `manualChunks` rule and no lazy boundary above it falls into the default entry chunk. That is why `axios`, `lodash-es`, `formik`, `yup`, `dayjs`, `react-hot-toast`, icon sets, and the socket/firebase stacks all land in `index-*.js` (confirmed in 2.4).

**Consequence:** a change to any one of those libraries busts the hash of the entire 294 KB-gzip entry file, so returning visitors re-download all of it. Splitting stable vendors into their own chunks means they cache independently across deploys.

**Note on `target`:** the existing `build.target` floor (`es2019 / chrome79 / edge79 / firefox71 / safari13`) is deliberate and heavily documented in the config — it exists to avoid a parse-time blank-page cliff from `??` / logical assignment. **Do not raise it.** Chunk splitting is orthogonal to `target` and safe alongside it.

### 3.2 The chat socket loads on page one for everyone — confirmed import chain

**Confirmed chain (top-level, eager):**

```
src/App.jsx
  └─ import useAstrologerStatusSocket from "./hooks/useAstrologerStatusSocket"   (top-level)
       └─ src/hooks/useAstrologerStatusSocket.js
            └─ import { voiceSocket } from "../services/voiceSocketServices"      (top-level)
                 └─ src/services/voiceSocketServices.js
                      └─ import { io } from "socket.io-client"                     (top-level)
```

`App.jsx` calls `useAstrologerStatusSocket()` in the component body, and that hook statically imports `voiceSocketServices`, which statically imports `socket.io-client`. Because these are all static top-level imports with no lazy boundary, the whole `socket.io-client` + `engine.io-client` + parsers stack is welded into the entry chunk (matches the sourcemap evidence in 2.4).

**Why this matters for the traffic we have:** the Clarity sessions show the dominant audience arrives from Instagram/Facebook ads into listing and AI-feature pages. A large share of first-time visitors never open a live chat in that session — yet every one of them pays the socket stack's download + parse cost at first paint.

**This is a real-time feature that must keep working.** The fix is *not* to remove it — it's to load the socket module at the point of use (or behind an idle/interaction boundary) rather than at the top of `App.jsx`. The global "astrologer online/offline status" this hook powers can be deferred to idle without breaking chat/call.

### 3.3 Firebase messaging bundles into the entry path — **RESOLVED, and the original diagnosis here was wrong**

This section originally blamed `src/App.jsx` → `import { initializeFCM } from "./services/fcmService.jsx"`. That import was real, and the runtime call was already correctly gated and deferred (good prior work — opted-in/signed-in only, on `requestIdleCallback`). But it was **not** what held Firebase in the entry chunk. Converting it to a dynamic `import()` was measured on its own: it saved **477 bytes gzip** and left all 9 `@firebase/*` modules in the entry sourcemap.

The actual edge was the landing page. `Paths.js` deliberately keeps `HomeV2` statically imported (documented: splitting the landing screen adds a serial request before the homepage can paint, which works against LCP). `HomeV2` renders `<GuestKundliAuthModal>`, and that modal imported `requestFCMToken` from `services/firebase` at top level. `services/firebase.js` then runs `initializeApp(firebaseConfig)` and `getMessaging(app)` at **module scope** — so the landing page was not just downloading Firebase, it was executing its initialisation during first paint.

Fixed via a lazy façade (`src/services/fcmToken.js`) adopted by all five direct importers. Result: 0 `@firebase/*` modules in the entry chunk, **−14,915 B gzip (−3.6%)** off the entry path. Full detail and verification in **P0-3**.

**Method note worth keeping:** the sourcemap `sources` audit told us the package was in the entry chunk, but not *why*. Answering "why" needed a reverse walk — enumerate the entry chunk's own `src/` modules from the sourcemap, then grep those for the import. That is what surfaced `HomeV2`. Section 2.4's package list should be read as a symptom list, not a cause list.

### 3.4 CLS: font swap + unreserved async sections

- **Fonts:** `index.html` loads Poppins/Montserrat/Open Sans via Google Fonts with a `media="print"`→`all` swap (non-blocking — good for load), but the swap repaints text in a different metric after first paint → layout shift. A metric-adjusted `@font-face` fallback (`size-adjust` / `ascent-override`) for the primary font (Poppins) closes the gap.
- **Async sections:** below-the-fold sections that mount after data arrives without a reserved min-height push content down when they appear. The route fallback height is already handled in `HomeLayout` (documented `.routeFallback`), but individual data-driven sections on astrologer routes still need height reservation. This aligns with the field CLS of 3–4 on those routes.

### 3.5 INP (~968 ms on astrologer routes) — must be measured, not guessed

INP is *interaction* latency, not load size. It's caused by long tasks on the main thread during/after interaction (large synchronous renders, unmemoized list re-renders, heavy event handlers). **We will not add `React.memo` blindly.** The correct step is to profile with the browser Performance panel / React Profiler on the actual astrologer route, find the long task, and fix that specific handler or render. Marked **[TOOL-COLLECTED]** below.

---

## 4. Frontend vs Backend split — don't blame the wrong layer

The site talks to several APIs. Crucially, the internal API (`privateRequestNew`) goes through an **encrypted secure-gateway** with a handshake. That handshake and the API's own response time are **backend/network latency, not frontend rendering cost.**

| Symptom | Layer | Evidence / how to confirm |
|---|---|---|
| Big first-load JS/CSS before paint | **Frontend** | `dist/` sizes (Section 2) — deterministic |
| Layout shift (CLS) | **Frontend** | Font swap + unreserved sections (3.4) |
| Slow tap response (INP) | **Frontend** | Main-thread long tasks — profile (3.5) |
| "Astrologer list / profile takes time to appear" | **Mixed** | Frontend caching already improved (RTK Query `refetchOnMountOrArgChange` tuned on listing + profile); remaining wait is the **request itself** — measure the API/gateway response time in the Network panel before attributing to frontend |
| "TOP ASTROLOGERS sidebar slow" | **Frontend (fixed) + Backend** | `useIsDesktop` render-order fix + sidebar query caching already applied; residual is API time |

**Action for backend team:** capture server-timing / gateway handshake duration for `privateRequestNew` calls on `/astrologers` and `/astrologer/:slug/:id`. If TTFB for those API calls is high, that is where the "list takes time to appear" comes from — and no amount of frontend chunk-splitting fixes it.

---

## 5. Prioritized fix plan (Frontend)

Each item: what, why, risk, effort, expected win, and how to verify. Verify **every** change with `get_diagnostics` + `npm run build-dev` and compare `dist/` sizes before/after.

### P0-1 — Widen `manualChunks` to split heavy vendors out of the entry chunk — **TRIED AND REJECTED (measured)**

**Status: implemented, measured, reverted. Do not re-attempt without new evidence.**

The change was made (rules added for `axios`, `lodash-es`, `dayjs`, form stack, icon sets, `react-hot-toast`/`goober`, socket stack, firebase stack), built, and measured against the same build. It made first load **worse**, so it was reverted.

Measured, both from `npm run build-dev`, summing every JS file referenced by `dist/index.html`:

| Metric | Before | After split | Delta |
|---|---|---|---|
| **Entry-path JS (gzip)** | **409,330 B** | **420,491 B** | **+11,161 B (+2.7%) — worse** |
| Largest single entry chunk (gzip) | 294,215 B | 202,496 B | −91,719 B |
| Whole-app JS, all 280+ chunks (gzip) | 2,397,623 B | 2,403,650 B | +6,027 B (+0.25%, noise) |
| Chunk count | 298 | 284 | −14 |

Why it backfires: splitting a **statically reachable** dependency does not remove it from first load — the browser still fetches every chunk the entry imports. It only relocates bytes, and relocation has a price. gzip compresses each file independently, so code extracted from a 900 KB chunk into an 85 KB one loses the large shared dictionary and compresses ~11% worse. That 11% is charged directly to the critical path.

Two follow-ups were tested and did not rescue it:
- Grouping the small libs into one `utils-vendor` chunk instead of four separate ones recovered only ~1 KB gz. So the cost is the gzip window, not file count.
- Whole-app total was flat, so there was no hidden dedup win from lazy routes that previously fetched auto-created shared chunks.

What the split does buy is real but does not justify a certain first-load regression here:
- **Cache stability across deploys** — worth little at this deploy cadence (production sat unchanged from 2026-07-30 for over a month), and it only ever helps repeat visitors.
- **Smaller individual parse tasks** — plausibly better TBT, since the longest script drops 900 KB → 632 KB. **Not verifiable from this environment** (no browser/trace available), and total main-thread work is unchanged or marginally higher. Not asserted as a win.

**The conclusion that matters:** chunking cannot fix this. The entry chunk is large because too much is *statically reachable* from it. The only changes that reduce first-load bytes are ones that make code unreachable from the entry graph — P0-2 and P0-3 below. Prefer those.

### P0-2 — Take the chat socket off the first-paint path
- **What:** Defer `useAstrologerStatusSocket`'s socket usage so `socket.io-client` isn't statically imported from `App.jsx`. Options: (a) dynamic-`import()` `voiceSocketServices` inside the hook's effect behind `requestIdleCallback`; (b) move the global status socket into a lazy boundary. Keep the real-time status feature functionally identical.
- **Why:** 3.2 — removes the socket/engine.io stack from the entry chunk that every ad-visitor downloads.
- **Risk:** Medium (touches shared real-time service — must verify chat/call still connect).
- **Effort:** Medium.
- **Expected win:** Removes ~socket stack from entry parse/exec.
- **Verify:** sourcemap audit shows `socket.io-client`/`engine.io-client` gone from entry; manually confirm chat connect, call connect, and astrologer online/offline status still work.

### P0-3 — Take Firebase off the first-paint path — **DONE (measured)**

Originally filed as "P1-firebase" and scoped only to `App.jsx`. Promoted to P0 once measurement showed `App.jsx` was **not** the reason Firebase was in the entry chunk, and completed.

**Measured result** (entry-path JS = every `.js` referenced by `dist/index.html`, gzip):

| Metric | Before | After | Delta |
|---|---|---|---|
| **Entry-path JS (gzip)** | **409,330 B** | **394,415 B** | **−14,915 B (−3.6%)** |
| Entry chunk (raw) | 900,276 B | 852,869 B | −47,407 B |
| Entry chunk (gzip) | 294,215 B | 279,300 B | −14,915 B |
| `@firebase/*` modules in entry sourcemap | 9 | **0** | — |

Unlike P0-1, these bytes leave the critical path entirely rather than moving. Firebase now sits in an async `firebase-*.js` chunk (~14.5 KB gz) that is fetched only when a token is actually requested. It is not `modulepreload`ed.

**Two changes, at two different seams:**

1. `App.jsx` — `import { initializeFCM } from "./services/fcmService.jsx"` became a dynamic `import()` inside the existing idle-deferred `start()`, sharing its `.catch`. This was the change originally planned. On its own it saved only **477 B** — see below.

2. `src/services/fcmToken.js` (new) — a lazy façade for `requestFCMToken`, adopted by the five modules that were importing `services/firebase` directly: `GuestKundliAuthModal.jsx`, `useGuestChatAuth.js`, `OtpVerification.jsx`, `useTruecallerLogin.js`, `OTPScreen.jsx`. **This is what actually did the work.**

**Root cause, corrected.** Section 3.3 attributed Firebase's presence in the entry chunk to the `App.jsx` import. That was wrong, and the 477 B result proved it. The real path was the landing page:

```
src/utils/routes/Paths.js  — HomeV2 is deliberately statically imported (documented policy)
  └─ src/screens/v2/home-v2/HomeV2.jsx
       └─ import { GuestKundliAuthModal } from "../../../component/UI/Profile"
            └─ src/component/UI/Profile/GuestKundliAuthModal.jsx
                 └─ import { requestFCMToken } from "../../../services/firebase"   (top-level)
                      └─ firebase/app + firebase/messaging
```

HomeV2 genuinely renders `<GuestKundliAuthModal>`, so this is not a barrel-file tree-shaking artefact — the landing page really does reach Firebase. `services/firebase.js` also runs `initializeApp()` and `getMessaging()` at **module scope**, so this was executing during first paint, not merely downloading.

**Correctness bonus:** the `isInAppBrowser()` guard in `App.jsx` now actually holds. It previously stopped `initializeFCM()` but could not stop module-scope `initializeApp`/`getMessaging`, which ran for every visitor purely because the landing page imported the module. Meta's in-app webview does not support web push, so that work could never pay off there.

**Contract preserved.** The façade is async, takes no arguments, resolves to a token string or `null`, and never rejects — identical to the eager export. That is load-bearing: callers do `const fcmTokens = await requestFCMToken();` inline in the login-success path, mostly without a `try/catch`. A failed chunk fetch degrades to "no token", exactly like a denied permission, instead of aborting a login that already succeeded.

**No meaningful added latency on the login path.** The façade adds one chunk fetch before the register-device call, but `requestFCMToken` already awaits `Notification.requestPermission()` — a native dialog that blocks on the user. The fetch is immaterial next to that.

- **Verified:** `npm run build-dev` clean; sourcemap audit confirms 0 `@firebase/*` modules in the entry chunk; `get_diagnostics` clean on all 7 touched files; ESLint clean (the two `no-unused-vars` errors in `App.jsx`/`OTPScreen.jsx` were confirmed pre-existing by linting `git show HEAD:` copies); `dist/firebase-messaging-sw.js` still has its env placeholders substituted.
- **Still needs a human:** confirm push notifications still register for an opted-in/signed-in user, and that OTP + Truecaller + guest-chat logins still complete.

### P1-1 — Kill font-swap CLS
- **What:** Add a metric-adjusted `@font-face` local fallback for Poppins (`size-adjust`, `ascent-override`, `descent-override`) so the fallback and web font occupy the same space.
- **Why:** 3.4 — primary CLS driver on astrologer routes (field CLS 3–4).
- **Risk:** Low.
- **Effort:** Low.
- **Verify:** **[TOOL-COLLECTED]** re-measure CLS in Lighthouse on `/astrologer/:slug/:id` before/after.

### P1-2 — Reserve height for below-the-fold async sections
- **What:** Give data-driven sections on astrologer routes a `min-height` matching their loaded size / skeleton.
- **Why:** 3.4.
- **Risk:** Low.
- **Effort:** Low–Medium.
- **Verify:** **[TOOL-COLLECTED]** CLS re-measure.

### P2 — INP profiling and targeted fix
- **What:** Profile the astrologer route interaction with the Performance panel + React Profiler; identify the long task; fix that specific handler/render (only then consider memoization, and only where profiling proves it).
- **Why:** 3.5 — field INP ~968 ms.
- **Risk:** Medium.
- **Effort:** Medium.
- **Verify:** **[TOOL-COLLECTED]** INP re-measure.

### P3 — Per-route CSS trimming
- **What:** Reduce duplicated CSS across the 174 CSS files; entry CSS is 62 KB gzip.
- **Risk:** Low.
- **Effort:** Medium.
- **Do last** — smallest marginal win.

---

## 6. Field metrics — per page (TO BE COLLECTED)

These **cannot** be produced in this build environment (no browser). Fill from Lighthouse (throttled, Mobile + Desktop) or PageSpeed Insights / RUM. The user's earlier PageSpeed pull is reproduced under "Prior field data" for reference; the blank table below is the standard to fill going forward.

**Legend:** LCP = Largest Contentful Paint (s), INP = Interaction to Next Paint (ms), CLS = Cumulative Layout Shift, TBT = Total Blocking Time (ms), Score = Lighthouse Performance.

### 6.1 Mobile (throttled — primary audience) — **[TOOL-COLLECTED]**

| Page | Score | LCP | INP | CLS | TBT |
|---|---|---|---|---|---|
| `/` (home) |  |  |  |  |  |
| `/astrologers` |  |  |  |  |  |
| `/astrologer/:slug/:id` |  |  |  |  |  |
| `/chat-to-astrologer/:id` |  |  |  |  |  |
| `/ai-wow` |  |  |  |  |  |
| `/ai-wow/ai-palmistry-scanner/*` |  |  |  |  |  |
| `/profile` |  |  |  |  |  |
| `/recharge` |  |  |  |  |  |
| `/daily-horoscope/:sign` |  |  |  |  |  |

### 6.2 Desktop — **[TOOL-COLLECTED]**

| Page | Score | LCP | INP | CLS | TBT |
|---|---|---|---|---|---|
| `/` (home) |  |  |  |  |  |
| `/astrologers` |  |  |  |  |  |
| `/astrologer/:slug/:id` |  |  |  |  |  |
| `/chat-to-astrologer/:id` |  |  |  |  |  |
| `/ai-wow` |  |  |  |  |  |
| `/profile` |  |  |  |  |  |
| `/recharge` |  |  |  |  |  |

### 6.3 Prior field data (from user's earlier PageSpeed pull — reference only)

| URL | Score | LCP | INP | CLS |
|---|---|---|---|---|
| `/astrologer/darshan…` | 34 | 1.03 | 968 | 4.188 |
| `/chat-to-astrologer/…` | 34 | 1.03 | 968 | 4.182 |
| `/astrologer/devendra…` | 36 | 3.35 | 63 | 1 |
| `/astrologers` | 47 | 2.24 | 968 | 3.057 |
| `/ai-wow/signature-analysis/camera` | 49 | 6.66 | 281 | 1.114 |
| `/ai-wow/ai-palmistry-scanner/result` | 51 | 2.24 | 968 | 2.485 |
| `/ai-wow` | 56 | 1.03 | 968 | 4.188 |
| `/profile` | 57 | 0.6 | 44 | 0.263 |
| `/recharge` | 57 | 0.6 | 44 | 0.263 |
| `/ai-wow/ai-palmistry-scanner/capture` | 59 | 2.40 | 888 | 1.041 |

**Reading the prior data:** LCP is mostly fine (0.6–3.3 s). The killers are **CLS (up to 4.188)** and **INP (up to 968 ms)** — both concentrated on astrologer/chat/AI routes. That's why P1 (CLS) and P2 (INP) target exactly those routes, and why the P0 bundle work improves the load feel underneath them.

---

## 7. Verification protocol (applies to every change)

1. `get_diagnostics` on every edited file — zero new errors.
2. `npm run build-dev` — must succeed.
3. Re-run the Section 2.4 sourcemap audit to prove packages left the entry chunk.
4. Compare `index-*.js` / `index-*.css` gzip sizes before vs after — record the delta in the PR.
5. For CLS/INP: re-measure in a real browser (**[TOOL-COLLECTED]**) — never claim a field-metric improvement without a tool number.
6. Report any pre-existing lint error separately from the change (lint a `git show HEAD:<file>` copy to prove it predates the edit).

---

## 8. Explicit non-goals (guardrails honored)

- **Do NOT** remove or disable Microsoft Clarity, GTM, gtag, Meta Pixel, or any API. All stay.
- **Do NOT** add `React.memo` everywhere — memoize only where profiling proves it (P2).
- **Do NOT** lazy-load everything — route lazy-loading is already correct; the target is the shared entry chunk.
- **Do NOT** raise `build.target` — it guards against a documented blank-page parse cliff.
- **Do NOT** fabricate field metrics — Section 6 stays blank until a browser tool fills it.
- **Do NOT** optimize on raw file size alone — gzip + whether it's on the entry path is what matters.
- `SingleBlog.jsx` is root-owned/read-only — extract shared logic to new files if needed.
