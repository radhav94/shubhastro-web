// chatProtocol.js
// Helpers + constants for the WhatsApp-style chat protocol:
// idempotency (clientMsgId), delivery/read status ticks, and seq ordering.
//
// The protocol is layered ON TOP of the existing `chat:message` /
// `message:recieved` (legacy, misspelled) contract without breaking it. New
// clients additionally listen to `message:received` (correct spelling),
// `message:ack`, `message:status`, `message:read_ack`, and
// `message:undelivered_batch`.

import { v4 as uuidv4 } from "uuid";

/**
 * Per-message delivery state machine:
 *   pending  → (message:ack)        sent      ✓  single grey tick
 *   sent     → (message:status)     delivered ✓✓ double grey tick
 *   delivered→ (message:read_ack)   read      ✓✓ double blue tick
 *   pending  → (10s x3 timeout)     failed    ⚠  retry affordance
 */
export const MESSAGE_STATUS = Object.freeze({
  PENDING: "pending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
});

// Rank used to prevent status from moving "backwards" if events arrive out of
// order (e.g. a late `delivered` after a `read` should not downgrade the tick).
const STATUS_RANK = {
  [MESSAGE_STATUS.PENDING]: 0,
  [MESSAGE_STATUS.FAILED]: 0,
  [MESSAGE_STATUS.SENT]: 1,
  [MESSAGE_STATUS.DELIVERED]: 2,
  [MESSAGE_STATUS.READ]: 3,
};

/**
 * Returns the higher-precedence of two statuses so ticks only ever advance.
 * `failed` is special-cased: it can always be set (retry exhausted) and is only
 * overridden once the message actually reaches `sent` or beyond.
 */
export const mergeStatus = (current, next) => {
  if (!current) return next;
  if (next === MESSAGE_STATUS.FAILED && current === MESSAGE_STATUS.PENDING) {
    return MESSAGE_STATUS.FAILED;
  }
  const cur = STATUS_RANK[current] ?? 0;
  const nxt = STATUS_RANK[next] ?? 0;
  return nxt >= cur ? next : current;
};

/** Generate a client-side idempotency key (UUID v4) for a new message. */
export const newClientMsgId = () => uuidv4();

/** Retry / ack-timeout tuning (see guide §14). */
export const ACK_TIMEOUT_MS = 10000;
export const MAX_SEND_RETRIES = 3;

/**
/**
 * Chronological message sort.
 *
 * Timestamp (createdAt / dateTime) is the PRIMARY key because it is present on
 * every message — persisted history, live socket messages, and optimistic
 * pending ones alike — so it always yields a correct, total ordering.
 *
 * `seq` is only a tie-breaker for two messages that share the same timestamp
 * (e.g. sent within the same millisecond), where the server-assigned sequence
 * disambiguates true order. Using seq as the PRIMARY key was wrong: history
 * messages often have no seq while live ones do, and mixing the two produced an
 * inconsistent comparator that scrambled dates (guide §9 / §16: old messages
 * have no seq — fall back to createdAt).
 */
export const sortBySeq = (messages = []) => {
  return [...messages].sort((a, b) => {
    const at = new Date(a?.dateTime || a?.timestamp || 0).getTime();
    const bt = new Date(b?.dateTime || b?.timestamp || 0).getTime();
    if (at !== bt) return at - bt;

    // Same timestamp → use seq to disambiguate when both have one.
    const aHasSeq = typeof a?.seq === "number";
    const bHasSeq = typeof b?.seq === "number";
    if (aHasSeq && bHasSeq) return a.seq - b.seq;
    return 0;
  });
};

/**
 * Normalizes the `replyTo` snapshot the server sends on `message:received`
 * (and inside `message:undelivered_batch`) into a stable shape for the UI.
 */
export const normalizeReplyTo = (replyTo) => {
  if (!replyTo) return null;
  return {
    messageId: replyTo.messageId || replyTo._id || null,
    // Server snapshots use `message`; a locally-built reply target (from a
    // rendered message) carries its body in `text`. Accept either so the
    // optimistic echo shows the quoted text immediately.
    message: replyTo.message ?? replyTo.text ?? "",
    // Server snapshots carry sender as "user"/"astrologer"; a locally-built
    // reply target only has the boolean `isSender`. Fall back to it so the
    // quoted preview labels ("You" vs the astrologer) are correct optimistically.
    sender:
      replyTo.sender ??
      (typeof replyTo.isSender === "boolean"
        ? replyTo.isSender
          ? "user"
          : "astrologer"
        : null),
    type: replyTo.type || "message",
    // Kundli replies need the human-readable name; the raw `message` for a
    // kundli message is just the id. Preserve it so the quoted preview can show
    // the name instead of the id (falls back gracefully when absent).
    kundliName: replyTo.kundliName ?? null,
    kundliId: replyTo.kundliId ?? null,
    // Gift replies keep the parsed gift payload so the quoted preview can show
    // the gift name (a rendered gift message stores it on `giftData`, not in the
    // raw `message` string). Falls back gracefully when absent.
    giftData: replyTo.giftData ?? null,
  };
};

/**
 * Turns a reply target (a locally-built message with `text`, or a normalized
 * `replyTo` snapshot with `message`) into a short, human-readable label for the
 * quoted preview shown in the compose bar and on the message bubble.
 *
 * Non-text messages carry structured payloads in their body: gifts and file
 * attachments store JSON, so the raw body is not fit to show (that's why a
 * gift reply used to render `{"text":"...","giftData":{...}}`). This centralizes
 * the per-type labelling so both preview locations stay in sync.
 */
export const replyPreviewLabel = (replyTo) => {
  if (!replyTo) return "";
  // Accept both shapes: normalized snapshot (`message`) and raw local msg (`text`).
  const body = replyTo.message ?? replyTo.text ?? "";
  switch (replyTo.type) {
    case "image":
      return "📷 Photo";
    case "video":
      return "🎥 Video";
    case "audio":
      return "🎤 Voice message";
    case "attachment": {
      // File attachments store `{ url, fileName }`; show the file name if present.
      try {
        const parsed = JSON.parse(body);
        return parsed?.fileName ? `📎 ${parsed.fileName}` : "📎 Attachment";
      } catch {
        return "📎 Attachment";
      }
    }
    case "kundli":
      return replyTo.kundliName ? `${replyTo.kundliName}'s Kundli` : "Kundli";
    case "gift": {
      // A rendered gift message keeps the gift name on `giftData.giftName` (the
      // raw body was already parsed away into `text` + `giftData`). Prefer that;
      // otherwise parse the JSON body `{ text, giftData: { giftName } }`.
      if (replyTo.giftData?.giftName) return `🎁 ${replyTo.giftData.giftName}`;
      try {
        const parsed = JSON.parse(body);
        const name = parsed?.giftData?.giftName;
        return name ? `🎁 ${name}` : "🎁 Gift";
      } catch {
        return "🎁 Gift";
      }
    }
    default:
      return body;
  }
};
