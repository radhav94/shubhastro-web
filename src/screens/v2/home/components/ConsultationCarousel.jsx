import { useState, useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../utils/routes/Paths";
import consult from "../../../../assets/images/astrologer.svg";
import styles from "../Home.module.scss";

const ConsultationCarousel = () => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [loadingConsult, setLoadingConsult] = useState(false);
    const navigate = useNavigate();
    const carouselRef = useRef(null);

    const carouselSlides = [
        {
            id: 1,
            title: "Consult our astrologers today.",
            subtitle: "Get advice from astrologers.",
            buttonText: "Consult Now",
            image: consult,
        },
        {
            id: 2,
            title: "Want to know your future?",
            subtitle: "Get advice from experts.",
            buttonText: "Consult Now",
            image: consult,
        },
        {
            id: 3,
            title: "Want to know your future?",
            subtitle: "Get advice from experts.",
            buttonText: "Consult Now",
            image: consult,
        },
        {
            id: 4,
            title: "Consult our astrologers today.",
            subtitle: "Get advice from astrologers.",
            buttonText: "Consult Now",
            image: consult,
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
                    <div
                        key={slide.id + "-" + index}
                        className={`${styles.carouselSlide} ${activeSlide === index ? styles.activeSlide : ""}`}
                    >
                        <div className={styles.slideContent}>
                            <h3 className={styles.slideTitle}>{slide.title}</h3>
                            <p className={styles.slideSubtitle}>{slide.subtitle}</p>
                            <button
                                className={`${styles.slideButton} ${loadingConsult ? styles.loading : ""}`}
                                onClick={handleConsultNow}
                                disabled={loadingConsult}
                            >
                                {slide.buttonText} <ChevronRight size={16} />
                            </button>
                        </div>
                        <div className={styles.slideImageWrapper}>
                            <img
                                src={slide.image}
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
