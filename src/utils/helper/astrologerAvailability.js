/**
 * Shared availability messaging for astrologer chat/call actions.
 *
 * These CTAs used to be rendered as `disabled` buttons with a `title` tooltip
 * explaining why. That combination gives touch users nothing at all: a disabled
 * button never fires a click event, and `title` tooltips do not exist on
 * mobile/tablet. The buttons therefore looked tappable, absorbed the tap and
 * responded in no way — which Clarity records as dead clicks.
 *
 * The rule everywhere now: keep the button tappable, mark it `aria-disabled`,
 * and explain the blocker on tap. This helper is the single source of that
 * explanation so the tooltip, the toast and the visual state cannot disagree.
 */

/**
 * @param {Object} params
 * @param {"Chat"|"Call"} params.label   Human-readable action name.
 * @param {boolean} params.isOnline      Astrologer is currently active.
 * @param {boolean} params.isLive        Astrologer is live streaming.
 * @param {boolean} params.isTypeActive  Astrologer accepts this session type.
 * @param {boolean} params.hasPrice      A rate is configured for this type.
 * @returns {string} Reason the action cannot start, phrased for the user.
 */
export const unavailableReason = ({ label, isOnline, isLive, isTypeActive, hasPrice }) => {
  if (isLive) {
    return `${label} is unavailable while the astrologer is live — join the live session instead`;
  }
  if (!isOnline) {
    return "Astrologer is offline right now. Try another astrologer or check back soon.";
  }
  if (!isTypeActive) {
    return `This astrologer is not taking ${label.toLowerCase()} sessions right now`;
  }
  if (!hasPrice) {
    return `${label} pricing is unavailable for this astrologer`;
  }
  return `${label} is currently unavailable`;
};

/**
 * Derives enable flags plus ready-to-show reasons for both session types.
 *
 * @param {Object} astrologer  Astrologer record from the API.
 * @param {boolean} isLive     From useAstrologerLiveStatus.
 */
export const getAstrologerAvailability = (astrologer, isLive) => {
  const isOnline = astrologer?.isActive === true;
  const activeTypes = astrologer?.isActiveType || [];
  const chatPrice = Number(astrologer?.price?.chatRate?.amount) || 0;
  const callPrice = Number(astrologer?.price?.audioRate?.amount) || 0;
  const chatTypeActive = activeTypes.includes("all") || activeTypes.includes("chat");
  const callTypeActive = activeTypes.includes("all") || activeTypes.includes("audio");

  return {
    isOnline,
    chatPrice,
    callPrice,
    chatEnabled: isOnline && !isLive && chatTypeActive && chatPrice > 0,
    callEnabled: isOnline && !isLive && callTypeActive && callPrice > 0,
    chatReason: unavailableReason({
      label: "Chat",
      isOnline,
      isLive,
      isTypeActive: chatTypeActive,
      hasPrice: chatPrice > 0,
    }),
    callReason: unavailableReason({
      label: "Call",
      isOnline,
      isLive,
      isTypeActive: callTypeActive,
      hasPrice: callPrice > 0,
    }),
  };
};
