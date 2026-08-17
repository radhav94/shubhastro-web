/**
 * Persistent, day-scoped cache for deterministic VedicAstro responses.
 *
 * Why this exists: VedicAstro is billed per API hit against a monthly quota.
 * RTK Query's cache is in-memory only, so it is thrown away on every full page
 * load. For data that is identical for a given (date, location, language) — the
 * daily Panchang being the main one, rendered on the homepage for every single
 * visitor — that meant a fresh upstream hit on each page load.
 *
 * Entries are keyed with the date baked in and anything from a previous day is
 * pruned, so there is no stale-data window to reason about: a new date is simply
 * a new key.
 */

const PREFIX = "vedicDayCache:";

/** Today as YYYY-MM-DD in local time. */
const today = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const buildKey = (namespace, parts) =>
  `${PREFIX}${namespace}:${today()}:${JSON.stringify(parts)}`;

/** Drops any entry that is not scoped to the current date. */
const pruneStale = () => {
  const stamp = today();
  try {
    const doomed = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX) && !key.includes(`:${stamp}:`)) {
        doomed.push(key);
      }
    }
    doomed.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Private mode / storage disabled — nothing to prune.
  }
};

/**
 * @returns the cached payload for today, or null on a miss.
 */
export const readDayCache = (namespace, parts) => {
  try {
    const raw = localStorage.getItem(buildKey(namespace, parts));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const writeDayCache = (namespace, parts, value) => {
  try {
    pruneStale();
    localStorage.setItem(buildKey(namespace, parts), JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled: caching is best-effort, so ignore.
  }
};
