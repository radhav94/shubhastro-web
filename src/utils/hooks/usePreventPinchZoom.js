import { useEffect } from "react";

/**
 * Blocks pinch / gesture zoom while a fullscreen camera screen is mounted.
 *
 * The AI-WOW camera overlays are fullscreen and rely on the user aligning their
 * hand/face/object precisely — an accidental pinch that zooms the whole page
 * ruins the framing. Browsers zoom via different mechanisms, so we defend on
 * all of them:
 *   - Chrome/Android & modern browsers: two-finger `touchmove` (preventDefault
 *     on a non-passive listener stops the pinch-zoom gesture).
 *   - iOS Safari: `gesturestart` / `gesturechange` / `gestureend` events.
 *   - Ctrl/⌘ + wheel zoom on desktop.
 *
 * Double-tap-to-zoom is deliberately NOT handled here. It is covered by
 * `touch-action: manipulation` on html/body in index.html.
 *
 * There used to be a fourth listener for it:
 *
 *   let lastTouchEnd = 0;
 *   const onTouchEnd = (e) => {
 *     const now = Date.now();
 *     if (now - lastTouchEnd <= 300) e.preventDefault();
 *     lastTouchEnd = now;
 *   };
 *
 * Cancelling `touchend` suppresses more than zoom. It also suppresses the
 * compatibility mouse events the browser synthesises from that tap, `click`
 * among them — so a second tap inside 300ms produced no click at all. And
 * because `lastTouchEnd` was reassigned even on the taps it had just cancelled,
 * a steady sub-300ms tapping rate kept every tap after the first cancelled for
 * as long as the tapping continued.
 *
 * That is bad anywhere (see the longer account in index.html, where the same
 * handler existed document-wide), and particularly bad here: these are
 * fullscreen camera screens whose entire purpose is one press of a capture
 * button. A user who taps capture twice in quick succession — the natural
 * response to a shutter that seems not to have fired — lost the retry. Worse
 * than the global copy, too, since these listeners use `capture: true` and so
 * ran ahead of everything else.
 *
 * The remaining listeners are all safe: `touchmove`, `gesture*` and `wheel`
 * carry no click behaviour, and `touch-action: manipulation` still permits
 * pinch zoom, so the `touchmove` guard below is doing real work.
 *
 * Listeners are attached to `document` (capture, non-passive) so they win over
 * anything below, and are fully removed on unmount.
 */
const usePreventPinchZoom = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const stop = (e) => {
      e.preventDefault();
    };

    // Two-finger pinch (Android/Chrome/Firefox).
    const onTouchMove = (e) => {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    };

    // Ctrl/Cmd + mouse wheel zoom (desktop trackpad pinch).
    const onWheel = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };

    const opts = { passive: false, capture: true };

    document.addEventListener("touchmove", onTouchMove, opts);
    document.addEventListener("gesturestart", stop, opts);
    document.addEventListener("gesturechange", stop, opts);
    document.addEventListener("gestureend", stop, opts);
    document.addEventListener("wheel", onWheel, opts);

    return () => {
      document.removeEventListener("touchmove", onTouchMove, opts);
      document.removeEventListener("gesturestart", stop, opts);
      document.removeEventListener("gesturechange", stop, opts);
      document.removeEventListener("gestureend", stop, opts);
      document.removeEventListener("wheel", onWheel, opts);
    };
  }, [enabled]);
};

export default usePreventPinchZoom;
