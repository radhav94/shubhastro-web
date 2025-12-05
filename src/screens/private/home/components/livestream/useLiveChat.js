
// src/components/LiveStreaming/useLiveChat.js
import { useEffect, useRef, useState } from "react";
import AgoraRTM from "agora-rtm-sdk";

const APP_ID = "b7bd8229702e4ec3b0938ea15f23a39c";
const CHANNEL_NAME = "testnew";

/**
 * NOTE:
 * Replace these with the tokens FROM AGORA CONSOLE
 * based on the exact UID format below
 */
const HOST_RTM_TOKEN = "006b7bd8229702e4ec3b0938ea15f23a39cIACicAU2Uv51r7pgDKCI8gma/TrYxWYEfC8e/VwM40Oj6SisZ78AAAAAEAAn4FweVewxaQEA6ANV7DFp";
const AUDIENCE_RTM_TOKEN = "006b7bd8229702e4ec3b0938ea15f23a39cIAD35Z3CCMg4t/ZFr8UFfUskKfy6UGZQgbONWXiM+/0q3PMYoaIAAAAAEAAn4Fwelu0xaQEA6AOW7TFp";

export const useLiveChat = (ROLE) => {
  const rtmClientRef = useRef(null);
  const rtmChannelRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  /**
   * Generate UID based on role
   * AND must match the UID used when generating the token in Agora Console
   */
  const rtmUid = ROLE === "host" ? "host-123" : "aud-123";

  // Select correct token for login
  const selectedRTMToken =
    ROLE === "host" ? HOST_RTM_TOKEN : AUDIENCE_RTM_TOKEN;

  useEffect(() => {
    const initRTM = async () => {
      try {
        console.log("RTM → init");

        const client = AgoraRTM.createInstance(APP_ID);
        rtmClientRef.current = client;

        // LOGIN WITH TOKEN
        await client.login({
          uid: rtmUid,
          token: selectedRTMToken,
        });
        console.log("RTM → Login Success:", rtmUid);

        const rtmChannel = client.createChannel(CHANNEL_NAME);
        rtmChannelRef.current = rtmChannel;

        await rtmChannel.join();
        console.log("RTM → Channel Join Success:", CHANNEL_NAME);

        // Receive message
        rtmChannel.on("ChannelMessage", (message, senderId) => {
          console.log("RTM → New Msg:", message.text, "sender:", senderId);

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: senderId,
              text: message.text,
              role: senderId.startsWith("host") ? "host" : "audience",
              isSelf: senderId === rtmUid,
            },
          ]);
        });
      } catch (err) {
        console.error("RTM → ERROR:", err);
      }
    };

    initRTM();

    return () => {
      if (rtmChannelRef.current) rtmChannelRef.current.leave();
      if (rtmClientRef.current) rtmClientRef.current.logout();
      console.log("RTM → Cleanup Done");
    };
  }, [rtmUid, selectedRTMToken]);

  // SEND MESSAGE
  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg) return;

    if (!rtmChannelRef.current) {
      console.warn("RTM → Channel not ready yet");
      return;
    }

    try {
      await rtmChannelRef.current.sendMessage({ text: msg });
      console.log("RTM → Message Sent:", msg);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: rtmUid,
          text: msg,
          role: ROLE,
          isSelf: true,
        },
      ]);

      setChatInput("");
    } catch (err) {
      console.error("RTM → Send Fail:", err);
    }
  };

  return {
    messages,
    chatInput,
    setChatInput,
    sendChatMessage,
  };
};
