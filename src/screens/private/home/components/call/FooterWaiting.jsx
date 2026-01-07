import { useEffect } from "react";
import { useCall } from "../../../../../context/CallContext";
import { voiceSocket } from "../../../../../services/voiceSocketServices";


export const FooterWaiting = () => {
  const { waitingList, resetCallFlow, activeCallRoomId, setCallApproval, setWaitingList } = useCall();

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

  return (
    <>
      <div className="flex items-center gap-3 text-white">
        <span className="text-xl">⏳</span>
        <div>
          <p className="text-sm font-medium">Waiting in queue</p>
          <p className="text-xs text-zinc-400">
            Approx {waitingList || "5"} mins
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          voiceSocket.emit("call:cancel", {roomId : activeCallRoomId, canceledBy : "CUSTOMER"});
          resetCallFlow();
        }}
        className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
      >
        Cancel
      </button>
    </>
  );
};
