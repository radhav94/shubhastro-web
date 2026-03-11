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
   * Selects the appropriate kundli from the user's profiles
   * Priority: 1) "self" relation kundli, 2) first kundli in the list
   * @returns {object|null} - Selected kundli profile or null
   */
  const getSelectedKundli = useCallback(() => {
    if (!profiles || profiles.length === 0) {
      return null;
    }

    // Try to find a kundli with relation "self" (case-insensitive)
    const selfKundli = profiles.find(
      (profile) => profile.relation?.toLowerCase() === "self"
    );

    // Return self kundli if found, otherwise return the first kundli
    return selfKundli || profiles[0];
  }, [profiles]);

  /**
   * Validates if user can connect (logged in + has kundli)
   * @returns {boolean} - true if validation passes, false otherwise
   */
  const validateBeforeConnection = useCallback(() => {
    // alert("validateBeforeConnection")
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
      try {
        const result = await getBalance({ astrologerId: astro?._id });
        
        // Check balance status
        if (result?.data?.data?.status === false) {
          setOpenModal((prev) => ({ ...prev, recharge: true }));
          return false;
        }
        
        // Check if astrologer is online for chat
        const availability = result?.data?.data?.availability;
        const isActive = availability?.isActive === true;
        const isActiveForChat = Array.isArray(availability?.isActiveType) 
          ? availability.isActiveType.includes("chat")
          : false;
        
        if (!isActive || !isActiveForChat) {
          Toast.error("Astrologer is not available for chat");
          return false;
        }
      } catch (error) {
        console.error("Error checking balance/availability:", error);
        Toast.error("Failed to check astrologer availability");
        return false;
      }
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
    // alert("handleCallStart")
    
    // Validate profile and kundli before proceeding
    if (!validateBeforeConnection()) {
      return false;
    }

    setSelectedAstrologer(astro);
    setLastRequestedCallAstro(astro);
    activeCallAstroRef.current = astro; // Store in ref immediately
    console.log("📝 Stored in activeCallAstroRef:", activeCallAstroRef.current);

    try {
      // Check balance
      const result = await getBalance({ astrologerId: astro?._id, type: "call" });
      
      // Check balance status
      if (result?.data?.data?.status === false) {
        setOpenModal((prev) => ({ ...prev, recharge: true }));
        return false;
      }

      // Check if astrologer is online for the specific call type (audio/video)
      const availability = result?.data?.data?.availability;
      const isActive = availability?.isActive === true;
      const isActiveForCallType = Array.isArray(availability?.isActiveType) 
        ? availability.isActiveType.includes(type)
        : false;
      
      if (!isActive || !isActiveForCallType) {
        const callTypeLabel = type === "audio" ? "voice call" : "video call";
        Toast.error(`Astrologer is not available for ${callTypeLabel}`);
        return false;
      }
    } catch (error) {
      console.error("Error checking balance/availability:", error);
      Toast.error("Failed to check astrologer availability");
      return false;
    }

    // setOpenModal((prev) => ({ ...prev, kundli: true }));
    handleAfterKundliSelect(astro, type) // Pass type directly
    return true;
  }, [getBalance, setLastRequestedCallAstro, validateBeforeConnection]);

  // After kundli selection
  const handleAfterKundliSelect = useCallback(async (selectedAstrologer, connectionType = null) => {
    // setOpenModal((prev) => ({ ...prev, kundli: false }));
    console.log("handleAfterKundliSelect", selectedAstrologer);

    // NEW LOGIC: Select kundli with priority - "self" relation first, then first kundli
    let selectedKundli = null;
    if (profiles && profiles.length > 0) {
      // Try to find a kundli with relation "self" (case-insensitive)
      const selfKundli = profiles.find(
        (profile) => profile.relation?.toLowerCase() === "self"
      );
      // Use self kundli if found, otherwise use the first kundli
      selectedKundli = selfKundli || profiles[0];
      console.log('selectedKundli', selectedKundli)
      
      if (selectedKundli) {
        kundliRef.current = selectedKundli._id;
        setLastSelectedKundli(selectedKundli);
        console.log("📋 Selected Kundli:", selectedKundli.relation || "Unknown", "ID:", selectedKundli._id);
      }
    }

    // OLD LOGIC (commented out for reference):
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
  }, [token, userIdLocal, activeCall, navigate, location, setLastSelectedKundli, setLastCallType, setCallWaitingList, profiles]);

  const handleRechargeNow = useCallback(() => {
    setOpenModal((prev) => ({ ...prev, recharge: false }));
    // alert("handleRechargeNow")
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
