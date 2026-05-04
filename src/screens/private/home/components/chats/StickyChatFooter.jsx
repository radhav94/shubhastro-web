import { useMatch, useNavigate } from "react-router-dom";
import { useChat } from "../../../../../context/ChatContext";
import { useWaitingQueue } from "../../../../../context/WaitingQueueContext";
import { FooterApproval } from "./FooterApproval";
import { FooterWaiting } from "./FooterWaiting";
import { FooterMissedApproval } from "./FooterMissedApproval";
import { useEffect } from "react";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import { PANDIT_AI_ID } from "../../../../../component/panditAI/usePanditAI";

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
  const { hasAnyPending } = useWaitingQueue();
  const navigate = useNavigate();

  const onTalkDetailPage = useMatch("/chat-with-astrologers/:id");

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
    }, 60000);

    return () => clearTimeout(timer);
  }, [chatApproval]);

  // Hide only on detail page
  if (onTalkDetailPage) return null;

  if (activeChat?.astrologerId === PANDIT_AI_ID) return null;

  // When the queue is active, hide ONLY the waiting state from this footer.
  // Approval, missedApproval, and activeChat states should still show here.
  if (hasAnyPending && waitingList && !chatApproval && !activeChat && !missedApproval) return null;

  if (!chatApproval && !activeChat && !missedApproval)
    return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slideUp waiting-queue">
      <div className="flex items-center gap-4 rounded-2xl bg-zinc-900/95 px-5 py-4 shadow-2xl backdrop-blur-md border border-zinc-800">
        {/* FooterWaiting removed — StickyWaitingQueue handles all waiting states */}

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
                navigate(`/chat-with-astrologers/${activeChat.astrologerId}`, {
                  state: {
                    userId: activeChat.userId,
                    astrologerId: activeChat.astrologerId,
                    fullName: activeChat.callerName,
                    roomId: activeChat.roomId,
                    isUserSide: true,
                    kundliId: activeChat.kundliId,
                    astrologerName: activeChat?.astrologerName,
                    refreshKey: Math.floor(Math.random() * 100) + 1,
                    profileImgUrl: activeChat?.profileImgUrl,
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
