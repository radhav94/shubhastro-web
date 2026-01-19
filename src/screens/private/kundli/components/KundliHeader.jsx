import styles from "./KundliHeader.module.scss";

const KundliHeader = () => {
    return (
        <div className={styles.headerSection}>
            <h1 className={styles.headerTitle}>Free Kundli Online</h1>
            <p className={styles.headerSubtitle}>
                A Kundli, or birth chart, is an astrological map of your life's journey.
            </p>
        </div>
    );
};

export default KundliHeader;
