import React, { useRef } from "react";
import styles from "./ProgressBar.module.scss";

/**
 * Seek bar for a call recording.
 *
 * Was mouse-only: `onMouseDown` plus document-level `mousemove`/`mouseup`
 * listeners. Touch never produces those, so scrubbing a recording on a phone
 * relied entirely on the browser's compatibility mouse events — which fire only
 * for a clean tap, and are cancelled the moment the gesture is interpreted as a
 * scroll. Dragging along the bar (the way anyone scrubs audio) therefore did
 * nothing at all, and inside an in-app browser even the tap is unreliable. The
 * track carries `cursor: pointer` and a thumb, so it advertises exactly the
 * interaction it did not support.
 *
 * Pointer Events cover mouse, touch and pen with one code path, and
 * `setPointerCapture` keeps the drag alive when the finger leaves the 6px track.
 * `touch-action: none` (see the stylesheet) stops the page claiming the gesture
 * as a scroll mid-scrub.
 */
const ProgressBar = ({ progress = 0, onSeek }) => {
  const progressRef = useRef(null);

  const updateProgress = (clientX) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect?.width) return;

    let percentage = ((clientX - rect.left) / rect.width) * 100;
    percentage = Math.max(0, Math.min(100, percentage));

    onSeek?.(percentage);
  };

  const handlePointerDown = (e) => {
    // Capture on the track itself, so move/up keep arriving here rather than
    // needing document-level listeners that have to be torn down by hand.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    updateProgress(e.clientX);
  };

  const handlePointerMove = (e) => {
    // Only while dragging. `buttons` is 0 for a hover and 1 while held, for
    // touch as well as mouse.
    if (e.buttons !== 1) return;
    updateProgress(e.clientX);
  };

  const handleKeyDown = (e) => {
    // The bar had no keyboard path at all. 5% nudges plus Home/End.
    const step = 5;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onSeek?.(Math.min(100, progress + step));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onSeek?.(Math.max(0, progress - step));
    } else if (e.key === "Home") {
      e.preventDefault();
      onSeek?.(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onSeek?.(100);
    }
  };

  return (
    <div
      ref={progressRef}
      className={styles.progressBar}
      role="slider"
      tabIndex={0}
      aria-label="Seek recording"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-valuetext={`${Math.round(progress)}%`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
    >
      <div
        className={styles.progressFill}
        style={{ width: `${progress}%` }}
      />
      <div
        className={styles.thumb}
        style={{ left: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
