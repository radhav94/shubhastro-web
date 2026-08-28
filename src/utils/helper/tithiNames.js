/**
 * Tithi name helpers.
 *
 * The VedicAstro `horoscope/planet-details` response returns `ghatka_chakra.tithi`
 * as a list of entries like `"1 (പ്രതിപദം)"` — the number is the tithi index but the
 * name inside the brackets comes back transliterated into Malayalam regardless of the
 * `lang=en` we send upstream. Rather than surface a script the user did not ask for,
 * we drop the localised label and rebuild it from the tithi index.
 */

// Index -> English tithi name (1..15 within a paksha).
export const TITHI_NAMES = {
  1: "Pratipada",
  2: "Dwitiya",
  3: "Tritiya",
  4: "Chaturthi",
  5: "Panchami",
  6: "Shashthi",
  7: "Saptami",
  8: "Ashtami",
  9: "Navami",
  10: "Dashami",
  11: "Ekadashi",
  12: "Dwadashi",
  13: "Trayodashi",
  14: "Chaturdashi",
  15: "Purnima / Amavasya",
  30: "Amavasya",
};

// Anything above the Latin Extended-B block means the upstream label is in another
// script (Malayalam, Devanagari, Tamil, ...) and needs replacing.
const NON_LATIN = /[\u0250-\uFFFF]/;

/**
 * Normalises a single tithi entry to `"<index> (<English name>)"`.
 * Entries that are already in Latin script are left untouched.
 */
export const formatTithiEntry = (entry) => {
  if (entry === null || entry === undefined) return "";

  const raw = String(entry).trim();
  if (!raw) return "";

  const match = raw.match(/^(\d+)\s*(?:\(([^)]*)\))?$/);
  if (!match) return NON_LATIN.test(raw) ? "" : raw;

  const index = Number(match[1]);
  const label = (match[2] || "").trim();
  const name = TITHI_NAMES[index];

  // Keep an already-Latin label from upstream, otherwise fall back to our map.
  const resolved = label && !NON_LATIN.test(label) ? label : name;

  return resolved ? `${index} (${resolved})` : String(index);
};

/**
 * Formats `ghatka_chakra.tithi`, which can be an array or a single value.
 */
export const formatTithiList = (value) => {
  const entries = Array.isArray(value) ? value : [value];
  const formatted = entries.map(formatTithiEntry).filter(Boolean);
  return formatted.length ? formatted.join(", ") : "";
};
