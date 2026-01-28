import { useEffect } from "react";
import { useCall } from "../../../../../context/CallContext";
import { voiceSocket } from "../../../../../services/voiceSocketServices";


export const FooterWaiting = () => {
  const { waitingList, resetCallFlow, activeCallRoomId, setCallApproval, setWaitingList, lastRequestedAstro } = useCall();

  useEffect(() => {
    const handleAstrologerIncoming = (data) => {
      if(data.type == "chat") return;
      setCallApproval(true);
      setWaitingList(null);
    }
    voiceSocket.on("incoming", handleAstrologerIncoming);
    return () => {
    voiceSocket.off("incoming", handleAstrologerIncoming);
    }
  }, [])

  const astrologerName = lastRequestedAstro?.firstName;

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3 text-white">
        <span className="text-lg sm:text-xl flex-shrink-0">⏳</span>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium">Waiting in queue</p>
          <p className="text-[11px] sm:text-xs text-zinc-400">
            Approx {waitingList || "5"} mins
          </p>
          {astrologerName && (
            <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
              Astrologer: {astrologerName}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          voiceSocket.emit("call:cancel", {roomId : activeCallRoomId, canceledBy : "CUSTOMER"});
          resetCallFlow();
        }}
        className="rounded-xl border border-red-500/40 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-red-400 hover:bg-red-500/10 transition flex-shrink-0"
      >
        Cancel
      </button>
    </>
  );
};
