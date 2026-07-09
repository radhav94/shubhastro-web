import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Heart, MessageCircle, Share2 } from "lucide-react";
import { AppImages } from "../../../utils/appImages";
import styles from "./LiveLanding.module.scss";
import { trackEvent } from "../../../utils/analytics";

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

                            {/* Action Buttons */}
                            <div className={styles.actionButtons}>
                                <button className={styles.actionBtn}>
                                    <Heart size={28} />
                                    <span>{insight.likes}</span>
                                </button>
                                <button className={styles.actionBtn}>
                                    <MessageCircle size={28} />
                                    <span>{insight.comments}</span>
                                </button>
                                <button className={styles.actionBtn}>
                                    <Share2 size={28} />
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
