import { Search, ChevronRight } from "lucide-react";
import styles from "../Home.module.scss";

const PanditAISection = () => {
    return (
        <section className={styles.panditAISection}>
            <div className={styles.panditAICard}>
                <div className={styles.panditInfo}>
                    <div className={styles.panditAvatar}>
                        <span>🧘‍♀️</span>
                    </div>
                    <div className={styles.panditText}>
                        <span className={styles.panditName}>
                            Pandit AI <span className={styles.sparkle}>✨</span>
                        </span>
                        <span className={styles.panditRole}>AI Assistant</span>
                    </div>
                </div>
                <button className={styles.freeQuestionBtn}>1 Free Question</button>
            </div>

            <div className={styles.searchBar}>
                <Search size={18} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="When will I get a job?"
                    className={styles.searchInput}
                />
                <button className={styles.searchSubmit}>
                    <ChevronRight size={18} />
                </button>
            </div>
        </section>
    );
};

export default PanditAISection;
