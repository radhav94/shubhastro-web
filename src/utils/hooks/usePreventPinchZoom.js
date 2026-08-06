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
 *   - Double-tap-to-zoom: a quick second tap within 300ms.
 *   - Ctrl/⌘ + wheel zoom on desktop.
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

    // Double-tap-to-zoom (iOS Safari mostly).
    let lastTouchEnd = 0;
    const onTouchEnd = (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    };

    // Ctrl/Cmd + mouse wheel zoom (desktop trackpad pinch).
    const onWheel = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };

    const opts = { passive: false, capture: true };

    document.addEventListener("touchmove", onTouchMove, opts);
    document.addEventListener("touchend", onTouchEnd, opts);
    document.addEventListener("gesturestart", stop, opts);
    document.addEventListener("gesturechange", stop, opts);
    document.addEventListener("gestureend", stop, opts);
    document.addEventListener("wheel", onWheel, opts);

    return () => {
      document.removeEventListener("touchmove", onTouchMove, opts);
      document.removeEventListener("touchend", onTouchEnd, opts);
      document.removeEventListener("gesturestart", stop, opts);
      document.removeEventListener("gesturechange", stop, opts);
      document.removeEventListener("gestureend", stop, opts);
      document.removeEventListener("wheel", onWheel, opts);
    };
  }, [enabled]);
};

export default usePreventPinchZoom;
