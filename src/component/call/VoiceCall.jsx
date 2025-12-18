import {
  RemoteUser,
  useIsConnected,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  useRTCClient,
} from "agora-rtc-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import {
  IoMic,
  IoMicOff,
  IoArrowBack,
  IoChatbubbleEllipses,
} from "react-icons/io5";
import styles from "./VoiceCall.module.scss";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useCall } from "../../context/CallContext";
import { PATH } from "../../utils/routes/Paths";

// export const AgoraVoiceCalling = ({ callData }) => {
//   const clientRef = useRef(null);

//   if (!clientRef.current) {
//     clientRef.current = AgoraRTC.createClient({
//       mode: "rtc",
//       codec: "vp8",
//     });
//   }

//   return (
//     <AgoraRTCProvider client={clientRef.current}>
//       <CallingUI client={clientRef.current} callData={callData} />
//     </AgoraRTCProvider>
//   );
// };


export const AgoraVoiceCalling = ({ callData }) => {
  const [clientKey, setClientKey] = useState(0);

  // 🔥 whenever room changes → force new Agora client
  useEffect(() => {
    setClientKey((k) => k + 1);
  }, [callData.roomId]);

  return (
    <AgoraRTCProvider
      key={clientKey}
      client={AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      })}
    >
      <CallingUI callData={callData} />
    </AgoraRTCProvider>
  );
};



const CallingUI = ({  callData }) => {
  const { activeCall, setActiveCall } = useCall();
  const navigate = useNavigate();
  const { roomId, callerName, agoraToken, isUserSide } = callData;
  const [micOn, setMic] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callState, setCallState] = useState("connecting");
  const [timer, setTimer] = useState(0);
  const [position, setPosition] = useState({ x: 20, y: 20 });

  const cleanupDoneRef = useRef(false);
  const client = useRTCClient();


  const isConnected = useIsConnected();
  const remoteUsers = useRemoteUsers();

  const appId = "5630460abdc141e3b2f8d9597752bd7d";

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);

useJoin(
  {
    appid: appId,
    channel: roomId,
    token: agoraToken,
  },
  Boolean(roomId && agoraToken)
);



  useEffect(() => {
  return () => {
    (async () => {
      try {
        localMicrophoneTrack?.stop();
        localMicrophoneTrack?.close();

        if (client && client.connectionState !== "DISCONNECTED") {
          await client.unpublish();
          await client.leave();
        }

        client?.removeAllListeners();
      } catch (e) {
        console.warn("Agora unmount cleanup", e);
      }
    })();
  };
}, []);


 useEffect(() => {
  if (!isConnected || !localMicrophoneTrack) return;

  client.publish([localMicrophoneTrack]);

  return () => {
    if (client.connectionState === "CONNECTED") {
      client.unpublish([localMicrophoneTrack]);
    }
  };
}, [isConnected, localMicrophoneTrack]);



  useEffect(() => {
  cleanupDoneRef.current = false;
}, [roomId]);


const cleanupCall = async () => {
  if (cleanupDoneRef.current) return;
  cleanupDoneRef.current = true;

  try {
    localMicrophoneTrack?.stop();
    localMicrophoneTrack?.close();

    if (client?.connectionState !== "DISCONNECTED") {
      await client.unpublish();
      await client.leave();
    }

    client?.removeAllListeners();
  } catch (e) {
    console.warn("cleanup error", e);
  } finally {
    setActiveCall(null);
  }
};




  useEffect(() => {
    localMicrophoneTrack?.setEnabled(micOn);
  }, [micOn]);

  useEffect(() => {
    if (!isConnected) return;
    setCallState(remoteUsers ? "connected" : "waiting");

    console.log("remoteUsers----",remoteUsers);
  }, [isConnected, remoteUsers.length]);

  useEffect(() => {
    let interval;
    if (callState === "connected") {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // useEffect(() => {
  //   const onCallEnded = async () => {
  //     await cleanupCall();
  //   };

  //   const onSocketDisconnect = async () => {
  //     await cleanupCall();
  //   };

  //   voiceSocket.on("call_ended", onCallEnded);
  //   voiceSocket.on("disconnect", onSocketDisconnect);

  //   return () => {
  //     voiceSocket.off("call_ended", onCallEnded);
  //     voiceSocket.off("disconnect", onSocketDisconnect);
  //   };
  // }, []);

  // ONLY for CUSTOMER
useEffect(() => {
  const onCallEnded = async () => {
    await cleanupCall(); // Agora cleanup only
  };

  voiceSocket.on("call_ended", onCallEnded);

  // 🔑 IMPORTANT: socket disconnect ONLY for customer
  if (isUserSide) {
    const onSocketDisconnect = async () => {
      await cleanupCall();
    };

    voiceSocket.on("disconnect", onSocketDisconnect);

    return () => {
      voiceSocket.off("call_ended", onCallEnded);
      voiceSocket.off("disconnect", onSocketDisconnect);
    };
  }

  return () => {
    voiceSocket.off("call_ended", onCallEnded);
  };
}, [isUserSide]);



  const endCall = async () => {
    const endedBy = isUserSide ? "CUSTOMER" : "ASTROLOGER";

    voiceSocket.emit("call_end", { roomId, endedBy });

    await cleanupCall();
  };

  const formatTime = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(
      sec % 60
    ).padStart(2, "0")}`;

  const dragOffset = useRef({ x: 0, y: 0 });

  const startDrag = (e) => {
    e.preventDefault(); // ⭐ REQUIRED FOR MOBILE

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragOffset.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);

    document.addEventListener("touchmove", onDrag, { passive: false });
    document.addEventListener("touchend", stopDrag);
  };

  const onDrag = (e) => {
    e.preventDefault(); // ⭐ mobile scroll stop

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setPosition({
      x: clientX - dragOffset.current.x,
      y: clientY - dragOffset.current.y,
    });
  };

  const stopDrag = () => {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);

    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", stopDrag);
  };

  return (
    <>
      {isMinimized && (
        <div
          className={styles.premiumMini}
          style={{ top: position.y, left: position.x }}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        >
          <div className={styles.dragHandle}>
            <span className={styles.dragDot} />
            <span className={styles.dragDot} />
            <span className={styles.dragDot} />
          </div>

          <div className={styles.miniInfo}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
              alt="avatar"
            />
            <div>
              <p className={styles.miniName}>{callerName}</p>
              <span className={styles.miniStatus}>
                {callState === "connected" ? formatTime(timer) : "Calling..."}
              </span>
            </div>
          </div>

          <div className={styles.miniControls}>
           
            <button
              onClick={() => setMic((p) => !p)}
              className={styles.controlBtn}
            >
              {micOn ? <IoMic size={20} /> : <IoMicOff size={20} />}
            </button>

            <button className={styles.endBtn} onClick={endCall}>
              End
            </button>

            <button
              className={styles.expandBtn}
              onClick={() => setIsMinimized(false)}
            >
              ⤢
            </button>
          </div>
        </div>
      )}

      {!isMinimized && (
        <div className={styles.fullscreenWrapper}>
          <button
            className={styles.minimizeBtn}
            onClick={() => setIsMinimized(true)}
            aria-label="Minimize"
          >
            <IoArrowBack size={20} />
          </button>

          <div className={styles.callingContainer}>
            <img
              className={styles.avatar}
              src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
              alt="User"
            />

            <h2 className={styles.name}>{callerName}</h2>

            <p className={styles.status}>
              {callState === "connecting" && "Connecting…"}
              {callState === "waiting" && `Waiting for ${callerName}…`}
              {callState === "connected" && `Connected • ${formatTime(timer)}`}
            </p>

            {remoteUsers.map((user) => (
              <RemoteUser key={user.uid} user={user} playAudio={true} />
            ))}

            <div className={styles.controls}>
              <button
                className={styles.controlBtn}
                onClick={() => setMic((m) => !m)}
              >
                {micOn ? <IoMic size={28} /> : <IoMicOff size={28} />}
              </button>

              <button className={styles.endBtn} onClick={endCall}>
                End
              </button>

              <button
                className={styles.chatBtn}
                onClick={() => {
                  if (isUserSide) {
                    setIsMinimized(true);

                    navigate(
                      `/talk-to-astrologers/${activeCall.astrologerId}`,
                      {
                        state: {
                          roomId: activeCall.chatRoomId, // SAME CHAT
                          userId: activeCall.userId,
                          astrologerId: activeCall.astrologerId,
                          kundliId: activeCall.kundliId,
                          fullName: activeCall.callerName,
                          isUserSide: true,
                        },
                      }
                    );
                  } else {
                    setIsMinimized(true);
                    navigate(PATH.privateRoutes.ASTROLOGER_CHAT_USER_LIST.path);
                  }
                }}
                aria-label="Open Chat"
              >
                <IoChatbubbleEllipses size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AgoraVoiceCalling;
