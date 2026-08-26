import { getAstrologerLiveList } from "../../services/appServices/authService";

/**
 * Finds the live channel an astrologer is currently streaming on.
 *
 * Why this exists
 * ---------------
 * `useAstrologerLiveStatus` gets `roomId` from exactly two places:
 *
 *   1. `astrologer.astrologerLiveStatus.roomId` on the fetched astrologer, and
 *   2. the `live:astrologer_status` socket event.
 *
 * The socket event only fires when the status *changes*. So a visitor who opens
 * an astrologer's profile or the listing while a stream is already running never
 * receives it — and if the API's `astrologerLiveStatus` carries `isLive: true`
 * without a `roomId`, `roomId` stays null for the rest of that page's life.
 *
 * That is not a brief window, which is how the code previously described it. It
 * is permanent for anyone arriving mid-stream, and it makes every join control
 * on the page a no-op: the LIVE pill, the mobile status bar, the sidebar live
 * card and its Join button, and the mobile "Join Live Session" CTA. A Clarity
 * session shows the result — a visitor tried to join a live session, then hit an
 * astrologer's LIVE controls repeatedly at 01:09, got nothing, and left.
 *
 * The live list is the same source `LivePlayerPage` already uses to decide what
 * to play, and it carries `channel` per astrologer, so it can answer the
 * question the socket event failed to deliver.
 *
 * @param {string} astrologerId
 * @returns {Promise<string|null>} The channel id, or null if the astrologer is
 *   not in the live list (genuinely no longer streaming, or the request failed).
 */
export const resolveLiveChannelForAstrologer = async (astrologerId) => {
  if (!astrologerId) return null;

  try {
    const res = await getAstrologerLiveList();
    const list = res?.data?.data || [];

    // Match on both shapes: the live-list projection nests the astrologer, and
    // some consumers flatten it to `astrologerId`.
    const match = list.find(
      (entry) =>
        entry?.astrologer?._id === astrologerId ||
        entry?.astrologer?.astrologerId === astrologerId ||
        entry?.astrologerId === astrologerId ||
        entry?.hostId === astrologerId
    );

    return match?.channel || null;
  } catch {
    // Caller decides what to tell the visitor; never throw out of a click handler.
    return null;
  }
};

export default resolveLiveChannelForAstrologer;
