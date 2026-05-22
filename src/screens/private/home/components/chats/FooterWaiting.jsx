import { useEffect } from "react";
import { useChat } from "../../../../../context/ChatContext";
import { useWaitingQueue } from "../../../../../context/WaitingQueueContext";
import { voiceSocket } from "../../../../../services/voiceSocketServices";


export const FooterWaiting = () => {
  const { waitingList, resetChatFlow, activeChatRoomId, setChatApproval, setWaitingList, lastRequestedAstro } = useChat();
  const { removePendingConnection, cancelAll } = useWaitingQueue();

  useEffect(() => {
    const handleAstrologerIncoming = (data) => {
      if(data.type != "chat") return;
      setChatApproval(true);
      setWaitingList(null);
      // Remove the accepted connection from the waiting queue
      // since it's now in the approval phase
      if (data?.roomId) {
        removePendingConnection(data.roomId);
      }
    }
    voiceSocket.on("incoming", handleAstrologerIncoming);
    return () => {
    voiceSocket.off("incoming", handleAstrologerIncoming);
    }
  }, [setChatApproval, setWaitingList, removePendingConnection])

  const astrologerName = lastRequestedAstro?.firstName

  const handleCancel = () => {
    voiceSocket.emit("chat:cancel", {roomId : activeChatRoomId, canceledBy : "CUSTOMER"});
    // Remove from queue and clear waiting state
    if (activeChatRoomId) {
      removePendingConnection(activeChatRoomId);
    }
    resetChatFlow();
    localStorage.removeItem("waitingState");
  };

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3 text-white">
        <span className="text-lg sm:text-xl flex-shrink-0">⏳</span>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium">Waiting in queue</p>
          <p className="text-[11px] sm:text-xs text-zinc-400">
            Approx {waitingList || "2"} mins
          </p>
          {astrologerName && (
            <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
              Astrologer: {astrologerName}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleCancel}
        className="rounded-xl border border-red-500/40 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-red-400 hover:bg-red-500/10 transition flex-shrink-0"
      >
        Cancel
      </button>
    </>
  );
};
