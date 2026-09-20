# Microsoft Clarity Dead Click Audit

**Date:** 2026-09-20 · **Branch:** `image-issue` · **Commit at audit start:** `ce6af63`
**App:** ShubhAstro / ShubhTalk — React 19.1.1 + Vite 7.1.7 SPA (JavaScript/JSX only)
**Method:** static detection across the full source tree, then per-candidate source verification.
No Clarity configuration was touched, added, or suppressed.

---

## Summary

| Metric | Value |
|---|---|
| `.jsx` / `.scss` files scanned | 997 |
| `onClick` sites | 1,918 |
| `<button>` elements | 1,473 |
| `<a>` / `<Link>` / `<NavLink>` | 72 / 55 |
| `role="button"` | 35 |
| `cursor: pointer` declarations | 1,446 |
| `pointer-events` declarations | 208 |
| **Files already carrying dead-click hardening** | **170** |
| Candidates raised by detectors | 6 classes |
| **Confirmed issues fixed this pass** | **3** |
| Confirmed issues rejected after verification | 3 classes (see Rejected) |

**Critical:** 0  **High:** 1  **Medium:** 1  **Low:** 1

### Context that shapes this result

170 of 997 files already contain dead-click remediation, much of it citing specific
Clarity session IDs. This application has been through sustained prior dead-click work,
so the yield of a fresh sweep is low by design — the common failure modes (fake `href="#"`
links, immediate-invocation handlers, no-op handlers, unguarded submits, disabled buttons
that swallow taps) were already eliminated. The three issues below are what remained.

---

## Issues

| Page | Component | Element | Problem | Root Cause | Fix | Status |
|------|-----------|---------|---------|------------|-----|--------|
| Any (call rejoin) | `utils/hooks/useInitiateCall.js` | Post-toast redirect | User told "Please select a Kundli first", then sent to a 404 | `navigate("/call-with-astrologers/")` is not a declared route; fell through `path: "*"` → `CmsNotFoundPage` → no CMS slug → `NotFound` | Redirect to the real listing route `/astrologers`, preserving `rejoinAstro` state | **Fixed** |
| Profile → Support → Email | `screens/v2/user/Profile.jsx` | "Update Email" button | Tapped, awaited network with no feedback; repeat taps fired duplicate `updateUserProfile` calls | `onClick={async …}` with no in-flight state, no `disabled`, no label change | Added `emailSaving` state + re-entry guard + `disabled` + `aria-busy` + "Updating…" label | **Fixed** |
| Profile → Support → Email | `screens/v2/user/Profile.module.scss` | `.emailModalBtn` | Button kept `cursor: pointer` and hover lift while disabled — advertised itself as pressable while swallowing taps | No `:disabled` styling existed | Added `&:disabled { opacity .6; cursor: progress; transform: none }` | **Fixed** |

---

## Navigation Issues

Every static navigation target in the tree was extracted and matched against the 275
route paths declared in `src/utils/routes/Paths.js`.

- Static navigation targets found: **378**
- Unresolved before this pass: **5 unique**
- Unresolved after this pass: **4 unique** (all verified non-issues)

| Target | Verdict |
|---|---|
| `/call-with-astrologers/` | **Real dead route — fixed** → `/astrologers` |
| `/tarot/yes-no-tarot` | **False positive.** Declared as the relative child path `"tarot/yes-no-tarot"` (no leading slash); React Router resolves it against the parent. Works. |
| `/community-guidelines` (×2) | **Not a dead click.** Falls to the `path: "*"` catch-all, which is `<CmsNotFoundPage />` — it resolves arbitrary CMS slugs (the same mechanism that makes the footer's `/naam-karan-muhurat` etc. work). Needs a CMS-content check, not a code change. |
| `/feedback` | Same as above — CMS-backed slug. |
| `/news` | Same as above — CMS-backed slug. |

**Open item for the content owner (not a code defect):** confirm that CMS static pages
exist for the slugs `community-guidelines`, `feedback` and `news`. If any is missing, that
Support card renders `NotFound` and becomes a real dead click. This cannot be settled from
source because the CMS is external.

---

## Async / Loading Issues

Detector: inline `async onClick` handlers containing `await` with no in-flight guard and no
progress state.

| Site | Verdict |
|---|---|
| `screens/v2/user/Profile.jsx:2885` (Update Email) | **Genuine — fixed** |
| `screens/v2/user/Profile.jsx:2437` (wallet receipt) | False positive — guarded by `disabled={invoiceLoadingId === transaction._id}` |
| `screens/private/epooja/cart/AstromallCart.jsx:509` | False positive — `disabled={isValidating}` + "Verifying…" label |
| `shubhAstroMallHistory/components/OrderHistoryTab.jsx:337` | False positive — `disabled={invoiceLoadingId === orderId}` |
| `shubhAstroMallHistory/MallOrderDetail.jsx:212` | False positive — `disabled={invoiceLoading}` |

4 of 5 were false positives caused by a case-sensitive detector regex that missed
`invoiceLoadingId` / `isValidating`. Each was verified by reading the source.

---

## Pointer / Z-Index Issues

Detector: full-bleed (`inset: 0`, or `100%`/`100vw`×`100vh`) `position: fixed|absolute`
blocks with no `pointer-events` declaration. **198 blocks matched.**

This detector has low precision for dead clicks: the overwhelming majority are **modal and
drawer backdrops, which are supposed to intercept clicks** — that is how click-outside-to-
dismiss works. Reporting them would be noise.

Decorative full-bleed layers (the real interception risk) were checked individually:

| Element | Verdict |
|---|---|
| `.sparkles` — `component/ErrorBoundary.module.scss` | **Not an issue.** Confined to `.iconWrapper`, which is `position: relative` at 120×120px. Nothing interactive sits beneath it. Verified rather than assumed, because a decorative layer over the error-recovery buttons would have been serious. |
| `.countdownRing` — `AstrologerRingModal.module.scss` | Not an issue — sized element inside the modal card, not an overlay. |
| `.successBgWrapper` — `SubscriptionModal.module.scss` | Not an issue — `z-index: 0` background behind `z-index: 1` content. |

No pointer-events interception defect was confirmed this pass.

---

## JavaScript Errors

No new interaction-breaking runtime error was found. Relevant existing handling was
reviewed and is correct:

- `App.jsx` chunk-load recovery is bounded — a 60s timestamped cooldown (`CHUNK_RELOAD_COOLDOWN_MS`) so it reloads at most once, then surfaces a toast instead of looping.
- `index.html` classifies host-WebView bridge errors (`error invoking postmessage: java object is gone`) as `jsErrorKind: host_webview_bridge`. These originate in the Instagram/Facebook in-app WebView, not this application, and cannot be fixed from here.

---

## Mobile Issues

| Page | Component | Problem | Fix | Status |
|------|-----------|---------|-----|--------|
| — | — | No new mobile-specific dead click confirmed this pass | — | — |

Mobile-specific paths were reviewed and already carry in-app-browser handling from prior
work: the AI-WOW camera screens branch on `isInAppBrowser()` with upload fallbacks,
`downloadFile.js` falls back to `window.open`, and `AppDownloadSection` intercepts the Play
Store handoff that Instagram's WebView blocks. `onTouch*` / `onPointer*` usage is limited to
17 sites, none of which conflicted with a click handler.

---

## Accessibility Issues

**397 non-semantic clickable elements** (`onClick` on `div` / `span` / `img` / `p` / `li`
etc. with no `role`, no `tabIndex` and no key handler), across 167 files. Highest
concentrations: `screens/v2/user/Profile.jsx` (26), `component/UI/chips/astrologer/FilterChips.jsx`
(16), `component/UI/cards/MoreBlogsCarousel.jsx` (9), `component/TopHeader.jsx` (8).

**Deliberately not changed in this pass.** These respond correctly to mouse and touch, so
they are not Clarity dead clicks — they are a keyboard/assistive-technology gap. Converting
397 sites to `<button>` would be a mass refactor with real regression risk to layout and
styling (default button box model, `display`, font inheritance), which the brief explicitly
warns against ("Do not blindly convert elements", "Do NOT redesign the application").

Recommended as a separate, scoped workstream, prioritised by traffic: `TopHeader`, then
`FilterChips`, then the blog carousels.

Accessibility improvements that *were* made: the fixed button carries `aria-busy` during
its request, and its disabled state is now visually distinct.

---

## Detector Limitations (disclosed)

Two detectors produced unreliable output and their findings are **not** reported as issues:

1. **Nested interactive elements** — a regex tag-stream parser reported 187 hits, but
   inspection showed a single `<Link>` in `TopHeader.jsx` being treated as the parent of
   everything after it. Cause: JSX arrow functions (`=>`) contain `>`, so a regex cannot
   delimit opening tags. Reliable detection needs a real JSX/AST parser (e.g. a Babel
   pass). **Nested-interactive coverage for this pass is therefore incomplete.**
2. **Async handler guards** — the initial regex was case-sensitive and produced 4 false
   positives out of 5. All were manually verified; the detector alone should not be trusted.

---

## Verification

| Check | Command | Result |
|---|---|---|
| Production build | `npm run build-dev` | **PASS** — 4,229 modules transformed, built in 13.79s |
| Build security gate | (chained in build) | **PASS** — 0 errors, 1 pre-existing warning (vendor `localhost` strings in Agora/React-Router chunks) |
| Lint (changed files) | `npx eslint …` | **No parse errors, no new errors.** `Profile.jsx` reports only pre-existing `no-unused-vars` (unused vars starting uppercase are ignored per `eslint.config.js`) |
| Route resolution | custom detector | Unresolved static targets **5 → 4**, all 4 verified non-issues |
| Tests | — | **Not available.** No test framework in the project (no `test` script, no vitest/jest). Regression tests for these fixes cannot be added without first introducing a runner. |
| Manual QA | — | **Not performed.** No browser/device automation available in this environment; see Remaining Work. |

---

## Remaining Known Issues

1. **Manual cross-device QA not performed.** Desktop/mobile/tablet interaction testing of every CTA was not possible here. The two behavioural fixes should be spot-checked: (a) trigger a call rejoin with no kundli selected and confirm you land on `/astrologers`; (b) update an email on a throttled connection and confirm the button dims, reads "Updating…", and ignores repeat taps.
2. **CMS slug confirmation** for `community-guidelines`, `feedback`, `news` (see Navigation Issues).
3. **397 non-semantic clickables** remain keyboard-inaccessible — scoped separately above.
4. **Nested-interactive detection is incomplete** pending an AST-based detector.
5. **No test framework**, so none of these fixes are protected by regression tests.

---

## Clarity Integration

Unchanged and intact. No `clarity(...)` call was added, removed, or altered; no tracking was
disabled, filtered, or suppressed. The existing `window.clarity('set', 'jsError*')` calls in
`index.html` are pre-existing **diagnostic** tagging for error attribution, not dead-click
suppression. The three fixes change real interaction behaviour, which is the only legitimate
way to move this metric.

**This audit does not claim dead clicks are eliminated.** It claims three confirmed issues
were fixed, several candidates were disproven with evidence, and two detection gaps remain
open and disclosed.
