import React from "react";
import PrimaryText from "../../../../../component/PrimaryText";
import styles from "./AstrologersDashboard.module.scss";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import { useCall } from "../../../../../context/CallContext";

const CallHistoryTab = () => {
  const {
    waitingList,
    setWaitingList,
    setActiveCall,
  } = useCall();

  const astroIdLocal = localStorage.getItem("shubhtalk_astro_id");

const handleAccept = (call) => {

  console.log("testssss",call);
  if (!call?.roomId || !call?.agoraToken) {
    console.warn("Missing call data", call);
    return;
  }

  voiceSocket.emit("accept_call", {
    roomId: call.roomId,
    token: call.agoraToken,
    channelName: call.roomId,
    astrologerId: astroIdLocal,
  });

  // Remove from waiting list
  setWaitingList((prev) =>
    prev.filter((item) => item.roomId !== call.roomId)
  );

  // 🔥 SET ACTIVE CALL WITH CORRECT SHAPE

  console.log("ACCEPT FROM WAITING LIST", {
  roomId: call.roomId,
  token: call.agoraToken,
  callerName: call.callerName,
});

 setActiveCall({
  roomId: call.roomId,
  agoraToken: call.agoraToken,
  callerName: call.callerName, // ✅ REAL NAME
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
