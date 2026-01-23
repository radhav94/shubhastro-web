import styles from "../Home.module.scss";

const SectionHeader = ({ title }) => {
    return (
        <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{title}</h2>
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
    );
};

export default SectionHeader;
