/**
 * On-device diagnostic log for the Truecaller mobile-web login.
 *
 * Why this exists
 * ───────────────
 * The flow can only be tested on a real Android phone against a deployed build,
 * where there is no devtools console and `import.meta.env.DEV` is false (so the
 * existing DEV-only hints are stripped). Worse, the flow deliberately leaves the
 * page: the deep link hands control to the Truecaller app, and Android is free to
 * freeze — or discard — the browser tab while that happens. Anything held only in
 * memory (or printed to a console nobody can read) is gone by the time the user
 * comes back and sees a toast.
 *
 * So every step is appended to localStorage, which survives a tab freeze, a
 * restore, and even a full reload. `download()` then writes the whole thing to the
 * phone's Downloads folder as a plain text file that can be attached to a ticket.
 *
 * Privacy
 * ───────
 * Never log a token, phone number or email. The completed-login payload carries
 * all three, so entries record only presence and length (`hasAccessToken`,
 * `phoneLen`). The partner key is logged as a 6-char prefix plus its length —
 * enough to tell "wrong key" from "no key" without pasting a credential into a
 * file the user is about to share.
 */

const STORAGE_KEY = "tc_debug_log";
const VIEWER_KEY = "tc_debug";
/** Ring buffer size. ~200 entries is several full login attempts. */
const MAX_ENTRIES = 200;
/** Hard ceiling so a pathological loop can never fill the origin's quota. */
const MAX_CHARS = 96 * 1024;

const readAll = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupt/blocked storage (private mode, quota) — start clean rather than
    // taking the login down with us.
    return [];
  }
};

const writeAll = (entries) => {
  try {
    let out = entries.slice(-MAX_ENTRIES);
    let json = JSON.stringify(out);
    // Trim from the front until it fits; the newest lines are the useful ones.
    while (json.length > MAX_CHARS && out.length > 1) {
      out = out.slice(Math.ceil(out.length / 4));
      json = JSON.stringify(out);
    }
    localStorage.setItem(STORAGE_KEY, json);
  } catch {
    /* storage unavailable — logging must never break the flow */
  }
};

/** Session id so entries from separate attempts are visually grouped. */
let runId = null;
export const startTruecallerRun = () => {
  runId = Math.random().toString(36).slice(2, 8);
  return runId;
};

/**
 * Append one entry.
 *
 * @param {string} event - short machine-readable step name, e.g. "poll_tick"
 * @param {object} [data] - JSON-serialisable detail (already redacted)
 */
export const tcLog = (event, data = {}) => {
  const entry = {
    t: new Date().toISOString(),
    run: runId || "-",
    event,
    ...data,
  };
  const entries = readAll();
  entries.push(entry);
  writeAll(entries);
  // Also print, so `chrome://inspect` remote debugging shows the same trail.
  console.log(`[truecaller] ${event}`, data);
  return entry;
};

/** Human-readable dump, newest last — this is what lands in the .txt file. */
export const formatTruecallerLog = () => {
  const entries = readAll();
  const header = [
    "ShubhAstro — Truecaller mobile-web login diagnostic log",
    `generated : ${new Date().toISOString()}`,
    `entries   : ${entries.length}`,
    `url       : ${typeof window !== "undefined" ? window.location.href : "-"}`,
    `userAgent : ${typeof navigator !== "undefined" ? navigator.userAgent : "-"}`,
    "".padEnd(72, "-"),
  ].join("\n");

  const body = entries
    .map(({ t, run, event, ...rest }) => {
      const detail = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
      return `${t} [${run}] ${event}${detail}`;
    })
    .join("\n");

  return `${header}\n${body}\n`;
};

export const getTruecallerLogEntries = () => readAll();

export const clearTruecallerLog = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

/**
 * Save the log to the device as a text file.
 *
 * Uses a Blob + object URL rather than a data: URI because Android Chrome
 * refuses to download large data: URIs from a click handler.
 */
export const downloadTruecallerLog = () => {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const blob = new Blob([formatTruecallerLog()], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `truecaller-log-${stamp}.txt`;
    // Must be in the document for the click to be honoured on Android Chrome.
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke on the next tick; revoking synchronously can cancel the download.
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  } catch (err) {
    tcLog("log_download_failed", { message: String(err?.message || err) });
    return false;
  }
};

/** Clipboard copy, for when sharing a file is more hassle than pasting text. */
export const copyTruecallerLog = async () => {
  const text = formatTruecallerLog();
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older Android WebViews: fall back to a hidden textarea + execCommand.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
};

/**
 * Is the on-screen log viewer switched on?
 *
 * Enabled by visiting `?tclog=1` once — the flag is persisted because the
 * Truecaller round trip can drop the query string, and turning it on again mid-
 * flow would mean losing the run you were trying to capture. `?tclog=0` clears
 * it. Never on by default, so real users never see the panel.
 */
export const isTruecallerLogViewerEnabled = () => {
  try {
    const param = new URLSearchParams(window.location.search).get("tclog");
    if (param === "1") {
      localStorage.setItem(VIEWER_KEY, "1");
      return true;
    }
    if (param === "0") {
      localStorage.removeItem(VIEWER_KEY);
      return false;
    }
    return localStorage.getItem(VIEWER_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * Records whether the browser froze or discarded the page while the Truecaller
 * app was in front — the failure mode that looks identical to a backend timeout
 * from the user's side, and the reason a poll can silently stop.
 *
 * Call once; returns a detach function.
 */
export const attachTruecallerLifecycleLog = () => {
  if (typeof document === "undefined") return () => {};

  const onVisibility = () =>
    tcLog("page_visibility", { state: document.visibilityState });
  const onPageHide = (e) => tcLog("page_hide", { persisted: !!e.persisted });
  const onPageShow = (e) => tcLog("page_show", { persisted: !!e.persisted });
  const onFreeze = () => tcLog("page_freeze", {});
  const onResume = () => tcLog("page_resume", {});

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);
  document.addEventListener("freeze", onFreeze);
  document.addEventListener("resume", onResume);

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
    document.removeEventListener("freeze", onFreeze);
    document.removeEventListener("resume", onResume);
  };
};
