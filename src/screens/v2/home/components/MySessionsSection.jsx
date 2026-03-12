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

  const handleCallAgain = (session,connectionType) => {
    if (onConnectClick) {
      // If session has full astrologer object, use it
      if (session.astrologer) {
        onConnectClick(session.astrologer,connectionType);
      } else if (session.astrologerId || session.astrologerName) {
        // Otherwise, construct astrologer object from session data
        const astrologer = {
          _id: session._id,
          firstName:
            session.astrologerName?.split(" ")[0] ||
            session.astrologerName ||
            "Astrologer",
          lastName: session.astrologerName?.split(" ").slice(1).join(" ") || "",
          imageUrl: session.astrologerImage,
          isActive:session.isActive,
        };
        onConnectClick(astrologer,connectionType);
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
            <span className={styles.dividerMoon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
            </span>
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
            onCallAgain={handleCallAgain}
            isLoading={loadingCallAgain === session.id}
          />
        ))}
      </div>
    </section>
  );
};

export default MySessionsSection;
