#!/usr/bin/env node
/**
 * Post-build production security check.
 *
 * INTENDED HOME: `scripts/check-production-security.js`, alongside
 * generate-sitemap.js. It lives in `tools/` only because `scripts/` is owned by
 * root (drwxr-xr-x root:staff) and is not writable by the build user. To move it:
 *
 *   sudo chown -R "$(id -un)":staff scripts
 *   git mv tools/check-production-security.js scripts/
 *   # then update the package.json build scripts to match
 *
 * Why this exists
 * ---------------
 * index.html is ~1,100 lines of hand-maintained analytics markup and inline
 * script with no integrity check, and three separate structural defects reached
 * production through it:
 *
 *   1. a Tailwind-generated invalid CSS rule (`https: //…;`) produced from a
 *      bracketed URL inside a JSDoc comment, warning on every build
 *   2. a comment note that escaped its `-->` during an edit
 *   3. a stray `);` outside every <script>, which the browser painted as visible
 *      text on every page — this one shipped and was live
 *
 * All three are trivial to detect mechanically and easy to miss by eye.
 *
 * Design rules
 * ------------
 * - No dependencies. Plain node, reads files, exits non-zero on error.
 * - ERROR fails the build. WARN reports and passes, for deployment-pipeline
 *   concerns this script cannot verify by itself.
 * - No naive secret scanning. Public identifiers (GA4 measurement IDs, GTM
 *   container IDs, Firebase web config, Razorpay key *ids*, Branch keys) are
 *   public by design and are NOT flagged — a check that cries wolf gets ignored.
 *   Only variable *names* denoting a private credential match, and a matched
 *   value is never printed.
 *
 * Usage:  node tools/check-production-security.js [distDir]
 */

// ESM: package.json sets "type": "module", so `require` is unavailable here.
import fs from "node:fs";
import path from "node:path";

const DIST = process.argv[2] || "dist";
const errors = [];
const warnings = [];
const notes = [];

const rel = (p) => path.relative(process.cwd(), p);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

if (!fs.existsSync(DIST)) {
  console.error(`[security-check] dist directory not found: ${DIST}`);
  process.exit(1);
}

const files = walk(DIST);
const jsFiles = files.filter((f) => f.endsWith(".js"));
const htmlFiles = files.filter((f) => f.endsWith(".html"));
const cssFiles = files.filter((f) => f.endsWith(".css"));

/* 1. Source maps — WARN.
 * `sourcemap: 'hidden'` is deliberate in vite.config.js so a production build
 * stays debuggable locally, and nginx 404s *.map. The files are still written to
 * disk, so the deploy must exclude them — a pipeline property, not a build one. */
const maps = files.filter((f) => f.endsWith(".map"));
if (maps.length) {
  const mb = (maps.reduce((s, f) => s + fs.statSync(f).size, 0) / 1048576).toFixed(1);
  warnings.push(
    `${maps.length} source map(s) in ${DIST} (${mb} MB). Exclude *.map from the ` +
      `deploy artifact; nginx also returns 404. If monitoring needs them, upload ` +
      `privately from CI.`
  );
}

/* 2. debugger — always an error. Word-boundary so `debuggerFoo` is not a hit. */
for (const f of jsFiles) {
  if (/(^|[^\w$.])debugger\s*(;|}|$)/m.test(fs.readFileSync(f, "utf8"))) {
    errors.push(`debugger statement in ${rel(f)}`);
  }
}

/* 3. Development endpoints — WARN, not ERROR, and deliberately so.
 *
 * The first version of this check errored on any `http://localhost` in any JS.
 * That failed the build on four chunks, and all four were false positives:
 * vendor code. The Agora SDK and React Router both embed localhost strings in
 * dev fallbacks and error-message templates. None of it is our configuration.
 *
 * A string match cannot tell "our API base URL is misconfigured" from "a vendor
 * shipped a doc URL". What actually matters is whether the app's own API origin
 * points at localhost, and that is worth a human glance rather than a hard fail
 * on evidence this weak. So: report, do not block. */
const LOCAL_RE = /https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/g;
const localHits = [];
for (const f of jsFiles) {
  const hits = fs.readFileSync(f, "utf8").match(LOCAL_RE);
  if (hits) localHits.push(`${rel(f)} (${[...new Set(hits)].slice(0, 2).join(", ")})`);
}
if (localHits.length) {
  warnings.push(
    `localhost URL(s) present in ${localHits.length} chunk(s). Usually vendor ` +
      `dev-fallback strings (Agora, React Router) and harmless. Confirm the app's ` +
      `own API origin is not a dev value: ${localHits.slice(0, 3).join("; ")}`
  );
}

/* 4. Private-credential variable NAMES. Never value shapes, so public config is
 * not flagged. A hit means a name that should never be client-side is present. */
const SECRET_NAME_RE = new RegExp(
  [
    "[A-Z0-9_]*SECRET[A-Z0-9_]*",
    "[A-Z0-9_]*PRIVATE_KEY[A-Z0-9_]*",
    "[A-Z0-9_]*_PASSWORD[A-Z0-9_]*",
    "JWT_SECRET",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_ACCESS_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "WEBHOOK_SECRET",
    "SERVICE_ACCOUNT",
  ].join("|")
);
/* Known-benign identifiers that match the pattern above but are not credentials.
 * Without this allowlist the check failed the build on three of them, which is
 * how a security check earns a permanent `|| true`.
 *
 *   SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED
 *     React's own internal sentinel property name. Ships in every React app.
 *   ILLEGAL_AES_PASSWORD / *_PASSWORD error codes
 *     Agora SDK error-code constants — names of failure enums, not secrets.
 *
 * Add to this list only after confirming the identifier is a library constant.
 * If in doubt, treat it as a real finding. */
const BENIGN_IDENTIFIERS = [
  /SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED/,
  /SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED/,
  /ILLEGAL_AES_PASSWORD/,
  /^ERR_[A-Z0-9_]*PASSWORD/,
  /*
    Route-table keys from src/utils/routes/Paths.js:

        FORGOT_PASSWORD: { path: "/forgot-password", element: ForgotPassword },
        VERIFY_PASSWORD: { path: "/verify-password/:id", element: VerifyPassword },

    Object property names, so esbuild does not mangle them and they ship in the
    entry chunk. There is no value attached to either — the screens they name
    collect a password from the user and POST it; nothing is embedded at build
    time. Verified by reading the declarations, not inferred from the names.
  */
  /^FORGOT_PASSWORD$/,
  /^VERIFY_PASSWORD$/,
];
/*
  Every match, not just the first.

  This loop used to be `src.match(SECRET_NAME_RE)` — no /g flag, so it returned
  only the FIRST matching identifier in each chunk, and one benign hit silenced
  the entire file. That is not a theoretical gap. React's internal
  `SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED` sits in the allowlist above and
  is present in almost any chunk containing React, so for as long as it happened
  to appear before a real finding, that finding was never examined and the build
  passed.

  It was caught by accident: a bundle-splitting change moved React's sentinel out
  of the entry chunk, and the check immediately "started failing" on
  FORGOT_PASSWORD — an identifier that had been shipping in that same chunk all
  along, 108 bytes from VERIFY_PASSWORD, which had never been looked at either.
  Nothing about the payload changed; only which match came first.

  So: scan all matches, de-duplicate, drop the benign ones, and report what is
  left. This strictly widens detection — an identifier hidden behind a benign
  one is now reported instead of skipped.
*/
const SECRET_NAME_RE_ALL = new RegExp(SECRET_NAME_RE.source, "g");
for (const f of jsFiles.concat(htmlFiles)) {
  const src = fs.readFileSync(f, "utf8");
  const found = [...new Set(src.match(SECRET_NAME_RE_ALL) || [])].filter(
    (name) => !BENIGN_IDENTIFIERS.some((re) => re.test(name))
  );
  for (const name of found) {
    errors.push(
      `secret-like identifier "${name}" in ${rel(f)} (value withheld). Confirm ` +
        `whether a real credential shipped; if so ROTATE it and move the operation ` +
        `server-side.`
    );
  }
}

/* 5. HTML integrity — the three defects described at the top. */
for (const f of htmlFiles) {
  const src = fs.readFileSync(f, "utf8");

  // Comment balance.
  let depth = 0;
  let stray = 0;
  for (let i = 0; ; ) {
    const open = src.indexOf("<!--", i);
    const close = src.indexOf("-->", i);
    if (open < 0 && close < 0) break;
    if (open >= 0 && (close < 0 || open < close)) {
      depth++;
      i = open + 4;
    } else {
      if (depth === 0) stray++;
      else depth--;
      i = close + 3;
    }
  }
  if (depth !== 0) errors.push(`${rel(f)}: ${depth} unclosed HTML comment(s)`);
  if (stray !== 0) errors.push(`${rel(f)}: ${stray} stray "-->"`);

  // Mask comments once, and use the masked copy for everything below.
  const masked = src.replace(/<!--[\s\S]*?-->/g, (m) => " ".repeat(m.length));

  // <script> balance — counted on the MASKED copy.
  //
  // The first version counted the raw source and reported "21 open vs 19 close"
  // on a file that is actually balanced at 16/16. The extra hits were <script>
  // written inside HTML comments, e.g. the commented-out Branch tail. Counting
  // raw text makes any documentation mentioning a script tag look like a defect.
  const opens = (masked.match(/<script\b/gi) || []).length;
  const closes = (masked.match(/<\/script\s*>/gi) || []).length;
  if (opens !== closes) {
    errors.push(`${rel(f)}: <script> imbalance — ${opens} open vs ${closes} close`);
  }

  // Text outside script/style/title/textarea would render on the page.
  const skip = [];
  for (const re of [
    /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,
    /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,
    /<title\b[^>]*>[\s\S]*?<\/title\s*>/gi,
    /<textarea\b[^>]*>[\s\S]*?<\/textarea\s*>/gi,
  ]) {
    let m;
    while ((m = re.exec(masked))) skip.push([m.index, m.index + m[0].length]);
  }
  const inSkip = (i) => skip.some(([a, b]) => i >= a && i < b);

  for (let i = 0; i < masked.length; ) {
    if (masked[i] === "<") {
      const e = masked.indexOf(">", i);
      if (e < 0) break;
      i = e + 1;
      continue;
    }
    const next = masked.indexOf("<", i);
    const end = next < 0 ? masked.length : next;
    const chunk = masked.slice(i, end);
    if (chunk.trim() && !inSkip(i)) {
      const line = src.slice(0, i).split("\n").length;
      errors.push(
        `${rel(f)}: text outside script/style/title renders on the page — line ` +
          `${line}: ${JSON.stringify(chunk.trim().slice(0, 60))}`
      );
    }
    i = end;
  }
}

/* 6. Tailwind arbitrary-property artefacts, e.g. `.\[https\:\/\/…\]`, produced
 * from a bracketed "name:value" string anywhere the content scanner reads —
 * including JS comments. Emits invalid CSS. */
for (const f of htmlFiles.concat(cssFiles)) {
  if (/\.\\\[[a-zA-Z-]+\\:/.test(fs.readFileSync(f, "utf8"))) {
    warnings.push(
      `${rel(f)}: Tailwind arbitrary-property artefact — a bracketed "name:value" ` +
        `string was scanned from source and emitted invalid CSS.`
    );
  }
}

notes.push(
  `scanned ${files.length} files (${jsFiles.length} JS, ${cssFiles.length} CSS, ${htmlFiles.length} HTML)`
);

console.log("\n[security-check] production build inspection");
notes.forEach((n) => console.log(`  · ${n}`));
warnings.forEach((w) => console.log(`  WARN  ${w}`));
errors.forEach((e) => console.log(`  ERROR ${e}`));

if (errors.length) {
  console.log(
    `\n[security-check] FAILED — ${errors.length} error(s), ${warnings.length} warning(s)\n`
  );
  process.exit(1);
}
console.log(`\n[security-check] PASSED — 0 errors, ${warnings.length} warning(s)\n`);
