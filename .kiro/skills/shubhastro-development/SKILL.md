---
name: shubhastro-development
description: Production development standards and workflows for the ShubhAstro application. Use this skill when developing, modifying, debugging, optimizing, securing, reviewing, refactoring, or preparing ShubhAstro code for production.
---

# ShubhAstro Development

Production engineering standards for this repository. Every fact below was verified
against the working tree, not inferred from documentation. Where the repo contradicts
its own docs, this file records the repo.

## 1. Verified stack

Read from `package.json`, `vite.config.js`, `eslint.config.js`, `postcss.config.js`,
`nginx-proxy.conf`, `index.html` and `src/`.

| Area | Actual |
|---|---|
| Framework | React 19.1.1, `react-dom` 19.1.1 |
| Language | **JavaScript + JSX only. Zero `.ts`/`.tsx` files in `src/`.** `@types/react` is present but there is no TypeScript build. |
| Build | Vite 7.1.7, `@vitejs/plugin-react` 5 |
| Module type | `"type": "module"` — all node scripts are ESM |
| Package manager | npm (`package-lock.json`; no yarn/pnpm lock) |
| Routing | `react-router-dom` 7.9.1, data-router via `createBrowserRouter` in `src/App.jsx` |
| State | Redux Toolkit 2.10 + RTK Query, `react-redux` 9.2, `redux-persist` 6 |
| Styling | **367 `*.module.scss`** (dominant), Sass 1.93; Tailwind **v3.4.17 through PostCSS** (`postcss.config.js` + `tailwind.config.js`) + autoprefixer; 11 plain `.css` files |
| Forms | Formik 2.4 + Yup 1.7 |
| HTTP | Axios 1.12 and RTK Query `fetchBaseQuery` |
| Realtime | `socket.io-client` 4.8; Agora RTC/RTM SDKs; `hls.js` |
| Payments | `react-razorpay` 3.0 via `src/utils/hooks/useRazorpay.js` |
| Push/auth extras | Firebase 12.6 (messaging + `public/firebase-messaging-sw.js`), Truecaller |
| Toasts | `react-hot-toast` |
| Env | `env-cmd` + `.env-cmdrc` with `dev` / `stage` / `prod` |

### Unused dependencies — do not build on them

Verified by import search across `src/`:

- `react-helmet-async` — **0 imports, no `HelmetProvider` mounted anywhere.**
  `src/component/SeoHelmet.jsx` is named after it but does not use it; it mutates DOM
  meta tags through `src/utils/updateMeta.js`. Do not introduce `<Helmet>`.
- `@tailwindcss/vite` (v4) — 0 imports, and `vite.config.js` does not register it.
  Tailwind runs on v3 via PostCSS. Do not mix v4 syntax.
- `clsx` — 0 imports. `mediabunny` — 0 imports.

Do not add a dependency that duplicates something already present.

## 2. Architecture map

```
src/
  App.jsx                     createBrowserRouter; every route wrapped in CmsPageWrapper
  utils/routes/Paths.js       publicRoutes + privateRoutes (single source of route truth)
  utils/routes/PrivateRoute.jsx  token gate -> /login?skip=welcome, saves return path
  layouts/                    HomeLayout, Footer
  screens/public/             login, onboarding, OTP, guest chat, static pages
  screens/private/            feature screens; per-feature `use*.js` hooks
  screens/v2/home-v2/         HomeV2 (homepage, static import - not lazy)
  component/                  shared UI; barrel at component/index.js
  component/UI/               cards, modal, tabs, charts, table, chips
  redux/api/                  RTK Query slices per domain
  redux/api/baseApi/          baseApi, pythonApi, horoscopeBaseApi, vedicApi, calculatorApi
  services/appServices/       privateRequest, publicRequest, privateRequestNew, domain services
  utils/security/             cryptoClient, secureBaseQuery, secureAxios, sgwCacheBuster
  utils/analytics.js          trackEvent -> dataLayer + gtag
  utils/branchEvents.js       Branch SDK events
  utils/helper/               string utils, converters, sanitizers, lazyWithRetry
secure-gateway/               separate Express app: encrypts JSON response bodies
tools/check-production-security.js   post-build gate, runs in all 4 build scripts
scripts/generate-sitemap.js   runs in all 4 build scripts
nginx-proxy.conf              security headers, cache policy, /sgw/ proxy, *.map 404
```

### Routing facts

- `src/utils/routes/Paths.js` is authoritative. `App.jsx` flattens it.
- Almost everything is public. `PrivateRoute` wraps only: `/shop/:slug/:productSlug`,
  `/profile`, `/community`, `/aiwow/muhurat-calendar`, `/ai-wow/muhurat-calendar`.
- `*` catch-all renders `src/component/CmsNotFoundPage.jsx`, which looks the path up
  in the CMS before showing 404. **This serves every SEO landing page.** It is NOT
  wrapped in `CmsPageWrapper`, so it gets no `CmsAccordion` and no `JsonLd`.
- `CmsPageWrapper` appends a collapsed `CmsAccordion` under matched routes and keeps
  `<link rel=canonical>` in sync on every navigation. `EXCLUDED_PATHS` skips the CMS
  lookup for `/`, `/blog`, `/astrologers`, `/astrologer`, `/live`, `/community`,
  `/shubh-mall`.
- `publicRoutes` screens and `HomeV2` are static imports on purpose. Converting them to
  `lazy()` requires adding a Suspense boundary first.
- `build.target` in `vite.config.js` is load-bearing — see §7.

## 3. Core working rules

### Inspect before modifying

Before any edit: understand the requirement, read the relevant files, trace the current
implementation, and identify dependencies, affected routes, API calls, performance
impact, security impact and regression risk. Check whether an existing component, hook
or helper already does the job. Never start editing from assumption.

This codebase is densely commented, and the comments are load-bearing: many record why
a specific approach was chosen, with measurements. **Read them before changing the code
they describe.** Two traps, both observed here:

- Comments describing a fix that was reasoned about but never applied.
- Comments describing a fix that *is* applied.

Always confirm against the code, not the prose. If you find a comment whose claim you
prove false, correct the comment in the same change.

### Minimal changes

Prefer small, targeted edits inside the existing architecture. Do not refactor
surrounding code, rewrite working business logic, restyle unrelated files, or add
dependencies. A bug fix does not license cleanup.

### Measure before claiming

Never state a performance number you did not measure. There is no browser in the
agent environment, so LCP, INP, CLS, TBT and TTI **cannot be measured here**. Say
"target defined, not measured" and attribute any figure you quote to its tool
(Lighthouse, Clarity, GTmetrix, curl). If a hypothesis is falsified, say so plainly
and remove the false claim from the code.

### Do not over-engineer

Before adding a library, abstraction, hook, state layer, caching layer or optimization,
ask: is it necessary, does existing code already solve it, what complexity and
maintenance cost does it add, and does it measurably improve anything? Choose the
simplest production-safe option.

## 4. React standards

- Reuse before creating. Check `src/component/index.js`, `src/component/UI/`,
  `src/utils/helper/` and `src/utils/hooks/` first. Do not add a second component with
  an existing purpose.
- Keep components focused; extract feature logic into a `use*.js` hook beside the
  screen, matching the existing per-feature pattern.
- Avoid unnecessary state, unnecessary effects, duplicate API calls, and state writes
  that trigger renders nothing consumes.
- Derive from props/state instead of mirroring them into new state.

### Memoization

`React.memo`, `useMemo` and `useCallback` are used ~21 times in `src/` — deliberately,
not by default. **Do not add them blindly.** Add one only when there is a real cost:
an expensive computation, a large list, or a dependency identity that demonstrably
causes a re-render loop. State the reason in a comment.

Note the recurring trap: `data?.items || []` creates a fresh array every render, so any
`useMemo`/`useEffect` depending on it never memoizes. Anchor the array first.

### Effects

- Never put an unstable function or freshly-created object/array in a dependency array
  without checking its identity.
- An effect that resets user-visible state must not be reachable while the user is
  interacting with that state.

### Disabled controls — hard rule

**Never use the native `disabled` attribute on a connect, submit, retry, generate or
pay control.** A disabled element fires no click event, so the tap is invisible to the
user and to Clarity, and reads as a dead click.

Instead:

```jsx
<button
  onClick={handleSubmit}          // always attached; guards live inside
  aria-disabled={!canSubmit}
  aria-busy={isSubmitting}
>
  {isSubmitting ? "Working..." : "Continue"}
</button>
{notice && <p key={notice.seq} role="status">{notice.text}</p>}
```

- Put the guard inside the handler and explain what is missing.
- Dim via `[aria-disabled='true']` in SCSS, never `:disabled`.
- Prefer an **inline `role="status"` notice keyed by an incrementing `seq`** over
  `toast.*()`. Clarity cannot see toasts, and the toaster is top-right, away from the
  control. Exception: a branch that navigates may keep its toast.
- `disabled` is acceptable only while an action is genuinely in flight, and only with a
  visible spinner plus label change.

Settled reference: `src/screens/private/aiwow/palmistry/PalmistryAnalysis.jsx`.

### Same-URL navigation taps

Do not invent an action. Make the current state legible — an active nav item must look
different from a hover state. See `BlogHeader.jsx` (`applyParams`) and
`TopHeader.module.scss`.

### Every user-facing surface needs

Loading (skeleton/shimmer), empty, error with retry, and success states. Never a blank
screen. Reserve space for async content so arrival does not shift layout.

Watch this pattern: a single flag gating both content and its action bar unmounts the
CTA during every refetch. Gate on "nothing to show yet", not "a request is in flight" —
see `src/component/recharge-modal/useRechargePlans.js`.

## 5. Mobile-first and in-app WebViews

Test every UI change against mobile, tablet and desktop; touch and pointer; slow
network and slow CPU. Mobile is the majority of real traffic here.

**In-app WebViews (Instagram, Facebook) are a recurring root cause in this codebase.**
`isInAppBrowser()` exists in `src/utils/deviceInfo.js`. Known failure modes:
`navigator.mediaDevices` absent, `play()` rejected, dynamic chunk loads failing,
programmatic `.focus()` not raising the keyboard, and `:hover` latching after tap.

**House pattern — always guard hover effects:**

```scss
@media (hover: hover) and (pointer: fine) {
  .card:hover { transform: translateY(-4px); }
}
```

Used in `NewAstrologerCard`, `PalmistryCamera`, `AuraCamera`, `FaceReadingCamera`,
`ClothColorLanding`, `SignatureResult`, `rechargeModal`. An unguarded hover transform
stays latched after a tap on a touch device.

Also check: fixed/sticky UI, bottom sheets, modal dismissal targets, keyboard overlap,
and safe areas. Prefer `dvh` over `vh` for full-height mobile surfaces — a WebView URL
bar makes `vh` larger than the visible viewport.

## 6. Core Web Vitals — release requirement

Targets apply to the homepage **and** all landing, category, service, detail and
content pages. Do not optimize only the homepage.

| Metric | Target | Ideal | Poor |
|---|---|---|---|
| LCP | ≤ 2.5 s | < 2.0 s | > 4.0 s |
| CLS | ≤ 0.1 | | > 0.25 |
| INP | ≤ 200 ms | | > 500 ms |

Also watch FCP, TBT, TTI, Speed Index and TTFB.

### LCP is mandatory

For any public-facing page you create or modify, identify the LCP element — hero image,
banner, main heading, large content block, promo image or video poster — and confirm
nothing you changed delays it.

**Image rules**

- **Never `loading="lazy"` on the LCP element.** This has already shipped as a real
  regression here: the homepage LCP image carried `loading="lazy"`, producing
  Load Delay 756 ms of a 2,070 ms LCP while Load Time was only 32 ms — proof it was
  scheduling, not bytes.
- Give the LCP image `fetchPriority="high"` and `decoding="async"`.
- Always set `width`/`height` or `aspect-ratio` to prevent CLS.
- Lazy-load below-the-fold images only. `loading="lazy"` appears 25 times in `src/`;
  keep it that way for genuinely below-fold surfaces.
- Do not give siblings of the LCP element `fetchPriority="high"` — they compete.
- Right-size assets; prefer WebP/AVIF; do not serve desktop artwork to phones.
- Chromium excludes full-viewport `background-image` from LCP candidacy, so preloading
  a background PNG can only compete with the real LCP element. Reach backgrounds through
  CSS `url()`.

```jsx
<img
  src={heroSrc}
  width="1200"
  height="675"
  fetchPriority="high"
  decoding="async"
  alt="Descriptive text"
/>
```

**Preload discipline.** `index.html` already has 17 `preload` entries and 4
`preconnect`. Do not add more without justification, and never preload multiple
competing images.

**CSS.** Watch render-blocking and unused CSS, global vs route CSS, and load order.
Do not build a critical-CSS pipeline without a measured benefit.

**Fonts.** Five Poppins weights are self-hosted in `public/fonts/` (woff2 + woff) with
`@font-face` in `index.html`. Use `font-display: swap`. Do not preload every weight.
Do not reintroduce Google Fonts — that adds two serial third-party handshakes.

**JavaScript.** Audit initial bundle size, large dependencies, synchronous scripts and
expensive init. Use route- and component-level `lazy()` (13 files already do) — but
never lazy-load the LCP element itself. `manualChunks` widening was measured here at
**+2.7% worse**; do not retry it.

**API dependency.** Prefer `Page load -> critical content -> LCP -> non-critical data`.
If LCP genuinely needs an API: cut latency and payload, remove duplicate calls, avoid
waterfalls, and consider prefetch. `index.html` already contains
`__homepagePrefetch__` and `__astrologersPrefetch__` inline prefetch scripts; extend
that proven pattern rather than inventing a new one.

### LCP regression prevention

Performance is part of Definition of Done. Do not add large images, blocking scripts,
blocking CSS, extra fonts, new third-party SDKs or API waterfalls to a public route
without justifying the LCP cost.

## 7. Vite and build

Four build scripts (`build`, `build-dev`, `build-stage`, `build-prod`) each run
`vite build` → `scripts/generate-sitemap.js` → `tools/check-production-security.js`,
with a raised `--max-old-space-size` (4096, or 8192 for prod).

**There is no `lint` script and no `test` script in `package.json`.** ESLint 9 flat
config is installed, so lint via `npx eslint <path>`. Do not tell the user to run
`npm run lint` or `npm test`.

Three settings in `vite.config.js` are load-bearing. Do not change them casually:

1. **`build.target: ['es2019','chrome79','edge79','firefox71','safari13']`** —
   **do not raise.** This floor forces esbuild to lower `??`, `?.` and `||=`/`??=`
   across all chunks including vendor code. Those are *parse-time* features: an older
   engine rejects the whole chunk with `Unexpected token '?'` and the app never boots —
   a blank page, invisible to feature detection, already observed in the wild. Raising
   any entry above chrome80/edge80/firefox72/safari13.4 reintroduces it.
2. **`sourcemap: false`** — security (maps are fetchable by derived filename even when
   `hidden`) and build memory (measured −674,889,728 B peak RSS, −28%). If error
   monitoring is added, generate maps in a separate CI step and upload them privately;
   do not set this back to `hidden`.
3. **`esbuild.pure: ["console.log","console.debug","console.info"]`** — `pure` not
   `drop`, because this block also applies in dev; minification only runs for builds,
   so developers keep their console. `console.warn`/`console.error` are kept
   deliberately and are load-bearing. `drop: []` stays empty so `debugger` still works
   in dev.

Dev and production requirements differ. Never disable useful development debugging to
improve a production number.

## 8. Security

`docs/PRODUCTION_SECURITY_AUDIT.md` tracks findings. Enforced controls today:

- `nginx-proxy.conf`: HSTS, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`,
  a scoped `Permissions-Policy`, `location ~* \.map$` → 404, `/assets/` immutable
  1-year cache, `no-store` on `index.html` and `firebase-messaging-sw.js`.
  **nginx trap:** `add_header` is not inherited by a location that declares its own
  `add_header`. Any location adding a header must restate the security headers.
- `tools/check-production-security.js` runs post-build in all four scripts. ERROR fails
  the build; WARN passes. It deliberately does not flag public identifiers (GA4, GTM,
  Firebase web config, Razorpay key *id*, Branch key). It currently emits one known
  benign warning about vendor `localhost` strings (Agora, React Router).
- `secure-gateway/` — separate Express app proxying upstream APIs and encrypting JSON
  response bodies so they read as ciphertext in the Network tab. Client side is
  `src/utils/security/` (`cryptoClient`, `secureBaseQuery`, `secureAxios`,
  `sgwCacheBuster`); dev proxy `/sgw` → `SGW_URL`.

### Anything shipped to the browser is public

**Never treat a `VITE_*` variable as secret.** Vite inlines them as literals into the
bundle; they are trivially readable. Verified inlined today: `VITE_SIGNUP_BONUS_AMOUNT`
reads out of the live bundle as `"99"`.

`src/` currently references these `VITE_*` names, several of which are real vendor
credentials in client code and are tracked findings — do not add more of this shape:
`VITE_SARVAM_API_KEY`, `VITE_HOROSCOPE_API_KEY`, `VITE_TAROT_API_KEY`,
`VITE_TAROT_API_USER_ID`, `VITE_VEDIC_API_KEY`, `VITE_VEDIC_API_USER_ID`,
`VITE_GOOGLE_MAPS_API_KEY`, `VITE_TRUECALLER_PARTNER_KEY`, `VITE_AGORA_APP_ID`,
`VITE_FIREBASE_*`, `VITE_RAZORPAY_KEY_ID`, `VITE_BRANCH_KEY`.

Route any new third-party credential through the backend or `secure-gateway/`. Never
put a server secret in React. Never rely on frontend-only security.

**`.env-cmdrc` holds credentials — do not read it.**

Also enforce: no secrets in source or comments; escape/sanitize before any
`dangerouslySetInnerHTML` (CMS bodies flow through `CmsPageWrapper` and
`CmsNotFoundPage`); validate URLs and prevent open redirects; keep tokens out of logs
and URLs; do not widen an API response beyond what the UI needs.

Auth today: bearer tokens in `localStorage` (`shubhtalk_customer_token` /
`shubhtalk_astro_token`, selected by `shubhtalk_role` in `src/utils/token.js`).
`HttpOnly` cookie migration is a tracked open item — do not change token storage as a
side effect of another task.

### Production debug hygiene

Strip debug logs (already handled by `esbuild.pure`), keep dev-only diagnostics behind
an env check, and do not expose internal API details or sensitive state. Do not claim
React DevTools can be fully prevented by React configuration — it cannot. Protect
secrets, internal API shapes, sensitive state and source maps instead.

## 9. API work

RTK Query is the default data layer. Base slices live in `src/redux/api/baseApi/`
(`baseApi`, `pythonApi`, `horoscopeBaseApi`, `vedicApi`, `calculatorApi`), plus
`privateRequestNew` for the internal backend. Axios services sit in
`src/services/appServices/`.

Before changing API usage, check: duplicate calls, request cancellation, timeouts,
retries, auth and token expiry, error handling, race conditions, stale responses,
pagination, caching, payload size and response validation.

Specifics that have bitten this repo:

- A `skip` flag whose value depends on another query resolving creates a two-phase
  render, which is a CLS source. Gate the *section*, not just the query.
- `refetchOnMountOrArgChange: true` plus an explicit `refetch()` in an open-effect
  produces two round trips and two loading flashes per open.
- When converting a `query` to `queryFn` to consume a prefetch, verify the args match
  on a genuinely fresh load and that the response shape matches every consumer.

Do not silently change an API contract. If a backend change is needed, report the
existing contract, the proposed contract, frontend impact, backend impact and
backward compatibility, then wait.

## 10. Payments (Razorpay)

`src/utils/hooks/useRazorpay.js` is the shared integration. It has a retryable script
loader that names Facebook/Instagram WebViews and exposes `scriptError`, `isLoaded`
and `retryScriptLoad`; `PaymentDetailsModal` and `FinalPay` consume them.
`src/screens/private/epooja/checkout/EPoojaCheckout.jsx` still hand-rolls its own
loader and is a known exception.

**Payment paths are high-risk. Get explicit confirmation before changing payment
behaviour, and never change it as a side effect of another task.**

Validate: order creation, initiation, success, failure, cancellation, closing the
Razorpay sheet, retry, duplicate-payment prevention, order status and mobile number
handling. Never trust frontend success — verification and signature checking happen
server-side. Only the Razorpay **key id** may appear client-side; never a key secret.

The Razorpay handler payload contains only `razorpay_payment_id`, `razorpay_order_id`
and `razorpay_signature` — never an amount. Do not read an amount from it.

## 11. SEO

Implemented here: `src/utils/updateMeta.js` (`updateMeta`, `resetMeta`,
`updateCanonical`) driving in-place DOM meta updates; `src/component/SeoHelmet.jsx`
(5 consumers); `src/component/JsonLd.jsx` rendered by `CmsPageWrapper`;
`public/robots.txt`; `scripts/generate-sitemap.js` (38 `staticRoutes` entries, emits
`public/sitemap.xml` **and** `dist/sitemap.xml`, ~326 URLs incl. blog and astrologer
categories); `public/llms.txt`; `public/site.webmanifest`.

- `react-helmet-async` is unused and there is no `HelmetProvider`. Use `updateMeta`
  or `SeoHelmet`, never `<Helmet>`.
- Every important public page needs page-specific title, meta description, canonical,
  robots, Open Graph and Twitter metadata.
- `CmsPageWrapper` keeps canonical in sync on every navigation, including excluded
  routes. Preserve that.
- The `*` catch-all (`CmsNotFoundPage`) serves the CMS/SEO landing pages but gets no
  `JsonLd` and no `CmsAccordion`. Account for that when working on landing-page SEO.
- Check semantic HTML, one `<h1>`, heading order, image `alt`, internal links,
  crawlability, indexability and duplicate content.
- `generate-sitemap.js` warns on drift when a hardcoded route no longer exists in
  `Paths.js`. Fix drift in that script; do not silence the warning.
- `public/sitemap.xml` shows as untracked because the build generates it. That is not
  an agent change.

## 12. Analytics

`src/utils/analytics.js` exposes `trackEvent(name, props)`, which validates the event
name and pushes to **both** `window.dataLayer` and `window.gtag`, auto-attaching
`user_id`, `timestamp`, `app_version` and `device_type`. `src/utils/branchEvents.js`
wraps Branch events.

`index.html` loads GTM, GA4 (gtag), Microsoft Clarity, Meta Pixel and Branch, and
contains an inline error reporter that pushes `js_error` to `dataLayer`.

**`__deferTagScript__`** in `index.html` waits for `load`, then `requestIdleCallback`
(`IDLE_TIMEOUT_MS = 2000`, `NO_IDLE_DELAY_MS = 1200` fallback, `MAX_WAIT_MS = 4000`
ceiling). **All five tags now go through it** — GTM, GA4, Meta Pixel, Branch
(`{ requireAllowedHost: false }`) and Clarity.

Two tags install a synchronous stub before their real script is deferred, so calls made
during the wait are queued rather than lost: Clarity's `window.clarity` command queue,
and Branch's method-shim queue. Verify the stub still exists before assuming a tag can
be called early.

The cost of deferring Clarity is documented at its call site: it snapshots the DOM at
init, so mutations during roughly the first second are not replayed. The session, the
snapshot, the event queue and custom tags all survive. This matters when reading Clarity
recordings — an early interaction may be missing from replay while still counted.

Rules:

- Never remove or degrade Clarity, GA4, GTM, Meta Pixel, Branch, Truecaller, Firebase
  or Razorpay to win a performance number.
- Route those tags through `__deferTagScript__` rather than adding a new defer scheme.
  Delaying them further does not move LCP (they are already off the critical path) and
  costs Clarity recordings of short sessions and Pixel PageViews for bouncers.
- Guard against duplicate events from re-renders, wrong effect dependencies, SPA route
  changes and repeated init. A value that changes when a refresh resolves must not sit
  in the dependency array of the effect that fires the event.
- Use consistent snake_case event names and keep an initiation event paired with its
  completion event, or conversion rates break.
- `index.html` is ~1,100 lines of hand-maintained analytics markup. After editing it,
  verify comment and script balance programmatically (`<!--` vs `-->`, live
  `<script>` vs `</script>` after stripping comments). Three structural defects have
  reached production through this file; that is why the post-build check exists.

## 13. Microsoft Clarity investigation

Clarity drives much of the UX work here. Treat it as evidence, not verdict.

**Reliable:** click counts, timestamps, page URLs, device and referrer metadata.

**Unreliable:**
- Element names can be misattributed or fabricated. Verify the element exists.
- AI prose drifts and regenerates between sends of the same session, and confidence
  inflates with no new data ("may not be functional" → "was unresponsive").
- The IDs shown are **User IDs**, not session IDs. Compare timestamp, duration and
  click/page counts to tell a re-send from a genuinely new visit.

**Reading signals:**
- A container-level element name (concatenated child text) is the signature of a click
  that missed every interactive child.
- `pages > clicks` suggests redirects or full reloads.
- Rage clicks on desktop text are often just text selection (double/triple click).

**Workflow.** Do not assume a dead click is a bug. Determine whether the element looks
clickable, has a handler, is covered, is natively `disabled`, or is intentionally
inert. Then verify against the real artifact — read the CMS document, the live bundle,
or the API response. Prefer fetching live evidence (`curl`, or `web_fetch` with
`mode: "rendered"`) over reasoning from source alone. If you cannot localise it, say
so; do not ship a speculative change.

**Cross-check the label against real data.** A rage click reported on a "₹99 payment
option" was disproved by fetching `plans/all`: nine plans, minimum ₹100, no ₹99 tile.
The label came from `VITE_SIGNUP_BONUS_AMOUNT`, elsewhere in the app.

Require repeat evidence (two or more independent sessions) before changing a shared
component on Clarity evidence alone.

**Minified-bundle greps:** local function names are mangled, so a zero count proves
nothing. JSX prop names (`fetchPriority`, `width`) and string literals survive.

## 14. Accessibility

Semantic HTML first. Use a real `<button>` for actions and a real `<a>`/`<Link>` for
navigation. Do not reach for ARIA to paper over wrong semantics.

Check keyboard navigation, visible `:focus-visible`, labels, `alt` text, contrast,
form error association, and `role="status"` / `aria-live` for async feedback.
`aria-disabled` + `aria-busy` are the house pattern for blocked controls (§4).

If asked about WCAG compliance, state that full validation needs manual testing with
assistive technology and expert review.

## 15. Code quality

Readable names, focused functions, reusable helpers, no duplication, no dead code, no
commented-out legacy blocks, no stray `console.log` in new code, no magic values where
config belongs, no unnecessary dependencies.

Repo conventions:

- Components `PascalCase.jsx`; hooks `useThing.js`; utils `camelCase.js`; API slices
  `thingApi.js`; styles `Component.module.scss` with camelCase class names.
- Import assets through `src/utils/appImages.js`; route paths through
  `src/utils/routes/Paths.js`.
- ESLint `no-unused-vars` uses `varsIgnorePattern: '^[A-Z_]'`, so unused **uppercase**
  imports are tolerated by design — leave them. Lowercase unused vars must go.
- `globalIgnores(['dist'])` — do not lint build output.
- **ASCII discipline:** scan added lines for unexpected non-ASCII. A zero-width space
  and a stray CJK character have both been introduced accidentally here. Em dashes are
  established house style in comments and are fine.
- Only create markdown files when explicitly requested.

## 16. Debugging workflow

1. Reproduce or precisely characterise the report.
2. Read the relevant code and trace execution; do not guess.
3. Inspect console, network, API response shape, Redux state, effect timing and race
   conditions.
4. Fetch real artifacts (live bundle, live API, live HTML) rather than trusting source
   or documentation.
5. Identify the root cause and state it.
6. Apply the smallest fix that addresses that cause.
7. Verify per §17 and check for regression.

If the same approach fails twice, stop tweaking. Diagnose, say what went wrong, and
switch strategy.

## 17. Verification — required before reporting done

1. `get_diagnostics` on every changed file.
2. `npm run build-dev` must pass (~13–20 s). This also runs the sitemap generator and
   the post-build security check.
3. Lint changed files with `npx eslint <path>` when logic changed. **There is no
   `npm run lint` and no `npm test`.**
4. Confirm the change reached the output when it matters: grep `dist/assets/` for a new
   class name, string literal or JSX prop. Remember minified names are mangled.
5. Clean up temporary files and confirm `git status --porcelain` shows only intended
   files (plus build-generated `public/sitemap.xml`).

**Proving a finding is pre-existing.** Compare against a temp copy from HEAD named
`__head_<file>`, then delete it and confirm `git status --porcelain | grep __head_` is
empty. SCSS diagnostics do not run on `__head_*` filenames — instead count the specific
trigger in HEAD vs current (e.g. `grep -c 'webkit-line-clamp'`) and confirm zero in
your added lines.

**Answering "is this deployed?"** Read the **live build**: fetch
`https://www.shubhastro.ai/`, extract the entry asset name, and inspect that asset.
Do not answer from a git ref — `origin/production` is a stale ref here; deploys track
`origin/production-branch`. Do not compare against a stale local `dist/`.

**Grep traps:** `grep -c "disabled={!profile"` also matches `aria-disabled={!profile`.
`grep -n "^\.className"` misses nested SCSS rules.

**Environment quirk:** `grep`, `node`, `perl`, `npx` and `python3` intermittently drop
off `PATH`. Prefix shell calls with
`export PATH="/usr/local/bin:/usr/bin:/bin:$PATH";`. zsh needs glob patterns quoted
(`--include='*.js'`). macOS `awk` rejects `[*/]` character classes — use `python3` for
line filtering.

## 18. Production build validation

For production-affecting changes verify: the build succeeds; no missing assets; no
broken routes; correct env per target; no unexpected bundle growth; no exposed secrets;
no source maps in the artifact; no duplicate API calls introduced.

Known deploy-side issue, independent of source: the loader GIF referenced by the live
entry chunk 404s. Do not "fix" it in source; it needs the pipeline owner.

## 19. Definition of Done

- Requirement implemented; existing behaviour preserved.
- `get_diagnostics` clean; `npm run build-dev` passes.
- No console errors introduced; no security regression; no unnecessary dependency.
- Mobile and in-app WebView behaviour considered.
- Performance impact considered; LCP impact considered for public pages.
- SEO impact considered for public pages; analytics impact considered where relevant.
- For important public pages the targets are LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms.

If performance was not measured, write exactly:
**"Performance target defined but not measured."** Never claim an improvement you did
not measure.

## 20. Change report format

Report after completing work under this skill. Keep it proportional — a one-line fix
does not need every heading.

1. **Summary** — what changed.
2. **Root cause** — for bug, performance or security work; what you proved and how.
3. **Files changed** — every file created or modified.
4. **Implementation** — the technical explanation.
5. **Performance** — LCP, bundle, API, rendering and third-party impact. Label each
   figure measured or expected.
6. **Security** — impact and residual risk.
7. **SEO** — when applicable.
8. **Analytics** — tracking impact when applicable.
9. **Testing** — exact commands and checks run.
10. **Risks** — what remains unresolved, and anything you could not verify.
11. **Rollback** — how to revert safely.

## 21. Never

- Rewrite working code, or refactor beyond the task.
- Change unrelated files or configuration.
- Add a dependency that duplicates something present.
- Treat a `VITE_*` variable as secret, or put a server secret in React.
- Rely on frontend-only security, or trust frontend payment success.
- Raise `build.target`, or restore `sourcemap: 'hidden'`.
- Retry `manualChunks` widening (measured worse).
- Use native `disabled` on a connect, submit, retry or pay control.
- Lazy-load the LCP element, or preload indiscriminately.
- Add `React.memo` / `useMemo` / `useCallback` without a stated reason.
- Remove or throttle Clarity, GA4, GTM, Meta Pixel, Branch, Truecaller, Firebase or
  Razorpay for a performance score.
- Read `.env-cmdrc`.
- Claim "fixed" or quote a metric without validation.
- Change payment behaviour or token storage without explicit confirmation.
