import { useEffect } from "react";
import { useChat } from "../../../../../context/ChatContext";
import { voiceSocket } from "../../../../../services/voiceSocketServices";


export const FooterWaiting = () => {
  const { waitingList, resetChatFlow, activeChatRoomId, setChatApproval, setWaitingList, lastRequestedAstro } = useChat();

  useEffect(() => {
    const handleAstrologerIncoming = (data) => {
      if(data.type != "chat") return;
      setChatApproval(true);
      setWaitingList(null);
    }
    voiceSocket.on("incoming", handleAstrologerIncoming);
    return () => {
    voiceSocket.off("incoming", handleAstrologerIncoming);
    }
  }, [])

  const astrologerName = lastRequestedAstro?.firstName

  return (
    <>
      <div className="flex items-center gap-3 text-white">
        <span className="text-xl">⏳</span>
        <div>
          <p className="text-sm font-medium">Waiting in queue</p>
          <p className="text-xs text-zinc-400">
            Approx {waitingList || "2"} mins
          </p>
          {astrologerName && (
            <p className="text-xs text-zinc-400">
              Astrologer: {astrologerName}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          voiceSocket.emit("chat:cancel", {roomId : activeChatRoomId, canceledBy : "CUSTOMER"});
          resetChatFlow();
        }}
        className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
      >
        Cancel
      </button>
    </>
  );
};
