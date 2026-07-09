import { useMatch, useNavigate } from "react-router-dom";
import { useCall } from "../../../../../context/CallContext";
import { useWaitingQueue } from "../../../../../context/WaitingQueueContext";
import { FooterApproval } from "../call/FooterApproval";
import { FooterWaiting } from "../call/FooterWaiting";
import { FooterMissedApproval } from "../call/FooterMissedApproval";
import { useEffect } from "react";
import { voiceSocket } from "../../../../../services/voiceSocketServices";

const StickyCallFooter = () => {
  const {
    waitingList,
    callApproval,
    activeCall,
    missedApproval,
    resetCallFlow,
    setCallApproval,
    setMissedApproval,
    activeCallRoomId,
    callSeconds,
  } = useCall();
  const { hasAnyPending } = useWaitingQueue();
  const navigate = useNavigate();

  const onTalkDetailPage = useMatch("/chat-to-astrologer/:id");

  useEffect(() => {
    if (!callApproval) return;

    const timer = setTimeout(() => {
      voiceSocket.emit("call:cancel", {
        roomId: activeCallRoomId,
        canceledBy: "SYSTEM",
      });

      setCallApproval(false);
      resetCallFlow();
      setMissedApproval(true);
    }, 60000);

    return () => clearTimeout(timer);
  }, [callApproval]);

  // Hide only on detail page
  if (onTalkDetailPage) return null;

  // Don't show if there's an active call and no waiting state (call UI is already visible)
  if (activeCall && !waitingList) return null;

  // When the queue is active, hide ONLY the waiting state from this footer.
  // Approval, missedApproval states should still show here.
  if (hasAnyPending && waitingList && !callApproval && !missedApproval) return null;

  if (!callApproval && !missedApproval)
    return null;
  
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 animate-slideUp waiting-queue ${activeCall ? 'z-[100000]' : 'z-50'}`}>
      <div className="flex items-center gap-4 rounded-2xl bg-zinc-900/95 px-5 py-4 shadow-2xl backdrop-blur-md border border-zinc-800">
        {/* FooterWaiting removed — StickyWaitingQueue handles all waiting states */}

        {callApproval && <FooterApproval />}
        {missedApproval && <FooterMissedApproval />}

        {/* {activeCall && (
          <div className="flex items-center gap-3 text-white">
            <span className="text-xl">💬</span>
            <div>
              <p className="text-sm font-medium">Call ongoing</p>
              <p className="text-xs text-zinc-400">
                With {activeCall.callerName || "Astrologer"} {Math.floor(callSeconds / 60)}:
                {String(callSeconds % 60).padStart(2, "0")}
              </p>
            </div>
            <button
              onClick={() =>
                navigate(`/astrologers/${activeCall.astrologerId}`, {
                  state: {
                    userId: activeCall.userId,
                    astrologerId: activeCall.astrologerId,
                    fullName: activeCall.callerName,
                    roomId: activeCall.roomId,
                    isUserSide: true,
                    kundliId: activeCall.kundliId,
                    astrologerName: activeCall?.astrologerName,
                    refreshKey: Math.floor(Math.random() * 100) + 1,
                  },
                })
              }
              className="ml-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 transition"
            >
              Open Call
            </button>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default StickyCallFooter;
