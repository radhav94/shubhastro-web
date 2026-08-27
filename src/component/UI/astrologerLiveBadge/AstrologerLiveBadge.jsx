import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAstrologerLiveStatus from "../../../hooks/useAstrologerLiveStatus";
import { resolveLiveChannelForAstrologer } from "../../../utils/helper/resolveLiveChannel";
import toast from "../../toast";
import styles from "./AstrologerLiveBadge.module.scss";

/**
 * "LIVE" pill shown when an astrologer is currently live-streaming.
 * Renders nothing when the astrologer is not live. Clicking it opens the live
 * stream. Mirrors the pill used on the homepage top-astrologer cards.
 *
 * Encapsulates the useAstrologerLiveStatus hook so it can be dropped into a
 * list/`.map()` without violating the rules of hooks.
 */
const AstrologerLiveBadge = ({ astrologerId, initialStatus, className = "" }) => {
  const navigate = useNavigate();
  const { isLive, roomId } = useAstrologerLiveStatus(astrologerId, initialStatus);
  const [opening, setOpening] = useState(false);

  /*
    This used to be `if (roomId) navigate(...)` and nothing else — the plainest
    possible dead click. And `roomId` is null for every visitor who arrives while
    the stream is already running, because it only ever arrives with the
    `live:astrologer_status` socket event, which fires on a status *change*. See
    resolveLiveChannelForAstrologer.

    So the pill now looks the channel up when it doesn't already have one. The
    label changes to "Opening…" while that runs, which matters for two reasons: it
    tells the visitor the tap registered, and it is a real DOM change, so the tap
    stops being recorded as a dead click. A toast alone would not do either —
    Clarity cannot see toasts.
  */
  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (opening) return;

    if (roomId) {
      navigate(`/live/${roomId}`);
      return;
    }

    setOpening(true);
    try {
      const channel = await resolveLiveChannelForAstrologer(astrologerId);
      if (channel) {
        navigate(`/live/${channel}`);
        return;
      }
      toast.error("This live session just ended. Try another astrologer.");
    } finally {
      setOpening(false);
    }
  };

  if (!isLive) return null;

  return (
    <button
      type="button"
      className={`${styles.liveBadge} ${className}`.trim()}
      onClick={handleClick}
      aria-busy={opening}
      aria-label="Astrologer is live, click to watch"
    >
      <span className={styles.liveDot} />
      <span>{opening ? "Opening…" : "LIVE"}</span>
    </button>
  );
};

export default AstrologerLiveBadge;
