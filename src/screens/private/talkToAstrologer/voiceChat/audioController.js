import Toast from "../../../../component/toast";

let currentAudio = null;

/**
 * Starts playback on an audio element, stopping whichever one was playing.
 *
 * `audioEl.play()` returns a promise, and this used to ignore it entirely. Two
 * consequences, both of which read as a broken button:
 *
 *  - Mobile browsers reject playback that cannot be traced to a user gesture
 *    with NotAllowedError. Every caller here is a tap handler, but the permission
 *    is consumed synchronously and does not survive an `await` or an event
 *    callback — see the HLS path in OrderInfoCard, which used to start playback
 *    from `MANIFEST_PARSED`, i.e. a network round trip after the tap. The
 *    rejection surfaced as an unhandled promise, so `isPlaying` stayed false, the
 *    progress bar never moved, and nothing was said. Clarity recorded exactly
 *    this: repeat taps on call recordings in an in-app browser.
 *  - A genuinely broken or expired recording URL failed just as quietly.
 *
 * Returns the promise so callers can react, and reports the failure so the tap
 * is never silent. AbortError is swallowed on purpose: it means this playback was
 * superseded by another play/pause, which is normal operation rather than a
 * failure.
 */
export const playAudio = (audioEl) => {
  if (!audioEl) return Promise.resolve();

  // Pause previous audio if different (stop it and reset)
  if (currentAudio && currentAudio !== audioEl) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = audioEl;

  const started = audioEl.play();
  if (!started?.catch) return Promise.resolve();

  return started.catch((err) => {
    if (err?.name === "AbortError") return;

    console.error("Audio playback failed:", err);
    Toast.error(
      err?.name === "NotAllowedError"
        ? "Your browser blocked playback. Tap play again to allow it."
        : "Couldn't play this recording. Please try again."
    );
  });
};

// Pause at current position (WhatsApp-style — resume from same point)
export const stopAudio = (audioEl) => {
  if (audioEl) {
    audioEl.pause();
    // Do NOT reset currentTime — keep position for resume
    if (currentAudio === audioEl) {
      currentAudio = null;
    }
  }
};
