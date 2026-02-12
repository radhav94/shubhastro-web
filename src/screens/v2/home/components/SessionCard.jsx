import { Calendar, Clock, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import astrologerSquare from "../../../../assets/images/astrologer-square.svg";
import styles from "../Home.module.scss";
import { DefaultImages } from "../../../../utils/appImages";

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

  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onCallAgain();
  };

  return (
    <Link
      to={`/astrologer/${session.astrologerId}`}
      className={styles.sessionCard}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className={styles.sessionImageWrapper}>
        <img
          src={session.astrologerImage || DefaultImages.AstrologerDefaultImg}
          alt={session.astrologerName}
          className={styles.sessionImage}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>
      <div className={styles.sessionInfo}>
        <h3 className={styles.sessionName}>{session.astrologerName}</h3>
        <div className={styles.sessionDetails}>
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
        <button
          className={`${styles.callAgainBtn} ${isLoading ? styles.loading : ""}`}
          onClick={handleButtonClick}
          disabled={isLoading}
        >
          <Phone size={18} />
          Connect now
        </button>
      </div>
    </Link>
  );
};

export default SessionCard;
