import { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Toast } from "../../component";
import { getToken } from "../token";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useCall } from "../../context/CallContext";
import { useGetBalanceMutation } from "../../redux/api/wallet/walletApi";

export const useInitiateCall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeCall, setOpenModal, setLastCallType, lastSelectedKundli, setWaitingList } = useCall();
  const [getBalance] = useGetBalanceMutation();
  
  const activeCallAstroRef = useRef(null);
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const token = getToken();

  const initiateCall = async (astro, type = "audio") => {
    // 🔐 Auth check
    if (!token) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    // ❌ Validations
    if (!astro) return Toast.error("Astrologer missing");
    if (!userIdLocal) return Toast.error("User ID missing");

    // Check if we have a stored Kundli
    if (!lastSelectedKundli?._id) {
      Toast.error("Please select a Kundli first");
      // Navigate back to astrologer page to select Kundli
      navigate("/call-with-astrologers/", {
        state: { rejoinAstro: astro }
      });
      return;
    }

    // 💰 Balance check
    const res = await getBalance({ astrologerId: astro._id, type: type });
    if (!res?.data?.data?.status || res?.data?.data?.availableAmount < res?.data?.data?.requiredAmount) {
      setOpenModal((prev) => ({ ...prev, recharge: true }));
      return;
    }

    // 🔴 Check if astrologer is currently on a live stream
    const liveStatus = res?.data?.data?.astrologerLiveStatus;
    if (liveStatus?.isLive) {
      Toast.error("Currently unavailable during live stream.");
      return;
    }

    // 📞 Already on call
    if (activeCall) {
      return Toast.error("You are already on a call");
    }

    // Check if astrologer is online
    if (!astro?.isActive) {
      Toast.error("Astrologer is not online");
      return;
    }

    // ✅ Store active call info
    activeCallAstroRef.current = astro;
    setLastCallType(type); // Store the call type in context
    setWaitingList(5); // Show waiting footer with 5 min estimate

    // 🚀 Create call room
    voiceSocket.emit("call:initiate", {
      userId: userIdLocal,
      astrologerId: astro._id,
      type, // "audio" | "video"
      kundliId: lastSelectedKundli._id, // Include the Kundli ID
    });
  };

  return { initiateCall };
};