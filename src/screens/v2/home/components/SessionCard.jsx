import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "../Home.module.scss";
import {
  getAstrologerDefaultImage,
  AppIcons,
} from "../../../../utils/appImages";
import EmergencySessionModal from "../../../../component/UI/modal/EmergencySessionModal/EmergencySessionModal";
import { useGetAstrologerByIdQuery } from "../../../../redux/api/astrologer/astrologerApi";

const SessionCard = ({ session, onCallAgain, isLoading }) => {
  const isOnline = session?.isActive === true;
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Fetch full astrologer details for emergency pricing
  const { data: astroData } = useGetAstrologerByIdQuery(
    { id: session?._id },
    { skip: !session?._id || isOnline }
  );
  const fullAstrologer = astroData?.data;

  const hasEmergency = !isOnline && (
    (fullAstrologer?.isEmergencyAvailable === true && (
      fullAstrologer?.emergencyPrice?.chatRate?.amount > 0 || 
      fullAstrologer?.emergencyPrice?.audioRate?.amount > 0
    )) ||
    (session?.isEmergencyAvailable === true && (
      session?.emergencyPrice?.chatRate?.amount > 0 || 
      session?.emergencyPrice?.audioRate?.amount > 0
    ))
  );

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
    if (!minutes) return "";
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    if (mins === 0 && secs === 0) return "";
    if (secs === 0) return `${mins} Min`;
    return `${mins} Min ${secs} Secs`;
  };

  const handleButtonClick = (e, astrologer, connectionType) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOnline) return;
    onCallAgain(astrologer, connectionType);
  };

  return (
    <div className={`${styles.sessionCard} ${!isOnline ? styles.sessionCardOffline : ''}`}>
      {/* Online/Offline badge */}
      <div className={`${styles.sessionStatusBadge} ${isOnline ? styles.sessionStatusOnline : styles.sessionStatusOffline}`}>
        <span className={styles.sessionStatusDot} />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
      {session._id ? (
        <Link
          to={`/astrologer/${session._id}`}
          className={styles.sessionCardLink}
        >
          <div className={styles.sessionImageWrapper}>
            <img
              src={
                session.profileImgUrl ||
                session.imageUrl ||
                session.astrologerImage ||
                getAstrologerDefaultImage(session.gender || session.astrologerGender)
              }
              alt={session.astrologerName}
              className={styles.sessionImage}
              onError={(e) => {
                e.target.src = getAstrologerDefaultImage(session.gender || session.astrologerGender);
              }}
            />
          </div>
        </Link>
      ) : (
        <div className={styles.sessionCardLink}>
          <div className={styles.sessionImageWrapper}>
            <img
              src={
                session.profileImgUrl ||
                session.imageUrl ||
                session.astrologerImage ||
                getAstrologerDefaultImage(session.gender || session.astrologerGender)
              }
              alt={session.astrologerName}
              className={styles.sessionImage}
              onError={(e) => {
                e.target.src = getAstrologerDefaultImage(session.gender || session.astrologerGender);
              }}
            />
          </div>
        </div>
      )}
      <div className={styles.sessionInfo}>
        {session._id ? (
          <Link
            to={`/astrologer/${session._id}`}
            className={styles.sessionNameLink}
          >
            <h3 className={styles.sessionName}>{session.astrologerName}</h3>
          </Link>
        ) : (
          <h3 className={styles.sessionName}>{session.astrologerName}</h3>
        )}
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
        {formatDuration(session.billedMinutes) && (
          <p className={styles.sessionDuration}>
            Duration : {formatDuration(session.billedMinutes)}
          </p>
        )}
        <div className={styles.sessionActionButtons}>
          {isOnline ? (
            <>
              {(session?.isActiveType?.includes("all") || session?.isActiveType?.includes("chat")) && (
                <div className={styles.sessionButtonWrapper}>
                  <button
                    className={styles.sessionChatBtn}
                    onClick={(e) => handleButtonClick(e, session, "chat")}
                    disabled={isLoading}
                  >
                    <img src={AppIcons.ChatMinutesIcon} alt="chat" /> Chat
                  </button>
                  <p className={styles.sessionPriceText}>
                    <span className={styles.sessionPriceAmount}>₹{session?.price?.chatRate?.amount || session?.chatRate || 0}</span>/min
                  </p>
                </div>
              )}
              {(session?.isActiveType?.includes("all") || session?.isActiveType?.includes("audio")) && (
                <div className={styles.sessionButtonWrapper}>
                  <button
                    className={styles.sessionCallBtn}
                    onClick={(e) => handleButtonClick(e, session, "call")}
                    disabled={isLoading}
                  >
                    <img src={AppIcons.CallMinutesIcon} alt="call" /> Call
                  </button>
                  <p className={styles.sessionPriceText}>
                    <span className={styles.sessionPriceAmount}>₹{session?.price?.audioRate?.amount || session?.callRate || 0}</span>/min
                  </p>
                </div>
              )}
            </>
          ) : hasEmergency ? (
            <div className={styles.sessionEmergencyWrapper}>
              <button
                className={styles.sessionEmergencyBtn}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowEmergencyModal(true);
                }}
              >
                Try Emergency Session
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <EmergencySessionModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        astrologer={fullAstrologer || session}
        onChatNow={(astro) => {
          setShowEmergencyModal(false);
          onCallAgain(session, "chat", true);
        }}
        onCallNow={(astro) => {
          setShowEmergencyModal(false);
          onCallAgain(session, "audio", true);
        }}
      />
    </div>
  );
};

export default SessionCard;
