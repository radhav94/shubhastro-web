import { useEffect } from "react";
import { useCall } from "../../../../../context/CallContext";
import { useWaitingQueue } from "../../../../../context/WaitingQueueContext";
import { voiceSocket } from "../../../../../services/voiceSocketServices";

function formatWait(conn) {
  if (!conn || conn.confidence === undefined) return null;
  const { waitingTime, minWait, maxWait, confidence } = conn;
  const safeWait = Math.max(1, waitingTime || 1);
  const safeMin = Math.max(1, minWait || safeWait);
  const safeMax = Math.max(safeMin, maxWait || safeWait);
  if (confidence === "high") return `~${safeWait} min`;
  return `~${safeMin}-${safeMax} min`;
}

export const FooterWaiting = () => {
  const { waitingList, resetCallFlow, activeCall, activeCallRoomId, setCallApproval, setWaitingList, lastRequestedAstro, pendingLiveCall, setPendingLiveCall } = useCall();
  const { removePendingConnection, getConnectionByRoomId } = useWaitingQueue();

  useEffect(() => {
    const handleAstrologerIncoming = (data) => {
      if(data.type == "chat") return;
      setCallApproval(true);
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
  }, [setCallApproval, setWaitingList, removePendingConnection])

  const astrologerName = lastRequestedAstro?.firstName;

  const handleCancel = () => {
    voiceSocket.emit("call:cancel", {roomId: activeCallRoomId, canceledBy: "CUSTOMER"});
    localStorage.removeItem("waitingState");
    // Remove from queue
    if (activeCallRoomId) {
      removePendingConnection(activeCallRoomId);
    }
    // Clear pending live call so HomeLayout WaitingModal doesn't appear after this one dismisses
    if (pendingLiveCall) {
      setPendingLiveCall(null);
      try { sessionStorage.removeItem("shubhtalk_pending_live_call"); } catch { /* ignore */ }
    }
    // During a switch (activeCall exists), only clear waiting state — don't reset the timer
    if (activeCall) {
      setWaitingList(null);
    } else {
      resetCallFlow();
    }
  };

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
        onClick={handleCancel}
        className="rounded-xl border border-red-500/40 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-red-400 hover:bg-red-500/10 transition flex-shrink-0"
      >
        Cancel
      </button>
    </>
  );
};
