// AstrologerCallUI.jsx
import React, { useEffect, useState } from "react";
import styles from "./AstrologerCallUI.module.scss";
import { appColors } from "../../../../../utils/theme";
import { AppIcons } from "../../../../../utils/appImages";
import PrimaryText from "../../../../../component/PrimaryText";
import PrimaryButton from "../../../../../component/PrimaryButton";
import { MdCallEnd, MdVolumeUp, MdVolumeOff, MdMicOff, MdMic } from "react-icons/md";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { getAstrologerDisplayName } from "../../../../../utils/helper/string.utils";

const AstrologerCallUI = ({ astrologer, onEndCall }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [callStatus, setCallStatus] = useState("Connecting..."); // "Ringing", "Connected"

  // Simple timer
  useEffect(() => {
    // yahan pe tum Agora ke 'on("user-published")' ya 'on("join-channel-success")'
    // ke basis pe status update kar sakta hai
    const statusTimeout = setTimeout(() => {
      setCallStatus("Connected");
    }, 2000);

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(statusTimeout);
    };
  }, []);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleToggleMute = () => {
    // yahan Agora mic mute/unmute logic call karna
    setIsMuted((prev) => !prev);
  };

  const handleToggleSpeaker = () => {
    // mobile app me speaker toggle karte, web me visual feedback hi sahi hai
    setSpeakerOn((prev) => !prev);
  };

  const handleEnd = () => {
    // yahan Agora leave() call karna
    onEndCall?.();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.blurLayer} />
      <div className={styles.callCard}>
        <div className={styles.header}>
          <PrimaryText size_12 color={appColors.greyLight}>
            Audio Call
          </PrimaryText>
          <div className={styles.statusBadge}>
            <span className={styles.pulseDot} />
            <span>{callStatus}</span>
          </div>
        </div>

        <div className={styles.centerSection}>
          <div className={styles.rippleWrapper}>
            <div className={styles.rippleCircle} />
            <div className={styles.rippleCircle} />
            <div className={styles.rippleCircle} />
            <div className={styles.avatarBorder}>
              <img
                src={astrologer?.imageUrl}
                alt={astrologer?.firstName}
                className={styles.avatar}
              />
            </div>
          </div>

          <div className={styles.nameBlock}>
            <PrimaryText size_18 isExtraBold>
              {getAstrologerDisplayName(astrologer)}
            </PrimaryText>
            <PrimaryText size_12 color={appColors.greyMedium}>
              {astrologer?.specialties?.length
                ? astrologer.specialties.join(" • ")
                : astrologer?.role || "Vedic Astrologer"}
            </PrimaryText>
          </div>

          <div className={styles.timerRow}>
            <PrimaryText size_14 isSemiBold>
              {callStatus === "Connected" ? formatTime(seconds) : callStatus}
            </PrimaryText>
          </div>

          <div className={styles.infoChipsRow}>
            {astrologer?.languagePreference?.length > 0 && (
              <div className={styles.chip}>
                <img
                  src={AppIcons.Lang}
                  alt="Lang"
                  className={styles.chipIcon}
                />
                <span>{astrologer.languagePreference.join(", ")}</span>
              </div>
            )}

            {astrologer?.experience && (
              <div className={styles.chip}>
                <img
                  src={AppIcons.Education}
                  alt="Exp"
                  className={styles.chipIcon}
                />
                <span>{astrologer.experience} Years Exp.</span>
              </div>
            )}

            {astrologer?.PhoneCharge?.Value && (
              <div className={styles.chip}>
                <span>₹{astrologer.PhoneCharge.Value}/min</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.controlsSection}>
          <div className={styles.secondaryControls}>
            <button
              className={`${styles.controlCircle} ${
                isMuted ? styles.controlActive : ""
              }`}
              onClick={handleToggleMute}
            >
              {isMuted ? <MdMicOff size={22} /> : <MdMic size={22} />}
            </button>

            <button
              className={`${styles.controlCircle} ${
                speakerOn ? styles.controlActive : ""
              }`}
              onClick={handleToggleSpeaker}
            >
              {speakerOn ? <MdVolumeUp size={22} /> : <MdVolumeOff size={22} />}
            </button>

            <button className={styles.controlCircle}>
              <IoChatbubbleEllipsesOutline size={22} />
            </button>
          </div>

          <div className={styles.endCallWrapper}>
            <button className={styles.endCallButton} onClick={handleEnd}>
              <MdCallEnd size={26} />
            </button>
            <PrimaryText size_12 color={appColors.greyLight}>
              Tap to end call
            </PrimaryText>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AstrologerCallUI;
