import { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { PATH } from "../routes/Paths";
import { getToken } from "../token";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useCall } from "../../context/CallContext";
import { useChat } from "../../context/ChatContext";
import { useWaitingQueue } from "../../context/WaitingQueueContext";
import { useGetBalanceMutation } from "../../redux/api/wallet/walletApi";
import { useCreateChatRoomMutation } from "../../redux/api/chatApi";
import { useGetAllKundlisQuery } from "../../services/appServices/kundliServicesNew";
import Toast from "../../component/toast";

export const useAstrologerConnect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Get the kundli selected by user in the header dropdown
  const headerSelectedKundli = useSelector((state) => state.kundli.selectedKundli);
  const token = getToken();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  const { addPendingConnection, isInQueue, isQueueFull } = useWaitingQueue();

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
    activeChat,
    setActiveChat,
    setWaitingList,
    resetChatFlow,
    setActiveChatRoomId,
    setLastRequestedAstro,
    setChatSeconds,
  } = useChat();

  const activeCallAstroRef = useRef(null);
  const kundliRef = useRef(null);
  const activeCallRef = useRef(activeCall);
  const activeChatRef = useRef(activeChat);

  // Keep refs in sync
  activeCallRef.current = activeCall;
  activeChatRef.current = activeChat;

  const [getBalance] = useGetBalanceMutation();
  const [createChatRoom] = useCreateChatRoomMutation();

  /**
   * Selects the appropriate kundli from the user's profiles
   * Priority: 1) "self" relation kundli, 2) first kundli in the list
   * @returns {object|null} - Selected kundli profile or null
   */
  const getSelectedKundli = useCallback(() => {
    // Priority: header-selected kundli first
    if (headerSelectedKundli?._id) {
      return headerSelectedKundli;
    }

    if (!profiles || profiles.length === 0) {
      return null;
    }

    const selfKundli = profiles.find(
      (profile) => profile.relation?.toLowerCase() === "self"
    );

    return selfKundli || profiles[0];
  }, [profiles, headerSelectedKundli]);

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
  const handleChatStart = useCallback(async (astro, checkBalance = true, isEmergency = false) => {
    console.log("[NormalFlow] 💬 handleChatStart called");
    console.log("[NormalFlow]   → astrologer:", astro?._id, astro?.firstName, astro?.lastName);
    console.log("[NormalFlow]   → checkBalance:", checkBalance);
    console.log("[NormalFlow]   → isEmergency:", isEmergency);
    
    // Validate profile and kundli before proceeding
    if (!validateBeforeConnection()) {
      console.log("[NormalFlow] ❌ validateBeforeConnection failed — aborting chat start");
      return false;
    }
    console.log("[NormalFlow] ✅ Validation passed");

    setSelectedAstrologer(astro);
    setLastRequestedAstro(astro);
    activeCallAstroRef.current = astro; // Store in ref immediately
    console.log("[NormalFlow] 📝 Stored astrologer in ref:", astro?._id);

    // Check balance conditionally
    if (checkBalance) {
      try {
        console.log("[NormalFlow] 💰 Checking balance for chat...");
        const result = await getBalance({ astrologerId: astro?._id, ...(isEmergency && { isEmergency: true }) });
        console.log("[NormalFlow] 💰 Balance API response:", JSON.stringify(result?.data?.data));
        
        // Check balance status
        const checkBalanceStatus = result?.data?.data?.status;

        if (checkBalanceStatus === false) {
          console.log("[NormalFlow] ❌ Insufficient balance — opening recharge modal");
          setOpenModal((prev) => ({ ...prev, recharge: true }));
          return false;
        } else if (checkBalanceStatus === undefined)
          return false;
        
        // Check if astrologer is online for chat
        // API returns availability fields flat in data (not nested under .availability)
        const balanceData = result?.data?.data || {};
        const isActive = balanceData?.isActive === true || balanceData?.availability?.isActive === true;
        const activeTypes = balanceData?.isActiveType || balanceData?.availability?.isActiveType;
        const isActiveForChat = Array.isArray(activeTypes) 
          ? activeTypes.includes("chat")
          : (balanceData?.isActiveForChat === true);
        
        console.log("[NormalFlow] 📊 Availability check:", {
          isActive,
          isActiveType: activeTypes,
          isActiveForChat,
          rawKeys: Object.keys(balanceData),
        });
        
        if (!isEmergency && (!isActive || !isActiveForChat)) {
          // Check if emergency is available — must be explicitly true
          const isEmergencyAvailable = balanceData?.availability?.isEmergencyAvailable === true || balanceData?.isEmergencyAvailable === true;
          if (isEmergencyAvailable) {
            console.log("[NormalFlow] 🚨 Astrologer offline but emergency available");
            return { emergencyAvailable: true, astrologer: astro };
          }
          console.log("[NormalFlow] ❌ Astrologer not available for chat");
          Toast.error("Astrologer is not available for chat");
          return false;
        }

        // Check if astrologer is currently on a live stream
        const chatLiveStatus = balanceData?.astrologerLiveStatus;
        if (chatLiveStatus?.isLive) {
          console.log("[NormalFlow] ❌ Astrologer is on live stream — blocking chat");
          Toast.error("Currently unavailable during live stream.");
          return false;
        }

        console.log("[NormalFlow] ✅ Balance & availability OK for chat");
      } catch (error) {
        console.error("[NormalFlow] ❌ Balance/availability check error:", error);
        Toast.error("Failed to check astrologer availability");
        return false;
      }
    }

    // Open kundli selection
    // setOpenModal((prev) => ({ ...prev, kundli: true }));
    console.log("[NormalFlow] ➡️ Proceeding to handleAfterKundliSelect (chat)");
    handleAfterKundliSelect(astro, null, isEmergency)
    return true;
  }, [getBalance, setLastRequestedAstro, validateBeforeConnection]);

  // Call handler
  const handleCallStart = useCallback(async (astro, type, isEmergency = false) => {
    console.log("[NormalFlow] 📞 handleCallStart called");
    console.log("[NormalFlow]   → astrologer:", astro?._id, astro?.firstName, astro?.lastName);
    console.log("[NormalFlow]   → callType:", type);
    console.log("[NormalFlow]   → isEmergency:", isEmergency);
    
    // Validate profile and kundli before proceeding
    if (!validateBeforeConnection()) {
      console.log("[NormalFlow] ❌ validateBeforeConnection failed — aborting call start");
      return false;
    }
    console.log("[NormalFlow] ✅ Validation passed");

    setSelectedAstrologer(astro);
    setLastRequestedCallAstro(astro);
    activeCallAstroRef.current = astro; // Store in ref immediately
    console.log("[NormalFlow] 📝 Stored astrologer in ref:", astro?._id);

    try {
      // Check balance
      console.log("[NormalFlow] 💰 Checking balance for call type:", type);
      const result = await getBalance({ astrologerId: astro?._id, type: type, ...(isEmergency && { isEmergency: true }) });
      console.log("[NormalFlow] 💰 Balance API response:", JSON.stringify(result?.data?.data));
      
      // Check balance status
      if (result?.data?.data?.status === false) {
        console.log("[NormalFlow] ❌ Insufficient balance — opening recharge modal");
        setOpenModal((prev) => ({ ...prev, recharge: true }));
        return false;
      }

      // Check if astrologer is online for the specific call type (audio/video)
      // API returns availability fields flat in data (not nested under .availability)
      const balanceData = result?.data?.data || {};
      const isActive = balanceData?.isActive === true || balanceData?.availability?.isActive === true;
      const activeTypes = balanceData?.isActiveType || balanceData?.availability?.isActiveType;
      const isActiveForCallType = Array.isArray(activeTypes) 
        ? activeTypes.includes(type)
        : (type === "audio" ? balanceData?.isActiveForCall === true : balanceData?.isActiveForVideo === true);
      
      console.log("[NormalFlow] 📊 Availability check:", {
        isActive,
        isActiveType: activeTypes,
        isActiveForCallType,
        requestedType: type,
        rawKeys: Object.keys(balanceData),
      });
      
      if (!isEmergency && (!isActive || !isActiveForCallType)) {
        // Check if emergency is available — must be explicitly true
        const isEmergencyAvailable = balanceData?.availability?.isEmergencyAvailable === true || balanceData?.isEmergencyAvailable === true;
        if (isEmergencyAvailable) {
          console.log("[NormalFlow] 🚨 Astrologer offline but emergency available");
          return { emergencyAvailable: true, astrologer: astro, callType: type };
        }
        const callTypeLabel = type === "audio" ? "voice call" : "video call";
        console.log("[NormalFlow] ❌ Astrologer not available for", callTypeLabel);
        Toast.error(`Astrologer is not available for ${callTypeLabel}`);
        return false;
      }

      // Check if astrologer is currently on a live stream
      const liveStatus = balanceData?.astrologerLiveStatus;
      if (liveStatus?.isLive) {
        console.log("[NormalFlow] ❌ Astrologer is on live stream — blocking call");
        Toast.error("Currently unavailable during live stream.");
        return false;
      }

      console.log("[NormalFlow] ✅ Balance & availability OK for", type);
    } catch (error) {
      console.error("[NormalFlow] ❌ Balance/availability check error:", error);
      Toast.error("Failed to check astrologer availability");
      return false;
    }

    // setOpenModal((prev) => ({ ...prev, kundli: true }));
    console.log("[NormalFlow] ➡️ Proceeding to handleAfterKundliSelect (call type:", type, ")");
    handleAfterKundliSelect(astro, type, isEmergency)
    return true;
  }, [getBalance, setLastRequestedCallAstro, validateBeforeConnection]);

  // After kundli selection
  const handleAfterKundliSelect = useCallback(async (selectedAstrologer, connectionType = null, isEmergency = false) => {
    console.log("[NormalFlow] 🎯 handleAfterKundliSelect called");
    console.log("[NormalFlow]   → astrologer:", selectedAstrologer?._id);
    console.log("[NormalFlow]   → connectionType:", connectionType || "chat");
    console.log("[NormalFlow]   → isEmergency:", isEmergency);

    // Priority: 1) Header-selected kundli, 2) "self" relation, 3) first kundli
    let selectedKundli = null;
    if (headerSelectedKundli?._id) {
      // Use the kundli user explicitly selected in the header
      selectedKundli = headerSelectedKundli;
      console.log("[NormalFlow] 📋 Using header-selected Kundli:", selectedKundli.name, "ID:", selectedKundli._id);
    } else if (profiles && profiles.length > 0) {
      const selfKundli = profiles.find(
        (profile) => profile.relation?.toLowerCase() === "self"
      );
      selectedKundli = selfKundli || profiles[0];
      console.log("[NormalFlow] 📋 Fallback Kundli:", selectedKundli.relation || "Unknown", "ID:", selectedKundli._id);
    } else {
      console.log("[NormalFlow] ⚠️ No kundli profiles available");
    }

    if (selectedKundli) {
      kundliRef.current = selectedKundli._id;
      setLastSelectedKundli(selectedKundli);
    }

    if (!selectedAstrologer?._id) {
      console.log("[NormalFlow] ❌ Astrologer not selected — aborting");
      return Toast.error("Astrologer not selected");
    }
    if (!userIdLocal) {
      console.log("[NormalFlow] ❌ User ID missing — aborting");
      return Toast.error("User ID Missing");
    }

    const astro = selectedAstrologer;
    localStorage.setItem("selectedAstroId", astro._id);

    try {
      if (!token) {
        console.log("[NormalFlow] ❌ No token — redirecting to login");
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      activeCallAstroRef.current = astro;

      console.log("[NormalFlow] 🔌 Socket state before emit: connected=", voiceSocket.connected, "id=", voiceSocket.id);

      // If connection type exists, initiate call, otherwise chat
      if (connectionType) {
        // Initiate call
        if (activeCallRef.current || activeChatRef.current) {
          console.log("[NormalFlow] ❌ Already on an active call/chat — aborting");
          Toast.error("You already have an active call/chat");
          return
        }

        // Check queue limit
        if (isQueueFull()) {
          console.log("[NormalFlow] ❌ Queue full — aborting");
          return Toast.error("Maximum 5 simultaneous queues allowed. Please cancel an existing request first.");
        }

        // Check if same astrologer already has any pending request (call or chat)
        if (isInQueue(astro._id, connectionType) || isInQueue(astro._id, "chat")) {
          console.log("[NormalFlow] ⏭️ Already in queue for this astrologer");
          Toast.error("Already waiting for this astrologer");
          return;
        }

        setLastCallType(connectionType);
        const payload = {
          userId: userIdLocal,
          astrologerId: astro._id,
          type: connectionType,
          ...(isEmergency && { isEmergency: true }),
          fromLive: false,
        };
        console.log("[NormalFlow] 📤 Emitting call:initiate");
        console.log("[NormalFlow]   → payload:", JSON.stringify(payload));
        debugger
        voiceSocket.emit("call:initiate", payload);

        // Add to waiting queue (roomId will be assigned when call:room arrives)
        addPendingConnection({
          id: `${astro._id}-${connectionType}-${Date.now()}`,
          astrologer: astro,
          type: connectionType,
          roomId: null,
          waitingTime: 5,
          isEmergency,
        });

        console.log("[NormalFlow] ✅ call:initiate emitted — waiting for call:room / call:accepted / error");
      } else {
        // Initiate chat
        if (activeCallRef.current || activeChatRef.current) {
          console.log("[NormalFlow] ❌ Already on an active call/chat — aborting");
          Toast.error("You already have an active call/chat");
          return
        }

        // Check queue limit
        if (isQueueFull()) {
          console.log("[NormalFlow] ❌ Queue full — aborting");
          return Toast.error("Maximum 5 simultaneous queues allowed. Please cancel an existing request first.");
        }

        // Check if same astrologer already has any pending request (call or chat)
        if (isInQueue(astro._id, "chat") || isInQueue(astro._id, "audio") || isInQueue(astro._id, "video")) {
          console.log("[NormalFlow] ⏭️ Already in queue for this astrologer");
          Toast.error("Already waiting for this astrologer");
          return;
        }

        const payload = {
          userId: userIdLocal,
          astrologerId: astro._id,
          type: "chat",
          ...(isEmergency && { isEmergency: true }),
          fromLive: false,
        };
        console.log("[NormalFlow] 📤 Emitting chat:initiate");
        console.log("[NormalFlow]   → payload:", JSON.stringify(payload));
        voiceSocket.emit("chat:initiate", payload);

        // Add to waiting queue (roomId will be assigned when chat:room arrives)
        addPendingConnection({
          id: `${astro._id}-chat-${Date.now()}`,
          astrologer: astro,
          type: "chat",
          roomId: null,
          waitingTime: 2,
          isEmergency,
        });

        console.log("[NormalFlow] ✅ chat:initiate emitted — waiting for chat:room / chat:accepted / error");
      }
    } catch (error) {
      console.error("[NormalFlow] ❌ Error in handleAfterKundliSelect:", error);
    }
  }, [token, userIdLocal, navigate, location, setLastSelectedKundli, setLastCallType, setCallWaitingList, profiles, addPendingConnection, isInQueue, isQueueFull]);

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
