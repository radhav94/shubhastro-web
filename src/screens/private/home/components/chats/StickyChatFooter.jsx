import { useMatch, useNavigate } from "react-router-dom";
import { useChat } from "../../../../../context/ChatContext";
import { FooterApproval } from "./FooterApproval";
import { FooterWaiting } from "./FooterWaiting";
import { FooterMissedApproval } from "./FooterMissedApproval";
import { useEffect } from "react";
import { voiceSocket } from "../../../../../services/voiceSocketServices";

const StickyChatFooter = () => {
  const {
    waitingList,
    chatApproval,
    activeChat,
    missedApproval,
    resetChatFlow,
    setChatApproval,
    setMissedApproval,
    activeChatRoomId,
    chatSeconds,
  } = useChat();
  const navigate = useNavigate();

  const onTalkDetailPage = useMatch("/talk-to-astrologers/:id");

  useEffect(() => {
    if (!chatApproval) return;

    const timer = setTimeout(() => {
      voiceSocket.emit("chat:cancel", {
        roomId: activeChatRoomId,
        canceledBy: "SYSTEM",
      });

      setChatApproval(false);
      resetChatFlow();
      setMissedApproval(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [chatApproval]);

  // Hide only on detail page
  if (onTalkDetailPage) return null;

  if (!waitingList && !chatApproval && !activeChat && !missedApproval)
    return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slideUp">
      <div className="flex items-center gap-4 rounded-2xl bg-zinc-900/95 px-5 py-4 shadow-2xl backdrop-blur-md border border-zinc-800">
        {waitingList && <FooterWaiting />}

        {chatApproval && <FooterApproval />}
        {missedApproval && <FooterMissedApproval />}

        {activeChat && (
          <div className="flex items-center gap-3 text-white">
            <span className="text-xl">💬</span>
            <div>
              <p className="text-sm font-medium">Chat ongoing</p>
              <p className="text-xs text-zinc-400">
                With {activeChat.callerName || "Astrologer"} {Math.floor(chatSeconds / 60)}:
                {String(chatSeconds % 60).padStart(2, "0")}
              </p>
            </div>
            <button
              onClick={() =>
                navigate(`/talk-to-astrologers/${activeChat.astrologerId}`, {
                  state: {
                    userId: activeChat.userId,
                    astrologerId: activeChat.astrologerId,
                    fullName: activeChat.callerName,
                    roomId: activeChat.roomId,
                    isUserSide: true,
                    kundliId: activeChat.kundliId,
                    astrologerName: activeChat?.astrologerName,
                    refreshKey: Math.floor(Math.random() * 100) + 1,
                  },
                })
              }
              className="ml-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 transition"
            >
              Open Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StickyChatFooter;
