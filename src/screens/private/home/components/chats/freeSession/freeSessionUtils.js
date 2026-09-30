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
