# ShubhTalk Web Application - Audit Report

**Date:** June 6, 2026  
**Scope:** Full application code review (design, functionality, performance, security, accessibility, SEO)

---

## 🔴 Critical: Security

| # | Issue | File | Details |
|---|-------|------|---------|
| 1 | API keys exposed in source control | `.env-cmdrc` | Razorpay live key (`rzp_live_Sx60FCjicmF2IK`), Sarvam API key, Google Maps key, Firebase config, Vedic/Horoscope/Tarot API keys are all committed to git. All environments share the same keys. |
| 2 | Basic Auth credentials baked into client bundle | `src/redux/api/baseApi/baseApi.js` | `btoa(userId + ":" + apiKey)` is visible to anyone inspecting the JS bundle in browser DevTools. Should proxy through backend. |
| 3 | Auth tokens stored in localStorage | `src/services/privateRequest.js` | Vulnerable to XSS — any injected script can steal auth tokens. Consider httpOnly cookies or sessionStorage with proper CSP. |

---

## 🟠 Code Quality

| # | Issue | File | Details |
|---|-------|------|---------|
| 4 | Console.logs left in production code | `src/App.jsx` (lines 97-109), `src/screens/private/horoscope/Horoscope.jsx` | Debug logging for chunk errors and category IDs. Should be removed or gated behind `import.meta.env.DEV`. |
| 5 | Duplicate object key | `src/screens/private/horoscope/Horoscope.jsx` | `total_score` is defined twice in `categoryImages` object. Second definition silently overwrites the first. |
| 6 | No code-splitting on routes | `src/utils/routes/Paths.js` | 100+ screen components are statically imported at the top. The entire app is in one massive bundle. Should use `React.lazy()` for route-level splitting. |
| 7 | Unused imports | `src/layouts/Footer.jsx` | Imports `useEffect`, `useDispatch`, `logout`, `clearSelectedKundli`, `navigate`, `location` — none are used in the component. |
| 8 | Fabricated online count | `src/screens/v2/home-v2/HomeV2.jsx` | Community "online" count uses `Math.random()` to generate fake numbers. Misleads users about actual platform activity. |
| 9 | Massive commented-out code | `src/component/TopHeader.jsx`, `src/layouts/Footer.jsx` | ~100+ lines of commented-out NavLinks and sections. Clutters codebase and confuses future developers. |
| 10 | No PropTypes or TypeScript | Entire codebase | Zero type safety. Props are passed without validation, making refactoring risky and bugs harder to catch. |

---

## 🟠 SEO

| # | Issue | File | Details |
|---|-------|------|---------|
| 11 | SVG used as og:image | `src/component/SeoHelmet.jsx` | `og:image` points to `/images/ShubhAstrologo.svg`. Social platforms (Facebook, WhatsApp, LinkedIn, Twitter) do NOT render SVG previews. Must be PNG/JPG, minimum 1200×630px. |
| 12 | No base `<title>` or `<meta description>` in HTML | `index.html` | If React fails to hydrate, search engine crawlers see no title or description. Add static fallback values. |
| 13 | No structured data (JSON-LD) | `index.html` | Missing Schema.org markup for Organization, WebSite, BreadcrumbList. No rich snippets in search results. |
| 14 | Canonical URL includes query params | `src/component/SeoHelmet.jsx` | Uses `window.location.href` which includes `?query=x` and `#hash`. Should strip params for canonical. |
| 15 | No sitemap reference | `index.html` | No `<link rel="sitemap" href="/sitemap.xml">`. Crawlers rely on robots.txt to find it. |
| 16 | Multiple `<h1>` tags possible | `src/screens/v2/home-v2/HomeV2.jsx` | Both `HeroGroupLayout` and the ungrouped hero renderer output `<h1>`. Conditionally, multiple h1s can exist on the page. |

---

## 🟠 Accessibility (a11y)

| # | Issue | File | Details |
|---|-------|------|---------|
| 17 | Zoom completely disabled | `index.html`, `src/main.jsx`, `src/global.css` | Violates WCAG 1.4.4 (Resize Text). Users with low vision cannot zoom. Consider allowing zoom and fixing overflow at the CSS level instead. |
| 18 | No skip-to-content link | `index.html` / `HomeLayout` | No mechanism to skip repetitive navigation for keyboard/screen reader users. |
| 19 | Mobile drawer lacks focus trap | `src/component/TopHeader.jsx` | When hamburger menu opens, focus is not trapped. Users can tab to elements behind the overlay. |
| 20 | Dropdowns lack ARIA patterns | `src/component/TopHeader.jsx` | Profile dropdown and calculator dropdown don't use `aria-haspopup`, `aria-expanded`, or `role="menu"`. |
| 21 | Hamburger menu not keyboard accessible | `src/component/TopHeader.jsx` | Only has `onClick`. Missing `role="button"`, `tabIndex`, and `onKeyDown` handler. |
| 22 | Color contrast concerns | `src/global.css` | Scrollbar thumb is `#fff` on potentially light backgrounds. Validation error text `orangered` may not meet 4.5:1 ratio. |

---

## 🟠 Performance

| # | Issue | File | Details |
|---|-------|------|---------|
| 23 | No route-level code splitting | `src/utils/routes/Paths.js` | All screens bundled together. Initial JS payload is unnecessarily large. |
| 24 | 329 pre-minified CSS files in public/ | `public/css/` | These appear to be legacy/pre-built module CSS files. Unclear if they're all loaded or tree-shaken. Audit for unused files. |
| 25 | Google Translate script loaded synchronously | `index.html` | Can block Time to Interactive. Add `async` or `defer`, or load conditionally. |
| 26 | Eagerly loaded images in HomeV2 | `src/screens/v2/home-v2/HomeV2.jsx` | 13 static images + 5 community avatars imported at top level. Load below-fold images lazily. |
| 27 | No `React.memo` on expensive components | `src/screens/v2/home-v2/HomeV2.jsx` | `HeroGroupLayout` and `ThreeColGroupLayout` re-render on any parent state change. |
| 28 | Preloading wrong LCP image | `index.html` | Preloads `AiPandit.png` with high priority, but if PanditAI bubble isn't the LCP element on the actual rendered page, this wastes bandwidth. |

---

## 🟠 Functionality Bugs

| # | Issue | File | Details |
|---|-------|------|---------|
| 29 | Apple App Store link is fake | `src/layouts/Footer.jsx` | `href="https://apps.apple.com/app/shubhtalk/id123456789"` — placeholder ID, leads to 404. |
| 30 | Twitter/X link is generic | `src/layouts/Footer.jsx` | `href="https://twitter.com"` — not the actual ShubhAstro handle. Should be `https://twitter.com/ShubhAstro` or correct handle. |
| 31 | Typo in Footer | `src/layouts/Footer.jsx` (line ~19) | `"Tommorow Horoscope"` → should be `"Tomorrow Horoscope"`. |
| 32 | Duplicate route definitions | `src/utils/routes/Paths.js` | `/tomorrow-horoscope/:sign` defined in multiple places. Can cause route matching conflicts. |
| 33 | No error boundaries on sections | `src/screens/v2/home-v2/HomeV2.jsx` | If one API-driven section throws, the entire page crashes. Each section should have its own error boundary. |
| 34 | No token refresh mechanism | `src/services/privateRequest.js` | On 401, immediately redirects to login. Should attempt silent token refresh first. |
| 35 | `publicRequest.js` attaches auth token | `src/services/publicRequest.js` | The "public" request service still sends Bearer tokens from localStorage, blurring the public/private API boundary. |

---

## 🟡 Architecture & Design

| # | Issue | File | Details |
|---|-------|------|---------|
| 36 | Dev and Stage share identical config | `.env-cmdrc` | Same Firebase, API keys, Google Maps key across dev/stage. No actual environment isolation for testing. |
| 37 | Feature flag changes require reload | `src/App.jsx` | Router is `useMemo`'d once. `isShubhMallEnabled()` changes aren't reactive — requires full page reload. |
| 38 | Overly aggressive `max-width: 100vw` | `src/global.css` | Applied to `*, *::before, *::after`. Can break modals, tooltips, dropdowns, and absolute-positioned elements. |
| 39 | Overloaded Paths.js | `src/utils/routes/Paths.js` | Acts as both route registry AND component importer (~600 lines). Should separate route definitions from component loading. |
| 40 | No API response caching strategy | `src/redux/api/` | RTK Query caches are per-session only. No persistent cache, no stale-while-revalidate for static content like horoscope data. |

---

## Priority Recommendations

### Immediate (This Sprint)
1. Fix fake App Store link (#29) — misleads users
2. Fix typo "Tommorow" (#31) — visible to all users
3. Fix Twitter link (#30) — broken social presence
4. Add base `<title>` and `<meta description>` to `index.html` (#12)
5. Remove console.logs (#4)

### Short-term (Next 2 Sprints)
6. Move API keys to server-side proxy (#1, #2)
7. Add `React.lazy()` code splitting to Paths.js (#6, #23)
8. Fix og:image to use PNG (#11)
9. Add error boundaries per section (#33)
10. Remove unused imports (#7)

### Medium-term (Next Quarter)
11. Add structured data / JSON-LD (#13)
12. Implement token refresh flow (#34)
13. Add ARIA patterns to dropdowns (#20)
14. Separate route config from component imports (#39)
15. Audit and remove unused public/css files (#24)

---

*Generated by automated code review. Manual testing with real devices and assistive technologies is recommended for full accessibility validation.*
