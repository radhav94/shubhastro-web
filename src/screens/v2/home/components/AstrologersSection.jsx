import { useState, useCallback, memo, lazy, Suspense } from "react";
import SectionHeader from "./SectionHeader";
import NewAstrologerCard from "../../../../component/UI/cards/newAstrologerCard/NewAstrologerCard";
import styles from "../Home.module.scss";

const EmergencySessionModal = lazy(() => import("../../../../component/UI/modal/EmergencySessionModal/EmergencySessionModal"));

const AstrologersSection = memo(({ title, astrologers, onConnect }) => {
    const [emergencyAstrologer, setEmergencyAstrologer] = useState(null);

    const handleEmergencyClick = useCallback((astrologer) => {
        setEmergencyAstrologer(astrologer);
    }, []);

    const handleEmergencyClose = useCallback(() => {
        setEmergencyAstrologer(null);
    }, []);

    if (!astrologers || astrologers.length === 0) return null;

    return (
        <section className={styles.astrologersSection}>
            <SectionHeader title={title} />
            <div className={styles.astrologersGrid}>
                {astrologers.map((astrologer) => (
                    <NewAstrologerCard
                        key={astrologer._id}
                        astrologer={astrologer}
                        onConnect={onConnect}
                        onEmergencyClick={handleEmergencyClick}
                    />
                ))}
            </div>
            {emergencyAstrologer && (
                <Suspense fallback={null}>
                    <EmergencySessionModal
                        isOpen={true}
                        onClose={handleEmergencyClose}
                        astrologer={emergencyAstrologer}
                        onChatNow={(astro) => onConnect(astro, "chat", true)}
                        onCallNow={(astro) => onConnect(astro, "audio", true)}
                    />
                </Suspense>
            )}
        </section>
    );
});

AstrologersSection.displayName = "AstrologersSection";

export default AstrologersSection;
