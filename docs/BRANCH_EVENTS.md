# Branch.io Events — ShubhAstro

Extracted from source, not from memory. Every event name, parameter and call site
below was read out of the working tree.

**Source of truth:** `src/utils/branchEvents.js` (the event definitions) and
`src/utils/branchIntegration.js` (the transport).

---

## 0. Integrated events — the short answer

**13 Branch events are live in production.** These are the ones with a real
production call site that actually reaches `branch.logEvent`:

| # | Branch event name | Fires when |
|---|---|---|
| 1 | `Landing Page` | Any route change (deduped per pathname) |
| 2 | `Signup Started` | User begins signup on the login screen |
| 3 | `OTP Sent` | OTP dispatched to the phone |
| 4 | `OTP Verified` | OTP accepted |
| 5 | `Registration Completed` | Registration finishes |
| 6 | `Profile Completed` | Birth details submitted |
| 7 | `Astrologer Listing Viewed` | Astrologer list screen viewed |
| 8 | `Astrologer Profile Viewed` | An astrologer profile is opened |
| 9 | `Recharge Pack Selected` | An amount tile is chosen in the recharge modal |
| 10 | `Actual Wallet Recharge Initiated` | Payment details step opens |
| 11 | `Actual Wallet Recharge Successful` | Razorpay reports success |
| 12 | `Consultation Started` | A **voice** call starts |
| 13 | `Consultation Completed` | A **voice** call ends |

**Not integrated** — defined in `branchEvents.js` but with no production caller,
so Branch never receives them:

- `Promo Eligible`
- `Promo Credited`
- `Wallet Screen Viewed`

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
          └─> window.branch.logEvent(name, data, cb)     branchIntegration.js:227
```

Two things worth knowing:

- **Every event is dual-sent.** One call fires both a Branch event *and* a
  GA4/GTM event. The two use **different names** — Branch gets Title Case
  ("Wallet Screen Viewed"), GA4 gets snake_case (`wallet_screen_viewed`). Both
  names are listed per event below.
- **`window.trackBranchEvent` is a plain wrapper** around `branch.logEvent`. If
  `window.branch` is undefined it logs `⚠️ Branch SDK not available: <event>` and
  returns — the event is dropped, not queued by this layer.

### SDK loading

`index.html` (from line 1245, production-only block):

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
| `trackLandingPageOpen` | `src/hooks/useLandingPageTracking.js:53`, mounted via `src/layouts/NavigationSetup.jsx:10`. Also `src/main.jsx:282`, but that call is **dev-only** (see §4.2) |
| `trackSignupStarted` | `src/screens/public/onboarding/LoginScreen.jsx:180` |
| `trackOtpSent` | `src/screens/public/onboarding/OTPScreen.jsx:423` |
| `trackOtpVerified` | `src/screens/public/onboarding/OTPScreen.jsx:195` |
| `trackRegistrationCompleted` | `src/screens/public/Register.jsx:152` |
| `trackProfileCompleted` | `src/screens/public/onboarding/BirthDetailsScreen.jsx:159` |
| `trackPromoEligible` | **no production call site** |
| `trackPromoCredited` | **no production call site** |
| `trackAstrologerListingViewed` | `src/screens/private/talkToAstrologer/TalkToAstrologer.jsx:147` |
| `trackAstrologerProfileViewed` | `src/screens/private/astrologerProfile/AstrologerProfile.jsx:220` |
| `trackWalletScreenViewed` | **no production call site** |
| `trackRechargePackSelected` | `src/component/recharge-modal/RechargeModal.jsx:96` |
| `trackWalletRechargeInitiated` | `src/component/recharge-modal/PaymentDetailsModal.jsx:82` |
| `trackWalletRechargeSuccessful` | `src/utils/hooks/useRazorpay.js:429` |
| `trackConsultationStarted` | `src/component/call/VoiceCall.jsx:538` |
| `trackConsultationCompleted` | `src/component/call/VoiceCall.jsx:642` |

---

## 4. Findings worth acting on

These came out of the extraction. Nothing here has been changed.

### 4.1 Three events are defined but never fired

`trackPromoEligible`, `trackPromoCredited` and `trackWalletScreenViewed` have no
caller outside the test file. If the Branch dashboard has funnels or audiences
expecting `Promo Eligible`, `Promo Credited` or `Wallet Screen Viewed`, they are
receiving nothing.

The promo pair is the notable gap: there **is** a live signup bonus
(`VITE_SIGNUP_BONUS_AMOUNT = "99"` in production, surfaced as "Continue & Get ₹99
Bonus"), and `WelcomeBonusModal` exists — but neither promo event is wired to it.
So bonus attribution is currently invisible to Branch.

### 4.2 The boot-time events are dev-only

`src/main.jsx` has a block headed `🧪 TEST EVENTS ON PAGE LOAD` that fires three
things 4.5 s after mount:

- `trackTestEvent("app_initialized", …)` — `main.jsx:269`
- `trackBranchEvent("app_load_test", …)` — `main.jsx:276`
- `BranchEvents.trackLandingPageOpen()` — `main.jsx:282`
- then `flushBranchEvents()` 500 ms later

**All of it is wrapped in `if (import.meta.env.DEV)` at `main.jsx:257`**, so none
of it runs in a production build. Do not read these as production traffic.

Two details still worth knowing:

- `trackTestEvent` (`branchEvents.js:543`) calls only `trackEvent(...)` — it has
  **no** `trackToBranch(...)`. So even in dev it reaches GA4/GTM as `test_event`
  and never reaches Branch.
- `trackBranchEvent("app_load_test", …)` bypasses `BranchEvents` and calls the
  `branchIntegration.js` export directly, so in **dev** Branch does receive an
  `app_load_test` event. It is the only Branch event not defined in
  `branchEvents.js`.

Also note `trackTestEvent("app_initialized", { environment: "development", … })`
hardcodes `environment`, which would be misleading if this block were ever
un-gated.

### 4.3 Consultation events are voice-only

Both consultation events fire only from `src/component/call/VoiceCall.jsx`.
There is no equivalent in the chat or video paths, so `Consultation Started` /
`Consultation Completed` under-report by however much of your consultation volume
is chat and video.

### 4.4 `phone` is sent as an event parameter

`trackOtpSent` and `trackOtpVerified` both accept and forward a `phone` param to
Branch and to GA4/GTM. That is PII going to two third parties. Worth confirming it
is intended and consistent with your privacy policy; if not, hash it or drop it.

### 4.5 The test file has no runner

`src/utils/__tests__/branchEvents.test.js` exists and covers all 16 events, but
`package.json` has **no `test` script** and no Jest/Vitest dependency, so it never
runs. Either wire up a runner or the coverage is decorative.

### 4.6 Console logging in production

`window.trackBranchEvent` (`branchIntegration.js:227`) logs unconditionally with
`console.log("📤 Branch event called:", …)` and `console.log("✅ Branch event
sent:", …)`. `vite.config.js` sets `esbuild.pure: ["console.log", …]`, so these are
stripped from production builds — but `console.error("❌ Branch event failed:")` is
deliberately kept, which is correct. `trackTestEvent` also has several
unconditional `console.log` calls, likewise stripped.

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
  array of the effect that fires the event.
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
- Transport chain: `branchEvents.js:31-44`, `branchIntegration.js:83-96` and
  `branchIntegration.js:225-247`.
- SDK loading and deferral: `index.html` from line 1245, including the
  `__deferTagScript__("Branch", …)` call and the vendor method list.

Counts: **16** events defined in `BranchEvents`; **13** live in production;
**3** with no caller at all (`Promo Eligible`, `Promo Credited`,
`Wallet Screen Viewed`); **1** dev-only Branch event defined outside
`branchEvents.js` (`app_load_test`); and `trackTestEvent`, which never reaches
Branch on any environment.

Completeness check for "what reaches Branch": the only two paths are
`BranchEvents.trackXxx -> trackToBranch` and the single direct
`trackBranchEvent("app_load_test", …)` at `main.jsx:276`. `branch.logEvent` is
called from exactly one place (`branchIntegration.js:235`) and
`trackBranchCommerceEvent` has **no** call sites, so nothing else can emit a
Branch event.

### Correction log

An earlier revision of this file claimed `test_event` and `app_load_test` fire on
every production boot. That was wrong — the `main.jsx` block containing them is
guarded by `if (import.meta.env.DEV)` at `main.jsx:257`. Corrected in §4.2. The
lesson: line numbers were read without checking the enclosing scope.
