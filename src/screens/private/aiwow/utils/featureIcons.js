/*
 * Feature icons for the Result History cards.
 *
 * Every history card used to render the same hardcoded "✦" glyph, because
 * AIWow.jsx passed `featureIcon: null`. The icons do exist in the CMS: the
 * ai-suites page payload (`homepage/?slug=ai-suites`, already fetched on this
 * screen for the feature grid) gives every feature an `icon` URL, which is what
 * FeatureCard renders. These helpers reuse that payload to put the real icon on
 * the matching history row.
 *
 * Matching is by name/slug rather than id because the history API keys a record
 * by `featureType` (e.g. "face-analysis", "gemstone-scanner") and labels it with
 * `featureName` (e.g. "Astro Face Reading"), neither of which is the CMS id.
 */

/** Lowercase, collapse every run of non-alphanumerics to a single hyphen. */
export const normalizeFeatureKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/*
 * featureType values that share no prefix with the CMS slug, so neither an exact
 * match nor the containment fallback below can find them. Keys and values are
 * already normalised.
 */
const FEATURE_TYPE_TO_SLUG = {
  "face-analysis": "astro-face-reading",
  "face-reading": "astro-face-reading",
  "gemstone-scanner": "gemstone-authenticity",
  "clothes-color": "clothes-colour-analysis",
  "color-analysis": "clothes-colour-analysis",
  "cloth-color": "clothes-colour-analysis",
  // Muhurat Calendar is still keyed by its original name in several APIs.
  "agentic-calendar": "muhurat-calendar",
  "agentic-calendar-report": "muhurat-calendar",
  // Kundli chat is surfaced as "Talk to your Kundli" in the CMS.
  "kundli-chat": "talk-to-your-kundli",
  "talk-to-kundli": "talk-to-your-kundli",
  "daily-horoscope": "daily-cosmic-briefing",
  matchmaking: "smart-matchmaking",
  vastu: "ar-vastu-scanner",
  "ar-vastu": "ar-vastu-scanner",
  dream: "dream-interpreter",
};

/**
 * Flattens the ai-suites sections into { normalizedKey: iconUrl }, indexing each
 * feature under both its slug and its title so either side of the history
 * payload can find it.
 *
 * @param {Array} sections - aiwowData?.data?.list
 * @returns {Record<string, string>}
 */
export const buildFeatureIconMap = (sections) => {
  const map = {};
  if (!Array.isArray(sections)) return map;

  for (const section of sections) {
    for (const feature of section?.content || []) {
      const icon = feature?.icon;
      if (!icon) continue;
      for (const key of [feature.slug, feature.title]) {
        const normalized = normalizeFeatureKey(key);
        if (normalized && !map[normalized]) map[normalized] = icon;
      }
    }
  }
  return map;
};

/** Exact key, then alias, then containment either way ("aura" ↔ "aura-photography"). */
const lookup = (map, value) => {
  const key = normalizeFeatureKey(value);
  if (!key) return null;
  if (map[key]) return map[key];

  const aliased = FEATURE_TYPE_TO_SLUG[key];
  if (aliased && map[aliased]) return map[aliased];

  /*
   * Loose fallback so a feature renamed on one side still resolves without a
   * code change. Guarded by a 4-character minimum: shorter fragments match far
   * too many slugs and would put the wrong icon on the card, which is worse
   * than the neutral fallback glyph.
   */
  if (key.length >= 4) {
    const hit = Object.keys(map).find((k) => k.includes(key) || key.includes(k));
    if (hit) return map[hit];
  }
  return null;
};

/**
 * Resolves the icon for one history row.
 *
 * Any icon the history API itself returns wins — if the backend starts sending
 * one per record it is authoritative and needs no mapping. Otherwise the CMS
 * icon is matched on featureName, then featureType, then the route slug.
 *
 * @param {Record<string, string>} iconMap - from buildFeatureIconMap
 * @param {Object} item - a history record
 * @returns {string|null} icon URL, or null to let the card show its fallback
 */
export const resolveFeatureIcon = (iconMap, item) => {
  const direct = item?.featureIcon || item?.icon;
  if (typeof direct === "string" && direct.trim()) return direct;

  /*
   * `image` / `featureImage` are deliberately NOT treated as the module logo up
   * front: on photo-based modules (face reading, palmistry, aura, gemstone,
   * signature, clothes colour) the history record's image field is the user's
   * uploaded photo, not the feature icon. Use them only when the CMS has no
   * match at all.
   */
  const fromCms = iconMap
    ? lookup(iconMap, item?.featureName) ||
      lookup(iconMap, item?.featureType) ||
      lookup(iconMap, item?.slug)
    : null;
  if (fromCms) return fromCms;

  const fallback = item?.featureImage;
  return typeof fallback === "string" && fallback.trim() ? fallback : null;
};
