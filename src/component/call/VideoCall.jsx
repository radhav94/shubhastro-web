import { useEffect, useRef, useState, useMemo, useCallback } from "react";
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
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./VideoCalling.module.scss";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useCall } from "../../context/CallContext";
import { useChat as useChatContext } from "../../context/ChatContext";
import VideoCallChat from "./VideoCallChat";
import GiftModal from "./GiftModal";
import { useGetBalanceMutation } from "../../redux/api/wallet/walletApi";
import ProfileManager from "../UI/Profile/ProfileManager";
import { useGetAllKundlisQuery } from "../../services/appServices/kundliServicesNew";
import { Toast } from "../index";
import { getUserFromStorage } from "../../utils/authStorage";
import { useWalletBalance } from "../../screens/private/wallet/useWalletBalance";
import RechargeModal from "../recharge-modal/RechargeModal";
import { PATH } from "../../utils/routes/Paths";
import ChatNotificationBanner from "../UI/ChatNotificationBanner/ChatNotificationBanner";
import { capitalizeWords } from "../../utils/capitalize";
import VideocamIcon from "../../assets/chat/Videocam.svg";
import CallIcon from "../../assets/chat/Call.svg";
import SuggestedRemedyPanel from "./SuggestedRemedyPanel";

// const APP_ID = "c76e3d30a3b6483689dac88ca9f94381";
const APP_ID = import.meta.env.VITE_AGORA_APP_ID;
const CHAT_STORAGE_KEY = "shubhtalk_active_chat";

const VideoCalling = ({ callData }) => {
  const { activeCall, setActiveCall, lastRequestedAstro, lastSelectedKundli, setOpenReview, setReviewData, callSeconds, setCallSeconds, startTimer, stopTimer, reconnectToCall, isCallMinimized, setIsCallMinimized,setWaitingList } = useCall();
  const { activeChat } = useChatContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnLivePage = location.pathname.startsWith("/live");

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
  const userLeftTimerRef = useRef(null);
  const isRefreshingRef = useRef(false);
  const isDowngradingToAudio = useRef(false);

  // Ref to always hold the latest activeCall so socket handlers never use stale closures
  const activeCallRef = useRef(activeCall);

  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  // Use context's isCallMinimized instead of local state
  const isMinimized = isCallMinimized;
  const setIsMinimized = setIsCallMinimized;
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRechargeButton, setShowRechargeButton] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isRemedyPanelOpen, setIsRemedyPanelOpen] = useState(false);
  const [suggestedRemedyData, setSuggestedRemedyData] = useState({ suggestedProducts: [], messages: [] });
  const [hasNewRemedy, setHasNewRemedy] = useState(false);
  const [showEndCallConfirm, setShowEndCallConfirm] = useState(false);

  const [getBalance] = useGetBalanceMutation();
  const { balance, isFetching, refreshWallet } = useWalletBalance();
  
  // Fetch kundli profiles
  const { data: profilesData } = useGetAllKundlisQuery();
  const profiles = profilesData?.data || [];

  /* ================= NETWORK RECONNECTION STATE ================= */
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const RECONNECT_GRACE_PERIOD = 30000; // 30 seconds to reconnect

  // Keep activeCallRef in sync so socket handlers always have current values
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  // Default avatar URL
  const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  /* ================= CHAT NOTIFICATION ================= */
  const [chatNotification, setChatNotification] = useState(null);
  const notificationTimerRef = useRef(null);

  const showChatNotification = useCallback((data) => {
    if (data.sender === "user") return;
    
    const messageText = data.type === "gift" ? "🎁 Sent a gift" : data.type === "products" ? "💊 Suggested a remedy" : (data.message || data.response || "New message");
    const astroImage = lastRequestedAstro?.imageUrl || lastRequestedAstro?.aadharCardImgUrl || lastRequestedAstro?.panCardImgUrl || null;
    const astroGender = lastRequestedAstro?.gender || null;
    setChatNotification({
      senderName: callerName || "Astrologer",
      message: messageText,
      image: astroImage,
      gender: astroGender,
      astrologerId: activeCall?.astrologerId,
    });

    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    notificationTimerRef.current = setTimeout(() => {
      setChatNotification(null);
    }, 4000);
  }, [callerName, lastRequestedAstro]);

  useEffect(() => {
    voiceSocket.on("message:recieved", showChatNotification);

    const handleProductMessage = (data) => {
      if (data?.type === "products" && data?.suggestedProducts?.length > 0) {
        setSuggestedRemedyData((prev) => ({
          suggestedProducts: [...prev.suggestedProducts, ...data.suggestedProducts],
          messages: data.message ? [...prev.messages, data.message] : prev.messages,
        }));
        setHasNewRemedy(true);
      }
    };
    voiceSocket.on("message:recieved", handleProductMessage);

    return () => {
      voiceSocket.off("message:recieved", showChatNotification);
      voiceSocket.off("message:recieved", handleProductMessage);
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    };
  }, [showChatNotification]);

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

  /* ================= PREVENT ACCIDENTAL REFRESH & DETECT REFRESH ================= */
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      isRefreshingRef.current = true;
      console.log("[VideoCall] 🔄 beforeunload fired — isRefreshing=true, roomId:", roomId);
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

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
    let didCancelStart = false;

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
          console.log("[VideoCall] 📡 user-published — uid:", user.uid, "mediaType:", mediaType);
          // Cancel any pending end-call grace timer — remote user is back
          if (userLeftTimerRef.current) {
            clearTimeout(userLeftTimerRef.current);
            userLeftTimerRef.current = null;
            console.log("[VideoCall] ✅ user-published: cancelled pending endCall grace timer");
          }

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
          console.log("[VideoCall] 📴 user-unpublished — uid:", user.uid, "mediaType:", mediaType);
          if (mediaType === "video") {
            setRemoteVideoEnabled(false);
          }
        });

        // Grace period so a page refresh doesn't kill the call
        client.on("user-left", (user) => {
          // Don't end call if we're downgrading to audio
          if (isDowngradingToAudio.current) return;

          console.log("[VideoCall] 👋 user-left — uid:", user.uid, "starting 15s grace timer");
          if (userLeftTimerRef.current) clearTimeout(userLeftTimerRef.current);
          userLeftTimerRef.current = setTimeout(() => {
            console.log("[VideoCall] ⏰ user-left grace timer expired — ending call");
            safeEndCall();
          }, 30000); // 30s grace period for rejoin
        });

        client.on("user-joined", (user) => {
          console.log("[VideoCall] 🤝 user-joined — uid:", user.uid);
          // User reconnected — cancel the pending end-call
          if (userLeftTimerRef.current) {
            clearTimeout(userLeftTimerRef.current);
            userLeftTimerRef.current = null;
            console.log("[VideoCall] ✅ user-joined: cancelled pending endCall grace timer");
          }
        });

        // On mobile Safari, camera/mic acquisition can take a few seconds during
        // audio -> video upgrades. Acquire both tracks first so we don't join the
        // video room and sit unpublished long enough for the remote side to end it.
        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        if (didCancelStart || cleanupRef.current || endCallRef.current) {
          micTrack.stop();
          micTrack.close();
          camTrack.stop();
          camTrack.close();
          return;
        }

        micTrackRef.current = micTrack;
        camTrackRef.current = camTrack;

        await client.join(APP_ID, roomId, agoraToken, null);
        console.log("[VideoCall] ✅ Agora joined — channel:", roomId);

        if (didCancelStart || cleanupRef.current || endCallRef.current) {
          await client.leave();
          return;
        }

        await client.publish([micTrackRef.current, camTrackRef.current]);

        setJoined(true);

        // Only set initial call seconds if not resuming from a refresh
        const savedSeconds = sessionStorage.getItem("shubhtalk_call_seconds");
        if (savedSeconds && Number(savedSeconds) > 0) {
          console.log("[VideoCall] 🔄 Resuming from refresh, seconds:", savedSeconds);
          setCallSeconds(Number(savedSeconds));
          sessionStorage.removeItem("shubhtalk_call_seconds");
        } else if (callSeconds > 0) {
          // callSeconds already set (e.g. from audio→video upgrade via CallContext)
          console.log("[VideoCall] 🔄 Using existing callSeconds from upgrade:", callSeconds);
        } else {
          const raw = activeCall.remainingTime || 0;
          const seconds = Math.floor(Number(raw) * 60);
          console.log("[VideoCall] 🆕 Fresh call — remainingTime:", raw, "→ seconds:", seconds);
          if (seconds > 0) {
            setCallSeconds(seconds);
          } else {
            console.log("[VideoCall] ⚠️ remainingTime is 0 — waiting for activity event");
          }
        }

        startTimer();
      } catch (err) {
        if (didCancelStart || cleanupRef.current || endCallRef.current) {
          return;
        }
        console.error("Call start error:", err);
        safeEndCall();
      }
    };

    start();

    // On unmount: only release Agora resources
    // Do NOT clear activeCall — if this is a refresh, we need it to persist
    return () => {
      console.log("[VideoCall] 🧹 useEffect cleanup (unmount) — isRefreshing:", isRefreshingRef.current, "isDowngrading:", isDowngradingToAudio.current);
      didCancelStart = true;
      cleanupRef.current = true;
      if (userLeftTimerRef.current) {
        clearTimeout(userLeftTimerRef.current);
        userLeftTimerRef.current = null;
      }
      try {
        micTrackRef.current?.stop();
        micTrackRef.current?.close();
        camTrackRef.current?.stop();
        camTrackRef.current?.close();
        clientRef.current?.leave();
        clientRef.current?.removeAllListeners();
      } catch (e) {
        console.warn("[VideoCall] Video unmount cleanup error:", e);
      }
      micTrackRef.current = null;
      camTrackRef.current = null;
      clientRef.current = null;
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
  const cleanup = async (skipEmit = false) => {
    if (cleanupRef.current) return;
    cleanupRef.current = true;

    if (userLeftTimerRef.current) {
      clearTimeout(userLeftTimerRef.current);
      userLeftTimerRef.current = null;
    }

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
      let persistedCallType = null;
      try {
        persistedCallType = JSON.parse(localStorage.getItem("shubhtalk_active_call") || "null")?.callType || null;
      } catch (err) {
        console.warn("[VideoCall] Failed to read persisted call state during cleanup:", err);
      }

      // Preserve activeCall during video -> audio switches even if the downgrade flag
      // hasn't propagated to this component before unmount cleanup runs.
      if (!skipEmit && activeCallRef.current?.callType !== "audio" && persistedCallType !== "audio") {
        setActiveCall(null);
      }
      stopTimer();
    }
  };

  /* ================= SAFE END CALL ================= */
  const safeEndCall = async () => {
    if (endCallRef.current) return;
    endCallRef.current = true;

    // Clear reconnection timer if user manually ends call
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsReconnecting(false);

    // Don't emit call:end if we're downgrading to audio
    if (!isDowngradingToAudio.current) {
      const currentCall = activeCallRef.current;
      console.log("[VideoCall] 🔚 safeEndCall — roomId:", roomId, "activeCall:", currentCall ? { astrologerID: currentCall.astrologerID, callerName: currentCall.callerName } : "null");

      setReviewData({
        astrologerID: currentCall?.astrologerID,
        fullName: currentCall?.callerName || callerName,
        roomId,
      });

      // Try to emit call:end - if socket is disconnected, it will be queued
      // and sent when reconnected, or we rely on server timeout
      if (voiceSocket.connected) {
        voiceSocket.emit("call:end", {
          roomId,
          endedBy: isUserSide ? "CUSTOMER" : "ASTROLOGER",
        });
      } else {
        console.log("[VideoCall] ⚠️ Socket disconnected, attempting to send call:end anyway");
        // Emit anyway - socket.io will queue it if reconnection happens
        voiceSocket.emit("call:end", {
          roomId,
          endedBy: isUserSide ? "CUSTOMER" : "ASTROLOGER",
        });
        
        // Also try to reconnect socket briefly to send the event
        if (!voiceSocket.connected) {
          voiceSocket.connect();
          // Give it a moment to connect and send
          setTimeout(() => {
            if (voiceSocket.connected) {
              console.log("[VideoCall] ✅ Socket reconnected, call:end should be sent");
            }
          }, 2000);
        }
      }

      // Refresh wallet balance after call ends
      refreshWallet();
      window.dispatchEvent(new Event("walletBalanceUpdated"));

      // Don't show review when this call was started from an ongoing chat.
      if (!hasOngoingChat()) {
        setOpenReview(true);
      }
    }
    
    await cleanup(isDowngradingToAudio.current);
  };

  // Gated end call — show confirmation only when this is the last active session
  const requestEndCall = () => {
    if (hasOngoingChat()) {
      safeEndCall();
    } else {
      setShowEndCallConfirm(true);
    }
  };

  const confirmEndCall = () => {
    setShowEndCallConfirm(false);
    safeEndCall();
  };

  /* ================= SOCKET ================= */
  useEffect(() => {
    const handleCallEnded = (data) => {
      if (data?.endedBy === "SYSTEM") {
        if (isDowngradingToAudio.current || cleanupRef.current || endCallRef.current) {
          return;
        }

        setIsReconnecting(true);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("[VideoCall] ⏰ SYSTEM reconnect grace period expired — ending call");
          Toast.error("Unable to reconnect. Call ended.");
          setIsReconnecting(false);
          safeEndCall();
        }, RECONNECT_GRACE_PERIOD);

        reconnectToCall?.(activeCallRef.current);
        return;
      }

      // Server already ended the call, don't emit call:end again
      if (endCallRef.current) return;
      endCallRef.current = true;

      if (!isDowngradingToAudio.current) {
        const currentCall = activeCallRef.current;
        console.log("[VideoCall] 📞 call:ended received — roomId:", roomId, "activeCall:", currentCall ? { astrologerID: currentCall.astrologerID, callerName: currentCall.callerName } : "null");

        setReviewData({
          astrologerID: currentCall?.astrologerID,
          fullName: currentCall?.callerName || callerName,
          roomId,
        });

        // Refresh wallet balance after call ends
        refreshWallet();
        window.dispatchEvent(new Event("walletBalanceUpdated"));

        // Don't show review when this call was started from an ongoing chat.
        if (!hasOngoingChat()) {
          setOpenReview(true);
        }
      }
      
      cleanup(isDowngradingToAudio.current);
    };

    const handleCallReconnected = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      setIsReconnecting(false);
    };

    const handleDisconnect = (reason) => {
      console.log("[VideoCall] 🔴 Socket disconnected — reason:", reason);
      
      // Don't start reconnection if we're downgrading to audio or intentionally ending
      if (isDowngradingToAudio.current || cleanupRef.current || endCallRef.current) {
        console.log("[VideoCall] Skipping reconnection (downgrading or cleanup in progress)");
        return;
      }
      
      // Show reconnecting state to user
      setIsReconnecting(true);
      // Toast.info("Connection lost. Attempting to reconnect...");
      
      // Start grace period timer - only end call if we can't reconnect in time
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("[VideoCall] ⏰ Reconnection grace period expired — ending call");
        Toast.error("Unable to reconnect. Call ended.");
        setIsReconnecting(false);
        safeEndCall();
      }, RECONNECT_GRACE_PERIOD);
    };

    // Handle socket reconnect - cancel the grace period timer
    const handleSocketReconnect = () => {
      console.log("[VideoCall] ✅ Socket reconnected");
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      setIsReconnecting(false);
      // Toast.success("Reconnected successfully!");
    };

    const handleWarning = (msg) => {
      if (msg?.message.includes("Low balance alert! Remaining time:")) {
        setShowRechargeButton(true);
      }
      Toast.warning(msg.message);
    };

    const handleCallRejected = (data) => {
      // Check if this is an audio switch rejection
      if (data?.switchRejected && data?.type === "video") {
        console.log("🔄 Audio switch rejected - resuming video call");
        
        // Reset the downgrade flag since we're staying in video mode
        isDowngradingToAudio.current = false;
        setWaitingList(null);
        
        Toast.info(data?.message || "Audio call request rejected. Continuing with video call.");
        return;
      }
      
      // Regular call rejection
      console.log("📞 Regular call rejection - ending call");
      safeEndCall();
    };

    voiceSocket.on("call:ended", handleCallEnded);
    voiceSocket.on("disconnect", handleDisconnect);
    voiceSocket.on("connect", handleSocketReconnect);
    voiceSocket.on("warning", handleWarning);
    voiceSocket.on("call:rejected", handleCallRejected);
    voiceSocket.on("call:reconnected", handleCallReconnected);

    return () => {
      voiceSocket.off("call:ended", handleCallEnded);
      voiceSocket.off("disconnect", handleDisconnect);
      voiceSocket.off("connect", handleSocketReconnect);
      voiceSocket.off("warning", handleWarning);
      voiceSocket.off("call:rejected", handleCallRejected);
      voiceSocket.off("call:reconnected", handleCallReconnected);
      
      // Clear reconnect timer on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, []);

  /* ================= DETECT CALL TYPE CHANGE (VIDEO -> AUDIO) ================= */
  useEffect(() => {
    const handleDowngradeEvent = (event) => {
      if (event.detail.roomId === roomId) {
        console.log("🔄 Received downgrade event, setting flag...");
        isDowngradingToAudio.current = true;
      }
    };

    window.addEventListener('call:downgrading-to-audio', handleDowngradeEvent);

    return () => {
      window.removeEventListener('call:downgrading-to-audio', handleDowngradeEvent);
    };
  }, [roomId]);

  // Detect via activeCall change - catches any case where callType changes to audio
  useEffect(() => {
    if (activeCall && activeCall.callType === "audio" && activeCall.roomId === roomId) {
      console.log("🔄 Detected activeCall changed to audio, setting downgrade flag...");
      isDowngradingToAudio.current = true;
      setWaitingList(null);
    }
  }, [activeCall, roomId]);

  /* ================= SWITCH TO AUDIO ================= */
  const switchToAudio = () => {
    Toast.success("Switching to audio call...");
    setWaitingList(5);

    voiceSocket.emit("call:initiate", {
      userId: activeCall.userId,
      astrologerId: activeCall.astrologerId,
      type: "audio",
      isSwitch: true,
      roomId: roomId,
      ...(activeCall?.isEmergency && { isEmergency: true }),
    });
  };

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

  const hasOngoingChat = () => {
    if (activeChat?.roomId) return true;

    try {
      return !!JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "null")?.roomId;
    } catch (err) {
      console.warn("[VideoCall] Failed to read persisted chat state:", err);
      return false;
    }
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
        roomId: activeCall.roomId,
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
          display: isMinimized && !isOnLivePage ? "block" : "none",
          transform: 'scaleX(-1)'
        }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        <div className={styles.miniHeader}>
          <span>
            {capitalizeWords(callerName) || "Video Call"} • {formatTime(callSeconds)}
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
          <button className={styles.endBtnMini} onClick={requestEndCall}>
            ✕
          </button>
        </div>
      </div>

      {/* FULL VIEW */}
      <div
        className={styles.videoContainer}
        style={{ display: isMinimized ? "none" : undefined }}
      >
        {/* Chat Notification Banner */}
        {chatNotification && (
          <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 99999, width: 'fit-content', maxWidth: '90vw' }}>
            <ChatNotificationBanner
              senderName={chatNotification.senderName}
              message={chatNotification.message}
              imageUrl={chatNotification.image}
              gender={chatNotification.gender}
              onClose={() => setChatNotification(null)}
              onClick={() => {
                setChatNotification(null);
                setIsMinimized(true);
                navigate(`/chat-with-astrologers/${chatNotification.astrologerId}`, {
                  state: {
                    userId: activeCall?.userId,
                    astrologerId: activeCall?.astrologerId,
                    roomId: activeCall?.roomId,
                    fullName: callerName,
                    isUserSide: activeCall?.isUserSide,
                    kundliId: activeCall?.kundliId,
                    astrologerName: callerName,
                    astroID: activeCall?.astrologerID,
                  }
                });
              }}
            />
          </div>
        )}
        {!joined ? (
          <div className={styles.waitingText}>Connecting…</div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.headerWrap}>
              <div className={styles.header}>
              <button
                className={styles.backBtn}
                onClick={() => setIsMinimized(true)}
              >
                <IoArrowBack size={24} />
              </button>

              <div className={styles.astrologerInfo}>
                <h3 className={styles.astrologerName}>{capitalizeWords(callerName)}</h3>
                <p className={styles.astrologerExp}>
                  {lastRequestedAstro?.role 
                    ? lastRequestedAstro.role.charAt(0).toUpperCase() + lastRequestedAstro.role.slice(1).toLowerCase()
                    : "Astrologer"} • Exp. {lastRequestedAstro?.experience || "0"} Years
                </p>
              </div>


              <div className={styles.groupBtns}>
                <button 
                  className={styles.chateM}
                  onClick={handleNavigateToChat}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <path d="M15 0H1.66667C0.75 0 0.00833333 0.75 0.00833333 1.66667L0 16.6667L3.33333 13.3333H15C15.9167 13.3333 16.6667 12.5833 16.6667 11.6667V1.66667C16.6667 0.75 15.9167 0 15 0ZM4.16667 5.83333H12.5C12.9583 5.83333 13.3333 6.20833 13.3333 6.66667C13.3333 7.125 12.9583 7.5 12.5 7.5H4.16667C3.70833 7.5 3.33333 7.125 3.33333 6.66667C3.33333 6.20833 3.70833 5.83333 4.16667 5.83333ZM9.16667 10H4.16667C3.70833 10 3.33333 9.625 3.33333 9.16667C3.33333 8.70833 3.70833 8.33333 4.16667 8.33333H9.16667C9.625 8.33333 10 8.70833 10 9.16667C10 9.625 9.625 10 9.16667 10ZM12.5 5H4.16667C3.70833 5 3.33333 4.625 3.33333 4.16667C3.33333 3.70833 3.70833 3.33333 4.16667 3.33333H12.5C12.9583 3.33333 13.3333 3.70833 13.3333 4.16667C13.3333 4.625 12.9583 5 12.5 5Z" fill="url(#paint0_linear_8989_297)"/>
                    <defs>
                      <linearGradient id="paint0_linear_8989_297" x1="0" y1="8.33333" x2="16.6667" y2="8.33333" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#F75801"/>
                        <stop offset="1" stop-color="#D43400"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  Chat
                </button>
  
                <button 
                  className={styles.chateM}
                  onClick={switchToAudio}
                >
                  <img src={CallIcon} alt="audio" width="17" height="17" />
                  Audio
                </button>
  
                <span class={styles.dividerLine}></span>
              </div>
  
              <div className={styles.groupBtnsRight}>
                <div class={styles.callTimerBottom}>Call Ends in <span class={styles.timerRed}>{formatTime(callSeconds)}</span></div>
  
                <button className={styles.chateEnd} onClick={requestEndCall}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <g clip-path="url(#clip0_8989_310)">
                      <path d="M7.11979 8.87333C7.79636 9.5505 8.56101 10.1335 9.39313 10.6067L10.2398 9.76C10.4211 9.58076 10.6499 9.45723 10.8992 9.40406C11.1485 9.35089 11.4078 9.3703 11.6465 9.46C12.2513 9.6857 12.8797 9.84225 13.5198 9.92667C13.8402 9.97195 14.1331 10.1322 14.3441 10.3775C14.5551 10.6228 14.6696 10.9365 14.6665 11.26V13.26C14.6672 13.4457 14.6292 13.6294 14.5548 13.7996C14.4804 13.9697 14.3713 14.1224 14.2345 14.2479C14.0977 14.3734 13.9362 14.469 13.7603 14.5285C13.5844 14.588 13.398 14.61 13.2131 14.5933C11.1617 14.3704 9.19113 13.6694 7.45979 12.5467C6.65664 12.0367 5.91214 11.4398 5.23979 10.7667M3.45979 8.54C2.33703 6.80867 1.63603 4.83811 1.41313 2.78667C1.39647 2.60231 1.41838 2.41651 1.47746 2.24108C1.53654 2.06566 1.63151 1.90446 1.7563 1.76775C1.8811 1.63103 2.033 1.5218 2.20232 1.44701C2.37164 1.37222 2.55469 1.33351 2.73979 1.33333H4.73979C5.06333 1.33015 5.37699 1.44472 5.6223 1.65569C5.86761 1.86666 6.02784 2.15963 6.07313 2.48C6.15754 3.12004 6.31409 3.74848 6.53979 4.35333C6.62949 4.59195 6.6489 4.85127 6.59573 5.10059C6.54256 5.3499 6.41903 5.57874 6.23979 5.76L5.39313 6.60667" stroke="white" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M14.6668 1.33333L1.3335 14.6667" stroke="white" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_8989_310">
                        <rect width="16" height="16" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>
                  End
                </button>
  
                <span class={styles.dividerLine}></span>
  
                {showRechargeButton && (
                  <button 
                    className={styles.rechargeButton}
                    onClick={() => {
                      setIsMinimized(true);
                      setIsRechargeModalOpen(true);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34" fill="none">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M5 0C2.23858 0 0 2.23858 0 5V28.3333C0 31.0948 2.23858 33.3333 5 33.3333H28.3333C31.0948 33.3333 33.3333 31.0948 33.3333 28.3333V11.6667C33.3333 9.48964 31.942 7.63757 30 6.95118V5C30 2.23858 27.7614 0 25 0H5ZM5 3.33333C4.07953 3.33333 3.33333 4.07953 3.33333 5C3.33333 5.92048 4.07953 6.66667 5 6.66667H26.6667V5C26.6667 4.07953 25.9205 3.33333 25 3.33333H5ZM25 16.6667C23.1591 16.6667 21.6667 18.1591 21.6667 20C21.6667 21.841 23.1591 23.3333 25 23.3333H28.3333C29.2538 23.3333 30 22.5871 30 21.6667V18.3333C30 17.4129 29.2538 16.6667 28.3333 16.6667H25Z" fill="url(#paint0_linear_10676_8474)"/>
                      <defs>
                        <linearGradient id="paint0_linear_10676_8474" x1="0" y1="16.6667" x2="33.3333" y2="16.6667" gradientUnits="userSpaceOnUse">
                          <stop stop-color="#F75801"/>
                          <stop offset="1" stop-color="#D43400"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </button>
                )}

              {/* <div className={styles.walletBadge}>
                <span className={styles.walletIcon}>💰</span>
                <span className={styles.walletAmount}>₹20</span>
              </div> */}
            </div>
            </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button className={styles.actionBtn} onClick={toggleChat}>
                {/* <IoAttach size={16} /> */}
                <span>Virtual Assistant</span>
              </button>
              <button
                className={styles.actionBtn}
                onClick={() => {
                  setIsRemedyPanelOpen(true);
                  setHasNewRemedy(false);
                }}
                style={{ position: 'relative' }}
              >
                {/* <IoSparkles size={16} /> */}
                <span>Suggested Remedy</span>
                {hasNewRemedy && <span className={styles.notificationDot} />}
              </button>
              <button
                className={styles.actionBtn}
                onClick={() => {
                  setIsMinimized(true);
                  navigate("/profile", { state: { activeTab: "Order History", orderHistoryTab: "call" } });
                }}
              >
                {/* <IoTime size={16} /> */}
                <span>View History</span>
              </button>
            </div>

            {/* Video Area */}
            <div className={styles.videoWrapper}>
              {/* Remote Video Container - Always rendered */}
              <div ref={remoteVideoRef} className={styles.remoteVideoArea} style={{ transform: 'scaleX(-1)' }}/>

              {/* Avatar Overlay - Separate layer */}
              {!remoteVideoEnabled && (
                <div className={styles.avatarOverlay}>
                  <img
                    src={DEFAULT_AVATAR}
                    alt={callerName}
                    className={styles.avatarImage}
                  />
                  <p className={styles.avatarName}>{capitalizeWords(callerName)}</p>
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
                  <span className={styles.localVideoName}>{capitalizeWords(customerName)}</span>
                  <span className={styles.localVideoRole}>{capitalizeWords(user?.role || "Customer")}</span>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className={styles.bottomControls}>
              {/* Control Buttons Grid */}
              <div className={styles.controlGrid}>
                {/* <div className={styles.controlItem}>
                  <button
                    className={styles.controlBtn}
                    onClick={handleSwitchProfile}
                  >
                    <IoSwapHorizontal size={24} />
                  </button>
                  <span className={styles.controlLabel}>Switch Profile</span>
                </div> */}

                {/* <div className={styles.controlItem}>
                  <button
                    className={styles.controlBtn}
                    onClick={() => handleRedirection("/aiwow")}
                  >
                    <IoSparkles size={24} />
                  </button>
                  <span className={styles.controlLabel}>AI Wow</span>
                </div> */}

                {showRechargeButton && (
                  <button className={styles.rechargeNowBtn} 
                    onClick={() => {
                      setIsMinimized(true);
                      setIsRechargeModalOpen(true);
                    }} >Recharge Now
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="15" viewBox="0 0 8 15" fill="none">
                      <path d="M0.75 13.95L6.18333 8.51667C6.825 7.875 6.825 6.825 6.18333 6.18333L0.75 0.75" stroke="#FEFEFE" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                )}

                <div className={`${styles.controlItem} ${styles.giftWrapMain}`}>
                  <button
                    className={`${styles.controlBtn} ${styles.sendGiftBg}`}
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
                    onClick={requestEndCall}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M19.23 15.26L16.69 14.97C16.08 14.9 15.48 15.11 15.05 15.54L13.21 17.38C10.38 15.94 8.06004 13.63 6.62004 10.79L8.47004 8.94001C8.90004 8.51001 9.11004 7.91001 9.04004 7.30001L8.75004 4.78001C8.63004 3.77001 7.78004 3.01001 6.76004 3.01001H5.03004C3.90004 3.01001 2.96004 3.95001 3.03004 5.08001C3.56004 13.62 10.39 20.44 18.92 20.97C20.05 21.04 20.99 20.1 20.99 18.97V17.24C21 16.23 20.24 15.38 19.23 15.26Z" fill="currentColor" />
                    </svg>
                  </button>
                  <span className={styles.controlLabel}>End Call</span>
                </div>

                {/* <div className={styles.controlItem}>
                  <button
                    className={styles.controlBtn}
                    onClick={() => setCameraOn((p) => !p)}
                  >
                    {cameraOn ? <IoCall size={24} /> : <IoVideocam size={24} />}
                  </button>
                  <span className={styles.controlLabel}>
                    {cameraOn ? "Switch to Audio" : "Switch to Video"}
                  </span>
                </div> */}

                {/* <div className={styles.controlItem}>
                  <button
                    className={styles.controlBtn}
                    onClick={handleNavigateToChat}
                  >
                    <IoChatbubbleEllipses size={24} />
                  </button>
                  <span className={styles.controlLabel}>Chat</span>
                </div> */}

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
              {/* <div className={styles.bottomBar}>
                <div className={styles.callTimer}>
                  Call Ends in <span className={styles.timerRed}>{formatTime(callSeconds)}</span>
                </div>
                {showRechargeButton && (
                  <button className={styles.rechargeBtn} onClick={() => handleRedirection("/recharge")}>Recharge Now</button>
                )}
              </div> */}
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

        {/* Suggested Remedy Panel */}
        <SuggestedRemedyPanel
          isOpen={isRemedyPanelOpen}
          onClose={() => setIsRemedyPanelOpen(false)}
          remedyData={suggestedRemedyData}
          onProductClick={() => {
            setIsRemedyPanelOpen(false);
            setIsMinimized(true);
          }}
        />

        {/* Gift Modal */}
        <GiftModal
          isOpen={isGiftModalOpen}
          onClose={() => setIsGiftModalOpen(false)}
          astrologerId={activeCall?.astrologerId}
          astrologerName={callerName}
          roomId={activeCall?.roomId}
          userId={activeCall?.userId}
          socketSendFn={(message, type) => {
            if (!voiceSocket.connected) {
              return { error: "Socket not connected" };
            }
            voiceSocket.emit("chat:message", {
              sender: "user",
              kundliId: effectiveKundliId,
              roomId: activeCall?.roomId,
              userId: activeCall?.userId,
              astrologerId: activeCall?.astrologerId,
              message,
              type
            });
            return { success: true };
          }}
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

        {/* Recharge Modal */}
        <RechargeModal
          isOpen={isRechargeModalOpen}
          onClose={() => setIsRechargeModalOpen(false)}
          onSuccess={(paymentData) => {
            console.log('Payment successful in video call:', paymentData);
            refreshWallet();
          }}
          title="Recharge to Continue Call"
        />

        {/* Reconnection Overlay */}
        {isReconnecting && (
          <div className={styles.reconnectOverlay}>
            <div className={styles.reconnectModal}>
              <div className={styles.reconnectSpinner}>
                <svg viewBox="0 0 50 50" className={styles.spinnerSvg}>
                  <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="4"
                  />
                  <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="url(#reconnectGradientVideo)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="80, 200"
                    className={styles.spinnerCircle}
                  />
                  <defs>
                    <linearGradient id="reconnectGradientVideo" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F75801" />
                      <stop offset="100%" stopColor="#D43400" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3 className={styles.reconnectTitle}>Connection lost...</h3>
              <p className={styles.reconnectText}>
                Please wait while we restore your connection...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* End Call Confirmation Modal */}
      {showEndCallConfirm && (
        <div className={styles.endCallConfirmOverlay} onClick={() => setShowEndCallConfirm(false)}>
          <div className={styles.endCallConfirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.endCallConfirmTitle}>End Video Call?</h3>
            <p className={styles.endCallConfirmText}>
              Are you sure you want to end this call with {callerName || "the astrologer"}?
            </p>
            <div className={styles.endCallConfirmActions}>
              <button className={styles.endCallBtnCancel} onClick={() => setShowEndCallConfirm(false)}>
                Continue
              </button>
              <button className={styles.endCallBtnConfirm} onClick={confirmEndCall}>
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoCalling;
