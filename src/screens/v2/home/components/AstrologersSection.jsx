import { useState, useCallback, useRef, useEffect, memo, Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeader from "./SectionHeader";
import NewAstrologerCard from "../../../../component/UI/cards/newAstrologerCard/NewAstrologerCard";
import useHorizontalScrollState from "../../../../hooks/useHorizontalScrollState";
import styles from "./sharedSections.module.scss";
import EmergencySessionModal from "../../../../component/UI/modal/EmergencySessionModal/EmergencySessionModal";

const AstrologersSection = memo(({ title, astrologers, onConnect, gridRef, hideSliderButtons = false, onScrollableChange }) => {
    const [emergencyAstrologer, setEmergencyAstrologer] = useState(null);
    const internalRef = useRef(null);
    const listRef = gridRef || internalRef;
    const { canScrollLeft, canScrollRight } = useHorizontalScrollState(listRef, [astrologers]);

    // Report scrollability to a parent that renders external slider buttons.
    useEffect(() => {
        onScrollableChange?.({ canScrollLeft, canScrollRight });
    }, [canScrollLeft, canScrollRight, onScrollableChange]);

    const handleEmergencyClick = useCallback((astrologer) => {
        setEmergencyAstrologer(astrologer);
    }, []);

    const handleEmergencyClose = useCallback(() => {
        setEmergencyAstrologer(null);
    }, []);

    const scrollByCards = useCallback((direction) => {
        const grid = listRef.current;
        if (!grid) return;
        const amount = Math.max(grid.clientWidth * 0.8, 240);
        grid.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
    }, [listRef]);

    if (!astrologers || astrologers.length === 0) return null;

    return (
        <section className={styles.astrologersSection}>
            <SectionHeader title={title} />
            <div className={styles.gridWrapper}>
                {!hideSliderButtons && canScrollLeft && (
                    <button
                        type="button"
                        className={`${styles.sliderBtn} ${styles.sliderBtnLeft}`}
                        onClick={() => scrollByCards("left")}
                        aria-label="Scroll left"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                <div className={styles.astrologersGrid} ref={listRef}>
                    {astrologers.map((astrologer) => (
                        <NewAstrologerCard
                            key={astrologer._id}
                            astrologer={astrologer}
                            onConnect={onConnect}
                            onEmergencyClick={handleEmergencyClick}
                        />
                    ))}
                </div>
                {!hideSliderButtons && canScrollRight && (
                    <button
                        type="button"
                        className={`${styles.sliderBtn} ${styles.sliderBtnRight}`}
                        onClick={() => scrollByCards("right")}
                        aria-label="Scroll right"
                    >
                        <ChevronRight size={20} />
                    </button>
                )}
            </div>
            {emergencyAstrologer && (
                <Suspense fallback={null}>
                    <EmergencySessionModal
                        isOpen={true}
                        onClose={handleEmergencyClose}
                        astrologer={emergencyAstrologer}
                        onChatNow={(astro) => onConnect(astro, "chat", true)}
                        onCallNow={(astro) => onConnect(astro, "audio", true)}
                        /*
                          EmergencySessionModal renders a Video button whenever the
                          astrologer has an emergency videoCallRate, but invokes it as
                          `onVideoNow?.(astrologer)`. With no handler the tap resolved to
                          undefined and the sheet just closed — no balance check, so no
                          "Minimum balance of N minutes (₹X) …" prompt and no connect.

                          This is the homepage path (AstrologerGridSection renders this
                          section, and it owns its own emergency modal rather than taking
                          handlers from the screen), which is why the bug showed up only
                          on the home page while the astrologer profile and /astrologers
                          pages — which wire their own modals — worked.
                        */
                        onVideoNow={(astro) => onConnect(astro, "video", true)}
                    />
                </Suspense>
            )}
        </section>
    );
});

AstrologersSection.displayName = "AstrologersSection";

export default AstrologersSection;
