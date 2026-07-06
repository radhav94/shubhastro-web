import { useEffect, useState } from "react";

/**
 * Tracks an astrologer's live-stream status in real time.
 *
 * Seeds from the astrologer data (`astrologerLiveStatus`) and then updates
 * whenever the global `live:astrologer_status` socket event fires. That socket
 * event is re-dispatched on `window` by `useAstrologerStatusSocket`, so this
 * hook works for any card regardless of whether its parent reads the RTK Query
 * cache directly (home) or accumulates results into local state (astrologer list).
 *
 * @param {string} astrologerId - The astrologer's `_id` (matched against event `hostId`).
 * @param {{ isLive?: boolean, roomId?: string }} [initialStatus] - astrologer?.astrologerLiveStatus
 * @returns {{ isLive: boolean, roomId: string|null }}
 */
export default function useAstrologerLiveStatus(astrologerId, initialStatus) {
  const [liveStatus, setLiveStatus] = useState(() => ({
    isLive: initialStatus?.isLive === true,
    roomId: initialStatus?.roomId || null,
  }));

  // Re-seed when the astrologer data changes (e.g. a fresh fetch supplies the field).
  useEffect(() => {
    setLiveStatus({
      isLive: initialStatus?.isLive === true,
      roomId: initialStatus?.roomId || null,
    });
  }, [initialStatus?.isLive, initialStatus?.roomId]);

  useEffect(() => {
    if (!astrologerId) return undefined;

    const handler = (event) => {
      const data = event?.detail;
      if (!data || data.hostId !== astrologerId) return;

      const isLive = data.status === "started";
      setLiveStatus({
        isLive,
        roomId: isLive ? data.roomId || data.channel || null : null,
      });
    };

    window.addEventListener("live:astrologer_status", handler);
    return () => window.removeEventListener("live:astrologer_status", handler);
  }, [astrologerId]);

  return liveStatus;
}
