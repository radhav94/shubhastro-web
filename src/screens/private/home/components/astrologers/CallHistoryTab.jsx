import React,{useEffect} from "react";
import PrimaryText from "../../../../../component/PrimaryText";
import styles from "./AstrologersDashboard.module.scss";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import { useCall } from "../../../../../context/CallContext";
import { Toast } from "../../../../../component";

const CallHistoryTab = () => {
  const {
    waitingList,
    setWaitingList,
    setActiveCall,
    activeCall
  } = useCall();

  const astroIdLocal = localStorage.getItem("shubhtalk_astro_id");


  useEffect(() => {
  if (!voiceSocket.connected) {
    voiceSocket.io.opts.query = {
      astrologerId: astroIdLocal,
      role: "ASTROLOGER",
    };
    voiceSocket.connect();
  }
}, []);

const handleAccept = async (call) => {
  if (!call?.roomId || !call?.agoraToken) return;

  if(activeCall)
  {
    Toast.error("Please end the previous call first");
    return
  }

  // 1️⃣ END ANY EXISTING CALL FIRST
  setActiveCall(null);

  // 🔥 IMPORTANT: allow Agora to cleanup
  await new Promise((res) => setTimeout(res, 0));

  // 2️⃣ TELL SERVER
  voiceSocket.emit("accept_call", {
    roomId: call.roomId,
    token: call.agoraToken,
    channelName: call.roomId,
    astrologerId: astroIdLocal,
  });

  // 3️⃣ REMOVE FROM WAITING LIST
  setWaitingList((prev) =>
    prev.filter((item) => item.roomId !== call.roomId)
  );

  // 🔥 IMPORTANT: delay before mounting Agora again
  await new Promise((res) => setTimeout(res, 50));

  // 4️⃣ START NEW CALL
  setActiveCall({
    roomId: call.roomId,
    agoraToken: call.agoraToken,
    callerName: call.callerName,
    isUserSide: false,
    callType: call.callType || "audio",
  });
};





  const handleReject = (call) => {
    if (!call?.roomId) return;

    voiceSocket.emit("reject_call", {
      roomId: call.roomId,
    });

    // 🔥 Remove from list
    setWaitingList((prev) =>
      prev.filter((item) => item.roomId !== call.roomId)
    );
  };

  return (
    <div className={styles.content}>
      <PrimaryText size_20 isSemiBold>
        Waiting List
      </PrimaryText>

      {waitingList.length === 0 ? (
        <PrimaryText size_14 color="#777">
          No calls found.
        </PrimaryText>
      ) : (
        <ul className={styles.callList}>
          {waitingList.map((call) => (
            <li key={call._id} className={styles.callItem}>
              <div className={styles.callInfo}>
                <PrimaryText isSemiBold>
                  Room: {call.roomId}
                </PrimaryText>

                <PrimaryText size_12 color="#666">
                  {call.callType.toUpperCase()} • {call.status}
                </PrimaryText>

                <PrimaryText size_12 color="#666">
                  User: {call.callerId}
                </PrimaryText>
              </div>

              {/* 🔥 ACTION BUTTONS */}
              <div className={styles.callActions}>
                <button
                  className={styles.acceptBtn}
                  onClick={() => handleAccept(call)}
                >
                  Accept
                </button>

                <button
                  className={styles.rejectBtn}
                  onClick={() => handleReject(call)}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CallHistoryTab;
