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
 * A 24-char hex string, i.e. a Mongo ObjectId. Used to tell whether the
 * `/astrologer/:id` URL segment is a real id or a username handle.
 */
export function isObjectIdLike(value) {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value.trim());
}

/**
 * Return the astrologer's `userName` in a form that can be dropped straight
 * into a URL path, or "" when it can't be used.
 *
 * Deliberately NOT slugified: the backend matches `userName` exactly (only the
 * case is ignored), so `new_astrologer` must stay `new_astrologer` —
 * slugifying it to `new-astrologer` returns 404.
 */
export function getAstrologerUrlHandle(astrologer) {
  const userName = astrologer?.userName?.trim?.();
  if (!userName) return "";
  // Only unreserved URL characters — anything else (spaces, slashes, %, ...)
  // would need encoding and is safer to skip in favour of the id form.
  if (!/^[A-Za-z0-9._~-]+$/.test(userName)) return "";
  // An all-hex 24-char handle would be indistinguishable from an ObjectId.
  if (isObjectIdLike(userName)) return "";
  return userName.toLowerCase();
}

/**
 * Build the astrologer profile URL.
 *
 * Preferred shape is the clean `/astrologer/<userName>` — no ObjectId in the
 * URL. The backend's `astrologers/astrologer?astrologerId=` accepts a userName
 * (case-insensitively) as well as an id, so this resolves with no extra lookup.
 *
 * Astrologers whose `userName` is missing/unusable fall back to the existing
 * `/astrologer/<display-name-slug>/<id>` form, which stays routed. Once the
 * backend backfills `userName` for everyone, every URL becomes the clean one
 * automatically — no code change needed here.
 *
 * @param {object|string} astrologer - astrologer object, or a bare id/handle string
 * @param {string} [idOverride] - explicit id when the object lacks _id
 */
export function getAstrologerProfilePath(astrologer, idOverride) {
  // Allow passing just an id or handle (e.g. only an authorId is known).
  if (typeof astrologer === "string" || typeof astrologer === "number") {
    return `/astrologer/${astrologer}`;
  }

  const handle = getAstrologerUrlHandle(astrologer);
  if (handle) return `/astrologer/${handle}`;

  const id = idOverride || astrologer?._id || astrologer?.id || "";
  if (!id) return "/astrologers";

  const slug = slugifyName(getAstrologerDisplayName(astrologer));
  return slug ? `/astrologer/${slug}/${id}` : `/astrologer/${id}`;
}
