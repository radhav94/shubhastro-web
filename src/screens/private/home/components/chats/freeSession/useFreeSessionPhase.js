import { useEffect, useRef, useState } from "react";
import { voiceSocket } from "../../../../../../services/voiceSocketServices";
import { readFreeSessionMeta } from "../../../../../../utils/auth/freeSessionRoom";
import {
  FREE_SESSION_WARNING_SECONDS,
  MIN_WALLET_MINUTES_TO_CARRY_ON,
  canContinueOnWallet,
  estimateWalletSeconds,
  getFreeSecondsLeft,
} from "./freeSessionUtils";

/*
 * Where a free first session (chat or audio call) stands, given the wallet.
 *
 *   free phase     the free minutes are running — free badge + free countdown.
 *   last 60s       wallet covers the paid rate  → calm "continues at ₹X/min" notice;
 *                  it does not                  → low-balance popup + recharge banner.
 *   free time up   wallet covers it → the session switches to the normal PAID UI
 *                  (`hasSwitchedToPaid`) and nothing is ended client-side;
 *                  it does not      → `isFreeTimeUp`, today's locked state.
 *
 * `canContinue` is live: a recharge mid-session (or a balance from an
 * `activity` tick) re-evaluates it on the next render.
 *
 * Once switched, the switch is latched (and kept in sessionStorage, so a
 * refresh stays on the paid UI): from then on the wallet is being spent, so a
 * falling balance must not flip the screen back to the free/locked state.
 *
 * `isPaidConfirmed` — the server has shown it is billing the continuation:
 * either `remainingTime` was still running when the free part ended (it covers
 * wallet minutes too), or an `activity` tick re-timed the session afterwards.
 * Until then a session that ends is treated as the free session ending (locked
 * offer screen), not as a finished paid consultation.
 */

const LATCH_PREFIX = "shubhtalk_free_paid_";
// An `activity` re-sync this close to zero is the free clock finishing, not
// the server starting to bill the wallet.
const CONFIRM_MIN_SECONDS = 10;

const readLatch = (key) => {
  if (!key) return null;
  try {
    return JSON.parse(sessionStorage.getItem(LATCH_PREFIX + key) || "null");
  } catch {
    return null;
  }
};
const writeLatch = (key, value) => {
  if (!key) return;
  try {
    sessionStorage.setItem(LATCH_PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable — the latch lives for this mount only */
  }
};

/**
 * @param {object}   p
 * @param {boolean}  p.isFree           this session is the free first session
 * @param {string}   p.sessionKey       storage id (room id, or `call:<roomId>`)
 * @param {string}   [p.roomId]         socket room id, to match `activity` ticks
 * @param {boolean}  p.isActive         the session is live
 * @param {number}   p.sessionSeconds   the server-driven countdown (chatSeconds / callSeconds)
 * @param {number}   p.balance          wallet balance (live)
 * @param {number}   p.ratePerMinute    astrologer's chat / audio rate
 * @param {(secs:number)=>void} [p.seedSessionSeconds]
 *   Called once on the switch when the countdown has hit 0 (remainingTime was
 *   the free part only): seeds it with what the wallet covers so the paid timer
 *   isn't stuck at 00:00 until the server's next `activity` tick corrects it.
 */
export const useFreeSessionPhase = ({
  isFree,
  sessionKey,
  roomId,
  isActive,
  sessionSeconds,
  balance,
  ratePerMinute,
  seedSessionSeconds,
}) => {
  // The key outlives the session (activeChat / roomId are cleared on end).
  const keyRef = useRef(null);
  if (isFree && sessionKey && keyRef.current !== sessionKey) keyRef.current = sessionKey;
  const key = isFree ? keyRef.current : null;

  const meta = key ? readFreeSessionMeta(key) : null;
  const freeSecondsLeft = isFree
    ? getFreeSecondsLeft({
        sessionSeconds,
        freeAllowanceSeconds: meta?.freeSeconds,
        startedAt: meta?.startedAt,
      })
    : 0;
  // In-session carry-on needs only a minute's worth — see
  // MIN_WALLET_MINUTES_TO_CARRY_ON (SHB-2137).
  const canContinue = canContinueOnWallet(balance, ratePerMinute, MIN_WALLET_MINUTES_TO_CARRY_ON);

  // The countdown starts at 0 until remainingTime arrives — only a countdown
  // that has really run can "run out".
  const startedRef = useRef({ key: null, value: false });
  if (startedRef.current.key !== key) startedRef.current = { key, value: false };
  if (isFree && freeSecondsLeft > 0) startedRef.current.value = true;
  const freeRanOut = isFree && startedRef.current.value && freeSecondsLeft <= 0;

  /*
    Billing has started = the free part is over, whatever the countdown says.

    When the server's `remainingTime` covers free + wallet minutes, the free
    countdown never reaches 0 here, so the chat stayed in "free" mode for the
    whole paid continuation — free badge on, Voice/Video call buttons hidden.
    The wallet is the one unambiguous signal: the free part costs nothing, so
    once the balance drops below what it was when the free session started
    (live, via `activity` / walletBalanceUpdated) the server is billing.
    Baseline = the highest balance seen in this free session, so a recharge
    raises it instead of masking the drop.
  */
  const BILLING_DROP_EPSILON = 0.5;
  const baselineRef = useRef({ key: null, value: null });
  if (baselineRef.current.key !== key) baselineRef.current = { key, value: null };
  const bal = Number(balance);
  if (isFree && Number.isFinite(bal)) {
    const base = baselineRef.current.value;
    if (base === null || bal > base) baselineRef.current.value = bal;
  }
  const billingStarted =
    isFree &&
    !!isActive &&
    Number.isFinite(bal) &&
    baselineRef.current.value !== null &&
    bal < baselineRef.current.value - BILLING_DROP_EPSILON;

  /*
    The server kept it alive = it is carrying on paid. The client never ends a
    free session itself, so if the session is still active a few seconds after
    the free part ran out, the server has continued it on the wallet — switch
    the UI to paid even when the balance/rate check above couldn't tell.
  */
  const KEPT_ALIVE_MS = 6000;
  const [keptAlive, setKeptAlive] = useState({ key: null, value: false });
  const isKeptAlive = keptAlive.key === key && keptAlive.value;
  useEffect(() => {
    if (!isFree || !key || !freeRanOut || !isActive || isKeptAlive) return undefined;
    const t = setTimeout(() => setKeptAlive({ key, value: true }), KEPT_ALIVE_MS);
    return () => clearTimeout(t);
  }, [isFree, key, freeRanOut, isActive, isKeptAlive]);

  const [latch, setLatch] = useState({ key: null, switched: false, confirmed: false });
  const stored = latch.key === key ? latch : { key, switched: false, confirmed: false, ...(readLatch(key) || {}) };

  // Synchronous, so there is no one-render flash of the locked state.
  const switchingNow =
    !stored.switched &&
    !!isActive &&
    ((freeRanOut && canContinue) || billingStarted || (freeRanOut && isKeptAlive));
  const hasSwitchedToPaid = isFree && (stored.switched || switchingNow);
  const isPaidConfirmed =
    hasSwitchedToPaid &&
    (stored.confirmed ||
      (switchingNow && (billingStarted || isKeptAlive || Number(sessionSeconds) > 0)));

  const seedRef = useRef(seedSessionSeconds);
  seedRef.current = seedSessionSeconds;

  useEffect(() => {
    if (!switchingNow || !key) return;
    // The wallet already moved → the server is billing: confirmed.
    const confirmed = billingStarted || isKeptAlive || Number(sessionSeconds) > 0;
    const next = { key, switched: true, confirmed };
    writeLatch(key, { switched: true, confirmed });
    setLatch(next);
    // Countdown sitting at 0 (remainingTime was the free part only): seed the
    // paid timer from the wallet so it isn't stuck at 00:00 until the server's
    // next `activity` tick re-times it.
    if (!(Number(sessionSeconds) > 0)) {
      const estimate = estimateWalletSeconds(balance, ratePerMinute);
      if (estimate > 0) seedRef.current?.(estimate);
    }
    // Runs on the switch itself; the other values are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [switchingNow, key]);

  useEffect(() => {
    if (!hasSwitchedToPaid || isPaidConfirmed || !key) return undefined;
    const onActivity = (data) => {
      if (data?.roomId && roomId && data.roomId !== roomId) return;
      if (!(Number(data?.remainingTime) * 60 >= CONFIRM_MIN_SECONDS)) return;
      writeLatch(key, { switched: true, confirmed: true });
      setLatch({ key, switched: true, confirmed: true });
    };
    voiceSocket.on("activity", onActivity);
    return () => voiceSocket.off("activity", onActivity);
  }, [hasSwitchedToPaid, isPaidConfirmed, key, roomId]);

  const isFreePhase = !!isFree && !hasSwitchedToPaid;
  const isEndingSoon =
    isFreePhase && !!isActive && freeSecondsLeft > 0 && freeSecondsLeft <= FREE_SESSION_WARNING_SECONDS;

  return {
    freeSecondsLeft,
    canContinue,
    isFreePhase,
    isEndingSoon,
    // Free time over and the wallet could not carry it on — today's lock.
    isFreeTimeUp: isFreePhase && freeRanOut,
    hasSwitchedToPaid,
    isPaidConfirmed,
  };
};

export default useFreeSessionPhase;
