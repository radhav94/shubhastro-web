import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../utils/routes/Paths";
import SectionHeader from "./SectionHeader";
import SessionCard from "./SessionCard";
import styles from "../Home.module.scss";

const MySessionsSection = () => {
    const [loadingCallAgain, setLoadingCallAgain] = useState(null);
    const navigate = useNavigate();

    // Mock data - replace with actual data from API
    const sessions = [
        {
            id: 1,
            name: "Dr. K Jagdish Rao",
            date: "Oct 17, 2025",
            time: "04:36 PM",
            duration: "5 Min 30 Secs",
        },
        {
            id: 2,
            name: "Pandit Jagdish",
            date: "Oct 15, 2025",
            time: "02:15 PM",
            duration: "8 Min 45 Secs",
        },
    ];

    const handleCallAgain = (sessionId) => {
        setLoadingCallAgain(sessionId);
        setTimeout(() => {
            navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path);
        }, 500);
    };

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
                <button className={styles.viewAllLink}>
                    View All <ChevronRight size={20} />
                </button>
            </div>

            <div className={styles.sessionsGrid}>
                {sessions.map((session) => (
                    <SessionCard
                        key={session.id}
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
