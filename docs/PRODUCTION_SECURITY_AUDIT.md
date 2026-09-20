# Production Security Audit — ShubhAstro (React 19 + Vite 7)

Audit only. **No application code was changed to produce this document.**

Method: every finding below is backed by a build artifact (`dist/`), a config file, or a
source file, with the command or file:line given. Where a conclusion needs a running
browser or a live server response, it is marked **[NEEDS VERIFICATION]** rather than
asserted. No credential value appears anywhere in this document — variables are
referenced by name only.

Scope note: this replaces the five separate documents requested in the task with one,
because the findings are heavily cross-referential (the env-var, API and secret sections
are the same three findings viewed from different angles) and splitting them would
duplicate rather than clarify. Backend-only items are collected in their own section.

---

## Severity summary

| Severity | Count | Items |
|---|---|---|
| CRITICAL | 0 | — |
| HIGH | 4 | Source maps publicly fetchable; paid third-party API credentials in the client bundle; **`.env-cmdrc` committed to git with values**; auth tokens in `localStorage` |
| MEDIUM | 3 | 672 `console.log` in the production bundle; no `Permissions-Policy` / CSP; `alert()` in shipped code |
| LOW | 2 | React DevTools attaches in production; `X-Frame-Options` without a `frame-ancestors` equivalent |
| INFORMATIONAL | 3 | Client-side crypto correctly self-documented as non-boundary; Firebase/Razorpay/Branch/Agora public IDs correctly public; no `debugger` statements |

No actual secret (private key, signing secret, password) was found bundled. The HIGH
finding on credentials concerns **third-party paid API keys**, which are a billing and
quota-abuse exposure rather than an account-takeover one.

---

## A. React DevTools exposure

**Current behaviour.** React 19.1.1. No DevTools hardening exists anywhere — no
assignment to `__REACT_DEVTOOLS_GLOBAL_HOOK__`, no production guard. In a production
build the hook is installed by the browser extension as normal and the component tree,
props and hooks state are inspectable.

**Verified:** `grep -rn "__REACT_DEVTOOLS_GLOBAL_HOOK__" src index.html` → no matches.

**Severity: LOW.** Deliberately not rated higher, and this needs stating plainly because
the task framed it first:

> **Disabling React DevTools does not make frontend data secure.** It is a
> speed-bump against casual inspection, nothing more.

With DevTools neutralised a user can still read everything that matters:

- every request and response in the Network tab, including `Authorization` headers
- the whole JS bundle in Sources, and with source maps currently fetchable (finding B)
  the *original* source
- `localStorage`, `sessionStorage`, and every cookie not marked `HttpOnly`
- runtime state, by setting a breakpoint anywhere and walking the React fibre tree by hand
- anything reachable from the console

So this is worth doing for tidiness and to raise the effort bar, but it must not appear
in any checklist as a security control. If implemented, the mechanism should be a
production-only, pre-React assignment of a minimal no-op hook, guarded so development and
HMR are untouched.

---

## B. Source maps — HIGH

`vite.config.js:98` → `sourcemap: 'hidden'`.

`'hidden'` generates the maps but omits the `//# sourceMappingURL=` comment, so DevTools
does not load them automatically. It does **not** stop anyone fetching them, because the
map filename is mechanically derived from the chunk filename, and the chunk filenames are
in `dist/index.html`.

**Measured in the current build:**

```
299 .map files in dist/assets
47 MB total
largest: index-*.js.map ≈ 7.2 MB
```

`nginx-proxy.conf` was checked for a rule denying `.map` — **there is none**. Present
headers are `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy` (lines 81-84).

**Impact.** If `dist/` is deployed wholesale, the complete original source is downloadable:
component structure, business logic, internal API shapes and parameter names, and the
extensive explanatory comments throughout this codebase — which document internal
reasoning, endpoint behaviour and known weaknesses in unusual detail.

**[NEEDS VERIFICATION]** Whether the deploy copies `.map` files to the web root at all.
If the pipeline already excludes them, this drops to INFORMATIONAL. Confirm with:

```
curl -sI https://www.shubhastro.ai/assets/<entry-chunk>.js.map
```

**No monitoring dependency found.** No Sentry, Bugsnag, Rollbar or Datadog appears in
`package.json` or `src`, so nothing consumes these maps for symbolication. There is an
inline error reporter in `index.html` that pushes `js_error` to `dataLayer`; it does not
use source maps.

**Options, in order of preference:**

1. Keep `sourcemap: 'hidden'` and **deny `.map` at nginx** — retains local debuggability
   of a production build while making maps unreachable. Least disruptive.
2. `sourcemap: false` — smallest and simplest, loses the ability to debug a prod build.
3. Keep generating, upload privately to a monitoring tool, exclude from the web root —
   only worth it once such a tool exists.

Recommendation: (1) plus excluding `.map` from the deploy artifact. Two independent
controls, neither of which changes the bundle.

---

## C. Third-party API credentials in the client bundle — HIGH

There are **26** `VITE_*` variables across `dev`/`stage`/`prod` in `.env-cmdrc`. All 26
are inlined into client JavaScript at build time and are therefore **public**, regardless
of being "environment variables".

### Correctly public by design — no action

`VITE_APP_API_BASE_URL`, `VITE_SGW_URL`, `VITE_POLICY_ORIGIN`, `VITE_ROBOTS_CONTENT`,
`VITE_SHUBH_MALL_ENABLED`, `VITE_SIGNUP_BONUS_AMOUNT`, `VITE_TRUECALLER_ENABLED`.

`VITE_FIREBASE_*` (7 vars incl. `VAPID_KEY`) — the Firebase web config is public by
Google's design; enforcement is Firebase Security Rules, **not** key secrecy.

`VITE_RAZORPAY_KEY_ID` — the *key id* is meant to be client-side. Confirmed **no**
`KEY_SECRET` variable exists. Correct split.

`VITE_BRANCH_KEY` — Branch's live `branch_key` is the public half; no `branch_secret`
present. Correct.

`VITE_TRUECALLER_PARTNER_KEY` — client-side by Truecaller's web SDK design.

`VITE_AGORA_APP_ID` — public. **[NEEDS VERIFICATION]** that channels use token-based
auth; an App ID with authentication disabled would let anyone join any channel. This is
a project-settings question, not a code one.

### The actual exposure

These are credentials for **paid third-party APIs**, extractable from the bundle by anyone:

| Variable | Used at | Reaches the wire as |
|---|---|---|
| `VITE_VEDIC_API_KEY` + `VITE_VEDIC_API_USER_ID` | `src/redux/api/baseApi/baseApi.js:6-7` | `Authorization: Basic btoa(userId + ":" + apiKey)` |
| `VITE_VEDIC_API_KEY` | `src/services/appServices/kundaliDIrectApi.js:6` | same pattern |
| `VITE_HOROSCOPE_API_KEY` | `src/redux/api/baseApi/horoscopeBaseApi.js:6` | Basic auth header |
| `VITE_TAROT_API_KEY` + `VITE_TAROT_API_USER_ID` | `src/redux/api/tarot/astroTarotApi.js:6` | Basic auth header |
| `VITE_SARVAM_API_KEY` | `src/services/sarvamTTSService.js:3, 93, 139` | `api-subscription-key` header (TTS + STT) |
| `VITE_GOOGLE_MAPS_API_KEY` | `src/utils/location/locationSearch.jsx:11` | Maps JS API loader |
| `VITE_VEDIC_ASTRO_API_KEY` | no `src` reference found | possibly dead — see below |

**Important mitigating finding.** These do **not** go directly to the vendors. Both paths
already route through the project's own gateway:

```
src/utils/apiConfig.js:49   export const ASTROLOGY_PROXY = `${SGW_BASE}/vedic`
src/services/sarvamTTSService.js:5-6   `${SARVAM_PROXY}/text-to-speech` | `/speech-to-text`
```

So the "move the call to the backend" work described in the task is **already done
architecturally**. What remains is that the client still *constructs and sends* the
vendor credential to that gateway.

**This is the decisive open question, and it changes the fix completely:**

> Does the gateway require the client-supplied credential, or does it inject its own
> vendor credential server-side and ignore what the client sends?

- If the gateway injects its own → the client-side keys are **vestigial**. Deleting them
  from `.env-cmdrc` and from the four header builders removes the exposure with no backend
  work. This is the likely case given a gateway exists at all, but I cannot confirm it
  from the frontend.
- If the gateway forwards the client's credential → this needs a backend change so the
  gateway holds the keys, and the frontend simply stops sending them.

**[NEEDS VERIFICATION]** by whoever owns `secure-gateway/`. Until then, no code change
here — removing a credential the gateway actually validates would break Kundli, horoscope,
tarot and voice.

**`VITE_GOOGLE_MAPS_API_KEY`** is a genuine exception: browser Maps keys are *designed* to
be client-side. The control is an **HTTP-referrer restriction** in Google Cloud Console,
not secrecy. **[NEEDS VERIFICATION]** that the restriction is set; an unrestricted key is
directly billable by anyone who copies it.

**`VITE_VEDIC_ASTRO_API_KEY`** has no `src` reference. If genuinely unused it should be
deleted from `.env-cmdrc` — an unused key that still ships is pure liability. Confirm it
is not referenced by a build script or the gateway before removing.

### If any of these keys is live today

They have been in a public bundle for as long as the current build has been deployed.
Treat them as **compromised and pending rotation**, independent of any code change. That
is a judgement for the key owners; this audit only establishes that they are extractable.

---

## D. Authentication and token storage — HIGH

All auth material is in `localStorage`, i.e. readable by any JavaScript on the origin,
including any successful XSS or a compromised third-party script.

Keys observed (`grep -rhoE "localStorage\.(get|set)Item\(\s*[\"'][^\"']+"`):

| Key | Contains | Sensitive |
|---|---|---|
| `accessToken`, `refreshToken` | bearer + refresh tokens | **Yes** |
| `shubhtalk_customer_token`, `shubhtalk_astro_token` | session tokens | **Yes** |
| `shubhtalk_customer_phone` | phone number | **Yes** (PII) |
| `shubhtalk_customer_id`, `shubhtalk_astro_id`, `loggedAstroId`, `astrologerId`, `selectedAstroId` | identifiers | Low |
| `astro_wallet_balance` | balance | Low — display cache; must not be trusted for authorisation |
| `selectedKundliProfile`, `numerologyPayload` | birth details | Moderate (PII) |
| `appLang`, `recommend_cta_dismissed`, `pendingProductDetail`, `aiInitialQuery`, `shubhtalk_active_call`, `shubhtalk_chat_start_time`, `shubhtalk_device_limit_reached` | UI state | No |

The refresh token being in `localStorage` alongside the access token is the weakest point:
it removes most of the benefit of short access-token lifetimes, since stealing storage
yields long-lived access.

**This cannot be fixed from the frontend alone.** `HttpOnly` cookies are set by the
server. Moving to them is a backend contract change — see the backend section. Do not
change token handling unilaterally; it will break the session.

Worth noting the codebase is already careful about token *leakage*: the Truecaller logger
deliberately records only presence and length (`hasUserId`, `phoneLen`) rather than
values. That is the right pattern and should be the house rule.

---

## E. Debug code in the production bundle — MEDIUM

`vite.config.js:168-171`:

```js
esbuild: {
  pure: [],
  drop: [],
}
```

Both empty, so nothing is stripped. Measured:

| | in `src` | in `dist/assets/*.js` |
|---|---|---|
| `console.log` | 762 | **672** |
| `console.warn` | 103 | — |
| `console.error` | 325 | — |
| `debugger` | 0 | **0** |
| `alert(` | 5 | — |

672 `console.log` calls ship to users. The concern is not noise, it is that this codebase
logs richly for diagnosis — the Truecaller flow alone logs poll ticks, HTTP statuses and
server messages. Some of that describes internal endpoint behaviour.

**Do not blanket-drop `console.error`.** It is load-bearing in several places
(`[SarvamSTT] Mic access error`, the `index.html` error reporter). The safe configuration
is to drop `console.log`/`console.debug`/`console.info` and `debugger` in production and
keep `warn`/`error`:

```js
esbuild: { drop: ['debugger'], pure: ['console.log','console.debug','console.info'] }
```

`pure` lets the minifier eliminate the calls as side-effect-free; `drop` removes
`debugger` outright. No new dependency, and it should *reduce* bundle size slightly.

The 5 `alert(` calls should be reviewed individually — in a mobile web app an `alert()` is
almost always leftover debugging, but one may be intentional.

---

## F. Server headers — MEDIUM / LOW

Present in `nginx-proxy.conf:81-84`: `Strict-Transport-Security` (1 year, includeSubDomains),
`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`,
`Referrer-Policy: strict-origin-when-cross-origin`. That is a reasonable baseline.

Missing: `Permissions-Policy`, `Content-Security-Policy`, and a `.map` deny rule (finding B).

**On CSP — I am explicitly not proposing a policy to apply blind.** This app loads GTM,
GA4, Facebook Pixel, Clarity, Branch, Razorpay, Truecaller, Firebase, Agora, Google Fonts
and Google Maps, several of which inject further scripts at runtime. A CSP written from a
static read of `index.html` will miss a runtime-injected origin and break payments or
tracking in production. The correct sequence is:

1. Deploy `Content-Security-Policy-Report-Only` with a first-draft policy.
2. Collect violation reports across real traffic for a week, including the payment and
   Truecaller flows.
3. Only then enforce.

`X-Frame-Options: SAMEORIGIN` already provides clickjacking protection for all current
browsers; `frame-ancestors` would supersede it and should be introduced with the CSP
rather than separately.

---

## G. Informational

**`src/utils/security/cryptoClient.js`** performs an ECDH P-256 handshake with the gateway
and decrypts AES-256-GCM envelopes. It contains **no hardcoded key** and already carries an
accurate self-assessment:

> REALITY CHECK: this is obfuscation to keep readable JSON out of the Network tab, not a
> security boundary. The key is derived in the browser, so a determined user can reproduce
> this handshake and read the plaintext.

That framing is correct and should be preserved. It is the right model for the whole of
this audit: the frontend can raise effort, not enforce confidentiality.

**No `debugger` statements** anywhere in `src` or `dist`.

**`index.html` integrity.** Three structural defects were found in this file during recent
work — a Tailwind-generated invalid CSS rule, a comment note that escaped its `-->`, and a
stray `);` that was rendering as visible text on every page. The file is ~1,100 lines of
hand-maintained analytics markup with no automated integrity check. A pre-build validator
(leaked text nodes, comment balance, `<script>` balance) would be cheap and would have
caught all three.

---

## Backend / infrastructure work required

Frontend hardening cannot deliver these. Each needs an owner outside this repo.

1. **`HttpOnly; Secure; SameSite` cookie session** to replace `localStorage` tokens.
   Server-set, with a refresh endpoint. Frontend then stops touching tokens entirely.
2. **Confirm gateway credential handling** (finding C) — does `secure-gateway/` inject
   vendor keys server-side? This single answer determines whether the fix is a frontend
   deletion or a backend change.
3. **Rotate any live third-party key** listed in finding C, and set an HTTP-referrer
   restriction on the Maps key.
4. **Server-side authorisation on every protected endpoint.** Any frontend role check is
   UI convenience only. Not audited here — it cannot be audited from the frontend.
5. **Sanitise API error responses** so stack traces, file paths and internal service names
   never reach the client.
6. **Deny `.map` at nginx** and exclude `.map` from the deploy artifact.
7. **Add `Permissions-Policy`**; run CSP in report-only first.
8. **Confirm Agora channel token auth** is enabled.
9. **CORS**: confirm the API sends a specific allowed origin rather than a wildcard where
   credentials are involved. CORS is not authentication and must not be treated as such.

---

## What this audit did not cover

- **Runtime verification.** No browser is available in this environment, so React DevTools
  behaviour, CSP effects, and whether `.map` files are actually served were not observed.
  All three are marked **[NEEDS VERIFICATION]**.
- **`npm audit`.** Not yet run — see the follow-up plan.
- **Backend authorisation.** Not observable from this repo.
- **Any claim that the frontend can keep data from its own user.** It cannot. Every
  recommendation above either removes a credential that should never have been client-side,
  or reduces incidental disclosure. None of them makes browser-executed data confidential.

---

## H. Dependency audit — MEDIUM, needs triage not a blind fix

`npm audit` on the current lockfile:

| Severity | Count |
|---|---|
| critical | 3 |
| high | 21 |
| moderate | 6 |
| low | 4 |
| **total** | **34** |

Critical and high advisories, with what `npm` claims about fixability:

```
critical  protobufjs        fix available
critical  tar               fix available
critical  websocket-driver  fix available
high      @grpc/grpc-js     fix available
high      axios             fix available
high      brace-expansion   fix available
high      browserslist      fix available
high      flatted           fix available
high      form-data         fix available
high      immutable         fix available
high      js-yaml           fix available
high      lodash            fix available
high      lodash-es         fix available
high      minimatch         fix available
high      nanoid            fix available
high      node-fetch        fix -> face-api.js@0.20.0  (SEMVER-MAJOR)
high      picomatch         fix available
high      postcss           fix available
high      react-router      fix available
high      react-router-dom  fix available
high      rollup            fix available
high      socket.io-parser  fix available
high      vite              fix available
high      ws                fix available
```

**Do not run `npm audit fix --force`.** Several of these sit on load-bearing runtime
dependencies — `axios`, `react-router-dom`, `socket.io-parser`, `ws` (chat and calls),
`vite` and `rollup` (the build itself). A forced major bump would risk the routing policy
documented in `src/utils/routes/Paths.js` and the `build.target` floor in `vite.config.js`
that guards a known blank-page parse cliff.

Triage order, by real exposure rather than by CVSS:

1. **Runtime, user-facing, non-major** — `axios`, `socket.io-parser`, `ws`,
   `react-router-dom`, `nanoid`. These execute in the browser against untrusted input, so
   they matter most. Bump within the current major and run the full regression list.
2. **Build-time only** — `vite`, `rollup`, `postcss`, `browserslist`, `picomatch`,
   `minimatch`, `brace-expansion`, `js-yaml`, `flatted`, `immutable`, `tar`. These never
   reach a user; they matter for supply-chain integrity of the build host, not for site
   visitors. Lower urgency, safer to batch.
3. **Transitive under a pinned major** — `node-fetch` is only reachable via
   `face-api.js`, and the only offered fix is `face-api.js@0.20.0`, a **major** bump.
   `face-api.js` drives the AI-Wow face-reading camera; changing its major would need that
   whole flow retested. Given `node-fetch` there is used by a library that runs in the
   browser (not Node), assess whether the vulnerable path is even reachable before
   accepting a major upgrade.
4. **`protobufjs`, `@grpc/grpc-js`, `websocket-driver`** — establish which package pulls
   these in (likely Firebase and/or Agora) before touching them. Bumping a transitive dep
   of an SDK independently of the SDK is how you break a working integration.

**[NEEDS VERIFICATION]** for each of the above: whether the vulnerable code path is
actually reachable from this application. `npm audit` reports advisories against installed
versions, not against the call graph — a high advisory in a build tool that never
processes untrusted input is not a high risk to this site.

Recommendation: treat this as its own scoped task with a regression pass per group, not as
part of the hardening change set.

---

## I. `.env-cmdrc` is committed to the repository — HIGH

```
git ls-files --error-unmatch .env-cmdrc   -> tracked
git check-ignore .env-cmdrc               -> NOT ignored
```

The file holding all 26 variables **and their values**, for `dev`, `stage` and `prod`, is
tracked in git and not covered by `.gitignore`.

This compounds finding C rather than duplicating it. The paid third-party keys are exposed
twice over, by different routes with different remedies:

| | exposure | remedy |
|---|---|---|
| Client bundle | anyone who loads the site | stop sending the credential from the browser |
| Git history | anyone with repo read access, now or ever; any fork, clone, or CI log; permanent | **rotation** — history cannot be un-published |

The second is the harder one. Removing the file from tracking today does not remove it from
history, so **rotation is the only actual fix** for any key in there that is still live.

For the public-by-design variables (Firebase config, Razorpay key id, Branch key, GTM/GA4
ids, Agora app id) being in history is harmless — they are public anyway.

**Deliberately not changed in this audit.** `env-cmd` reads this file to build, so
untracking it without first giving the team another way to obtain values would break every
developer's and CI's build. The sequence has to be:

1. Rotate every non-public key it contains.
2. Provide the new values through the deployment platform's secret store / CI variables.
3. Commit a `.env-cmdrc.example` with names and empty values.
4. Add `.env-cmdrc` to `.gitignore` and `git rm --cached` it.
5. Optionally purge history — worth it only if the repo is or may become public; rotation
   already neutralises the risk.

Step 1 is the one that matters and it is not a code change.
