# Branch.io Events — ShubhAstro

Extracted from source, not from memory. Every event name, parameter and call site
below was read out of the working tree.

**Source of truth:** `src/utils/branchEvents.js` (the event definitions) and
`src/utils/branchIntegration.js` (the transport).

---

## 0. Integrated events — the short answer

**All 16 Branch events are live in production.** Every one has a real production
call site that reaches `branch.logEvent`.

| # | Branch event name | Fires when |
|---|---|---|
| 1 | `Landing Page` | Any route change (deduped per pathname) |
| 2 | `Signup Started` | User begins signup on the login screen |
| 3 | `OTP Sent` | OTP dispatched to the phone |
| 4 | `OTP Verified` | OTP accepted |
| 5 | `Registration Completed` | Registration finishes (six entry points — see §4.1) |
| 6 | `Profile Completed` | Birth details submitted |
| 7 | `Promo Eligible` | Welcome bonus modal determines eligibility |
| 8 | `Promo Credited` | Welcome bonus is credited |
| 9 | `Astrologer Listing Viewed` | Astrologer list screen viewed |
| 10 | `Astrologer Profile Viewed` | An astrologer profile is opened |
| 11 | `Wallet Screen Viewed` | Wallet transactions screen viewed |
| 12 | `Recharge Pack Selected` | An amount tile is chosen in the recharge modal |
| 13 | `Actual Wallet Recharge Initiated` | Payment details step opens |
| 14 | `Actual Wallet Recharge Successful` | Razorpay reports success |
| 15 | `Consultation Started` | A voice, video or chat consultation starts |
| 16 | `Consultation Completed` | A voice, video or chat consultation ends |

**Dev-only** — fires in `npm run start` but not in a production build:

- `app_load_test` (the only Branch event not defined in `branchEvents.js`)

Detail, parameters, exact call sites and caveats follow.

---

## 1. How an event reaches Branch

```
Component
  └─> BranchEvents.trackXxx({ ...params })          src/utils/branchEvents.js
        ├─> logEvent(name, params)                  console, DEV only
        ├─> trackToBranch("Branch Event Name", p)   ──┐
        └─> trackEvent("ga4_event_name", p)           │  src/utils/analytics.js
                                                      │  -> window.dataLayer.push
                                                      │  -> window.gtag("event", …)
                                                      │
        window.trackBranchEvent(name, data)  <────────┘  defined at
          └─> window.branch.logEvent(name, data, cb)     branchIntegration.js
```

Two things worth knowing:

- **Every event is dual-sent.** One call fires both a Branch event *and* a
  GA4/GTM event. The two use **different names** — Branch gets Title Case
  ("Wallet Screen Viewed"), GA4 gets snake_case (`wallet_screen_viewed`). Both
  names are listed per event in §2.
- **`window.trackBranchEvent` is a plain wrapper** around `branch.logEvent`. If
  `window.branch` is undefined it logs a warning and returns — the event is
  dropped, not queued by this layer.

### SDK loading

`index.html` (production-only block):

- `var branchKey = "%VITE_BRANCH_KEY%"` — substituted at build time by
  `indexHtmlEnvPlugin` in `vite.config.js`.
- The **vendor stub runs at parse time** and defines `window.branch` with every
  SDK method as a queueing shim (`b._q.push([method, arguments])`), so
  `branch.init(...)` and `branch.logEvent(...)` calls keep their original order.
- Only the **script download** is deferred, via
  `__deferTagScript__("Branch", inject, { requireAllowedHost: false })`. So events
  fired before the CDN script lands are queued by the stub, not lost.

Because the stub defines `window.branch` immediately, the "SDK not available"
branch in `trackBranchEvent` should be rare in production.

### Fields added automatically

`branchEvents.js` adds these to **every** event:

`event_category`, `event_type`, `page_name`, `route_name`, `route_path`,
`user_type`, `user_id`, `platform` (default `"web"`), `environment`
(`import.meta.env.MODE`), `timestamp` (ISO 8601)

`analytics.js -> trackEvent()` then adds, for the GA4/GTM copy only:

`user_id`, `timestamp`, `app_version`, `device_type`

Anything you pass in `params` is spread **last**, so a caller can override any
default.

---

## 2. Event catalogue

16 events, grouped by `event_category`. "Extra params" excludes the automatic
fields listed above.

### Onboarding & authentication — `event_category: "onboarding"`

| # | Function | Branch event name | GA4 / GTM name | Extra params |
|---|---|---|---|---|
| 1 | `trackLandingPageOpen` | `Landing Page` | `landing_page_open` | `page_url`, `referrer` |
| 2 | `trackSignupStarted` | `Signup Started` | `signup_started` | `signup_method`, `source` |
| 3 | `trackOtpSent` | `OTP Sent` | `otp_sent` | `otp_channel`, `signup_method`, `success`, `phone` |
| 4 | `trackOtpVerified` | `OTP Verified` | `otp_verified` | `verification_method`, `success`, `phone`, `verification_time_ms` |
| 5 | `trackRegistrationCompleted` | `Registration Completed` | `registration_completed` | `registration_method` |
| 6 | `trackProfileCompleted` | `Profile Completed` | `profile_completed` | `profile_completion_status`, `birth_date_provided`, `location_provided` |

### Promotions — `event_category: "promotion"`

| # | Function | Branch event name | GA4 / GTM name | Extra params |
|---|---|---|---|---|
| 7 | `trackPromoEligible` | `Promo Eligible` | `promo_eligible` | `promo_id`, `promo_type`, `eligibility_status`, `promo_value`, `currency` |
| 8 | `trackPromoCredited` | `Promo Credited` | `promo_credited` | `promo_id`, `promo_type`, `credit_status`, `promo_amount`, `currency` |

### Astrologer discovery — `event_category: "astrologer_discovery"`

| # | Function | Branch event name | GA4 / GTM name | Extra params |
|---|---|---|---|---|
| 9 | `trackAstrologerListingViewed` | `Astrologer Listing Viewed` | `astrologer_listing_viewed` | `listing_type`, `category`, `filter`, `sort_by`, `result_count` |
| 10 | `trackAstrologerProfileViewed` | `Astrologer Profile Viewed` | `astrologer_profile_viewed` | `astrologer_id`, `astrologer_name`, `category`, `source`, `rating`, `experience_years` |

### Wallet & payments — `event_category: "wallet"`

| # | Function | Branch event name | GA4 / GTM name | Extra params |
|---|---|---|---|---|
| 11 | `trackWalletScreenViewed` | `Wallet Screen Viewed` | `wallet_screen_viewed` | `source`, `current_balance`, `currency` |
| 12 | `trackRechargePackSelected` | `Recharge Pack Selected` | `recharge_pack_selected` | `pack_id`, `pack_name`, `amount`, `currency`, `source`, `includes_bonus`, `bonus_amount` |
| 13 | `trackWalletRechargeInitiated` | `Actual Wallet Recharge Initiated` | `wallet_recharge_initiated` | `pack_id`, `pack_name`, `amount`, `currency`, `payment_method`, `transaction_id`, `order_id` |
| 14 | `trackWalletRechargeSuccessful` | `Actual Wallet Recharge Successful` | `wallet_recharge_successful` | `pack_id`, `pack_name`, `amount`, `currency`, `payment_method`, `transaction_id`, `order_id`, `payment_status` |

Note the two Branch names carry an `Actual ` prefix that the GA4 names do not.
That asymmetry is in the source; don't "fix" it without checking the Branch
dashboard, which may already have funnels keyed on those exact strings.

### Consultation — `event_category: "consultation"`

| # | Function | Branch event name | GA4 / GTM name | Extra params |
|---|---|---|---|---|
| 15 | `trackConsultationStarted` | `Consultation Started` | `consultation_started` | `astrologer_id`, `astrologer_name`, `consultation_id`, `consultation_type`, `source`, `duration_minutes`, `cost`, `currency`, `order_id` |
| 16 | `trackConsultationCompleted` | `Consultation Completed` | `consultation_completed` | `astrologer_id`, `astrologer_name`, `consultation_id`, `consultation_type`, `actual_duration_minutes`, `scheduled_duration_minutes`, `cost`, `currency`, `order_id`, `completion_status`, `rating`, `review_provided` |

---

## 3. Where each event actually fires

Production call sites only. `src/utils/__tests__/branchEvents.test.js` also calls
every one of them and is excluded here.

| Event | Fired from |
|---|---|
| `trackLandingPageOpen` | `src/hooks/useLandingPageTracking.js:53`, mounted via `src/layouts/NavigationSetup.jsx`. Also `src/main.jsx:297`, but that call is **dev-only** (see §4.3) |
| `trackSignupStarted` | `src/screens/public/onboarding/LoginScreen.jsx:180` |
| `trackOtpSent` | `src/screens/public/onboarding/OTPScreen.jsx:443` |
| `trackOtpVerified` | `src/screens/public/onboarding/OTPScreen.jsx:215` |
| `trackRegistrationCompleted` | Six call sites — `src/screens/public/Register.jsx:152`, `src/screens/public/onboarding/BirthDetailsScreen.jsx:162`, `src/screens/public/onboarding/GuidanceScreen.jsx:136`, `src/component/UI/Profile/GuestKundliAuthModal.jsx:154`, `src/screens/public/guestChat/useGuestChatAuth.js:103`, `src/screens/v2/user/Profile.jsx:1435` |
| `trackProfileCompleted` | `src/screens/public/onboarding/BirthDetailsScreen.jsx:169` |
| `trackPromoEligible` | `src/component/UI/modal/WelcomeBonusModal/WelcomeBonusModal.jsx:43` |
| `trackPromoCredited` | `src/component/UI/modal/WelcomeBonusModal/WelcomeBonusModal.jsx:91` |
| `trackAstrologerListingViewed` | `src/screens/private/talkToAstrologer/TalkToAstrologer.jsx:146` |
| `trackAstrologerProfileViewed` | `src/screens/private/astrologerProfile/AstrologerProfile.jsx:253` |
| `trackWalletScreenViewed` | `src/screens/private/wallet/WalletTranscations.jsx:50` |
| `trackRechargePackSelected` | `src/component/recharge-modal/RechargeModal.jsx:96` |
| `trackWalletRechargeInitiated` | `src/component/recharge-modal/PaymentDetailsModal.jsx:82` |
| `trackWalletRechargeSuccessful` | `src/utils/hooks/useRazorpay.js:492` |
| `trackConsultationStarted` | `src/component/call/VoiceCall.jsx:538` (voice), `src/component/call/VideoCall.jsx:583` (video), `src/screens/private/home/components/chats/useChatWindow.js:253` (chat) |
| `trackConsultationCompleted` | `src/component/call/VoiceCall.jsx:642` (voice), `src/component/call/VideoCall.jsx:766` (video), `src/context/WaitingQueueContext.jsx:906` (chat) |

---

## 4. Findings worth acting on

These came out of the extraction. Nothing here has been changed.

### 4.1 `Registration Completed` fires from six places

More call sites than every other event combined. The six cover genuinely
different paths (standard signup, the onboarding birth-details and guidance
steps, the guest kundli modal, guest chat auth, and the profile screen), but that
breadth is also the main duplicate-fire risk in the catalogue: any user who
passes through two of these paths in one journey is counted twice.

If the Branch dashboard shows registrations exceeding real accounts created,
start here rather than assuming a delivery problem.

### 4.2 Consultation events now cover all three channels

Voice, video and chat all fire both `Consultation Started` and
`Consultation Completed`. Note the asymmetry in where they live: `started` and
`completed` are co-located for voice and video (both inside the call component),
but for chat `started` is in `useChatWindow.js` while `completed` is in
`WaitingQueueContext.jsx`. Worth knowing when tracing a chat session that
reports a start without an end.

### 4.3 The boot-time events are dev-only

`src/main.jsx` has a block headed `🧪 TEST EVENTS ON PAGE LOAD` that fires three
things a few seconds after mount:

- `trackTestEvent("app_initialized", …)`
- `trackBranchEvent("app_load_test", …)`
- `BranchEvents.trackLandingPageOpen()`
- then `flushBranchEvents()`

**All of it is wrapped in `if (import.meta.env.DEV)`**, so none of it runs in a
production build. Do not read these as production traffic.

Two details still worth knowing:

- `trackTestEvent` calls only `trackEvent(...)` — it has **no**
  `trackToBranch(...)`. So even in dev it reaches GA4/GTM as `test_event` and
  never reaches Branch.
- `trackBranchEvent("app_load_test", …)` bypasses `BranchEvents` and calls the
  `branchIntegration.js` export directly, so in **dev** Branch does receive an
  `app_load_test` event. It is the only Branch event not defined in
  `branchEvents.js`.

### 4.4 `phone` is sent as an event parameter

`trackOtpSent` and `trackOtpVerified` both accept and forward a `phone` param to
Branch and to GA4/GTM. That is PII going to two third parties. Worth confirming it
is intended and consistent with your privacy policy; if not, hash it or drop it.

### 4.5 The test file has no runner

`src/utils/__tests__/branchEvents.test.js` exists and covers all 16 events, but
`package.json` has **no `test` script** and no Jest/Vitest dependency, so it never
runs. Either wire up a runner or the coverage is decorative.

### 4.6 Console logging in production

`window.trackBranchEvent` logs unconditionally with `console.log`.
`vite.config.js` sets `esbuild.pure: ["console.log", …]`, so these are stripped
from production builds — but `console.error("❌ Branch event failed:")` is
deliberately kept, which is correct.

### 4.7 Conversion events navigate immediately after firing

Several conversion events fire immediately before a `navigate(...)`. The clearest
case is `Register.jsx`, where `trackRegistrationCompleted` is followed by a
`Toast.success` and then `navigate(HOME, { replace: true })` in the same tick.
`branch.logEvent` is an asynchronous POST to Branch's collector, so a route change
in the same tick can discard the request before it leaves.

If an event is present in the code but missing from the Branch dashboard, check
this before suspecting the name or the call site: open Branch Liveview, complete
the flow on production, and watch DevTools → Network for the `/v2/event` request.
No request means it is being dropped (either this, or the SDK script was blocked);
a request that fires means the event is arriving and the dashboard view is the
issue — these are **custom** event names, so they appear under Data Feeds /
Liveview and custom-event reports, not in the standard-event tiles.

---

## 5. Adding a new event

Follow the existing shape so both sinks stay consistent:

```js
// src/utils/branchEvents.js, inside the BranchEvents object
trackYourEvent: (params = {}) => {
  const eventParams = {
    event_category: "your_category",
    event_type: "your_event",
    page_name: params.page_name || "Screen",
    route_name: params.route_name || "route",
    route_path: params.route_path || window.location.pathname,
    // ...your domain fields, each defaulting to null
    platform: params.platform || "web",
    environment: import.meta.env.MODE,
    timestamp: new Date().toISOString(),
    ...params,
  };
  logEvent("your_event", eventParams);
  trackToBranch("Your Event", eventParams);   // Title Case — Branch
  trackEvent("your_event", eventParams);      // snake_case — GA4 / GTM
},
```

Rules that matter here:

- Keep `...params` last so callers can override.
- Use a **consistent** name pair. The `Actual Wallet Recharge …` prefix (§2) is a
  precedent to avoid repeating, not to copy.
- Pair an "initiated" event with its "completed" event, or the conversion rate in
  the dashboard breaks.
- Guard against duplicate fires from React re-renders and effect dependencies. A
  value that changes when an async refresh resolves must not sit in the dependency
  array of the effect that fires the event. See §4.1 for what this looks like at
  scale.
- Don't fire an event in the same tick as a `navigate(...)` — see §4.7.
- Do not add PII (see §4.4).

---

## 6. Verification notes

How the contents above were established, so it can be re-checked:

- Function list, Branch names, GA4 names and categories: parsed out of
  `src/utils/branchEvents.js` by matching each `trackXxx:` block and reading its
  `trackToBranch("…")`, `trackEvent("…")` and `event_category` values.
- Parameter lists: read from each function's `const eventParams = { … }` literal,
  with the automatic fields subtracted.
- Call sites: repo-wide grep for `BranchEvents.<fn>`, excluding
  `src/utils/branchEvents.js` itself and the `__tests__` directory.
- Transport chain: `branchEvents.js` (`trackToBranch`) and
  `branchIntegration.js` (`window.trackBranchEvent` -> `branch.logEvent`).

Counts: **16** events defined in `BranchEvents`; **16** live in production; **1**
dev-only Branch event defined outside `branchEvents.js` (`app_load_test`); and
`trackTestEvent`, which never reaches Branch on any environment.

Completeness check for "what reaches Branch": the only two paths are
`BranchEvents.trackXxx -> trackToBranch` and the single direct
`trackBranchEvent("app_load_test", …)` in `main.jsx`. `branch.logEvent` is called
from exactly one place in `branchIntegration.js`, and `trackBranchCommerceEvent`
has **no** call sites, so nothing else can emit a Branch event.

### Correction log

- An earlier revision claimed `test_event` and `app_load_test` fire on every
  production boot. Wrong — the `main.jsx` block containing them is guarded by
  `if (import.meta.env.DEV)`. Corrected in §4.3. The lesson: line numbers were
  read without checking the enclosing scope.
- An earlier revision listed `Promo Eligible`, `Promo Credited` and
  `Wallet Screen Viewed` as defined-but-never-fired, and described the
  consultation events as voice-only. All four statements are now out of date:
  the promo pair fires from `WelcomeBonusModal`, `Wallet Screen Viewed` fires
  from `WalletTranscations.jsx`, and the consultation events cover video and chat
  as well as voice. Corrected throughout. The lesson: a doc asserting a negative
  ("no caller") goes stale the moment someone wires the caller, so re-run the
  call-site grep rather than trusting the previous revision.
