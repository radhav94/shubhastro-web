import { Search, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "../Home.module.scss";

const PanditAISection = ({ data, title }) => {
    const navigate = useNavigate();
    const panditTitle = data?.title || "Pandit AI";
    const panditDescription = data?.description || "1 Free Question";

    const handleAskQuestion = () => {
        // Navigate to AI chat or cosmic chat
        navigate("/cosmic-chat");
    };

    return (
        <section className={styles.panditAISection}>
            <div className={styles.panditAICard}>
                <div className={styles.panditInfo}>
                    <div className={styles.panditAvatar}>
                        <span>🧘‍♀️</span>
                    </div>
                    <div className={styles.panditText}>
                        <span className={styles.panditName}>
                            {panditTitle} <span className={styles.sparkle}>✨</span>
                        </span>
                        <span className={styles.panditRole}>AI Assistant</span>
                    </div>
                </div>
                <button className={styles.freeQuestionBtn}>{panditDescription}</button>
            </div>

            <div className={styles.searchBar}>
                <Search size={18} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="When will I get a job?"
                    className={styles.searchInput}
                />
                <button className={styles.searchSubmit} onClick={handleAskQuestion}>
                    <ChevronRight size={18} />
                </button>
            </div>
        </section>
    );
};

export default PanditAISection;
