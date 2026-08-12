export function Length(stringData) {
  if (stringData === undefined) {
    return 0;
  }
  if (stringData === null) {
    return 0;
  }
  return stringData.length;
}

export function GetString(stringData, length) {
  const lengthOfSource = Length(stringData);
  if (lengthOfSource <= length) {
    return stringData;
  }

  return stringData.substring(0, length - 1) + "...";
}

// Get astrologer display name - prioritize userName, fallback to firstName + lastName
export function getAstrologerDisplayName(astrologer) {
  // If userName exists and is not empty or blank, use it
  if (astrologer?.userName && astrologer.userName.trim()) {
    return astrologer.userName;
  }
  // Otherwise, combine firstName and lastName
  const firstName = astrologer?.firstName || "";
  const lastName = astrologer?.lastName || "";
  return `${firstName} ${lastName}`.trim();
}

/**
 * Convert a name into a URL-safe slug: lowercase, non-alphanumerics collapsed
 * into single hyphens, no leading/trailing hyphens.
 * e.g. "Astro Hardik Gandhi!" -> "astro-hardik-gandhi"
 */
export function slugifyName(name) {
  if (!name) return "";
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Build the astrologer profile URL.
 *
 * Canonical shape is `/astrologer/<username-slug>/<id>` so the URL is readable
 * and shareable. When the astrologer has no usable name (or no id is available)
 * it falls back to the legacy `/astrologer/<id>` form, which is still routed.
 *
 * @param {object|string} astrologer - astrologer object, or a bare id string
 * @param {string} [idOverride] - explicit id when the object lacks _id
 */
export function getAstrologerProfilePath(astrologer, idOverride) {
  // Allow passing just an id (e.g. only an authorId is known).
  if (typeof astrologer === "string" || typeof astrologer === "number") {
    return `/astrologer/${astrologer}`;
  }

  const id = idOverride || astrologer?._id || astrologer?.id || "";
  if (!id) return "/astrologers";

  const slug = slugifyName(getAstrologerDisplayName(astrologer));
  return slug ? `/astrologer/${slug}/${id}` : `/astrologer/${id}`;
}
