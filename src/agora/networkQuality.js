/**
 * Agora network (signal) quality helpers.
 *
 * Agora's `network-quality` event reports `uplinkNetworkQuality` and
 * `downlinkNetworkQuality` on a 0-6 scale:
 *   0 = quality unknown
 *   1 = excellent
 *   2 = good
 *   3 = poor but usable
 *   4 = barely usable
 *   5 = very bad
 *   6 = unable to communicate
 *
 * Reference: https://api-ref.agora.io/en/video-sdk/web/4.x/interfaces/networkquality.html
 */

// Maps an Agora quality value (0-6) to a short status label + severity level.
// `level` is one of: "unknown" | "good" | "medium" | "bad"
// `quality` is the raw 0-6 value so callers can drive extra behaviour (toasts).
export const getNetworkQualityInfo = (quality) => {
  switch (quality) {
    case 1:
    case 2:
      // Excellent / Good
      return { label: "Connected", level: "good", color: "#16a34a", quality };
    case 3:
      // Poor — subtle warning
      return { label: "Weak Connection", level: "medium", color: "#eab308", quality };
    case 4:
    case 5:
      // Bad / Very bad
      return { label: "Poor Connection", level: "bad", color: "#ef4444", quality };
    case 6:
      // Disconnected
      return { label: "No Signal", level: "bad", color: "#dc2626", quality };
    case 0:
    default:
      return { label: "Connecting…", level: "unknown", color: "#9ca3af", quality: 0 };
  }
};

/**
 * Given the Agora `network-quality` stats object, returns the label/level for
 * the worse of the uplink and downlink so the indicator reflects the weakest
 * link. Values of 0 (unknown) are ignored when a real reading is available.
 */
export const getWorstNetworkQuality = (stats) => {
  const up = stats?.uplinkNetworkQuality ?? 0;
  const down = stats?.downlinkNetworkQuality ?? 0;

  // Ignore unknown (0) readings if at least one direction has real data.
  const known = [up, down].filter((q) => q > 0);
  if (known.length === 0) {
    return getNetworkQualityInfo(0);
  }

  // Higher number = worse quality, so take the max of known readings.
  const worst = Math.max(...known);
  return getNetworkQualityInfo(worst);
};
