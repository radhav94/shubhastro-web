/**
 * Artwork for the Rashi report: one landscape hero per moon sign, one square
 * deity portrait per nakshatra.
 *
 * Resolved by FILENAME via import.meta.glob rather than a hand-written import
 * list, so adding or replacing art is a file drop — no code change. Name the
 * files after the slug of what they depict:
 *
 *   src/assets/images/rashi/signs/capricorn.png
 *   src/assets/images/rashi/nakshatras/shravana.png
 *
 * Anything unmatched simply returns "", and every caller treats a missing image
 * as "render the card without art" rather than as a broken <img>.
 */

const SIGN_FILES = import.meta.glob("../assets/images/rashi/signs/*.{png,jpg,jpeg,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

const NAKSHATRA_FILES = import.meta.glob("../assets/images/rashi/nakshatras/*.{png,jpg,jpeg,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

/**
 * Framed zodiac tiles scattered down both edges of the report banner. Purely
 * decorative, so they are used in file order and carry no sign mapping —
 * `decor/tile-1.png`, `tile-2.png`, ... Add or remove files freely; the banner
 * lays out however many it finds.
 *
 * Matched on the `tile-` prefix, not the whole folder: `decor/` also holds
 * one-off pieces (the hero flourish) that must not turn up as a banner tile.
 */
const DECOR_FILES = import.meta.glob("../assets/images/rashi/decor/tile-*.{png,jpg,jpeg,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

export const rashiDecorTiles = Object.keys(DECOR_FILES)
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
  .map((key) => DECOR_FILES[key]);

/**
 * The embossed gold coin shown at the left of the hero card — separate art from
 * the landscape hero, so it gets its own folder on the same slug scheme:
 *
 *   src/assets/images/rashi/coins/capricorn.png
 */
const COIN_FILES = import.meta.glob("../assets/images/rashi/coins/*.{png,jpg,jpeg,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

/** "Uttara Ashadha!" -> "uttaraashadha" (spaces and punctuation dropped). */
const normalise = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Build { normalisedBasename: url } from a glob result. */
const byName = (globResult) =>
  Object.entries(globResult).reduce((acc, [path, url]) => {
    const base = path.split("/").pop().replace(/\.[^.]+$/, "");
    acc[normalise(base)] = url;
    return acc;
  }, {});

const SIGNS = byName(SIGN_FILES);
const NAKSHATRAS = byName(NAKSHATRA_FILES);
const COINS = byName(COIN_FILES);

/*
  The upstream API spells several nakshatras in its own way ("UttraShadha" for
  Uttara Ashadha, "Pushya" vs "Pushyami", ...). Rather than name the asset files
  after those spellings — which would break the moment the API is corrected —
  keep the files on the conventional names and translate here.

  Keys and values are both normalised, so casing/spacing in this table is free.
*/
const NAKSHATRA_ALIASES = {
  uttrashadha: "uttaraashadha",
  uttarashada: "uttaraashadha",
  purvashadha: "purvaashadha",
  poorvashadha: "purvaashadha",
  uttraphalguni: "uttaraphalguni",
  purvaphalguni: "purvaphalguni",
  uttrabhadrapada: "uttarabhadrapada",
  purvabhadrapada: "purvabhadrapada",
  pushyami: "pushya",
  mrigasira: "mrigashira",
  mrigashirsha: "mrigashira",
  aslesha: "ashlesha",
  swati: "swati",
  jyeshtha: "jyeshta",
  shatabhisha: "shatabhisha",
  satabhisha: "shatabhisha",
  abhijit: "abhijit",
};

/**
 * Landscape hero art for a moon sign.
 * @param {string} sign - e.g. "Capricorn"
 * @returns {string} image URL, or "" when there is no art for that sign
 */
export function getRashiSignImage(sign) {
  return SIGNS[normalise(sign)] || "";
}

/**
 * Embossed gold coin for a moon sign.
 * @param {string} sign - e.g. "Capricorn"
 * @returns {string} image URL, or "" so the caller can fall back
 */
export function getRashiCoinImage(sign) {
  return COINS[normalise(sign)] || "";
}

/**
 * Square deity portrait for a nakshatra.
 * @param {string} nakshatra - e.g. "Shravana", or the API's "UttraShadha"
 * @returns {string} image URL, or "" when there is no art for that nakshatra
 */
export function getNakshatraImage(nakshatra) {
  const key = normalise(nakshatra);
  return NAKSHATRAS[key] || NAKSHATRAS[NAKSHATRA_ALIASES[key]] || "";
}

/** Dev helper: which slugs are actually present. Used by the report's DEV hint. */
export const availableRashiArt = {
  signs: Object.keys(SIGNS),
  nakshatras: Object.keys(NAKSHATRAS),
};
