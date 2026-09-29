/**
 * Astrologer profile meta title / description templates (SHB-2058).
 *
 * Shared by BOTH places that write astrologer meta tags, so they cannot drift:
 *   - the SPA  (src/screens/private/astrologerProfile/AstrologerProfile.jsx)
 *   - the gateway's server-side injection for non-JS crawlers
 *     (secure-gateway/src/astrologerSeo.js)
 * It lives under secure-gateway/ because the gateway may be deployed on its own;
 * the SPA build always has the whole repo, so importing it from there is safe.
 * Keep this file dependency-free plain ESM (no Vite / Node-only APIs).
 *
 * Precedence: an admin-authored `metaTitle` / `metaDescription` on the
 * astrologer record always wins. These templates are only the fallback for
 * astrologers without one.
 */

// ============================================================================
// SEO TEMPLATES — swap wording here (e.g. from "ShubhAstro Astrologer Profile
// Meta Tags.xlsx"). Placeholders:
//   {name}        display name (userName handle, else first + last name)
//   {primarySkill} first specialty, with a trailing "Astrology"/"Astrologer"
//                 dropped so the title does not read "Vedic Astrology Astrologer"
//   {skills}      first few specialties, "A, B and C"
//   {experience}  years of experience (number)
//   {languages}   "Hindi, English and Gujarati"
// A `[...]` segment is dropped entirely when any placeholder inside it is empty,
// so an astrologer with no experience / languages on file never gets
// "with  years of experience" or "Speaks .".
// ============================================================================
export const ASTROLOGER_META_TEMPLATES = {
  title: "{name} - Best [{primarySkill} ]Astrologer | ShubhAstro",
  description:
    "Consult {name}[, expert in {skills}][ with {experience} years of experience]. [Speaks {languages}. ]Chat or call now on ShubhAstro.",
  // How many specialties go into {skills}.
  maxSkills: 3,
};
// ============================================================================

const str = (v) => (typeof v === "string" ? v.trim() : "");

const joinList = (items) => {
  if (items.length <= 1) return items[0] || "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
};

const titlesOf = (list, ...keys) =>
  (Array.isArray(list) ? list : [])
    .map((item) => {
      if (typeof item === "string") return str(item);
      if (item && typeof item === "object") {
        for (const k of keys) if (str(item[k])) return str(item[k]);
      }
      return "";
    })
    .filter(Boolean)
    // De-duplicate case-insensitively, keeping the first spelling.
    .filter((v, i, arr) => arr.findIndex((o) => o.toLowerCase() === v.toLowerCase()) === i);

const displayNameOf = (a) =>
  str(a.userName) || `${str(a.firstName)} ${str(a.lastName)}`.trim() || str(a.name);

/**
 * Fill a template. `{key}` is replaced by vars[key]; a `[...]` group is kept
 * only when every placeholder inside it resolved to a non-empty value.
 */
export const fillTemplate = (template, vars) => {
  const sub = (s) => s.replace(/\{(\w+)\}/g, (_m, k) => (vars[k] == null ? "" : String(vars[k])));
  return String(template || "")
    .replace(/\[([^\]]*)\]/g, (_m, inner) => {
      const keys = [...inner.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      return keys.every((k) => vars[k] != null && String(vars[k]).trim() !== "") ? sub(inner) : "";
    })
    .replace(/\{(\w+)\}/g, (_m, k) => (vars[k] == null ? "" : String(vars[k])))
    .replace(/\s{2,}/g, " ")
    .trim();
};

/**
 * Template variables from an astrologer API payload (`data` of
 * /api/astrologers/astrologer). Only public profile fields are read.
 */
export const astrologerMetaVars = (astrologer) => {
  const a = astrologer && typeof astrologer === "object" ? astrologer : {};
  // Specialties are the astrology disciplines (Vedic, Tarot, ...); expertise
  // is the topic list (Career, Love, ...) and is only a fallback.
  let skills = titlesOf(a.specialties, "title", "name");
  if (!skills.length) skills = titlesOf(a.expertise, "title", "name");
  const languages = titlesOf(a.languagePreferences, "languageName", "name", "title");
  const years = Number(a.experience);

  return {
    name: displayNameOf(a),
    primarySkill: (skills[0] || "").replace(/\s*astrolog(?:y|er)\s*$/i, "").trim(),
    skills: joinList(skills.slice(0, ASTROLOGER_META_TEMPLATES.maxSkills)),
    experience: Number.isFinite(years) && years > 0 ? Math.round(years) : "",
    languages: joinList(languages),
  };
};

/**
 * Title + description for an astrologer: admin-authored values first, the
 * templates above otherwise. Returns empty strings when there is no name to
 * build from (callers then leave the site defaults in place).
 *
 * @param {Object} astrologer
 * @returns {{title: string, description: string}}
 */
export const buildAstrologerMeta = (astrologer) => {
  const a = astrologer && typeof astrologer === "object" ? astrologer : {};
  const vars = astrologerMetaVars(a);
  const canTemplate = !!vars.name;

  return {
    title:
      str(a.metaTitle) ||
      (canTemplate ? fillTemplate(ASTROLOGER_META_TEMPLATES.title, vars) : ""),
    description:
      str(a.metaDescription) ||
      (canTemplate ? fillTemplate(ASTROLOGER_META_TEMPLATES.description, vars) : ""),
  };
};
