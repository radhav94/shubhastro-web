/* Helpers for the free first-session chat UI (see FreeSessionUI.jsx). */

/** Seconds left at which the popup and the "ending soon" banner appear. */
export const FREE_SESSION_WARNING_SECONDS = 60;

export const formatClock = (sec) => {
  const total = Math.max(0, Math.floor(Number(sec) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

/**
 * A real discount only exists when the earlier price is genuinely higher —
 * `isDiscountActive` alone is not trustworthy (see RecommendedAstrologersModal).
 */
const getRateOffer = (rate) => {
  const now = Number(rate?.amount);
  const was = Number(rate?.beforeDiscountPrice);
  if (!Number.isFinite(now) || now <= 0) return null;
  return { now, was: Number.isFinite(was) && was > now ? was : null };
};

export const getChatRateOffer = (astrologer) => getRateOffer(astrologer?.price?.chatRate);

/** The audio call rate — `price.audioRate`, as on the astrologer profile. */
export const getAudioCallRateOffer = (astrologer) => getRateOffer(astrologer?.price?.audioRate);

/* ==================== BALANCE-AWARE FREE SESSION ==================== */
/*
 * A free first session does not have to stop when its free minutes run out:
 * a user whose wallet can pay for the session carries on as a normal paid
 * session. Everything below is pure (no React, no storage) so the decision can
 * be reasoned about — and tested — on its own. useFreeSessionPhase wires it up.
 */

/**
 * Minutes of balance the wallet must cover for the session to carry on paid.
 *
 * Mirrors the only paid-minimum rule this codebase has: "Minimum balance of 5
 * minutes is required to start" (DEFAULT_MIN_MINUTES in RechargeModal /
 * ReachargeAlertModel, used when the balance-check API sends no
 * `requiredAmount`). Whether the server applies the same rule to CONTINUING a
 * free session — or only needs one minute's worth — is a backend question; it
 * is a single constant so the answer is a one-line change.
 */
export const MIN_PAID_MINUTES_TO_CONTINUE = 5;

/**
 * Minutes of balance needed for a RUNNING free session to carry on, paid,
 * when its free minutes run out (useFreeSessionPhase).
 *
 * Deliberately lower than MIN_PAID_MINUTES_TO_CONTINUE (SHB-2137): the costly
 * mistake is the client ending a chat at 00:00 that the server would have kept
 * billing — a user who recharged, say, 3 minutes' worth was cut off at the end
 * of the free 3 minutes. One minute is the least any paid session runs on. If
 * the server does not carry the session on, it ends it (chat:ended) and the
 * locked free-session screen still follows, since the switch was never
 * confirmed. The 5-minute rule still applies to STARTING a new paid session
 * (the "Continue" buttons on the locked / ended screens).
 */
export const MIN_WALLET_MINUTES_TO_CARRY_ON = 1;

/** Per-minute rate from a `{ now, was }` offer (getChatRateOffer / getAudioCallRateOffer). */
export const getRatePerMinute = (offer) => {
  const rate = Number(offer?.now);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
};

/**
 * Can the session carry on, paid from the wallet, once the free part is over?
 * Unknown balance or rate means "no" — the safe answer is today's behaviour
 * (low-balance popup, recharge offer), never promising a paid continuation the
 * wallet may not cover.
 */
export const canContinueOnWallet = (
  balance,
  ratePerMinute,
  minMinutes = MIN_PAID_MINUTES_TO_CONTINUE
) => {
  const bal = Number(balance);
  const rate = Number(ratePerMinute);
  if (balance === null || balance === undefined || !Number.isFinite(bal)) return false;
  // Rate unknown (astrologer data not loaded / other shape): don't read that as
  // "can't continue" — any wallet balance lets the server decide.
  if (!Number.isFinite(rate) || rate <= 0) return bal > 0;
  return bal >= rate * Math.max(1, Number(minMinutes) || 1);
};

/** Whole paid seconds the wallet covers at this rate (0 when unknown). */
export const estimateWalletSeconds = (balance, ratePerMinute) => {
  const bal = Number(balance);
  const rate = Number(ratePerMinute);
  if (!Number.isFinite(bal) || !Number.isFinite(rate) || bal <= 0 || rate <= 0) return 0;
  return Math.floor(bal / rate) * 60;
};

/*
 * Free allowance from a session payload (chat:accepted / call:accepted).
 * The backend sends none of these today — `remainingTime` is the only clock —
 * so this returns null and the session countdown is used as-is. Listed so the
 * free part is timed on its own the day the backend sends one, which matters
 * if `remainingTime` ever covers free + wallet-funded minutes.
 */
const FREE_MINUTE_FIELDS = [
  "freeMinutes",
  "freeSessionMinutes",
  "freeTime",
  "freeDuration",
  "freeRemainingTime",
  "freeMinutesRemaining",
];
const FREE_SECOND_FIELDS = ["freeSeconds", "freeRemainingSeconds"];

/** @returns {number|null} free seconds, or null when the payload has none */
/*
  Free allowance when the server doesn't send one (it doesn't today): the free
  first session is 3 minutes. Without this the free countdown fell back to the
  server's `remainingTime`, which for a user WITH wallet balance covers free +
  wallet minutes — so the chat/call showed e.g. "23:00 left" on the free badge
  and never reached the free→paid switch. Override per environment with
  VITE_FREE_SESSION_SECONDS if the CMS free duration differs; a server-sent
  freeSeconds/freeMinutes field always wins.
*/
export const DEFAULT_FREE_SESSION_SECONDS = (() => {
  const v = Number(import.meta.env?.VITE_FREE_SESSION_SECONDS);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 180;
})();

/** Allowance from the payload, else the default free-session length. */
export const resolveFreeAllowanceSeconds = (payload) =>
  readFreeAllowanceSeconds(payload) || DEFAULT_FREE_SESSION_SECONDS;

export const readFreeAllowanceSeconds = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  for (const key of FREE_SECOND_FIELDS) {
    const v = Number(payload[key]);
    if (Number.isFinite(v) && v > 0) return Math.floor(v);
  }
  for (const key of FREE_MINUTE_FIELDS) {
    const v = Number(payload[key]);
    if (Number.isFinite(v) && v > 0) return Math.floor(v * 60);
  }
  return null;
};

/**
 * Seconds left in the FREE part of the session.
 *
 * With a known free allowance and start time it is timed on its own (so a
 * `remainingTime` that also counts wallet minutes cannot stretch it). Without
 * one, `remainingTime` IS the free clock — how the backend behaves today.
 */
export const getFreeSecondsLeft = ({ sessionSeconds, freeAllowanceSeconds, startedAt, now = Date.now() }) => {
  const allowance = Number(freeAllowanceSeconds);
  const start = Number(startedAt);
  if (Number.isFinite(allowance) && allowance > 0 && Number.isFinite(start) && start > 0) {
    const byClock = Math.max(0, allowance - Math.floor((now - start) / 1000));
    // A server countdown that is SHORTER is the free clock itself (free-only
    // remainingTime, server slightly ahead) — follow it. A longer one also
    // counts wallet minutes and must not stretch the free part.
    const server = Math.floor(Number(sessionSeconds) || 0);
    return server > 0 ? Math.min(byClock, server) : byClock;
  }
  return Math.max(0, Math.floor(Number(sessionSeconds) || 0));
};

/** A server `warning` about the wallet (string or `{ message }`). */
export const isLowBalanceWarning = (msg) => {
  const text = String(typeof msg === "string" ? msg : msg?.message || "").toLowerCase();
  return text.includes("low balance") || text.includes("insufficient");
};
