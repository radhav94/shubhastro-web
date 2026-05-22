import { useCall } from "../../../../../context/CallContext";
import { useWaitingQueue } from "../../../../../context/WaitingQueueContext";
import { voiceSocket } from "../../../../../services/voiceSocketServices";

export const FooterApproval = () => {
  const { resetCallFlow, activeCallRoomId } = useCall();
  const { cancelAllExcept, removePendingConnection } = useWaitingQueue();

  const handleUserCallAccept = async() => {
    voiceSocket.emit("call:accept", {roomId : activeCallRoomId, acceptedBy : "CUSTOMER"});
    // User accepted — cancel all other pending connections
    cancelAllExcept(activeCallRoomId);
    resetCallFlow();
  }

  const handleDecline = () => {
    voiceSocket.emit("call:cancel", {roomId : activeCallRoomId, canceledBy : "CUSTOMER"});
    if (activeCallRoomId) {
      removePendingConnection(activeCallRoomId);
    }
    resetCallFlow();
  };

  return (
    <>
      <div className="flex items-center gap-3 text-white">
        <span className="text-xl">✨</span>
        <div>
          <p className="text-sm font-medium">Astrologer accepted</p>
          <p className="text-xs text-zinc-400">Start call now?</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleUserCallAccept}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 transition"
        >
          Yes
        </button>
        <button
          onClick={handleDecline}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition"
        >
          No
        </button>
      </div>
    </>
  );
};
