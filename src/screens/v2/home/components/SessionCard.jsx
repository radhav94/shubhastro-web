import { Calendar, Clock } from "lucide-react";
import astrologerSquare from "../../../../assets/images/astrologer-square.svg";
import styles from "../Home.module.scss";

const SessionCard = ({ session, onCallAgain, isLoading }) => {
    return (
        <div className={styles.sessionCard}>
            <div className={styles.sessionImageWrapper}>
                <img
                    src={session.imageUrl || astrologerSquare}
                    alt={session.name}
                    className={styles.sessionImage}
                    onError={(e) => {
                        e.target.style.display = "none";
                    }}
                />
            </div>
            <div className={styles.sessionInfo}>
                <h3 className={styles.sessionName}>{session.name}</h3>
                <div className={styles.sessionDetails}>
                    <div className={styles.sessionDetail}>
                        <Calendar size={16} className={styles.sessionIconSvg} />
                        <span className={styles.sessionText}>{session.date}</span>
                    </div>
                    <div className={styles.sessionDetail}>
                        <Clock size={16} className={styles.sessionIconSvg} />
                        <span className={styles.sessionText}>{session.time}</span>
                    </div>
                </div>
                <p className={styles.sessionDuration}>Duration : {session.duration}</p>
                <button
                    className={`${styles.callAgainBtn} ${isLoading ? styles.loading : ""}`}
                    onClick={() => onCallAgain(session.id)}
                    disabled={isLoading}
                >
                    Call Again
                </button>
            </div>
        </div>
    );
};

export default SessionCard;
