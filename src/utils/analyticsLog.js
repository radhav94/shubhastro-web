/**
 * On-device log of every analytics event the app fires.
 *
 * Why this exists
 * ───────────────
 * `trackEvent` pushes to two sinks — the GTM dataLayer and gtag — and both are
 * optional at runtime. If GTM's container hasn't loaded yet, or an ad blocker
 * removed it, `window.dataLayer` / `window.gtag` simply aren't there and the push
 * is dropped in silence. From GTM's Preview mode you can only see what arrived;
 * you cannot see what the app *tried* to send and lost. That gap is exactly where
 * "this event isn't firing" tickets come from.
 *
 * So every call is recorded here with its delivery result per sink, in
 * localStorage so it survives route changes and reloads, and can be dumped to a
 * text file or read straight from the console.
 *
 * Switching it on/off
 * ───────────────────
 * `VITE_GTM_LOG_ENABLED` in `.env-cmdrc` sets the default per environment
 * (dev: true, stage: true, prod: false). `?gtmlog=1` / `?gtmlog=0` overrides it
 * on a single device, so a prod issue can be captured without a redeploy.
 *
 * Console access (no UI needed):
 *   __gtmLog()          → console.table of the events, newest last
 *   __gtmLog.text()     → the full text dump
 *   __gtmLog.download() → save it as a .txt
 *   __gtmLog.clear()    → wipe it
 *
 * Privacy
 * ───────
 * Event properties are stored as-is, so do not put secrets in them — the same
 * rule that already applies to sending them to GTM. `user_id` is a customer id,
 * which GA receives anyway.
 */

const STORAGE_KEY = "gtm_event_log";
const ENABLED_KEY = "gtm_log";

/**
 * Which GTM containers / GA measurement IDs are actually live on the page.
 *
 * Read from the page rather than hardcoded from index.html, because that is the
 * question worth answering: `sent: both` only says the two sinks existed, not
 * which container received the event. A stage build pointed at the prod container
 * (or a container that never loaded) looks identical otherwise.
 *
 * `window.google_tag_manager` is keyed by every id GTM/gtag has initialised —
 * `GTM-…`, `G-…`, `AW-…`. It only appears once the remote script has run, so fall
 * back to reading the ids off the script tags, which are in the HTML from the
 * start.
 *
 * @returns {{ gtm: string[], ga: string[], other: string[] }}
 */
export const getTagIds = () => {
  const ids = new Set();
  try {
    const registry = window.google_tag_manager;
    if (registry) Object.keys(registry).forEach((k) => ids.add(k));
  } catch {
    /* ignore */
  }
  try {
    document
      .querySelectorAll('script[src*="googletagmanager.com"]')
      .forEach((el) => {
        const m = /[?&]id=([^&]+)/.exec(el.src || "");
        if (m) ids.add(decodeURIComponent(m[1]));
      });
  } catch {
    /* ignore */
  }

  const all = [...ids];
  return {
    gtm: all.filter((id) => /^GTM-/i.test(id)),
    ga: all.filter((id) => /^G-/i.test(id)),
    // AW- (Google Ads), DC- (Floodlight), and GTM's internal keys.
    other: all.filter((id) => !/^(GTM-|G-)/i.test(id)),
  };
};

/** Compact "GTM-x,G-y" form, for storing on each entry and in the dump header. */
const tagIdsSummary = () => {
  const { gtm, ga } = getTagIds();
  return [...gtm, ...ga].join(",") || "none";
};
/** Ring buffer size. Enough for a long session without filling storage. */
const MAX_ENTRIES = 300;
/** Hard ceiling so a render loop firing events can't exhaust the quota. */
const MAX_CHARS = 128 * 1024;

const readAll = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupt or blocked storage (private mode, quota) — start clean rather than
    // taking analytics down with us.
    return [];
  }
};

const writeAll = (entries) => {
  try {
    let out = entries.slice(-MAX_ENTRIES);
    let json = JSON.stringify(out);
    // Trim from the front until it fits; the newest events are the useful ones.
    while (json.length > MAX_CHARS && out.length > 1) {
      out = out.slice(Math.ceil(out.length / 4));
      json = JSON.stringify(out);
    }
    localStorage.setItem(STORAGE_KEY, json);
  } catch {
    /* storage unavailable — logging must never break tracking */
  }
};

/**
 * The environment's default, from `VITE_GTM_LOG_ENABLED` in `.env-cmdrc`
 * (dev: true, stage: true, prod: false). Vite inlines env vars as strings, so
 * "false" would be truthy if compared directly.
 *
 * Unset falls back to dev-only, which keeps the util working in any build that
 * hasn't defined the flag.
 */
const ENV_DEFAULT = (() => {
  const raw = import.meta.env.VITE_GTM_LOG_ENABLED;
  if (raw === undefined || raw === "") return !!import.meta.env.DEV;
  return String(raw).toLowerCase() === "true";
})();

/**
 * Is event recording (and the on-screen panel) switched on?
 *
 * Precedence, highest first:
 *   1. `?gtmlog=1` / `?gtmlog=0` — a per-device override, so the flag can be
 *      turned on against a prod build without a redeploy. Persisted, because the
 *      events worth capturing usually span a navigation that drops the query
 *      string.
 *   2. `VITE_GTM_LOG_ENABLED` — the environment's default.
 */
export const isAnalyticsLogEnabled = () => {
  try {
    const param = new URLSearchParams(window.location.search).get("gtmlog");
    if (param === "1") {
      localStorage.setItem(ENABLED_KEY, "1");
      return true;
    }
    if (param === "0") {
      // Explicit off, recorded so it survives reloads even where the env says on.
      localStorage.setItem(ENABLED_KEY, "0");
      return false;
    }
    const stored = localStorage.getItem(ENABLED_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
    return ENV_DEFAULT;
  } catch {
    // Storage blocked (private mode) — fall back to the build's own setting.
    return ENV_DEFAULT;
  }
};

// Resolved once: reading localStorage + parsing the query string on every event
// would be wasteful, and the flag cannot change without a reload anyway.
let enabled = null;
const checkEnabled = () => {
  if (enabled === null) enabled = isAnalyticsLogEnabled();
  return enabled;
};

/**
 * Record one event.
 *
 * @param {string} event - the event name as sent to GTM/GA
 * @param {object} payload - the full property bag that was sent
 * @param {{ dataLayer: boolean, gtag: boolean }} delivered - which sinks accepted it
 */
export const logAnalyticsEvent = (event, payload, delivered) => {
  if (!checkEnabled()) return;
  const entries = readAll();
  entries.push({
    t: new Date().toISOString(),
    event,
    // "both" | "dataLayer" | "gtag" | "none" — "none" means nothing received it.
    sent:
      delivered.dataLayer && delivered.gtag
        ? "both"
        : delivered.dataLayer
          ? "dataLayer"
          : delivered.gtag
            ? "gtag"
            : "none",
    // Recorded per entry, not once for the session: the container loads
    // asynchronously, so early events can legitimately show fewer ids than later
    // ones — which is exactly how "fired before GTM was ready" shows up.
    tags: tagIdsSummary(),
    path: typeof window !== "undefined" ? window.location.pathname : "-",
    props: payload,
  });
  writeAll(entries);
};

export const getAnalyticsLogEntries = () => readAll();

export const clearAnalyticsLog = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

/** Human-readable dump, newest last — this is what lands in the .txt file. */
export const formatAnalyticsLog = () => {
  const entries = readAll();
  const counts = entries.reduce((acc, e) => {
    acc[e.event] = (acc[e.event] || 0) + 1;
    return acc;
  }, {});
  const dropped = entries.filter((e) => e.sent === "none").length;

  const { gtm, ga, other } = getTagIds();

  const header = [
    "ShubhAstro — analytics / GTM event log",
    `generated  : ${new Date().toISOString()}`,
    `entries    : ${entries.length}`,
    `not sent   : ${dropped}${dropped ? "  (no dataLayer and no gtag at the time)" : ""}`,
    `url        : ${typeof window !== "undefined" ? window.location.href : "-"}`,
    `userAgent  : ${typeof navigator !== "undefined" ? navigator.userAgent : "-"}`,
    `dataLayer  : ${Array.isArray(window?.dataLayer) ? `present (${window.dataLayer.length} items)` : "MISSING"}`,
    `gtag       : ${typeof window?.gtag === "function" ? "present" : "MISSING"}`,
    `GTM cont.  : ${gtm.join(", ") || "NONE DETECTED"}`,
    `GA4 meas.  : ${ga.join(", ") || "NONE DETECTED"}`,
    ...(other.length ? [`other ids  : ${other.join(", ")}`] : []),
    "".padEnd(78, "-"),
    "counts by event:",
    ...Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, n]) => `  ${String(n).padStart(4)}  ${name}`),
    "".padEnd(78, "-"),
  ].join("\n");

  const body = entries
    .map(({ t, event, sent, tags, path, props }) =>
      [
        `${t}  ${String(sent).padEnd(9)} ${event}`,
        `    tags : ${tags || "-"}`,
        `    path : ${path}`,
        `    props: ${JSON.stringify(props)}`,
      ].join("\n")
    )
    .join("\n");

  return `${header}\n${body}\n`;
};

/**
 * Save the log as a text file.
 *
 * Blob + object URL rather than a data: URI, because Chrome on Android refuses to
 * download large data: URIs from a click handler.
 */
export const downloadAnalyticsLog = () => {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const blob = new Blob([formatAnalyticsLog()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gtm-event-log-${stamp}.txt`;
    // Must be in the document for the click to be honoured on Android Chrome.
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoking synchronously can cancel the download.
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  } catch {
    return false;
  }
};

/**
 * Expose the console helpers. Called once from analytics.js so that simply
 * importing `trackEvent` anywhere is enough to get them.
 */
export const installAnalyticsLogConsoleApi = () => {
  if (typeof window === "undefined" || window.__gtmLog) return;

  const api = () => {
    const rows = readAll().map(({ t, event, sent, tags, path, props }) => ({
      time: t.slice(11, 23),
      event,
      sent,
      tags,
      path,
      props: JSON.stringify(props),
    }));
    console.table(rows);
    return `${rows.length} events — __gtmLog.text() / .download() / .clear() / .ids()`;
  };
  api.ids = getTagIds;
  api.entries = getAnalyticsLogEntries;
  api.text = formatAnalyticsLog;
  api.download = downloadAnalyticsLog;
  api.clear = clearAnalyticsLog;
  api.enabled = isAnalyticsLogEnabled;

  window.__gtmLog = api;
};
