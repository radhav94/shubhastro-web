import { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PATH } from "../routes/Paths";
import { getToken } from "../token";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useCall } from "../../context/CallContext";
import { useChat } from "../../context/ChatContext";
import { useGetBalanceMutation } from "../../redux/api/wallet/walletApi";
import { useCreateChatRoomMutation } from "../../redux/api/chatApi";
import { useGetAllKundlisQuery } from "../../services/appServices/kundliServicesNew";
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
  const [chatRoomId, setChatRoomId] = useState(null);

  // Fetch user's kundli profiles for validation
  const { data: kundliData, isLoading: isValidating } = useGetAllKundlisQuery(undefined, {
    skip: !token || !userIdLocal,
  });

  const profiles = kundliData?.data || [];

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

  /**
   * Validates if user can connect (logged in + has kundli)
   * @returns {boolean} - true if validation passes, false otherwise
   */
  const validateBeforeConnection = useCallback(() => {
    // Check if user is logged in
    if (!token || !userIdLocal) {
      Toast.error("Please login to continue");
      navigate(PATH.publicRoutes.LOGIN.path);
      return false;
    }

    // Check if user has at least one kundli profile
    const hasKundli = profiles.length > 0;

    if (!hasKundli) {
      Toast.error("Please create your Kundli before starting chat or call.");
      navigate(PATH.privateRoutes.PROFILE.path, { state: { requiresCreation: true } });
      return false;
    }

    return true;
  }, [token, userIdLocal, profiles, navigate]);

  // Chat handler
  const handleChatStart = useCallback(async (astro, checkBalance = true) => {
    console.log("🚀 Chat Start - Astrologer:", astro);
    
    // Validate profile and kundli before proceeding
    if (!validateBeforeConnection()) {
      return false;
    }

    setSelectedAstrologer(astro);
    setLastRequestedAstro(astro);
    activeCallAstroRef.current = astro; // Store in ref immediately
    console.log("📝 Stored in activeCallAstroRef:", activeCallAstroRef.current);

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
    handleAfterKundliSelect(astro, null) // Pass null for chat
    return true;
  }, [getBalance, setLastRequestedAstro, validateBeforeConnection]);

  // Call handler
  const handleCallStart = useCallback(async (astro, type) => {
    console.log("📞 Call Start - Astrologer:", astro);
    console.log("📞 Call Type:", type);
    
    // Validate profile and kundli before proceeding
    if (!validateBeforeConnection()) {
      return false;
    }

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

    // setOpenModal((prev) => ({ ...prev, kundli: true }));
    handleAfterKundliSelect(astro, type) // Pass type directly
    return true;
  }, [getBalance, setLastRequestedCallAstro, validateBeforeConnection]);

  // After kundli selection
  const handleAfterKundliSelect = useCallback(async (selectedAstrologer, connectionType = null) => {
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

      console.log("🎯 Initiating connection - Connection Type:", connectionType);

      // If connection type exists, initiate call, otherwise chat
      if (connectionType) {
        // Initiate call
        if (activeCall) {
          return Toast.error("You are already on a call");
        }

        console.log("📞 Emitting call:initiate with type:", connectionType);
        setLastCallType(connectionType);

        voiceSocket.emit("call:initiate", {
          userId: userIdLocal,
          astrologerId: astro._id,
          type: connectionType,
        });
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
  }, [token, userIdLocal, activeCall, navigate, location, setLastSelectedKundli, setLastCallType, setCallWaitingList]);

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
    // Validation properties
    validateBeforeConnection,
    isValidating,
    hasProfile: !!(token && userIdLocal),
    hasKundli: profiles.length > 0,
  };
};
