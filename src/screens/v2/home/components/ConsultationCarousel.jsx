import { useState, useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../utils/routes/Paths";
import styles from "../Home.module.scss";
import { getAstrologerDefaultImage } from "../../../../utils/appImages";

const ConsultationCarousel = ({ data = [], title }) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [loadingConsult, setLoadingConsult] = useState(false);
    const navigate = useNavigate();
    const carouselRef = useRef(null);

    // Use API data if available, otherwise use default slides
    const carouselSlides = data.length > 0 ? data.map((item, index) => ({
        id: item._id || index,
        title: item.title || "Consult our astrologers today.",
        subtitle: item.description || "Get advice from astrologers.",
        buttonText: "Consult Now",
        image: item.image_url || getAstrologerDefaultImage(),
    })) : [
        {
            id: 1,
            title: "Consult our astrologers today.",
            subtitle: "Get advice from astrologers.",
            buttonText: "Consult Now",
            image: getAstrologerDefaultImage(),
        },
        {
            id: 2,
            title: "Want to know your future?",
            subtitle: "Get advice from experts.",
            buttonText: "Consult Now",
            image: getAstrologerDefaultImage(),
        },
    ];

    // Auto-slide functionality
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [carouselSlides.length]);

    // Scroll to active slide
    useEffect(() => {
        if (carouselRef.current) {
            const slideWidth = carouselRef.current.children[0]?.offsetWidth || 0;
            const gap = 16;
            const scrollPosition = activeSlide * (slideWidth + gap);

            carouselRef.current.scrollTo({
                left: scrollPosition,
                behavior: "smooth",
            });
        }
    }, [activeSlide]);

    const handleDotClick = (index) => {
        setActiveSlide(index);
    };

    const handleConsultNow = () => {
        setLoadingConsult(true);
        setTimeout(() => {
            navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path);
        }, 500);
    };

    return (
        <section className={styles.carouselSection}>
            <div className={styles.carouselContainer} ref={carouselRef}>
                {carouselSlides.map((slide, index) => (
                    <div onClick={handleConsultNow}
                        key={slide.id + "-" + index}
                        className={`${styles.carouselSlide} ${activeSlide === index ? styles.activeSlide : ""}`}
                    >
                        <div className={styles.slideContent}>
                            <h3 className={styles.slideTitle}>{slide.title}</h3>
                            <p className={styles.slideSubtitle}>{slide.subtitle}</p>
                            <button
                                className={`${styles.slideButton} ${loadingConsult ? styles.loading : ""}`}
                                disabled={loadingConsult}
                            >
                                {slide.buttonText} <ChevronRight size={16} />
                            </button>
                        </div>
                        <div className={styles.slideImageWrapper}>
                            <img
                                src={slide.image || getAstrologerDefaultImage()}
                                alt="Astrologer"
                                className={styles.astrologerImage}
                                onError={(e) => {
                                    e.target.style.display = "none";
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.carouselDots}>
                {carouselSlides.map((_, index) => (
                    <span
                        key={index}
                        className={`${styles.dot} ${activeSlide === index ? styles.active : ""}`}
                        onClick={() => handleDotClick(index)}
                    ></span>
                ))}
            </div>
        </section>
    );
};

export default ConsultationCarousel;
