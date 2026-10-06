import { useEffect, useState, useRef } from "react";
import { voiceSocket } from "../../services/voiceSocketServices";
import { isPanditAIEvent, isPanditAIErrorEvent } from "../panditAI/usePanditAI";
import { Toast } from "../index";
import { buildIntroMessage } from "../../utils/helper/introMessage";

export const useVideoCallChat = ({ userId, astrologerId, roomId, kundliId, kundliProfile, astrologerName }) => {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const hasInitializedRef = useRef(false);

  /*
    The selected kundli profile, read through a ref.

    The opening message carries the customer's birth details (see
    buildIntroMessage), and the profile list is fetched — it can resolve after
    this hook's effect has already run and the socket has connected. A ref lets
    the retry below pick up the profile when it lands without putting the object
    in the effect's dependency array, which would re-run the whole listener setup
    on every identity change.
  */
  const kundliProfileRef = useRef(kundliProfile);
  kundliProfileRef.current = kundliProfile;

  const formatTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  // Send message via voiceSocket
  // Updated: accept optional kundliIdOverride to send correct kundliId for selected kundli
  const sendViaSocket = (message, type = "message", kundliIdOverride = null) => {
    if (!voiceSocket.connected) {
      Toast.error("Socket not connected");
      return { error: "Socket not connected" };
    }

    try {
      voiceSocket.emit("chat:message", {
        sender: "user",
        kundliId: kundliIdOverride || kundliId,
        roomId,
        userId,
        astrologerId,
        message,
        type
      });
      return { success: true };
    } catch (err) {
      console.error("Error sending message:", err);
      return { error: err.message };
    }
  };

  // Initialize socket listeners and send initial messages
  useEffect(() => {
    if (!roomId || !userId || !astrologerId) return;

    // Prune stale "initial messages sent" flags so the per-room localStorage
    // keys don't accumulate forever. A live session never runs for a day, so
    // anything older than 24h belongs to a finished room and is safe to drop.
    try {
      const PREFIX = "shubhtalk_chat_init_";
      const MAX_AGE_MS = 24 * 60 * 60 * 1000;
      const now = Date.now();
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(PREFIX)) continue;
        // Skip the current room's key regardless of age.
        if (key === `${PREFIX}${roomId}`) continue;
        const ts = Number(localStorage.getItem(key));
        if (!Number.isFinite(ts) || now - ts > MAX_AGE_MS) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // localStorage unavailable (private mode / quota) — pruning is best-effort.
    }

    // Function to send initial messages (only once per room, survives reconnect)
    const sendInitialMessages = () => {
      if (hasInitializedRef.current) return;
      if (!kundliId) return;
      if (!voiceSocket.connected) return;

      // Check if we already sent initial messages for this room.
      //
      // This MUST use localStorage, not sessionStorage: killing the tab or the
      // whole browser clears sessionStorage, so a user who reconnected to the
      // same live video session got the greeting + kundli auto-sent a second
      // time. localStorage survives a tab/browser kill, so the "already sent"
      // flag is still there on rejoin and the duplicates are suppressed. The key
      // is per-roomId, so distinct sessions stay independent.
      const sentKey = `shubhtalk_chat_init_${roomId}`;
      if (localStorage.getItem(sentKey)) {
        console.log("[VideoCallChat] ⏭️ Initial messages already sent for room:", roomId, "— skipping");
        hasInitializedRef.current = true;
        return;
      }

      hasInitializedRef.current = true;
      // Timestamp value (not just "true") so stale keys from old rooms can be
      // pruned below without keeping a localStorage entry per session forever.
      localStorage.setItem(sentKey, String(Date.now()));
      
      /*
        Greeting + the customer's birth details (Name / Gender / DOB / TOB / POB),
        the same opening message the chat flow sends — see
        utils/helper/introMessage and useChatWindow's init block.

        This used to be a bare `Hi <name>`, so an astrologer on an audio or video
        session had none of the details a reading starts from and had to ask for
        them out loud while the session was being billed.

        The profile can resolve after the socket connects, so wait briefly for it
        (same retry shape as the chat flow) and fall back to the plain greeting
        rather than sending an empty details block.
      */
      const sendIntroWhenReady = (retries = 10) => {
        const profile = kundliProfileRef.current;
        if (profile?.name) {
          sendViaSocket(buildIntroMessage(astrologerName, profile), "message");
        } else if (retries > 0) {
          setTimeout(() => sendIntroWhenReady(retries - 1), 300);
        } else {
          sendViaSocket(buildIntroMessage(astrologerName, null), "message");
        }
      };
      setTimeout(() => sendIntroWhenReady(), 500);

      // Send Kundli. Send the bare kundliId as the message (origin-independent);
      // the kundliId also travels in the payload. Renderers rebuild the link
      // from the current origin.
      setTimeout(() => {
        sendViaSocket(kundliId, "kundli");
      }, 1000);
    };

    // Try to send immediately if already connected
    if (voiceSocket.connected) {
      sendInitialMessages();
    }

    // Also listen for connect event in case it connects later
    const handleConnect = () => {
      sendInitialMessages();
    };

    const handleAddMessage = (data) => {
      // Pandit AI replies arrive on the same socket event; they are not part of
      // this call's chat.
      if (isPanditAIEvent(data)) return;
      const isSenderUser = data.sender === "user";
      addMessage({
        text: data.message,
        sender: isSenderUser,
        time: formatTime(),
        dateTime: data?.dateTime,
        type: data?.type,
        kundliName: data?.kundliName,
        kundliId: data?.kundliId,
        suggestedProducts: data?.suggestedProducts,
      });
    };


    const handleError = (err) => {
      // Pandit AI's errors (e.g. its insufficient-balance refusal) are shown by
      // Pandit AI; toasting them here reads as a problem with this call.
      if (isPanditAIErrorEvent(err)) return;
      Toast.error(err.message || "Something went wrong");
      setError(err.message);
    };

    voiceSocket.on("connect", handleConnect);
    voiceSocket.on("message:recieved", handleAddMessage);
    voiceSocket.on("error", handleError);

    return () => {
      voiceSocket.off("connect", handleConnect);
      voiceSocket.off("message:recieved", handleAddMessage);
      voiceSocket.off("error", handleError);
    };
  }, [roomId, userId, astrologerId, kundliId, astrologerName]);

 
  // Updated: accept optional kundliIdOverride parameter
  const sendMessage = (text, type, kundliIdOverride = null) => {
    const res = sendViaSocket(text, type, kundliIdOverride);

    if (res?.error) {
      setError(res.error);
      Toast.error(res.error);
      return;
    }
  };

  return {
    messages,
    error,
    sendMessage,
  };
};
