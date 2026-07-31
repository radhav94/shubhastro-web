/**
 * Helpers for kundli-type chat messages.
 *
 * Kundli messages are inconsistent across senders: some carry a bare kundli id
 * in `message` (standard chat), some a full absolute URL like
 * `http://localhost:5173/kundli/<id>` (video call / virtual assistant / backend
 * auto-share). All senders also include a separate `kundliId` field, but it's
 * not always present on older/backend messages.
 *
 * These helpers resolve a single kundli id from any of those shapes so every
 * renderer builds the same in-app link, regardless of how the message was sent.
 */

// A Mongo ObjectId (what kundli ids look like), used to pull an id out of text.
const OBJECT_ID_RE = /[a-f0-9]{24}/i;

/**
 * Resolve the kundli id from a message.
 * @param {string|null|undefined} kundliId - explicit id field on the message
 * @param {string|null|undefined} text - the message text (`message`/`text`)
 * @returns {string|null}
 */
export const resolveKundliId = (kundliId, text) => {
  if (kundliId) return String(kundliId);
  if (typeof text !== "string") return null;

  const trimmed = text.trim();

  // Full URL form: .../kundli/<id>
  const fromPath = trimmed.match(/\/kundli\/([^/?#\s]+)/i);
  if (fromPath?.[1]) return fromPath[1];

  // Bare id form.
  const bare = trimmed.match(OBJECT_ID_RE);
  if (bare?.[0] && OBJECT_ID_RE.test(trimmed)) return bare[0];

  return null;
};

/**
 * Build an in-app kundli link (using the current origin) from a message.
 * @param {string|null|undefined} kundliId
 * @param {string|null|undefined} text
 * @returns {string|null}
 */
export const buildKundliLink = (kundliId, text) => {
  const id = resolveKundliId(kundliId, text);
  return id ? `${window.location.origin}/kundli/${id}` : null;
};
