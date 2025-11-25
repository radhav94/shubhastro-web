import React, { useEffect, useState } from "react";
// import VoiceCall from "../../../../component/call/VoiceCall";
import styles from "./AstrologerIncomingCall.module.scss";
import callServices from "../../../../../services/callServices";
import VoiceCall from "../../../../../component/call/VoiceCall";

const AstrologerIncomingCall = () => {
  const astrologerId=localStorage.getItem("loggedAstroId")

  const [incomingData, setIncomingData] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);

  useEffect(() => {
    // 📡 Connect socket when page loads
    callServices.connect({
      onConnected: () => console.log("Astrologer socket connected"),
    });

    // 👂 Listen for incoming calls
    callServices.onCallStart((data) => {
      console.log("📞 Incoming call data:", data);

      if (data.astrologerId === astrologerId) {
        setIncomingData(data);
      }
    });
  }, []);

  const acceptCall = () => {
    if (!incomingData) return;

    callServices.receiveCall({
      userId: incomingData.userId,
      astrologerId,
      channelName: incomingData.channelName,
      roomId: incomingData.roomId,
    });

    setCallAccepted(true);
  };

  const rejectCall = () => {
    if (!incomingData) return;

    callServices.rejectCall({
      userId: incomingData.userId,
      astrologerId,
    });

    setIncomingData(null);
  };

  // ⭐ If call is accepted → show Agora call UI
  // if (callAccepted && incomingData) {
  //   return (
  //     <VoiceCall
  //     />
  //   );
  // }

  return (
    <div className={styles.wrapper}>
      {/* {incomingData ? (
        <div className={styles.card}>
          <h2>📞 Incoming Call</h2>

          <div className={styles.infoBox}>
            <p><strong>User:</strong> {incomingData.userId}</p>
            <p><strong>Channel:</strong> {incomingData.channelName}</p>
          </div>

          <div className={styles.actions}>
            <button className={styles.accept} onClick={acceptCall}>
              Accept
            </button>

            <button className={styles.reject} onClick={rejectCall}>
              Reject
            </button>
          </div>
        </div>
      ) : (
        <h3>No active calls…</h3>
      )} */}
      {/* <VoiceCall
      /> */}
    </div>
  );
};

export default AstrologerIncomingCall;
