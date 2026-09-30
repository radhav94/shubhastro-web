import { useEffect } from "react";
import { voiceSocket } from "../../services/voiceSocketServices";
import {
  refreshFreeSessionStatus,
  markFreeSessionConsumed,
  readFreeSessionStatus,
  SESSION_ENDED_EVENT,
} from "../auth/freeSessionStatus";
import {
  rememberFreeSessionRoom,
  rememberFreeSessionCall,
  payloadSaysFree,
} from "../auth/freeSessionRoom";

/*
 * Keeps free-session eligibility honest for the rest of the visit.
 *
 * `isFirstSessionFree` is resolved at login and cached, but the backend flips it
 * to false as soon as the user has had a session — chat, audio call, video call
 * or Pandit AI. Without re-reading it, every astrologer card keeps showing
 * "₹21/min Free" after the free session has been spent, and the next session is
 * charged against a price the UI said was free.
 *
 * Mounted once, app-wide (App.jsx), because a session can end from many screens:
 * the call UI, the chat screen, the live stream, the Pandit AI bubble, or the
 * astrologer hanging up while the user is somewhere else entirely.
 */

/*
 * Short wait before reading the profile.
 *
 * The flag flips server-side as part of ending/billing the session, which is not
 * guaranteed to be committed by the time the end event reaches us — read too
 * early and a stale `true` gets cached, which is the exact bug this watcher
 * exists to prevent (and it would then stick for the rest of the visit).
 *
 * Kept short because the user lands back on price-bearing screens immediately
 * after closing a session, and until this resolves those still say "Free".
 */
const REFRESH_DELAY_MS = 1200;

/*
 * Second, confirming read — only when the first one still says the user has a
 * free session. Covers a backend that flips the flag while finalising billing,
 * a little after the end event reaches the client.
 */
const CONFIRM_DELAY_MS = 6000;

export const useFreeSessionWatcher = () => {
  useEffect(() => {
    // Eligibility is API-driven now (isFirstSessionFree), so this always runs.
    // It self-gates: refreshFreeSessionStatus() no-ops for guests and once the
    // answer is already false, and room tagging below only happens when the
    // cached status is true (or the payload says free).

    /*
      Once per page load, on top of the session-end refreshes below.

      The value is read from a localStorage cache (so the astrologer cards, which
      render ten to twenty at a time, do not each ask). That cache is only written
      at login and when a session ends *in this tab* — so a flag the backend
      flipped anywhere else (a session in the mobile app, another device, a change
      made server-side) would stay stale here indefinitely, and not even a reload
      would correct it. A single read on load closes that gap.

      Costs one request per page load for a signed-in user, and none at all for a
      guest or for someone whose answer is already `false` —
      refreshFreeSessionStatus returns early in both cases.
    */
    refreshFreeSessionStatus();

    let timer = null;
    let confirmTimer = null;

    /*
     * Debounced: one session can produce several of these (call:ended plus a
     * chat:ended for the session's chat room, a switch, a reconnect teardown).
     * refreshFreeSessionStatus also coalesces concurrent calls and no-ops once
     * the answer is already false, so this settles to a single profile read.
     */
    const scheduleRefresh = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const value = await refreshFreeSessionStatus();

        /*
          One confirmation read.

          The first read can legitimately still say `true`: ending and billing a
          session is not atomic with the flag flip, and a single read a second
          later is a guess about the server's timing. If it still claims the user
          has a free session, ask once more a few seconds on — after which we stop
          and leave it to the next session-end or page load. Skipped entirely once
          the answer is `false` (or unknown), so the normal case stays one request.
        */
        if (value === true) {
          confirmTimer = setTimeout(() => {
            refreshFreeSessionStatus();
          }, CONFIRM_DELAY_MS);
        }
      }, REFRESH_DELAY_MS);
    };

    voiceSocket.on("call:ended", scheduleRefresh);
    voiceSocket.on("chat:ended", scheduleRefresh);
    window.addEventListener(SESSION_ENDED_EVENT, scheduleRefresh);

    /*
      Session START — the decisive moment, and treated as decisive.

      The offer is one session, so once a session is running the user does not have
      a free one any more. This does not wait for the profile flag to agree:
      a session that was started and dropped part-way was still being advertised
      as free on the listing while the wallet check refused it as paid. So mark it
      spent locally and re-read the profile behind that (the read no-ops now that
      the answer is false — it matters for sessions started in another tab, device
      or the mobile app).

      `accepted`, not `initiate`: a request that never connects must not cost the
      user their free session.
    */
    const handleSessionStarted = () => {
      markFreeSessionConsumed();
      scheduleRefresh();
    };

    /*
      Chat only: before the offer is marked spent, remember whether THIS room is
      the free session, so the chat screen can show the free-session header,
      "ending soon" banner and locked footer (see utils/auth/freeSessionRoom).
      Must run before markFreeSessionConsumed — afterwards the flag reads false.
    */
    const handleChatStarted = (data) => {
      if (data?.roomId && (readFreeSessionStatus() === true || payloadSaysFree(data))) {
        rememberFreeSessionRoom(data.roomId);
      }
      handleSessionStarted();
    };
    /*
      Audio calls, same idea: remember the call's roomId so VoiceCall can show
      the "1st Free Call" badge, the last-minute popup/banner and the locked end
      state. VIDEO is never free (the offer covers chat and audio only), and a
      mid-call switch (audio <-> video) is not a new session, so neither is
      recorded. Must run before markFreeSessionConsumed, as above.
    */
    const handleCallStarted = (data) => {
      const isAudio = data?.type === "audio";
      if (
        isAudio &&
        data?.roomId &&
        !data?.isSwitch &&
        (readFreeSessionStatus() === true || payloadSaysFree(data))
      ) {
        rememberFreeSessionCall(data.roomId);
      }
      handleSessionStarted();
    };
    voiceSocket.on("chat:accepted", handleChatStarted);
    voiceSocket.on("call:accepted", handleCallStarted);

    return () => {
      clearTimeout(timer);
      clearTimeout(confirmTimer);
      voiceSocket.off("call:ended", scheduleRefresh);
      voiceSocket.off("chat:ended", scheduleRefresh);
      voiceSocket.off("chat:accepted", handleChatStarted);
      voiceSocket.off("call:accepted", handleCallStarted);
      window.removeEventListener(SESSION_ENDED_EVENT, scheduleRefresh);
    };
  }, []);
};

export default useFreeSessionWatcher;
