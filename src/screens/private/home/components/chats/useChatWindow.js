import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import socketService from "../../../../../services/socketService";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import toast from "../../../../../component/toast";
import { useChat as useChatContext } from "../../../../../context/ChatContext"
import { useGetAllKundlisQuery } from "../../../../../services/appServices/kundliServicesNew";
import { useCall } from "../../../../../context/CallContext";
import { showErrorWithHighlight } from "../../../../../utils/showErrorWithHighlight";
import { format12HourTime } from "../../../../../utils/dateFormat/dateTime";
import useTypingIndicator from "./useTypingIndicator";

// Month names for turning a profile's numeric `month` (1–12) into "September".
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// First word of the astrologer's display name, e.g. "Prathamesh M" -> "Prathamesh".
const firstWord = (value) => String(value || "").trim().split(/\s+/)[0] || "";

const capitalize = (value) => {
  const str = String(value || "").trim();
  return str ? str[0].toUpperCase() + str.slice(1) : "";
};

// Format a profile DOB as "16-September-1993". `month` is 1–12.
const formatProfileDob = (profile) => {
  const day = Number(profile?.day);
  const month = Number(profile?.month);
  const year = Number(profile?.year);
  if (!day || !month || !year || month < 1 || month > 12) return "";
  return `${day}-${MONTH_NAMES[month - 1]}-${year}`;
};

/*
  Build the customer's intro message sent as the first chat line, e.g.

    Hi Ravi,
    Below are my details:
    Name: Prathamesh M
    Gender: Male
    DOB: 16-September-1993
    TOB: 10:44 PM
    POB: Mumbai, Maharashtra, India

  Only the lines the selected profile can actually fill are included; if there is
  no profile yet we fall back to the plain "Hi <astrologer>" greeting so the chat
  never opens with an empty details block.
*/
const buildIntroMessage = (astrologerName, profile) => {
  const greetName = firstWord(astrologerName);
  const greeting = `Hi ${greetName}`.trim();

  if (!profile || !profile.name) return greeting;

  const dob = formatProfileDob(profile);
  /*
    TOB is always included. Profiles store the birth time as numeric `hour` (24h)
    + `min`; when the exact time is unknown the profile forms save the system
    default 00:00, and we send that (as "12:00 AM") rather than omitting the line
    — TOB is a required field in this details block. `format12HourTime` derives
    the AM/PM from the 24-hour hour.
  */
  const tob = format12HourTime(
    Number.isFinite(Number(profile.hour)) ? profile.hour : 0,
    Number.isFinite(Number(profile.min)) ? profile.min : 0
  );

  const lines = [
    greeting.endsWith(",") ? greeting : `${greeting},`,
    "Below are my details:",
    profile.name && `Name: ${profile.name}`,
    profile.gender && `Gender: ${capitalize(profile.gender)}`,
    dob && `DOB: ${dob}`,
    `TOB: ${tob}`,
    profile.place && `POB: ${profile.place}`,
  ].filter(Boolean);

  return lines.join("\n");
};

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
  // Mirror of hightLightText for the connect effect's onError handler to read
  // WITHOUT the effect depending on the state. See the deps note on that effect:
  // hightLightText changes on every sendMessage, and having it in the array made
  // the whole connect/onConnected block re-run per message — which re-fired the
  // one-time intro + kundli auto-share and sent both twice.
  const hightLightTextRef = useRef("");
  hightLightTextRef.current = hightLightText;

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

  // In-memory guard so the initial greeting + kundli auto-share runs at most
  // once per mount. The `onConnected` handler fires synchronously on every
  // effect re-run (deps like activeChat / highlight text change often) and the
  // sessionStorage key is keyed by roomId — which can flip (temp → real) mid
  // connect, bypassing that guard and sending the kundli twice. This ref does
  // not depend on roomId, so the auto-share can only happen once.
  const initSentRef = useRef(false);

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
          if (!refreshKey && !alreadySent && !initSentRef.current) {
            initSentRef.current = true;
            sessionStorage.setItem(sentKey, "true");

            // Check if there's an AI initial query stored
            const aiInitialQuery = localStorage.getItem("aiInitialQuery");

            // Resolve the selected profile the same way the kundli auto-share
            // does — header selection first, then the "Self" profile. Used both
            // for the intro message (its birth details) and the kundli share.
            const resolveSelectedProfile = () => {
              const currentProfiles = profilesRef.current;
              const headerProfile = selectedKundliRef.current;
              const selfProfile = currentProfiles.find(
                (profile) => profile.relation === "Self",
              );
              return headerProfile || selfProfile || null;
            };

            if (aiInitialQuery) {
              // Send the AI query directly
              sendMessage(aiInitialQuery);
              localStorage.removeItem("aiInitialQuery");
            } else {
              // First message: greeting + the selected profile's birth details.
              // The profile can lag the socket connect (same reason the kundli
              // share below retries), so wait briefly for it before sending, and
              // fall back to the plain greeting if it never arrives.
              const greetingName = astrologerName || fullName || "";
              const sendIntroWhenReady = (retries = 10) => {
                const profile = resolveSelectedProfile();
                if (profile?.name) {
                  sendMessage(buildIntroMessage(greetingName, profile));
                } else if (retries > 0) {
                  setTimeout(() => sendIntroWhenReady(retries - 1), 300);
                } else {
                  // Give up waiting — send the plain greeting so the chat still
                  // opens with a message.
                  sendMessage(buildIntroMessage(greetingName, null));
                }
              };
              sendIntroWhenReady();
            }

            // Find the kundli profile to send — use header-selected profile from Redux store
            const sendKundliWhenReady = (retries = 10) => {
              const profile = resolveSelectedProfile();
              const profileIdToUse = profile?._id || kundliId;

              if (profileIdToUse) {
                // Pass the profile's name so the card label does not depend on
                // the backend echoing it back. See the note in sendMessage.
                sendMessage(profileIdToUse, "kundli", profileIdToUse, profile?.name || null);
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

        console.log("ErrMsg::",hightLightTextRef.current)

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
    // `hightLightText` intentionally removed from this array. It is written by
    // every sendMessage (setHighLightText(text)) and read only by the onError
    // console.log above, now via hightLightTextRef. Leaving it here re-ran this
    // effect on every message: socketService.connect fires onConnected
    // synchronously when the socket is already connected, so the one-time intro
    // and kundli auto-share fired again, which is why "Below are my details" and
    // "…'s Kundli" arrived twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, activeChat, activeCall, reconnectToChat]);

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
  const sendMessage = (text, type = "message", kundliID = null, kundliName = null) => {
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
      /*
        Carry the kundli's display name in the outgoing payload.

        The card label (ChatMessages.jsx) reads `msg.kundliName` and falls back
        to "View Kundli" when it is empty. Every rendered message comes from the
        server echo (message:recieved), and a kundli message was previously sent
        as id ONLY — so the label depended entirely on the backend resolving
        id -> name and echoing `kundliName` back. That is exactly why it looked
        right against the local dev backend but wrong against
        session.shubhastro.ai's: same client, different socket server, and only
        one of them echoes the name.

        The client already holds the name at send time (profile.name in the
        auto-share, kundli.name in the picker), so send it. Only attached for
        kundli messages; a plain text/audio message has no kundliName.
      */
      ...(type === "kundli" && kundliName ? { kundliName } : {}),
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
