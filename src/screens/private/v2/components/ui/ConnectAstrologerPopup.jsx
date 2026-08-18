import { useEffect } from "react";
import { MessageSquare, Phone, Video, X } from "lucide-react";
import Toast from "../../../../../component/toast";
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
      Toast.error("Astrologer details are still loading. Please try again.");
      return;
    }

    // Unavailable options stay tappable and say why. They used to be dimmed
    // with `pointer-events: none`, so the tap hit nothing and the user got no
    // response at all — a dead click on the primary connect surface.
    const option = options.find((o) => o.key === type);
    if (option && !option.available) {
      Toast.info(option.reason);
      return;
    }

    let result = false;

    if (type === "chat") {
      result = await onChatStart(astrologer, isEmergency);
    } else if (type === "call") {
      result = await onCallStart(astrologer, "audio", isEmergency);
    } else if (type === "video") {
      result = await onCallStart(astrologer, "video", isEmergency);
    }

    // If astrologer is offline but emergency is available, notify parent
    if (result?.emergencyAvailable) {
      onClose();
      onEmergencyAvailable?.(astrologer);
      return;
    }

    if (result) {
      onClose();
    }
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
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`${styles.optionCard} ${!option.available ? styles.disabled : ''}`}
              onClick={() => handleConnect(option.key)}
              aria-disabled={!option.available}
              title={option.available ? `Start ${option.title.toLowerCase()}` : option.reason}
            >
              <div className={styles.iconCircle}>
                <option.Icon size={32} strokeWidth={2} />
              </div>
              <h3 className={styles.optionTitle}>{option.title}</h3>
              <p className={styles.optionPrice}>
                ₹{option.rate?.amount || 0}/{option.rate?.unit || 'minute'}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConnectAstrologerPopup;
