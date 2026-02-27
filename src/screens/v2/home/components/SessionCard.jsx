import { Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "../Home.module.scss";
import {
  getAstrologerDefaultImage,
  AppIcons,
} from "../../../../utils/appImages";

const SessionCard = ({ session, onCallAgain, isLoading }) => {
  // Format date from startTime
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  // Format time from startTime
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format duration from billedMinutes
  const formatDuration = (minutes) => {
    if (!minutes) return "0 Min 0 Secs";
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins} Min ${secs} Secs`;
  };

  const handleButtonClick = (e,astrologer, connectionType) => {
    e.preventDefault();
    e.stopPropagation();
    onCallAgain(astrologer, connectionType);
  };

  return (
    <div className={styles.sessionCard}>
      <Link
        to={`/astrologer/${session.astrologerId}`}
        className={styles.sessionCardLink}
      >
        <div className={styles.sessionImageWrapper}>
          <img
            src={
              session.astrologerImage ||
              getAstrologerDefaultImage(session.astrologerGender)
            }
            alt={session.astrologerName}
            className={styles.sessionImage}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      </Link>
      <div className={styles.sessionInfo}>
        <Link
          to={`/astrologer/${session.astrologerId}`}
          className={styles.sessionNameLink}
        >
          <h3 className={styles.sessionName}>{session.astrologerName}</h3>
        </Link>
        <div className={styles.sessionDateTime}>
          <div className={styles.sessionDetail}>
            <Calendar size={16} className={styles.sessionIconSvg} />
            <span className={styles.sessionText}>
              {formatDate(session.startTime)}
            </span>
          </div>
          <div className={styles.sessionDetail}>
            <Clock size={16} className={styles.sessionIconSvg} />
            <span className={styles.sessionText}>
              {formatTime(session.startTime)}
            </span>
          </div>
        </div>
        <p className={styles.sessionDuration}>
          Duration : {formatDuration(session.billedMinutes)}
        </p>
        <div className={styles.sessionActionButtons}>
          <div className={styles.sessionButtonWrapper}>
            <button
              className={styles.sessionChatBtn}
              onClick={(e) => handleButtonClick(e,session, "chat")}
              disabled={isLoading}
            >
              <img src={AppIcons.ChatMinutesIcon} alt="chat" /> Chat
            </button>
            <p className={styles.sessionPriceText}>
              <span className={styles.sessionPriceAmount}>₹{session.astrologer?.price?.chatRate?.amount || session.chatRate || 0}</span>/min
            </p>
          </div>
          <div className={styles.sessionButtonWrapper}>
            <button
              className={styles.sessionCallBtn}
              onClick={(e) => handleButtonClick(e,session, "call")}
              disabled={isLoading}
            >
              <img src={AppIcons.CallMinutesIcon} alt="call" /> Call
            </button>
            <p className={styles.sessionPriceText}>
              <span className={styles.sessionPriceAmount}>₹{session.astrologer?.price?.audioRate?.amount || session.callRate || 0}</span>/min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
