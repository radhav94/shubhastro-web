import { useEffect, useRef, useState, useMemo } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  IoMic,
  IoMicOff,
  IoVideocam,
  IoVideocamOff,
  IoArrowBack,
  IoGift,
  IoSwapHorizontal,
  IoSparkles,
  IoAttach,
  IoTime,
  IoVolumeHigh,
  IoVolumeMute,
  IoChatbubbleEllipses,
  IoCall,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import styles from "./VideoCalling.module.scss";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useCall } from "../../context/CallContext";
import VideoCallChat from "./VideoCallChat";
import GiftModal from "./GiftModal";
import { useGetBalanceMutation } from "../../redux/api/wallet/walletApi";
import ProfileManager from "../UI/Profile/ProfileManager";
import { useGetAllKundlisQuery } from "../../services/appServices/kundliServicesNew";
import { Toast } from "../index";
import { getUserFromStorage } from "../../utils/authStorage";
import { useWalletBalance } from "../../screens/private/wallet/useWalletBalance";

const APP_ID = "5630460abdc141e3b2f8d9597752bd7d";

const VideoCalling = ({ callData }) => {
  const { activeCall, setActiveCall, lastRequestedAstro, lastSelectedKundli, setOpenReview, setReviewData, callSeconds, setCallSeconds, startTimer, stopTimer } = useCall();
  const navigate = useNavigate();

  if (!activeCall || activeCall.callType !== "video") return null;

  const { roomId, agoraToken, isUserSide, callerName } = callData;

  const clientRef = useRef(null);
  const micTrackRef = useRef(null);
  const camTrackRef = useRef(null);

  const localVideoFullRef = useRef(null);
  const [isLocalBig, setIsLocalBig] = useState(false);

  const localVideoMiniRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const cleanupRef = useRef(false);
  const endCallRef = useRef(false);

  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRechargeButton, setShowRechargeButton] = useState(false);
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [getBalance] = useGetBalanceMutation();
  const { balance, isFetching, refreshWallet } = useWalletBalance();
  
  // Fetch kundli profiles
  const { data: profilesData } = useGetAllKundlisQuery();
  const profiles = profilesData?.data || [];

  // Default avatar URL
  const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // Get customer name from storage
  const user = getUserFromStorage();
  const customerName = useMemo(() => {
    console.log("🔍 User from storage:", user);
    if (!user) {
      console.log("⚠️ No user found in storage");
      return "Customer";
    }
    const name = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.firstName || "Customer";
    console.log("✅ Customer name:", name);
    return name;
  }, [user]);

  /* ================= LOCAL VIDEO ================= */
  const playLocalVideo = (container) => {
    if (!camTrackRef.current || !container) return;

    try {
      camTrackRef.current.stop();
    } catch (e) {
      console.error("Error stopping camera track:", e);
    }

    container.innerHTML = "";
    camTrackRef.current.play(container);
  };


  /* ================= REMOTE VIDEO SAFE PLAY ================= */
  // const safePlayRemoteVideo = (track) => {
  //   if (!remoteVideoRef.current || !track) return;

  //   remoteVideoRef.current.innerHTML = "";
  //   const div = document.createElement("div");
  //   div.style.width = "100%";
  //   div.style.height = "100%";
  //   remoteVideoRef.current.appendChild(div);

  //   setTimeout(() => {
  //     try {
  //       track.play(div);
  //     } catch (e) {
  //       console.warn("Retry remote video play");
  //       setTimeout(() => track.play(div), 300);
  //     }
  //   }, 150);
  // };

  const safePlayRemoteVideo = (track) => {
    if (!track) return;

    const container = isLocalBig
      ? localVideoFullRef.current
      : remoteVideoRef.current;

    if (!container) return;

    try {
      track.stop();
    } catch (e) {
      console.error("Error stopping remote track:", e);
    }

    container.innerHTML = "";

    const div = document.createElement("div");
    div.style.width = "100%";
    div.style.height = "100%";
    container.appendChild(div);

    setTimeout(() => {
      try {
        track.play(div);
      } catch (err) {
        setTimeout(() => {
          try {
            track.play(div);
          } catch (retryErr) {
            console.error("Failed to play remote video after retry:", retryErr);
          }
        }, 300);
      }
    }, 100);
  };


  /* ================= RESUME REMOTE AUDIO ================= */
  const resumeRemoteTracks = () => {
    if (!clientRef.current) return;

    clientRef.current.remoteUsers.forEach((user) => {
      if (user.audioTrack) {
        try {
          user.audioTrack.play();
          user.audioTrack.setVolume(speakerOn ? 100 : 0);
        } catch (err) {
          console.error("Error playing audio:", err);
        }
      }
      if (user.videoTrack && remoteVideoRef.current) {
        try {
          safePlayRemoteVideo(user.videoTrack);
        } catch (err) {
          console.error("Error playing video:", err);
        }
      }
    });
  };

  /* ================= START CALL ================= */
  useEffect(() => {
    cleanupRef.current = false;
    endCallRef.current = false;

    const start = async () => {
      try {
        if (clientRef.current) {
          await clientRef.current.leave();
          clientRef.current.removeAllListeners();
          clientRef.current = null;
        }

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
          try {
            await client.subscribe(user, mediaType);

            if (mediaType === "video" && user.videoTrack) {
              setRemoteVideoEnabled(true);
              safePlayRemoteVideo(user.videoTrack);
            }

            if (mediaType === "audio" && user.audioTrack) {
              user.audioTrack.play();
              user.audioTrack.setVolume(speakerOn ? 100 : 0);
            }
          } catch (err) {
            console.error("Error handling published media:", err);
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video") {
            setRemoteVideoEnabled(false);
          }
        });

        client.on("user-left", safeEndCall);

        await client.join(APP_ID, roomId, agoraToken, null);

        micTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
        camTrackRef.current = await AgoraRTC.createCameraVideoTrack();

        await client.publish([micTrackRef.current, camTrackRef.current]);

        setJoined(true);
        const seconds = Number(activeCall.remainingTime) * 60;
        setCallSeconds(seconds);
        startTimer();
      } catch (err) {
        console.error("Call start error:", err);
        safeEndCall();
      }
    };

    start();
    return () => {
      cleanup();
    };
    // eslint-disable-next-line
  }, [roomId]);

  /* ================= LOCAL VIDEO ================= */


  useEffect(() => {
    if (!joined) return;

    if (isMinimized) {
      playLocalVideo(localVideoMiniRef.current);
    } else if (isLocalBig) {
      playLocalVideo(remoteVideoRef.current); // local goes big
    } else {
      playLocalVideo(localVideoFullRef.current); // local stays small
    }
  }, [joined, isMinimized, isLocalBig]);

  useEffect(() => {
    if (!clientRef.current) return;
    resumeRemoteTracks();
    // eslint-disable-next-line
  }, [isLocalBig]);


  useEffect(() => {
    if (micTrackRef.current) {
      micTrackRef.current.setEnabled(micOn);
    }
  }, [micOn]);

  useEffect(() => {
    if (camTrackRef.current) {
      camTrackRef.current.setEnabled(cameraOn);
    }
  }, [cameraOn]);

  /* ================= SPEAKER CONTROL ================= */
  useEffect(() => {
    if (!clientRef.current) return;

    try {
      clientRef.current.remoteUsers.forEach((user) => {
        if (user.audioTrack) {
          user.audioTrack.setVolume(speakerOn ? 100 : 0);
        }
      });
    } catch (err) {
      console.error("Error updating speaker state:", err);
    }
  }, [speakerOn]);

  /* ================= REMOTE VIDEO SAFETY REPLAY ================= */
  useEffect(() => {
    if (!joined || !clientRef.current) return;

    clientRef.current.remoteUsers.forEach((user) => {
      if (user.videoTrack) {
        safePlayRemoteVideo(user.videoTrack);
      }
    });
    // eslint-disable-next-line
  }, [joined]);

  /* ================= CLEANUP ================= */
  const cleanup = async () => {
    if (cleanupRef.current) return;
    cleanupRef.current = true;

    try {
      if (micTrackRef.current) {
        micTrackRef.current.stop();
        micTrackRef.current.close();
      }

      if (camTrackRef.current) {
        camTrackRef.current.stop();
        camTrackRef.current.close();
      }

      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current.removeAllListeners();
      }
    } catch (e) {
      console.error("Error during cleanup:", e);
    } finally {
      micTrackRef.current = null;
      camTrackRef.current = null;
      clientRef.current = null;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.innerHTML = "";
      }

      setJoined(false);
      setActiveCall(null);
      stopTimer();
    }
  };

  /* ================= SAFE END CALL ================= */
  const safeEndCall = async () => {
    if (endCallRef.current) return;
    endCallRef.current = true;

    setReviewData({
      astrologerID: activeCall.astrologerID,
      fullName: activeCall.callerName,
    });

    voiceSocket.emit("call:end", {
      roomId,
      endedBy: isUserSide ? "CUSTOMER" : "ASTROLOGER",
    });

    // Refresh wallet balance after call ends
    refreshWallet();
    window.dispatchEvent(new Event("walletBalanceUpdated"));

    setOpenReview(true);
    await cleanup();
  };

  /* ================= SOCKET ================= */
  useEffect(() => {
    const handleCallEnded = () => {
      if (!endCallRef.current) {
        safeEndCall();
      }
    };

    const handleForceCallEnd = () => {
      if (!endCallRef.current) {
        safeEndCall();
      }
    };

    const handleDisconnect = () => {
      if (!endCallRef.current) {
        safeEndCall();
      }
    };

    const handleWarning = (msg) => {
      if (msg?.message.includes("Low balance alert! Remaining time:")) {
        setShowRechargeButton(true);
      }
      Toast.warning(msg.message);
    };

    voiceSocket.on("call:ended", handleCallEnded);
    voiceSocket.on("force_call_end", handleForceCallEnd);
    voiceSocket.on("disconnect", handleDisconnect);
    voiceSocket.on("warning", handleWarning);

    return () => {
      voiceSocket.off("call:ended", handleCallEnded);
      voiceSocket.off("force_call_end", handleForceCallEnd);
      voiceSocket.off("disconnect", handleDisconnect);
      voiceSocket.off("warning", handleWarning);
    };
    // eslint-disable-next-line
  }, []);

  /* ================= BALANCE CHECK ================= */
  // useEffect(async() => {
  //     console.log("halfTalkTimeBalance initialBalance", initialBalance);
  //     if (!activeCall?.astrologerId) return;

  //     try {
  //       const res = await getBalance({
  //         astrologerId: activeCall.astrologerId,
  //         type: "call"
  //       });

  //       const balanceData = res?.data?.data;
  //       if (!balanceData) return;

  //       if (initialBalance === null && balanceData?.availableAmount) {
  //         setInitialBalance(balanceData.availableAmount);
  //       }

  //       if (initialBalance !== null && balanceData?.pricePerMinute) {
  //         // Calculate based on astrologer's rate per minute
  //         const ratePerMinute = balanceData.pricePerMinute;
  //         const totalTalkTimeMinutes = initialBalance / ratePerMinute;
  //         const halfTalkTimeMinutes = totalTalkTimeMinutes * 0.5;
  //         const halfTalkTimeBalance = halfTalkTimeMinutes * ratePerMinute;
  //         // Show recharge button when current balance <= 50% of initial talk time balance
  //         const shouldShowButton = balanceData.availableAmount <= halfTalkTimeBalance;
  //         setShowRechargeButton(shouldShowButton);
  //       }
  //     } catch (error) {
  //       console.error("Balance check error:", error);
  //     }

  //   return () => {

  //   }
  // }, [activeCall?.astrologerId, getBalance, initialBalance]);

  /* ================= WALLET UPDATE LISTENER ================= */
  useEffect(() => {
    const handleWalletUpdate = async () => {
      if (activeCall && activeCall.callType === "video" && isMinimized) {
        setIsMinimized(false);
      }

      if (activeCall?.astrologerId) {
        try {
          const res = await getBalance({
            astrologerId: activeCall.astrologerId,
            type: "call"
          });

          const balanceData = res?.data?.data;
          if (!balanceData) return;

          // Calculate based on astrologer's rate per minute
          const ratePerMinute = balanceData.pricePerMinute;
          const totalTalkTimeMinutes = balanceData.availableAmount / ratePerMinute;
          const halfTalkTimeMinutes = totalTalkTimeMinutes * 0.5;
          const halfTalkTimeBalance = halfTalkTimeMinutes * ratePerMinute;

          // Show recharge button when current balance <= 50% of initial talk time balance
          const shouldShowButton = balanceData.availableAmount <= halfTalkTimeBalance;
          setShowRechargeButton(shouldShowButton);
        } catch (error) {
          console.error("Wallet update balance check error:", error);
        }
      }
    };

    window.addEventListener("wallet-updated", handleWalletUpdate);
    window.addEventListener("walletBalanceUpdated", handleWalletUpdate);

    return () => {
      window.removeEventListener("wallet-updated", handleWalletUpdate);
      window.removeEventListener("walletBalanceUpdated", handleWalletUpdate);
    };
  }, [activeCall, isMinimized, getBalance]);

  /* ================= DRAG ================= */
  const dragOffset = useRef({ x: 0, y: 0 });

  const startDrag = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    dragOffset.current = { x: x - position.x, y: y - position.y };
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onDrag);
    document.addEventListener("touchend", stopDrag);
  };

  const onDrag = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setPosition({ x: x - dragOffset.current.x, y: y - dragOffset.current.y });
  };

  const stopDrag = () => {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", stopDrag);
  };

  /* ================= CHAT ================= */
  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  const handleRedirection = (path) => {
    try {
      setIsMinimized(true);
      navigate(path);
    } catch (err) {
      console.error("❌ [handleRedirection] Navigation error:", err);
    }
  };

  const handleSwitchProfile = () => {
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  const handleProfileSelect = (profile) => {
    // Send the selected kundli profile as a link
    if (!profile?._id) {
      console.error("Invalid profile selected");
      return;
    }

    setSelectedProfile(profile);

    const baseUrl = window.location.origin;
    const kundliLink = `${baseUrl}/kundli/${profile._id}`;

    // Send via chat using the sendMessage function from VideoCallChat
    if (sendChatMessageRef.current) {
      sendChatMessageRef.current(kundliLink, "kundli");
    }

    setShowProfileModal(false);

    // Open chat panel to show the sent kundli
    setIsChatOpen(true);
  };

  const handleNavigateToChat = () => {
    if (!activeCall?.astrologerId || !activeCall?.roomId) {
      console.error("Missing required chat data");
      return;
    }

    setIsMinimized(true);
    navigate(`/chat-with-astrologers/${activeCall.astrologerId}`, {
      state: {
        userId: activeCall.userId,
        astrologerId: activeCall.astrologerId,
        roomId: activeCall.chatRoomId || activeCall.roomId,
        fullName: callerName,
        isUserSide: activeCall.isUserSide,
        kundliId: activeCall.kundliId,
        astrologerName: callerName,
        astroID: activeCall.astrologerID,
      }
    });
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0"
    )}`;
  // Memoize chat data to prevent unnecessary re-renders
  const astrologerName = useMemo(() => {
    if (!lastRequestedAstro) return "";
    return `${lastRequestedAstro.firstName || ""} ${lastRequestedAstro.lastName || ""}`.trim();
  }, [lastRequestedAstro]);

  // Get kundliId with fallback logic
  const effectiveKundliId = useMemo(() => {
    // Priority: activeCall.kundliId > lastSelectedKundli > first profile
    if (activeCall?.kundliId) return activeCall.kundliId;
    if (lastSelectedKundli?._id) return lastSelectedKundli._id;
    if (profiles && profiles.length > 0) return profiles[0]._id;
    return null;
  }, [activeCall?.kundliId, lastSelectedKundli, profiles]);

  const chatData = useMemo(() => ({
    userId: activeCall?.userId,
    astrologerId: activeCall?.astrologerId,
    chatRoomId: activeCall?.roomId,
    kundliId: effectiveKundliId,
    isUserSide: activeCall?.isUserSide,
    astrologerName: astrologerName
  }), [activeCall?.userId, activeCall?.astrologerId, activeCall?.chatRoomId, effectiveKundliId, activeCall?.isUserSide, astrologerName]);

  // Ref to store sendMessage function from VideoCallChat
  const sendChatMessageRef = useRef(null);

  return (
    <>
      {/* MINI VIEW */}
      <div
        className={styles.floatingMini}
        style={{
          top: position.y,
          left: position.x,
          display: isMinimized ? "block" : "none",
        }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        <div className={styles.miniHeader}>
          <span>
            {callerName || "Video Call"} • {formatTime(callSeconds)}
          </span>
          <button onClick={() => setIsMinimized(false)}>⤢</button>
        </div>

        <div className={styles.miniVideo}>
          {/* Mini Video Container - Always rendered */}
          <div
            ref={localVideoMiniRef}
            style={{ width: "100%", height: "100%" }}
          />
          {/* Avatar Overlay - Separate layer */}
          {!cameraOn && (
            <div className={styles.avatarOverlayMini}>
              <img
                src={DEFAULT_AVATAR}
                alt="You"
                className={styles.avatarImageMini}
              />
            </div>
          )}
        </div>

        <div className={styles.miniControls}>
          <button onClick={() => setMicOn((p) => !p)}>
            {micOn ? <IoMic size={18} /> : <IoMicOff size={18} />}
          </button>
          <button onClick={() => setCameraOn((p) => !p)}>
            {cameraOn ? <IoVideocam size={18} /> : <IoVideocamOff size={18} />}
          </button>
          <button onClick={() => setSpeakerOn((p) => !p)}>
            {speakerOn ? <IoVolumeHigh size={18} /> : <IoVolumeMute size={18} />}
          </button>
          <button className={styles.endBtnMini} onClick={safeEndCall}>
            ✕
          </button>
        </div>
      </div>

      {/* FULL VIEW */}
      <div
        className={styles.videoContainer}
        style={{ visibility: isMinimized ? "hidden" : "visible" }}
      >
        {!joined ? (
          <div className={styles.waitingText}>Connecting…</div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.header}>
              <button
                className={styles.backBtn}
                onClick={() => setIsMinimized(true)}
              >
                <IoArrowBack size={24} />
              </button>

              <div className={styles.astrologerInfo}>
                <h3 className={styles.astrologerName}>{callerName}</h3>
                <p className={styles.astrologerExp}>
                  {lastRequestedAstro?.role 
                    ? lastRequestedAstro.role.charAt(0).toUpperCase() + lastRequestedAstro.role.slice(1).toLowerCase()
                    : "Astrologer"} • Exp. {lastRequestedAstro?.experience || "20"} Years
                </p>
              </div>

              <div className={styles.walletBadge}>
                <span className={styles.walletIcon}>💰</span>
                <span className={styles.walletAmount}>
                  {isFetching ? "..." : balance !== null ? `₹${balance.toFixed(2)}` : "₹0.00"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button className={styles.actionBtn} onClick={toggleChat}>
                <IoAttach size={16} />
                <span>Attach File</span>
              </button>
              <button className={styles.actionBtn}>
                <IoSparkles size={16} />
                <span>Suggested Remedy</span>
              </button>
              <button
                className={styles.actionBtn}
                onClick={() => {
                  setIsMinimized(true);
                  navigate("/profile", { state: { activeTab: "Order History", orderHistoryTab: "call" } });
                }}
              >
                <IoTime size={16} />
                <span>View History</span>
              </button>
            </div>

            {/* Video Area */}
            <div className={styles.videoWrapper}>
              {/* Remote Video Container - Always rendered */}
              <div ref={remoteVideoRef} className={styles.remoteVideoArea} />

              {/* Avatar Overlay - Separate layer */}
              {!remoteVideoEnabled && (
                <div className={styles.avatarOverlay}>
                  <img
                    src={DEFAULT_AVATAR}
                    alt={callerName}
                    className={styles.avatarImage}
                  />
                  <p className={styles.avatarName}>{callerName}</p>
                  <p className={styles.avatarStatus}>Camera is off</p>
                </div>
              )}

              {/* Local Video Preview (PIP) */}
              <div
                className={styles.localVideoPreview}
                onClick={() => setIsLocalBig((p) => !p)}
              >
                {/* Local Video Container - Always rendered */}
                <div
                  ref={localVideoFullRef}
                  style={{ width: "100%", height: "100%", cursor: "pointer" }}
                />
                {/* Avatar Overlay - Separate layer */}
                {!cameraOn && (
                  <div className={styles.avatarOverlayLocal}>
                    <img
                      src={DEFAULT_AVATAR}
                      alt="You"
                      className={styles.avatarImageLocal}
                    />
                  </div>
                )}
                {/* Customer Name Label */}
                <div className={styles.localVideoLabel}>
                  <span className={styles.localVideoName}>{customerName}</span>
                  <span className={styles.localVideoRole}>{user?.role || "Customer"}</span>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className={styles.bottomControls}>
              {/* Control Buttons Grid */}
              <div className={styles.controlGrid}>
                <div className={styles.controlItem}>
                  <button
                    className={styles.controlBtn}
                    onClick={handleSwitchProfile}
                  >
                    <IoSwapHorizontal size={24} />
                  </button>
                  <span className={styles.controlLabel}>Switch Profile</span>
                </div>

                <div className={styles.controlItem}>
                  <button
                    className={styles.controlBtn}
                    onClick={() => handleRedirection("/aiwow")}
                  >
                    <IoSparkles size={24} />
                  </button>
                  <span className={styles.controlLabel}>AI Wow</span>
                </div>
                <div className={styles.controlItem}>
                  <button
                    className={styles.controlBtn}
                    onClick={() => setIsGiftModalOpen(true)}
                  >
                    <IoGift size={24} />
                  </button>
                  <span className={styles.controlLabel}>Send Gift</span>
                </div>

                <div className={styles.controlItem}>
                  <button
                    className={`${styles.controlBtn} ${!micOn ? styles.muted : ''}`}
                    onClick={() => setMicOn((p) => !p)}
                  >
                    {micOn ? <IoMic size={24} /> : <IoMicOff size={24} />}
                  </button>
                  <span className={styles.controlLabel}>
                    {micOn ? "Mute Audio" : "Unmute Audio"}
                  </span>
                </div>

                <div className={styles.controlItem}>
                  <button
                    className={`${styles.controlBtn} ${styles.endCallBtn}`}
                    onClick={safeEndCall}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M19.23 15.26L16.69 14.97C16.08 14.9 15.48 15.11 15.05 15.54L13.21 17.38C10.38 15.94 8.06004 13.63 6.62004 10.79L8.47004 8.94001C8.90004 8.51001 9.11004 7.91001 9.04004 7.30001L8.75004 4.78001C8.63004 3.77001 7.78004 3.01001 6.76004 3.01001H5.03004C3.90004 3.01001 2.96004 3.95001 3.03004 5.08001C3.56004 13.62 10.39 20.44 18.92 20.97C20.05 21.04 20.99 20.1 20.99 18.97V17.24C21 16.23 20.24 15.38 19.23 15.26Z" fill="currentColor" />
                    </svg>
                  </button>
                  <span className={styles.controlLabel}>End Call</span>
                </div>

                <div className={styles.controlItem}>
                  <button
                    className={styles.controlBtn}
                    onClick={() => setCameraOn((p) => !p)}
                  >
                    {cameraOn ? <IoCall size={24} /> : <IoVideocam size={24} />}
                  </button>
                  <span className={styles.controlLabel}>
                    {cameraOn ? "Switch to Audio" : "Switch to Video"}
                  </span>
                </div>
                <div className={styles.controlItem}>
                  <button
                    className={styles.controlBtn}
                    onClick={handleNavigateToChat}
                  >
                    <IoChatbubbleEllipses size={24} />
                  </button>
                  <span className={styles.controlLabel}>Chat</span>
                </div>
                <div className={styles.controlItem}>
                  <button
                    className={`${styles.controlBtn} ${!speakerOn ? styles.muted : ''}`}
                    onClick={() => setSpeakerOn((p) => !p)}
                  >
                    {speakerOn ? <IoVolumeHigh size={24} /> : <IoVolumeMute size={24} />}
                  </button>
                  <span className={styles.controlLabel}>
                    {speakerOn ? "Mute Speaker" : "Unmute Speaker"}
                  </span>
                </div>
              </div>

              {/* Timer and Recharge */}
              <div className={styles.bottomBar}>
                <div className={styles.callTimer}>
                  Call Ends in <span className={styles.timerRed}>{formatTime(callSeconds)}</span>
                </div>
                {showRechargeButton && (
                  <button className={styles.rechargeBtn} onClick={() => handleRedirection("/recharge")}>Recharge Now</button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Chat Panel */}
        <VideoCallChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          videoCallData={chatData}
          sendMessageRef={sendChatMessageRef}
        />

        {/* Gift Modal */}
        <GiftModal
          isOpen={isGiftModalOpen}
          onClose={() => setIsGiftModalOpen(false)}
          astrologerId={activeCall?.astrologerId}
          astrologerName={callerName}
        />

        {/* Profile Listing Modal */}
        <ProfileManager
          isOpen={showProfileModal}
          onClose={handleCloseProfileModal}
          onProfileSelect={handleProfileSelect}
          selectedProfileId={selectedProfile?._id}
          title="Select Profile"
          enabledOperations={{
            list: true,
            add: true,
            edit: true,
            delete: true,
          }}
        />
      </div>
    </>
  );
};

export default VideoCalling;