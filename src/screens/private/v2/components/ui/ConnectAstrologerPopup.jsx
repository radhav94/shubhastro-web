import { useEffect, useState } from "react";
import { MessageSquare, Phone, Video, X } from "lucide-react";
import { unavailableReason } from "../../../../../utils/helper/astrologerAvailability";
import { getAstrologerDisplayName } from "../../../../../utils/helper/string.utils";
import styles from "./ConnectAstrologerPopup.module.css";

const ConnectAstrologerPopup = ({
  isOpen,
  onClose,
  astrologer,
  onChatStart,
  onCallStart,
  isEmergency = false,
  onEmergencyAvailable,
  isLoadingAstrologer = false,
}) => {

  // Determine synchronously whether we should bypass this popup and go
  // straight to the emergency modal — avoids a flash of the call modal.
  // Trigger when emergency is available AND the astrologer is offline OR has
  // disabled all normal options (chat/call/video).
  //
  // IMPORTANT: only treat options as "disabled" when price data is actually
  // present. While the full astrologer is still loading (some screens open the
  // popup with a minimal object that has no `price`), we must NOT assume the
  // astrologer is disabled — otherwise every astrologer would redirect.
  const p = astrologer?.price;
  const hasPriceData = !!p;
  const allNormalDisabled =
    hasPriceData &&
    !(p?.chatRate?.amount > 0) &&
    !(p?.audioRate?.amount > 0) &&
    !(p?.videoCallRate?.amount > 0);
  const shouldRedirectToEmergency =
    !isEmergency &&
    !isLoadingAstrologer &&
    !!astrologer &&
    !!astrologer.isEmergencyAvailable &&
    !!onEmergencyAvailable &&
    (astrologer.isActive === false || allNormalDisabled);

  useEffect(() => {
    if (!isOpen) return;
    if (shouldRedirectToEmergency) {
      onClose();
      onEmergencyAvailable(astrologer);
    }
  }, [isOpen, shouldRedirectToEmergency]);

  /*
    Which option is mid-request, and why an option can't be used.

    This sheet is the primary connect surface on mobile — "Connect Now" opens it
    — and it had neither. Tapping Chat or Call awaits the parent's handler, which
    on the call path asks for microphone permission and then makes a
    balance/availability round trip; for that whole window the tile looked
    exactly as it did before the tap, and the sheet stayed open. When the attempt
    then failed the answer was a toast: portalled to the edge of the viewport,
    changing nothing inside the sheet, and identical repeats render as nothing at
    all.

    Clarity, mobile, from a paid Meta ad: 20 clicks in 1m42s, ending with
    "Connect Now" and the options inside it being tapped over and over between
    01:19 and 01:38 before the visitor left.

    Same treatment the astrologer listing card and the profile's connect tiles
    now have: name the state on the tile, and put the reason in the sheet.
  */
  const [connectingKey, setConnectingKey] = useState(null);
  const [blockedNote, setBlockedNote] = useState(null);

  const reportBlocked = (reason) =>
    setBlockedNote((prev) => ({ text: reason, seq: (prev?.seq || 0) + 1 }));

  // A fresh open should not inherit the last attempt's state.
  useEffect(() => {
    if (!isOpen) {
      setConnectingKey(null);
      setBlockedNote(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!blockedNote) return undefined;
    const id = setTimeout(() => setBlockedNote(null), 5000);
    return () => clearTimeout(id);
  }, [blockedNote]);

  // Don't render the call modal at all when redirecting to emergency.
  if (!isOpen || shouldRedirectToEmergency) return null;
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Use emergency pricing if in emergency mode
  const pricing = isEmergency ? astrologer?.emergencyPrice : astrologer?.price;

  // Check if service is available (price > 0 AND activeType includes it)
  const activeTypes = astrologer?.isActiveType || [];
  const isTypeActive = (type) => activeTypes.includes("all") || activeTypes.includes(type);

  const isChatAvailable = pricing ? (pricing.chatRate?.amount > 0 && isTypeActive("chat")) : true;
  const isCallAvailable = pricing ? (pricing.audioRate?.amount > 0 && isTypeActive("audio")) : true;
  const isVideoAvailable = pricing ? (pricing.videoCallRate?.amount > 0 && isTypeActive("video")) : true;

  // Why an option can't be used, phrased for the user. The two gates here are
  // "astrologer isn't taking this session type" and "no rate configured", so
  // online/live are not part of the decision at this point.
  const reasonFor = (label, type, rate) =>
    unavailableReason({
      label,
      isOnline: true,
      isLive: false,
      isTypeActive: isTypeActive(type),
      hasPrice: (rate?.amount || 0) > 0,
    });

  const options = [
    {
      key: "chat",
      title: "Chat",
      Icon: MessageSquare,
      rate: pricing?.chatRate,
      available: isChatAvailable,
      reason: reasonFor("Chat", "chat", pricing?.chatRate),
    },
    {
      key: "call",
      title: "Call",
      Icon: Phone,
      rate: pricing?.audioRate,
      available: isCallAvailable,
      reason: reasonFor("Call", "audio", pricing?.audioRate),
    },
    {
      key: "video",
      title: "Video call",
      Icon: Video,
      rate: pricing?.videoCallRate,
      available: isVideoAvailable,
      reason: reasonFor("Video call", "video", pricing?.videoCallRate),
    },
  ];

  const handleConnect = async (type) => {
    if (!astrologer) {
      reportBlocked("Astrologer details are still loading. Please try again.");
      return;
    }

    // Unavailable options stay tappable and say why. They used to be dimmed
    // with `pointer-events: none`, so the tap hit nothing and the user got no
    // response at all — a dead click on the primary connect surface. The reason
    // is rendered in the sheet rather than toasted; see reportBlocked.
    const option = options.find((o) => o.key === type);
    if (option && !option.available) {
      reportBlocked(option.reason);
      return;
    }

    // A request is already running. Say so on the surface that was tapped
    // instead of starting a second one.
    if (connectingKey) {
      reportBlocked(
        connectingKey === type
          ? "Connecting you now — one moment."
          : "Finishing the previous request — one moment."
      );
      return;
    }

    let result = false;

    setBlockedNote(null);
    setConnectingKey(type);
    try {
      if (type === "chat") {
        result = await onChatStart(astrologer, isEmergency);
      } else if (type === "call") {
        result = await onCallStart(astrologer, "audio", isEmergency);
      } else if (type === "video") {
        result = await onCallStart(astrologer, "video", isEmergency);
      }
    } finally {
      setConnectingKey(null);
    }

    // If astrologer is offline but emergency is available, notify parent
    if (result?.emergencyAvailable) {
      onClose();
      onEmergencyAvailable?.(astrologer);
      return;
    }

    if (result) {
      onClose();
      return;
    }

    /*
      The attempt was refused and this sheet is still on screen. The parent's
      handler has already explained why in a toast (insufficient balance opens the
      recharge modal, which is visible above this overlay), but the sheet itself
      would otherwise look untouched — which is what drives the repeat taps.
    */
    reportBlocked("That didn't go through. Check the message above, or try another option.");
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.popup}>
        <div className={styles.dragHandle}></div>

        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEmergency ? "Emergency Connect" : "Connect with"} {getAstrologerDisplayName(astrologer) || "Astrologer"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.optionsGrid}>
          {options.map((option) => {
            const isConnecting = connectingKey === option.key;
            return (
              <button
                key={option.key}
                type="button"
                className={`${styles.optionCard} ${!option.available ? styles.disabled : ''} ${
                  isConnecting ? styles.connecting : ''
                }`}
                onClick={() => handleConnect(option.key)}
                aria-disabled={!option.available}
                aria-busy={isConnecting}
                title={option.available ? `Start ${option.title.toLowerCase()}` : option.reason}
              >
                <div className={styles.iconCircle}>
                  <option.Icon size={32} strokeWidth={2} />
                </div>
                <h3 className={styles.optionTitle}>{option.title}</h3>
                {/* The price line carries the busy state: it is the only spare
                    line on the tile, and replacing it keeps the grid from
                    reflowing mid-request. */}
                <p className={styles.optionPrice}>
                  {isConnecting
                    ? "Connecting…"
                    : `₹${option.rate?.amount || 0}/${option.rate?.unit || 'minute'}`}
                </p>
              </button>
            );
          })}
        </div>

        {/* role="status" so it is announced as well as seen. See reportBlocked. */}
        {blockedNote && (
          <p key={blockedNote.seq} className={styles.blockedNote} role="status">
            {blockedNote.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConnectAstrologerPopup;
