import { useCallback, useState } from "react";
import GuestKundliAuthModal from "../../../component/UI/Profile/GuestKundliAuthModal";
import { voiceSocket } from "../../../services/voiceSocketServices";
import { useWaitingQueue } from "../../../context/WaitingQueueContext";
import { useMediaPermission } from "../../../utils/hooks/useMediaPermission";
import { GUEST_AUTO_ACCEPT_KEY } from "./guestChatConstants";

/**
 * Guest flow for CALL / VIDEO — mirrors the AI Wow guest flow.
 *
 * When a guest taps Call/Video we open the same GuestKundliAuthModal used by
 * AI Wow (collect details → OTP → register → login). On success we connect the
 * socket for the freshly-registered user and initiate the call; the astrologer's
 * acceptance is auto-accepted (no accept popup) and the global call UI takes over.
 *
 * Usage:
 *   const { openGuestConnect, guestConnectModal } = useGuestConnectFlow();
 *   // for a guest tapping audio/video: openGuestConnect(astrologer, "audio"|"video")
 *   // render {guestConnectModal} in the component tree
 */
export const useGuestConnectFlow = () => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null); // { astro, type }
  const { addPendingConnection } = useWaitingQueue();
  const { checkPermission } = useMediaPermission();

  const openGuestConnect = useCallback((astro, type) => {
    setPending({ astro, type: type === "video" ? "video" : "audio" });
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setPending(null);
  }, []);

  const handleSuccess = useCallback(async () => {
    setOpen(false);
    const target = pending;
    setPending(null);
    if (!target?.astro?._id) return;

    const { astro, type } = target;
    const userId = localStorage.getItem("shubhtalk_customer_id");
    if (!userId) return;

    // Ensure mic (and camera for video) permission before starting the call.
    const ok = await checkPermission(type === "video" ? "both" : "microphone");
    if (!ok) return;

    if (!voiceSocket.connected) {
      voiceSocket.io.opts.query = { userId, role: "CUSTOMER" };
      voiceSocket.connect();
    }

    // Auto-accept the astrologer's acceptance (consumed by WaitingQueueContext).
    sessionStorage.setItem(GUEST_AUTO_ACCEPT_KEY, astro._id);

    addPendingConnection({
      id: `${astro._id}-${type}-${Date.now()}`,
      astrologer: astro,
      type,
      roomId: null,
      waitingTime: 5,
    });

    voiceSocket.emit("call:initiate", {
      userId,
      astrologerId: astro._id,
      type,
      isLive: false,
    });
  }, [pending, addPendingConnection, checkPermission]);

  const guestConnectModal = (
    <GuestKundliAuthModal
      isOpen={open}
      onClose={handleClose}
      onSuccess={handleSuccess}
      title="Enter your details"
    />
  );

  return { openGuestConnect, guestConnectModal };
};

export default useGuestConnectFlow;
