import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Heart, MessageCircle, Share2 } from "lucide-react";
import { AppImages } from "../../../utils/appImages";
import styles from "./LiveLanding.module.scss";
import { trackEvent } from "../../../utils/analytics";
import Toast from "../../../component/toast";

const LiveLanding = () => {
    const [activeTab, setActiveTab] = useState("daily");
    const navigate = useNavigate();
    const contentRef = useRef(null);
    const autoScrollInterval = useRef(null);

    // Track live stream section view (once on mount)
    useEffect(() => {
        trackEvent("live_stream_list_viewed", {});
    }, []);

    const insights = [
        {
            id: 1,
            title: "12th House Transit",
            description: "A 12th house transit signifies closure, introspection, and release. Focus turns inward toward healing, subconscious patterns, and letting go, preparing you for a fresh cycle ahead.",
            image: AppImages.cosmicMoon,
            likes: 1200,
            comments: 45,
            shares: 8,
        },
        {
            id: 2,
            title: "Relationship Guidance",
            description: "The 7th house governs marriage, partnerships, and long-term relationships. It reflects the nature of one's spouse, quality of commitment, compatibility, and the karmic lessons experienced through partnerships.",
            image: AppImages.cosmicChronicles,
            likes: 980,
            comments: 32,
            shares: 12,
        },
        {
            id: 3,
            title: "Destiny and Karma",
            description: "In Vedic astrology, destiny is shaped by past karma and activated through planetary periods and transits. While the chart shows the path, conscious effort and right action determine how that destiny unfolds.",
            image: AppImages.cosmicUnity,
            likes: 1450,
            comments: 67,
            shares: 15,
        },
    ];

    // Auto-scroll functionality for desktop only
    useEffect(() => {
        const isDesktop = window.innerWidth >= 769;
        
        if (isDesktop && contentRef.current) {
            let currentIndex = 0;
            const scrollInterval = 4000; // 4 seconds per card
            
            autoScrollInterval.current = setInterval(() => {
                if (contentRef.current) {
                    currentIndex = (currentIndex + 1) % insights.length;
                    
                    contentRef.current.scrollTo({
                        left: currentIndex * window.innerWidth,
                        behavior: 'smooth'
                    });
                }
            }, scrollInterval);
        }

        return () => {
            if (autoScrollInterval.current) {
                clearInterval(autoScrollInterval.current);
            }
        };
    }, [insights.length]);

    const handleLiveReadingsClick = () => {
        navigate("/live");
    };

    const handleBackClick = (e) => {
        e.preventDefault();
        e.stopPropagation(); 
        navigate("/", { replace: false });
    };

    const handleTalkToAstrologer = () => {
        navigate("/astrologers");
    };

    /*
      Share was one of three icon buttons on each card — heart, comment, share —
      and none of the three had a handler. All were real <button>s carrying
      `.actionBtn`, which sets `cursor: pointer` and a `:hover` that darkens and
      scales the circle, so each one visibly answered the pointer and then did
      nothing on click. Three per card across three cards is nine dead controls,
      sitting in the TikTok-style right rail of a full-screen media card — the
      most obviously tappable thing on the page.

      Sharing needs no backend, so it is now real. Web Share where the browser
      has it (most mobile, Windows/ChromeOS Chrome), clipboard otherwise, which
      covers the desktop browsers that don't implement it.
    */
    const handleShare = async (insight) => {
        const url = `${window.location.origin}/live-landing`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: insight.title,
                    text: insight.description,
                    url,
                });
                trackEvent("live_insight_shared", { insight_id: insight.id, method: "web_share" });
                return;
            }

            await navigator.clipboard.writeText(`${insight.title} — ${url}`);
            Toast.success("Link copied to clipboard");
            trackEvent("live_insight_shared", { insight_id: insight.id, method: "clipboard" });
        } catch (err) {
            // Dismissing the OS share sheet rejects with AbortError. That's the
            // user changing their mind, not a failure, so say nothing.
            if (err?.name === "AbortError") return;
            Toast.error("Couldn't share this insight. Please try again.");
        }
    };

    return (
        <div className={styles.liveLanding}>
            {/* Header with Tabs */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={handleBackClick}>
                    <ChevronLeft size={24} />
                </button>

                <div className={styles.tabs}>
                    {/* <button
                        className={`${styles.tab} ${activeTab === "daily" ? styles.active : ""}`}
                        onClick={() => setActiveTab("daily")}
                    >
                        Daily Insights
                    </button> */}
                    <button
                        className={`${styles.tab} ${activeTab === "live" ? styles.active : ""}`}
                        onClick={() => {
                            setActiveTab("live");
                            handleLiveReadingsClick();
                        }}
                    >
                        Live Readings
                    </button>
                </div>
            </div>

            {/* Content Area - Scrollable Cards */}
            <div className={styles.content} ref={contentRef}>
                {insights.map((insight) => (
                    <div key={insight.id} className={styles.insightCard}>
                        {/* Background Image */}
                        <img
                            src={insight.image}
                            alt={insight.title}
                            className={styles.cardBackground}
                        />

                        {/* Blue Border Effect */}
                        <div className={styles.cardBorder} />

                        {/* Content Overlay */}
                        <div className={styles.cardContent}>
                            <div className={styles.textContent}>
                                <h3 className={styles.cardTitle}>{insight.title}</h3>
                                <p className={styles.cardDescription}>{insight.description}</p>
                                
                                <button 
                                    className={styles.ctaButton}
                                    onClick={handleTalkToAstrologer}
                                >
                                    Talk to Our Astrologer
                                </button>
                            </div>

                            {/*
                              Likes and comments are static counts on hardcoded
                              content — there is no endpoint behind either, so
                              neither can ever succeed. They stay visible as
                              figures but no longer claim to be controls:
                              `.actionStatic` drops the pointer cursor and the
                              hover response, so they read as the stats they are
                              instead of buttons that ignore you. Wiring them up
                              needs like/comment endpoints for these cards first.
                            */}
                            <div className={styles.actionButtons}>
                                <div className={`${styles.actionBtn} ${styles.actionStatic}`}>
                                    <Heart size={28} aria-hidden="true" />
                                    <span>{insight.likes}</span>
                                </div>
                                <div className={`${styles.actionBtn} ${styles.actionStatic}`}>
                                    <MessageCircle size={28} aria-hidden="true" />
                                    <span>{insight.comments}</span>
                                </div>
                                <button
                                    type="button"
                                    className={styles.actionBtn}
                                    onClick={() => handleShare(insight)}
                                    aria-label={`Share ${insight.title}`}
                                >
                                    <Share2 size={28} aria-hidden="true" />
                                    <span>{insight.shares}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveLanding;
