import { useNavigate } from "react-router-dom";
import useAstrologerLiveStatus from "../../../hooks/useAstrologerLiveStatus";
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

  if (!isLive) return null;

  return (
    <button
      type="button"
      className={`${styles.liveBadge} ${className}`.trim()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (roomId) navigate(`/live/${roomId}`);
      }}
      aria-label="Astrologer is live, click to watch"
    >
      <span className={styles.liveDot} />
      <span>LIVE</span>
    </button>
  );
};

export default AstrologerLiveBadge;
