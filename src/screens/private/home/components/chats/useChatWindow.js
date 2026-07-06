import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import socketService from "../../../../../services/socketService";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import toast from "../../../../../component/toast";
import { useChat as useChatContext } from "../../../../../context/ChatContext"
import { useGetAllKundlisQuery } from "../../../../../services/appServices/kundliServicesNew";
import { useCall } from "../../../../../context/CallContext";
import { showErrorWithHighlight } from "../../../../../utils/showErrorWithHighlight";
import useTypingIndicator from "./useTypingIndicator";

export default function useChat({
  userId,
  astrologerId,
  roomId,
  isUserSide,
  kundliId,
  setOpenFeedback,
  astrologerName,
  fullName,
  refreshKey = 0
}) {
  const { startTimer, stopTimer, chatSeconds, setActiveChat, activeChat, reconnectToChat } = useChatContext();
  const { activeCall, openReview } = useCall();
  const selectedKundli = useSelector((state) => state.kundli.selectedKundli);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [isMessageDisabled, setIsMessageDisabled] = useState(false);
  const systemReconnectInFlightRef = useRef(false);
  const [hightLightText, setHighLightText] = useState("");

  // Typing indicator via new activity:update / activity contract
  const { isTyping, handleTextChange, handleMessageSent } = useTypingIndicator({ roomId, sender: "user" });

  // When the kundali iframe closes, the server may briefly think the user disconnected
  // and fire session-end errors. We ignore those for a short grace period.
  const ignoringSystemEndRef = useRef(false);

  // Fetch kundli profiles to get the "Self" profile
  const { data: profilesData } = useGetAllKundlisQuery();
  const profiles = profilesData?.data || [];
  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;

  // Ref for header-selected kundli profile (from Redux store)
  const selectedKundliRef = useRef(selectedKundli);
  selectedKundliRef.current = selectedKundli;

  const formatTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  console.log("::",messages,"/",error)

  const handleChatEndedFromServer = (data) => {
    // SYSTEM ends are treated as transient transport failures; attempt reconnect
    // instead of tearing down the active chat session.
    if (data?.endedBy === 'SYSTEM') {
      ignoringSystemEndRef.current = true;
      setTimeout(() => { ignoringSystemEndRef.current = false; }, 10000);

      if (!systemReconnectInFlightRef.current) {
        systemReconnectInFlightRef.current = true;
        reconnectToChat?.(activeChat);
        setTimeout(() => {
          systemReconnectInFlightRef.current = false;
        }, 10000);
      }

      return;
    }

    // Non-SYSTEM ends are handled by the global handler (WaitingQueueContext).
    // It clears activeChat, stops timer, shows toast, and dispatches "global:chat:ended".
    // Page-level feedback/UI is handled via the "global:chat:ended" event listener below.
  };

  useEffect(() => {
    if (activeChat?.astrologerId !== astrologerId && activeCall?.astrologerId !== astrologerId) setIsMessageDisabled(true)
    if (!roomId || !userId || !astrologerId) return;
    socketService.connect({
      onConnected: () => {
        if (
          Object.keys(activeChat || {}).length > 0 ||
          (activeCall && activeCall.astrologerId === astrologerId)
        ) {
          //Check if chat is active or there's an active call with this astrologer
          startTimer(); //Start timer only when there is active chat
          setIsMessageDisabled(false);

          // Store chat start time for elapsed time calculation (if not already set)
          // Use localStorage so it persists across page refreshes
          if (!localStorage.getItem("shubhtalk_chat_start_time")) {
            localStorage.setItem(
              "shubhtalk_chat_start_time",
              String(Date.now()),
            );
          }

          // Check if initial messages were already sent for this room (persists across remounts/reconnects)
          const sentKey = `shubhtalk_chat_init_${roomId}`;
          const alreadySent = sessionStorage.getItem(sentKey);

          //Send msg first time only
          if (!refreshKey && !alreadySent) {
            sessionStorage.setItem(sentKey, "true");

            // Check if there's an AI initial query stored
            const aiInitialQuery = localStorage.getItem("aiInitialQuery");

            if (aiInitialQuery) {
              // Send the AI query directly
              sendMessage(aiInitialQuery);
              localStorage.removeItem("aiInitialQuery");
            } else {
              // Regular greeting message
              sendMessage(`Hi ${fullName || astrologerName || ""}`);
            }

            // Find the kundli profile to send — use header-selected profile from Redux store
            const sendKundliWhenReady = (retries = 10) => {
              const currentProfiles = profilesRef.current;
              const headerProfile = selectedKundliRef.current;
              const selfProfile = currentProfiles.find(
                (profile) => profile.relation === "Self",
              );
              const profileIdToUse = headerProfile?._id || selfProfile?._id || kundliId;

              if (profileIdToUse) {
                sendMessage(profileIdToUse, "kundli", profileIdToUse);
              } else if (retries > 0) {
                setTimeout(() => sendKundliWhenReady(retries - 1), 500);
              }
            };

            setTimeout(() => sendKundliWhenReady(), 300);
          } else if (alreadySent) {
            console.log(
              "[ChatWindow] ⏭️ Initial messages already sent for room:",
              roomId,
              "— skipping",
            );
          }
        }
      },
      onError: (errMsg) => {
        // If we're in the grace period after iframe close, ignore session-end errors
        if (
          ignoringSystemEndRef.current &&
          (errMsg === "Chat no longer available" ||
            errMsg === "Chat has already ended" ||
            errMsg === "Session not found")
        ) {
          return;
        }

        console.log("ErrMsg::",hightLightText)

        showErrorWithHighlight(errMsg);

        // toast.error(errMsg + " error" || "Something went wrong");
        setError(errMsg);
        if (
          errMsg === "Chat no longer available" ||
          errMsg === "Chat has already ended" ||
          errMsg === "Session not found"
        ) {
          setIsMessageDisabled(true);
          stopTimer();
          setActiveChat(null);
        }
        // setHighLightText("")
      },
      onWarn: (msg) => {
        toast.warning(msg + " warning" || "Something went wrong");
      },
    });

    const handleAddMessage = (data) => {
      const isSenderUser = data.sender === "user";

      console.log("handleAddMessage:",data)
      
      // Parse gift messages (detect by type === "gift")
      let messageText = data.message;
      let giftData = null;
      
      if (data.type === "gift") {
        try {
          const parsed = JSON.parse(data.message);
          messageText = parsed.text;
          giftData = parsed.giftData;
        } catch (e) {
          console.error("Failed to parse gift message:", e);
        }
      }
      
      addMessage({
        text: messageText,
        sender: isSenderUser,
        time: formatTime(),
        dateTime: data?.dateTime,
        type: data.type,
        giftData: giftData,
        kundliName: data?.kundliName,
        suggestedProducts: data?.suggestedProducts,
        kundliId: data?.kundliId,
      });
    }

    const handleWarning = (msg) => {
      toast.warning(msg.message);
    }

    voiceSocket.on("message:recieved", handleAddMessage);
    voiceSocket.on("warning", handleWarning);
    voiceSocket.on("chat:ended", handleChatEndedFromServer);

    return () => {
      voiceSocket.off("message:recieved", handleAddMessage);
      voiceSocket.off("warning", handleWarning);
      voiceSocket.off("chat:ended", handleChatEndedFromServer);
    };
  }, [roomId, activeChat, activeCall, reconnectToChat, hightLightText]);

  // Listen for global chat:ended event (fired from WaitingQueueContext)
  // Handles page-level actions: disabling input and showing feedback modal
  useEffect(() => {
    const handleGlobalChatEnded = (e) => {
      const data = e.detail;
      // Only react if this chat page matches the ended chat
      if (data?.astrologerId && data.astrologerId !== astrologerId) return;

      setIsMessageDisabled(true);

      // Don't show feedback if call review is already open or there's an active call
      if (!openReview && !activeCall) {
        setOpenFeedback(true);
      }
    };

    window.addEventListener("global:chat:ended", handleGlobalChatEnded);
    return () => window.removeEventListener("global:chat:ended", handleGlobalChatEnded);
  }, [astrologerId, activeCall, openReview, setOpenFeedback]);

  // Re-enable input and timer when activeChat is restored after reconnect
  useEffect(() => {
    if (activeChat?.astrologerId === astrologerId && activeChat?.roomId) {
      setIsMessageDisabled(false);
      startTimer();
    }
  }, [activeChat?.roomId, activeChat?.astrologerId, astrologerId]);

  // ─── Message Queue (for offline/disconnected sends) ─────────────────────────
  const messageQueueRef = useRef([]);

  // Flush queued messages when socket reconnects
  useEffect(() => {
    const flushQueue = () => {
      if (messageQueueRef.current.length === 0) return;
      console.log("[ChatWindow] 🔄 Flushing", messageQueueRef.current.length, "queued messages");
      const queue = [...messageQueueRef.current];
      messageQueueRef.current = [];
      queue.forEach((payload) => {
        voiceSocket.emit("chat:message", payload);
      });
    };

    voiceSocket.on("connect", flushQueue);
    return () => voiceSocket.off("connect", flushQueue);
  }, []);
  

  // USER SEND — uses voiceSocket, queues if disconnected
  const sendMessage = (text, type = "message", kundliID = null) => {
    console.log("sendMessage", text);
    setHighLightText(text);

    // Clear typing state immediately on send
    handleMessageSent();

    const payload = {
      sender: "user",
      kundliId: kundliID ?? kundliId,
      roomId,
      userId,
      astrologerId,
      message: text,
      type,
    };

    if (voiceSocket.connected) {
      voiceSocket.emit("chat:message", payload);
      return;
    }

    // Socket disconnected — queue the message for delivery on reconnect
    messageQueueRef.current.push(payload);
    console.log("[ChatWindow] 📦 Message queued (socket disconnected). Queue size:", messageQueueRef.current.length);
  };

  // ASTRO SEND
  const astroReply = (text) => {
    if (!voiceSocket.connected) {
      setError("Socket not connected, try again.");
      return;
    }

    voiceSocket.emit("astrologer_sent_message", {
      sender: astrologerId,
      roomId,
      userId,
      astrologerId,
      message: text,
    });

    addMessage({
      text,
      sender: "astro",
      isSender: !isUserSide,
      time: formatTime(),
    });
  };

  //  typing is now handled by useTypingIndicator hook

  return {
    messages,
    error,
    isTyping,
    sendMessage,
    astroReply,
    handleTextChange,
    chatSeconds,
    isMessageDisabled,
    setIsMessageDisabled,
    remainingTime: activeChat?.remainingTime || 0,
    handleChatEndedFromServer
  };
}
