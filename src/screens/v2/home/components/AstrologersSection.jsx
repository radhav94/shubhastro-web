import SectionHeader from "./SectionHeader";
import AstrologerCard from "./AstrologerCard";
import styles from "../Home.module.scss";

const AstrologersSection = ({ title, astrologers, onConnect }) => {
    if (!astrologers || astrologers.length === 0) return null;

    return (
        <section className={styles.astrologersSection}>
            <SectionHeader title={title} />
            <div className={styles.astrologersGrid}>
                {astrologers.map((astrologer) => (
                    <AstrologerCard
                        key={astrologer._id}
                        astrologer={astrologer}
                        onConnect={onConnect}
                    />
                ))}
            </div>
        </section>
    );
};

export default AstrologersSection;
