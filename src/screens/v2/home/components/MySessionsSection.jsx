import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { PATH } from "../../../../utils/routes/Paths";
import SessionCard from "./SessionCard";
import styles from "../Home.module.scss";
import { useGetAllUserSessionQuery } from "../../../../redux/api/userSession/userSessionApi";

const MySessionsSection = ({ onConnectClick }) => {
  const [loadingCallAgain, setLoadingCallAgain] = useState(null);
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const { data, isLoading } = useGetAllUserSessionQuery(undefined, {
    skip: !isLoggedIn,
  });
  const sessions = data?.data?.recentSessions || [];

  const handleCallAgain = (session) => {
    if (onConnectClick) {
      // If session has full astrologer object, use it
      if (session.astrologer) {
        onConnectClick(session.astrologer);
      } else if (session.astrologerId || session.astrologerName) {
        // Otherwise, construct astrologer object from session data
        const astrologer = {
          _id: session.astrologerId,
          firstName:
            session.astrologerName?.split(" ")[0] ||
            session.astrologerName ||
            "Astrologer",
          lastName: session.astrologerName?.split(" ").slice(1).join(" ") || "",
          imageUrl: session.astrologerImage,
        };
        onConnectClick(astrologer);
      } else {
        console.error("Session data missing astrologer information:", session);
      }
    }
  };

  // Don't render the section if user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  // Don't render while loading
  if (isLoading) {
    return null;
  }

  // Don't render if there are no sessions
  if (!sessions || sessions.length === 0) {
    return null;
  }

  return (
    <section className={styles.sessionsSection}>
      <div className={styles.sessionsHeader}>
        <div className={styles.sessionsHeaderLeft}>
          <h2 className={styles.sessionsTitle}>MY SESSIONS</h2>
          <div className={styles.titleDivider}>
            <div className={styles.dividerLine}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="53"
                height="1"
                viewBox="0 0 53 1"
                fill="none"
              >
                <path
                  d="M52.2858 0.406393C52.2858 0.630933 51.128 0.812789 49.6998 0.812789C48.2716 0.812789 0 0.630933 0 0.406393C0 0.181853 48.2719 0 49.6998 0C51.128 0 52.2858 0.181853 52.2858 0.406393Z"
                  fill="#2A161B"
                  fillOpacity="0.2"
                />
              </svg>
            </div>
            <span className={styles.dividerMoon}>☾</span>
            <div className={styles.dividerLine}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="53"
                height="1"
                viewBox="0 0 53 1"
                fill="none"
              >
                <path
                  d="M0 0.406393C0 0.630933 1.15779 0.812789 2.58601 0.812789C4.01424 0.812789 52.2858 0.630933 52.2858 0.406393C52.2858 0.181853 4.01393 0 2.58601 0C1.15779 0 0 0.181853 0 0.406393Z"
                  fill="#2A161B"
                  fillOpacity="0.2"
                />
              </svg>
            </div>
          </div>
        </div>
        <button
          className={styles.viewAllLink}
          onClick={() => navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path)}
        >
          View All <ChevronRight size={20} />
        </button>
      </div>

      <div className={styles.sessionsGrid}>
        {sessions.map((session, i) => (
          <SessionCard
            key={i}
            session={session}
            onCallAgain={() => handleCallAgain(session)}
            isLoading={loadingCallAgain === session.id}
          />
        ))}
      </div>
    </section>
  );
};

export default MySessionsSection;
