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
import { useMediaPermission } from "./useMediaPermission";
import { trackEvent } from "../analytics";

export const useAstrologerConnect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Get the kundli selected by user in the header dropdown
  const headerSelectedKundli = useSelector((state) => state.kundli.selectedKundli);
  const token = getToken();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  const { addPendingConnection, isInQueue, isCancelling } = useWaitingQueue();

  /*
   * A queued entry the user has already cancelled is held until its roomId
   * arrives so the withdrawal can actually be sent (see WaitingQueueContext).
   * isInQueue still counts it, which is what stops a duplicate request — but
   * telling someone who just pressed Cancel that they are "already waiting"
   * reads as the cancel having been ignored. Name the real state instead.
   */
  const queueRejectionMessage = useCallback(
    (astrologerId) =>
      ["audio", "video", "chat"].some((t) => isCancelling(astrologerId, t))
        ? "Still cancelling your previous request. One moment."
        : "Already waiting for this astrologer",
    [isCancelling]
  );

  const [openModal, setOpenModal] = useState({
    recharge: false,
    kundli: false,
  });
  // Which connection type triggered the recharge modal ("chat" | "audio" |
  // "video"), so the modal's copy and min-balance rate match what the user
  // actually tapped instead of always defaulting to "chat".
  const [rechargeType, setRechargeType] = useState("chat");
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);

  /*
   * Guards the window between the tap and the queue entry existing.
   *
   * handleChatStart / handleCallStart both `await getBalance(...)` — a network
   * round trip — before anything reaches handleAfterKundliSelect, which is where
   * the `isInQueue` duplicate check lives. So during that round trip isInQueue is
   * still false and nothing stopped a second tap from firing the whole flow
   * again. Nor did the button change in any way, so from the visitor's side the
   * first tap simply did nothing.
   *
   * Clarity shows the cost on the conversion path: a visitor who had just signed
   * up and entered their birth details made "multiple chat attempts" from 06:21
   * and only got into a session at 07:24 — roughly a minute of tapping a button
   * that looked inert while a balance check was in flight behind it.
   *
   * Keyed by astrologer + type rather than a single boolean, because these
   * handlers are shared by 14 screens and a global lock would wrongly block a
   * different astrologer. The ref is the guard (synchronous, so it wins a
   * double-tap race); the state exists only so consumers can render it.
   */
  const connectInFlightRef = useRef(new Set());
  const [connectingKey, setConnectingKey] = useState(null);

  const connectKey = (astrologerId, type) => `${astrologerId || "unknown"}:${type}`;

  const beginConnect = useCallback((astrologerId, type) => {
    const key = connectKey(astrologerId, type);
    if (connectInFlightRef.current.has(key)) return null;
    connectInFlightRef.current.add(key);
    setConnectingKey(key);
    return key;
  }, []);

  const endConnect = useCallback((key) => {
    if (!key) return;
    connectInFlightRef.current.delete(key);
    setConnectingKey((cur) => (cur === key ? null : cur));
  }, []);

  // For consumers that want to show a busy state on the specific button tapped.
  const isConnecting = useCallback(
    (astrologerId, type) => connectingKey === connectKey(astrologerId, type),
    [connectingKey]
  );

  // Fetch user's kundli profiles for validation
  const { data: kundliData, isLoading: isValidating, isFetching: isFetchingKundlis } =
    useGetAllKundlisQuery(undefined, {
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
  const { checkPermission } = useMediaPermission();

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

    /*
      A kundli selected in Redux counts, and a list that has not arrived yet is
      not the same thing as an empty one.

      This used to be `profiles.length > 0` alone, which contradicted the rest of
      this hook: getSelectedKundli() and handleAfterKundliSelect BOTH treat
      `headerSelectedKundli` as their first choice and only fall back to
      `profiles`. So the connection would have proceeded perfectly well on the
      Redux selection, but this gate refused it and — worse — navigated the
      visitor to the profile screen with `requiresCreation`, telling someone who
      has a profile to go and create one.

      The guest chat flow hits this dead on. useGuestChatAuth creates the self
      kundli via createKundli, dispatches setSelectedKundli(createdProfile), and
      calls `privateRequestNew.util.resetApiState()` immediately before flipping
      the session. That reset destroys the cache entry, so useGetAllKundlisQuery
      starts a fresh FIRST load and `profiles` is [] for the whole round trip —
      while the freshly created profile is already sitting in Redux.

      Clarity session 1q4dliv (Chrome mobile, Google → /chat-to-astrologer)
      completed the whole guest form — gender at 01:01, location at 02:22,
      verification — then "attempted multiple chat initiations" at 03:21 and
      03:33 and left without a conversation.

      So: honour the Redux selection, and when there is genuinely nothing
      selected AND the list is still in flight, hold the visitor where they are
      instead of bouncing them out of the connect flow.
    */
    const hasKundli = !!headerSelectedKundli?._id || profiles.length > 0;

    if (!hasKundli) {
      if (isValidating || isFetchingKundlis) {
        Toast.info("One moment — loading your profile.");
        return false;
      }
      Toast.error("Please create your Kundli before starting chat or call.");
      navigate(PATH.privateRoutes.PROFILE.path, { state: { requiresCreation: true } });
      return false;
    }

    return true;
  }, [
    token,
    userIdLocal,
    profiles,
    navigate,
    headerSelectedKundli,
    isValidating,
    isFetchingKundlis,
  ]);

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

    // Reject a repeat tap while this astrologer's chat request is still resolving.
    // See connectInFlightRef.
    const inFlightKey = beginConnect(astro?._id, "chat");
    if (!inFlightKey) {
      Toast.info("Connecting you now — one moment.");
      return false;
    }

    try {
    setSelectedAstrologer(astro);
    setLastRequestedAstro(astro);
    setLastRequestedCallAstro(astro);
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
          setRechargeType("chat");
          setOpenModal((prev) => ({ ...prev, recharge: true }));
          return false;
        } else if (checkBalanceStatus === undefined) {
          // A partial/malformed balance response used to abort here in total
          // silence, turning the Chat button into a no-op the user could only
          // respond to by tapping again. Always say something.
          console.log("[NormalFlow] ❌ Balance status missing from response — aborting");
          Toast.error("Couldn't verify availability right now. Please try again.");
          return false;
        }
        
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
    // Awaited so the in-flight guard is held until the queue entry actually
    // exists. It used to be fire-and-forget, which would have released the guard
    // while the socket emit was still pending and reopened the double-tap window.
    await handleAfterKundliSelect(astro, null, isEmergency);
    return true;
    } finally {
      endConnect(inFlightKey);
    }
    // handleAfterKundliSelect is deliberately NOT a dependency: it is declared
    // further down this same hook, so naming it here would evaluate it during
    // render and throw "Cannot access 'handleAfterKundliSelect' before
    // initialization". The body only reads it at invocation time, by which point
    // it exists. (This is why the file already carries exhaustive-deps warnings.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getBalance, setLastRequestedAstro, validateBeforeConnection, beginConnect, endConnect]);

  // Call handler
  const handleCallStart = useCallback(async (astro, type, isEmergency = false) => {
    console.log("[NormalFlow] 📞 handleCallStart called");
    console.log("[NormalFlow]   → astrologer:", astro?._id, astro?.firstName, astro?.lastName);
    console.log("[NormalFlow]   → callType:", type);
    console.log("[NormalFlow]   → isEmergency:", isEmergency);

    /*
      Claim the guard before anything async.

      It used to be taken after `checkPermission()`, and that is the slowest step
      on the call path: on mobile it can reach getUserMedia and, first time round,
      put a browser permission prompt in front of the user. For that whole window
      `isConnecting` was false, so the Call button on the card still read "Call" —
      inert as far as the visitor could tell — and each further tap started
      another permission check rather than being turned away.

      Clarity caught the shape of it on the listing: Call tapped at 01:13, 01:14
      and 01:16, with the outcome only landing at 01:18.

      Same guard, just claimed one step earlier, so the tapped button switches to
      "Connecting…" immediately and repeat taps are answered instead of queued.
    */
    const inFlightKey = beginConnect(astro?._id, type);
    if (!inFlightKey) {
      Toast.info("Connecting you now — one moment.");
      return false;
    }

    try {
    // Check media permissions before proceeding
    const permType = type === "video" ? "both" : "microphone";
    const hasPermission = await checkPermission(permType);
    if (!hasPermission) return false;

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
        setRechargeType(type || "audio");
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
    // Awaited for the same reason as the chat path: hold the guard until the
    // queue entry exists rather than releasing it mid-emit.
    await handleAfterKundliSelect(astro, type, isEmergency);
    return true;
    } finally {
      endConnect(inFlightKey);
    }
    // handleAfterKundliSelect omitted deliberately — see the note on
    // handleChatStart's dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getBalance, setLastRequestedCallAstro, validateBeforeConnection, beginConnect, endConnect]);

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

        // Check if same astrologer already has any pending request (audio, video, or chat)
        if (isInQueue(astro._id, "audio") || isInQueue(astro._id, "video") || isInQueue(astro._id, "chat")) {
          console.log("[NormalFlow] ⏭️ Already in queue for this astrologer");
          Toast.error(queueRejectionMessage(astro._id));
          return;
        }

        setLastCallType(connectionType);
        const payload = {
          userId: userIdLocal,
          astrologerId: astro._id,
          type: connectionType,
          ...(isEmergency && { isEmergency: true }),
          isLive: false,
        };
        console.log("[NormalFlow] 📤 Emitting call:initiate");
        console.log("[NormalFlow]   → payload:", JSON.stringify(payload));
        trackEvent("session_initiation_attempted", { astrologer_id: astro._id, channel: connectionType });
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
        trackEvent("session_waitlist_joined", { astrologer_id: astro._id, channel: connectionType });

        console.log("[NormalFlow] ✅ call:initiate emitted — waiting for call:room / call:accepted / error");
      } else {
        // Initiate chat
        if (activeCallRef.current || activeChatRef.current) {
          console.log("[NormalFlow] ❌ Already on an active call/chat — aborting");
          Toast.error("You already have an active call/chat");
          return
        }

        // Check if same astrologer already has any pending request (call or chat)
        if (isInQueue(astro._id, "chat") || isInQueue(astro._id, "audio") || isInQueue(astro._id, "video")) {
          console.log("[NormalFlow] ⏭️ Already in queue for this astrologer");
          Toast.error(queueRejectionMessage(astro._id));
          return;
        }

        const payload = {
          userId: userIdLocal,
          astrologerId: astro._id,
          type: "chat",
          ...(isEmergency && { isEmergency: true }),
          isLive: false,
        };
        console.log("[NormalFlow] 📤 Emitting chat:initiate");
        console.log("[NormalFlow]   → payload:", JSON.stringify(payload));
        trackEvent("session_initiation_attempted", { astrologer_id: astro._id, channel: "chat" });
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
        trackEvent("session_waitlist_joined", { astrologer_id: astro._id, channel: "chat" });

        console.log("[NormalFlow] ✅ chat:initiate emitted — waiting for chat:room / chat:accepted / error");
      }
    } catch (error) {
      console.error("[NormalFlow] ❌ Error in handleAfterKundliSelect:", error);
    }
  }, [token, userIdLocal, navigate, location, setLastSelectedKundli, setLastCallType, setCallWaitingList, profiles, addPendingConnection, isInQueue, queueRejectionMessage]);

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
    // Whether a chat/call request for a given astrologer + type is still
    // resolving, so the button that was tapped can show it instead of looking
    // inert. See connectInFlightRef.
    isConnecting,
    openModal,
    setOpenModal,
    rechargeType,
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
