import { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PATH } from "../routes/Paths";
import { getToken } from "../token";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useCall } from "../../context/CallContext";
import { useChat } from "../../context/ChatContext";
import { useGetBalanceMutation } from "../../redux/api/wallet/walletApi";
import { useCreateChatRoomMutation } from "../../redux/api/chatApi";
import Toast from "../../component/toast";

export const useAstrologerConnect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = getToken();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  const [openModal, setOpenModal] = useState({
    recharge: false,
    kundli: false,
  });
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [callType, setCallType] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);

  const {
    setActiveCall,
    setWaitingList: setCallWaitingList,
    setActiveCallRoomId,
    resetCallFlow,
    setLastCallType,
    setLastSelectedKundli,
    setLastRequestedAstro: setLastRequestedCallAstro,
    activeCall,
  } = useCall();

  const {
    setActiveChat,
    setWaitingList,
    resetChatFlow,
    setActiveChatRoomId,
    setLastRequestedAstro,
    setChatSeconds,
  } = useChat();

  const activeCallAstroRef = useRef(null);
  const kundliRef = useRef(null);

  const [getBalance] = useGetBalanceMutation();
  const [createChatRoom] = useCreateChatRoomMutation();

  // Chat handler
  const handleChatStart = useCallback(async (astro, checkBalance = true) => {
    console.log("🚀 Chat Start - Astrologer:", astro);
    setSelectedAstrologer(astro);
    setLastRequestedAstro(astro);
    activeCallAstroRef.current = astro; // Store in ref immediately
    setCallType(null); // Reset call type for chat
    console.log("📝 Stored in activeCallAstroRef:", activeCallAstroRef.current);
    console.log("💬 Call type reset to null for chat");

    // Check balance conditionally
    if (checkBalance) {
      const result = await getBalance({ astrologerId: astro?._id });
      if (result.data.data.status === false) {
        setOpenModal((prev) => ({ ...prev, recharge: true }));
        return false;
      }
    }

    // Check if online
    if (!astro?.isActive) {
      Toast.error("Astrologer is not online");
      return false;
    }

    // Open kundli selection
    // setOpenModal((prev) => ({ ...prev, kundli: true }));
    handleAfterKundliSelect(astro)
    return true;
  }, [getBalance, setLastRequestedAstro]);

  // Call handler
  const handleCallStart = useCallback(async (astro, type) => {
    console.log("📞 Call Start - Astrologer:", astro);
    console.log("📞 Call Type:", type);
    setSelectedAstrologer(astro);
    setLastRequestedCallAstro(astro);
    activeCallAstroRef.current = astro; // Store in ref immediately
    console.log("📝 Stored in activeCallAstroRef:", activeCallAstroRef.current);

    // Check balance
    const result = await getBalance({ astrologerId: astro?._id, type: "call" });
    if (result.data.data.status === false) {
      setOpenModal((prev) => ({ ...prev, recharge: true }));
      return false;
    }

    // Check if online
    if (!astro?.isActive) {
      Toast.error("Astrologer is not online");
      return false;
    }

    setCallType(type);
    // setOpenModal((prev) => ({ ...prev, kundli: true }));
    handleAfterKundliSelect(astro)
    return true;
  }, [getBalance, setLastRequestedCallAstro]);

  // After kundli selection
  const handleAfterKundliSelect = useCallback(async (selectedAstrologer) => {
    // setOpenModal((prev) => ({ ...prev, kundli: false }));

    // if (!kundli?._id) return Toast.error("Kundli not selected properly");
    // kundliRef.current = kundli._id;
    // setLastSelectedKundli(kundli);

    if (!selectedAstrologer?._id) return Toast.error("Astrologer not selected");
    if (!userIdLocal) return Toast.error("User ID Missing");

    const astro = selectedAstrologer;
    localStorage.setItem("selectedAstroId", astro._id);

    try {
      if (!token) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      activeCallAstroRef.current = astro;

      console.log("🎯 Initiating connection - Call Type:", callType);

      // If call type exists, initiate call, otherwise chat
      if (callType) {
        // Initiate call
        if (activeCall) {
          return Toast.error("You are already on a call");
        }

        console.log("📞 Emitting call:initiate with type:", callType);
        setLastCallType(callType);

        voiceSocket.emit("call:initiate", {
          userId: userIdLocal,
          astrologerId: astro._id,
          type: callType,
        });
        
        // Reset call type after emitting
        setCallType(null);
      } else {
        // Initiate chat
        console.log("💬 Emitting chat:initiate");
        voiceSocket.emit("chat:initiate", {
          userId: userIdLocal,
          astrologerId: astro._id,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }, [selectedAstrologer, callType, token, userIdLocal, activeCall, navigate, location, setLastSelectedKundli, setLastCallType, setCallWaitingList]);

  const handleRechargeNow = useCallback(() => {
    setOpenModal((prev) => ({ ...prev, recharge: false }));
    navigate(PATH.privateRoutes.RECHARGE.path);
  }, [navigate]);

  return {
    handleChatStart,
    handleCallStart,
    handleAfterKundliSelect,
    handleRechargeNow,
    openModal,
    setOpenModal,
    selectedAstrologer,
    chatRoomId,
    setChatRoomId,
    activeCallAstroRef,
    kundliRef,
  };
};
