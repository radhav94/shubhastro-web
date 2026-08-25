/**
 * Decorative artwork for the Rashi report.
 *
 * Per-sign artwork is NOT here. The moon-sign logo, the sign illustration and the
 * nakshatra deity portrait all come from the API (`signLogoUrl`,
 * `signIllustrationUrl`, `godImageUrl` on the `enriched` block), served from S3.
 * They used to be bundled here as well, which meant ~1.7 MB of images shipped to
 * every visitor purely as a fallback for URLs the API always sends — and against
 * a sign-to-file mapping that was inferred rather than confirmed. The API names
 * its own artwork, so it is the authority.
 *
 * What remains is the design's decorative furniture, which has no API equivalent:
 * the banner tiles (here), plus the hero flourishes, per-card swirls and section
 * icons that the report imports directly from `decor/` and `icons/`.
 */

/**
 * Framed zodiac tiles scattered down both edges of the report banner. Purely
 * decorative, so they are used in file order and carry no sign mapping —
 * `decor/tile-1.png`, `tile-2.png`, ... Add or remove files freely; the banner
 * lays out however many it finds.
 *
 * Matched on the `tile-` prefix, not the whole folder: `decor/` also holds
 * one-off pieces (the hero flourishes, the per-card swirls) that must not turn up
 * as a banner tile.
 */
const DECOR_FILES = import.meta.glob("../assets/images/rashi/decor/tile-*.{png,jpg,jpeg,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

export const rashiDecorTiles = Object.keys(DECOR_FILES)
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
  .map((key) => DECOR_FILES[key]);
