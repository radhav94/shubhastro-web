import React, { useState } from "react";
import styles from "./AstrologersDashboard.module.scss";
import PrimaryText from "../../../../../component/PrimaryText";
import { useNavigate } from "react-router-dom";
import ChatList from "./atrologerchat/ChatList";
import { PATH } from "../../../../../utils/routes/Paths";

const AstrologersDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const DashboardTab = (
    <div className={styles.content}>
      {/* Stats Cards */}
      <div className={styles.cardsRow}>
        <div className={styles.card}>
          <PrimaryText size_14 color="#777">Today's Earnings</PrimaryText>
          <PrimaryText size_28 isBold>₹2,450</PrimaryText>
        </div>

        <div className={styles.card}>
          <PrimaryText size_14 color="#777">This Week</PrimaryText>
          <PrimaryText size_28 isBold>₹12,780</PrimaryText>
        </div>

        <div className={styles.card}>
          <PrimaryText size_14 color="#777">Total Calls Today</PrimaryText>
          <PrimaryText size_28 isBold>18</PrimaryText>
        </div>

        <div className={styles.card}>
          <PrimaryText size_14 color="#777">Rating</PrimaryText>
          <PrimaryText size_28 isBold>4.9 ⭐</PrimaryText>
        </div>
      </div>

      {/* Panels */}
      <div className={styles.panels}>
        <div className={styles.panel}>
          <PrimaryText size_18 isSemiBold>Profile Completion</PrimaryText>
          <div className={styles.progressBar}>
            <div className={styles.progress} style={{ width: "85%" }}></div>
          </div>
          <PrimaryText size_14 color="#666">Your astrologer profile is 85% complete.</PrimaryText>
        </div>

        <div className={styles.panel}>
          <PrimaryText size_18 isSemiBold>Recent Calls</PrimaryText>
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

  const CallHistoryTab = (
    <div className={styles.placeholder}>
      <PrimaryText size_20 isSemiBold>Call history will appear here.</PrimaryText>
    </div>
  );

  return (
    <div className={styles.wrapper}>

      {/* ONLINE TOGGLE */}
      <div className={styles.topNav}>
        <PrimaryText size_16 isSemiBold>Online:</PrimaryText>

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
          onClick={() => navigate(PATH.privateRoutes.ASTROLOGER_CHAT_USER_LIST.path)} 
        >
          Chat
        </div>
         <div
          className={styles.tabItem}
          onClick={() => navigate(PATH.privateRoutes.ASTROLOGER_CALL_WINDOW.path)}  
        >
          Call
        </div>

      </div>

      {/* ⭐ CONTENT AREA */}
      {activeTab === "dashboard" && DashboardTab}
      {activeTab === "history" && CallHistoryTab}

    </div>
  );
};

export default AstrologersDashboard;
