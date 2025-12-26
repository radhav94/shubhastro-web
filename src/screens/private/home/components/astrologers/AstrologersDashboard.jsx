import React, { useState, useEffect } from "react";
import styles from "./AstrologersDashboard.module.scss";
import PrimaryText from "../../../../../component/PrimaryText";
import { useNavigate } from "react-router-dom";
import ChatList from "./atrologerchat/ChatList";
import { PATH } from "../../../../../utils/routes/Paths";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import { useCall } from "../../../../../context/CallContext";
import CallHistoryTab from "./CallHistoryTab";

const AstrologersDashboard = () => {
  const { setActiveCall, waitingList, setWaitingList } = useCall();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const astroIdLocal = localStorage.getItem("shubhtalk_astro_id");
  const [incomingCall, setIncomingCall] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [incomingVideoCall, setIncomingVideoCall] = useState(false);
  const [callerUserId, setCallerUserId] = useState(null);
  const [token, setToken] = useState("");
  // const [waitingList, setWaitingList] = useState([]);

  useEffect(() => {
    if (!voiceSocket.connected) {
      voiceSocket.io.opts.query = {
        astrologerId: astroIdLocal,
        role: "ASTROLOGER",
      };

      voiceSocket.connect();
    }

    const handleIncomingVoiceCall = (data) => {
      const { roomId, agoraToken, callerId } = data || {};
      console.log("Incoming call", roomId, data);
      setRoomId(roomId);
      setCallerUserId(callerId);
      setToken(agoraToken);
      if (data?.type === "video") {
        setIncomingVideoCall(true);
        setIncomingCall(false);
      } else {
        setIncomingCall(true);
        setIncomingVideoCall(false);
      }
    };

    const handleCanceledCall = (data) => {
      console.log("Call canceled by user", data);

      setIncomingCall(false);
      setIncomingVideoCall(false);

      // ✅ reset call state
      setRoomId(null);
      setCallerUserId(null);
      setToken("");
    };

    const handleWaitingList = (data) => {
      const normalizedList = (data.list || []).map((call) => ({
        ...call,

        // ✅ Extract correct caller info
        callerId: call.userId,
        callerName:
          call.user?.customer?.name ||
          call.user?.customer?.fullName ||
          call.userId,

        agoraToken: call.agoraToken,
      }));

      setWaitingList(normalizedList);
    };

    voiceSocket.on("incoming_call", handleIncomingVoiceCall);
    voiceSocket.on("waiting_list", handleWaitingList);
    voiceSocket.on("call_canceled", handleCanceledCall);

    return () => {
      voiceSocket.off("incoming_call", handleIncomingVoiceCall);
      voiceSocket.off("call_canceled", handleCanceledCall);
      voiceSocket.off("waiting_list", handleWaitingList);
    };
  }, []);

  const handleAccept = () => {
    if (!roomId) return;

    voiceSocket.emit("accept_call", {
      roomId,
      token,
      channelName: roomId,
      astrologerId: astroIdLocal,
    });

    setIncomingCall(false);
    setIncomingVideoCall(false);

    setActiveCall({
      roomId,
      agoraToken: token,
      callerName: callerUserId,
      isUserSide: false,
      callType: "audio",
    });
  };

  const handleReject = () => {
    if (!roomId) return;

    voiceSocket.emit("reject_call", { roomId });
    setIncomingCall(false);
    setIncomingVideoCall(false);
  };

  const handleVideoAccept = () => {
    if (!roomId) return;

    voiceSocket.emit("accept_call", {
      roomId,
      token,
      channelName: roomId,
      astrologerId: astroIdLocal,
    });

    setIncomingCall(false);
    setIncomingVideoCall(false);

    setActiveCall({
      roomId,
      agoraToken: token,
      callerName: callerUserId,
      isUserSide: false,
      callType: "video",
    });
  };

  const handleVideoReject = () => {
    if (!roomId) return;

    voiceSocket.emit("reject_call", { roomId });
    setIncomingVideoCall(false);
    setIncomingCall(false);
  };

  const DashboardTab = (
    <div className={styles.content}>
      {/* Stats Cards */}
      <div className={styles.cardsRow}>
        <div className={styles.card}>
          <PrimaryText size_14 color="#777">
            Today's Earnings
          </PrimaryText>
          <PrimaryText size_28 isBold>
            ₹2,450
          </PrimaryText>
        </div>
        <div className={styles.card}>
          <PrimaryText size_14 color="#777">
            This Week
          </PrimaryText>
          <PrimaryText size_28 isBold>
            ₹12,780
          </PrimaryText>
        </div>
        <div className={styles.card}>
          <PrimaryText size_14 color="#777">
            Total Calls Today
          </PrimaryText>
          <PrimaryText size_28 isBold>
            18
          </PrimaryText>
        </div>
        <div className={styles.card}>
          <PrimaryText size_14 color="#777">
            Rating
          </PrimaryText>
          <PrimaryText size_28 isBold>
            4.9 ⭐
          </PrimaryText>
        </div>
      </div>

      {/* 📞 Incoming Call Modal */}
      {incomingCall && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <PrimaryText size_18 isSemiBold>
              📞 Incoming Call…
            </PrimaryText>

            <div className={styles.modalButtons}>
              <button className={styles.acceptBtn} onClick={handleAccept}>
                Accept
              </button>
              <button className={styles.rejectBtn} onClick={handleReject}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {incomingVideoCall && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <PrimaryText size_18 isSemiBold>
              📹 Incoming Video Call
            </PrimaryText>

            <div className={styles.modalButtons}>
              <button className={styles.acceptBtn} onClick={handleVideoAccept}>
                Accept
              </button>
              <button className={styles.rejectBtn} onClick={handleVideoReject}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right panels */}
      <div className={styles.panels}>
        <div className={styles.panel}>
          <PrimaryText size_18 isSemiBold>
            Profile Completion
          </PrimaryText>
          <div className={styles.progressBar}>
            <div className={styles.progress} style={{ width: "85%" }}></div>
          </div>
          <PrimaryText size_14 color="#666">
            Your astrologer profile is 85% complete.
          </PrimaryText>
        </div>

        <div className={styles.panel}>
          <PrimaryText size_18 isSemiBold>
            Recent Calls
          </PrimaryText>
          <ul className={styles.callList}>
            <li>
              <PrimaryText>Rahul • 10 mins</PrimaryText>
              <PrimaryText isSemiBold>₹250</PrimaryText>
            </li>
            <li>
              <PrimaryText>Priya • 22 mins</PrimaryText>
              <PrimaryText isSemiBold>₹480</PrimaryText>
            </li>
            <li>
              <PrimaryText>Manish • 5 mins</PrimaryText>
              <PrimaryText isSemiBold>₹110</PrimaryText>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      {/* ONLINE TOGGLE */}
      <div className={styles.topNav}>
        <PrimaryText size_16 isSemiBold>
          Online:
        </PrimaryText>

        <label className={styles.switch}>
          <input type="checkbox" defaultChecked />
          <span className={styles.slider}></span>
        </label>
      </div>

      {/* ⭐ CUSTOM TAB BAR */}
      <div className={styles.tabBar}>
        <div
          className={`${styles.tabItem} ${
            activeTab === "dashboard" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </div>

        <div
          className={`${styles.tabItem} ${
            activeTab === "history" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("history")}
        >
          Call History
        </div>

        <div
          className={styles.tabItem}
          onClick={() =>
            navigate(PATH.privateRoutes.ASTROLOGER_CHAT_USER_LIST.path)
          }
        >
          Chat
        </div>

        <div
          className={styles.tabItem}
          onClick={() => navigate("/astrologer-dashboard/live-streaming")}
        >
          Live Stream
        </div>
      </div>

      {/* ⭐ CONTENT AREA */}
      {activeTab === "dashboard" && DashboardTab}
      {activeTab === "history" && <CallHistoryTab />}
    </div>
  );
};

export default AstrologersDashboard;
