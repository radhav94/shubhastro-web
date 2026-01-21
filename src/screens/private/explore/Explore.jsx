import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Edit, ChevronRight } from "lucide-react";
import styles from "./Explore.module.scss";

// Import images
import horoscopeImg from "../../../assets/explore/horoscope.png";
import kundliReportsImg from "../../../assets/icons/kundali.png";
import remediesImg from "../../../assets/explore/remedies.png";
import vedicImg from "../../../assets/explore/vedic.png";
import dashaImg from "../../../assets/explore/dasha.png";
import kpImg from "../../../assets/explore/kp.png";
import ashtakvargaImg from "../../../assets/explore/ashtakvarga.png";
import matchmakingImg from "../../../assets/explore/matchmaking.png";
import tarotImg from "../../../assets/explore/tarot.png";
import newsImg from "../../../assets/explore/news.png";

const Explore = () => {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState("Priya Gupta");

  const topCards = [
    {
      id: 1,
      title: "Explore Your Horoscope",
      image: horoscopeImg,
      bgColor: "#FF5722",
      link: "/horoscopes/daily-horoscope",
    },
    {
      id: 2,
      title: "Kundli Reports",
      image: kundliReportsImg,
      bgColor: "#FF5722",
      link: "/kundli",
    },
    {
      id: 3,
      title: "Remedies For You",
      image: remediesImg,
      bgColor: "#FF5722",
      link: "/remedies",
    },
  ];

  const kundliCards = [
    {
      id: 1,
      title: "Vedic Kundli",
      image: vedicImg,
      link: "/kundli",
    },
    {
      id: 2,
      title: "Dasha",
      image: dashaImg,
      link: "/kundli/dasha",
    },
    {
      id: 3,
      title: "KP Chart",
      image: kpImg,
      link: "/kundli/kp",
    },
    {
      id: 4,
      title: "Ashtakvarga Chart",
      image: ashtakvargaImg,
      link: "/kundli/ashtakvarga",
    },
  ];

  const destinyCards = [
    {
      id: 1,
      title: "Tarot",
      subtitle: "Unveil the unseen. Gain clarity.",
      bgColor: "#2196F3",
      image: tarotImg,
      link: "/tarot",
    },
    {
      id: 2,
      title: "Numerology",
      subtitle: "Decode the power of numbers",
      bgColor: "#8B4513",
      image: null,
      link: "/numerology",
    },
  ];

  const blogs = [
    {
      id: 1,
      date: "Aug 2, 2024",
      title: "Vedic Astrology: Unveiling Cosmic In...",
      image: newsImg,
      link: "/blogs/1",
    },
    {
      id: 2,
      date: "Jul 28, 2024",
      title: "Daily Horoscopes: Your Guide to the St...",
      image: newsImg,
      link: "/blogs/2",
    },
    {
      id: 3,
      date: "Jul 25, 2024",
      title: "Astrology Predictions: Per...",
      image: newsImg,
      link: "/blogs/3",
    },
  ];

  return (
    <div className={styles.explorePage}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <div className={styles.profileSelector}>
          <span className={styles.selectLabel}>Select Profile</span>
          <div className={styles.profileName}>
            {selectedProfile}
            <ChevronRight size={20} className={styles.dropdownIcon} />
          </div>
        </div>
        <button className={styles.editButton}>
          <Edit size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <h1 className={styles.mainTitle}>All About You</h1>
          <p className={styles.subtitle}>
            An ever growing library on the story of you
          </p>

          <div className={styles.topCardsGrid}>
            {topCards.map((card) => (
              <div
                key={card.id}
                className={styles.topCard}
                style={{ backgroundColor: card.bgColor }}
                onClick={() => navigate(card.link)}
              >
                <img src={card.image} alt={card.title} className={styles.cardIcon} />
                <h3 className={styles.cardTitle}>{card.title}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Discover Your Kundli */}
        <section className={styles.section}>
          <div className={styles.kundliSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>DISCOVER YOUR KUNDLI</h2>
              <ChevronRight size={24} className={styles.sectionArrow} />
            </div>

            <div className={styles.kundliGrid}>
              {kundliCards.map((card) => (
                <div
                  key={card.id}
                  className={styles.kundliCard}
                  onClick={() => navigate(card.link)}
                >
                  <div className={styles.kundliCardImage}>
                    <img src={card.image} alt={card.title} className={styles.chartImage} />
                  </div>
                  <div className={styles.kundliCardContent}>
                    <h3 className={styles.kundliCardTitle}>{card.title}</h3>
                    <ChevronRight size={20} className={styles.cardArrow} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Matchmaking Banner */}
        <div className={styles.matchmakingBanner}>
          <div className={styles.matchmakingContent}>
            <h3 className={styles.matchmakingTitle}>Matchmaking</h3>
            <p className={styles.matchmakingText}>
              Measures emotional alignment and long-term compatibility
            </p>
          </div>
          <img src={matchmakingImg} alt="Matchmaking" className={styles.matchmakingIcon} />
        </div>

        {/* Explore Your Destiny */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>EXPLORE YOUR DESTINY</h2>
            <ChevronRight size={24} className={styles.sectionArrow} />
          </div>

          <div className={styles.destinyGrid}>
            {destinyCards.map((card) => (
              <div
                key={card.id}
                className={styles.destinyCard}
                style={{ backgroundColor: card.bgColor }}
                onClick={() => navigate(card.link)}
              >
                <div className={styles.destinyCardContent}>
                  <h3 className={styles.destinyCardTitle}>{card.title}</h3>
                  <p className={styles.destinyCardSubtitle}>{card.subtitle}</p>
                </div>
                {card.image && (
                  <img src={card.image} alt={card.title} className={styles.destinyCardImage} />
                )}
                {card.id === 2 && (
                  <div className={styles.numerologyNumbers}>
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                    <span>6</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Gemstones Banner */}
          <div className={styles.gemstonesBanner}>
            <div className={styles.gemstonesContent}>
              <h3 className={styles.gemstonesTitle}>Gemstones</h3>
              <p className={styles.gemstonesText}>
                Smart recommendations aligned with your birth chart
              </p>
            </div>
            <img src={remediesImg} alt="Gemstones" className={styles.gemstonesIcon} />
          </div>
        </section>

        {/* Explore Blogs */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>EXPLORE BLOGS AND IN THE NEWS</h2>
            <ChevronRight size={24} className={styles.sectionArrow} />
          </div>

          <div className={styles.blogsScroll}>
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className={styles.blogCard}
                onClick={() => navigate(blog.link)}
              >
                <div className={styles.blogImage}>
                  <img src={blog.image} alt={blog.title} className={styles.blogBgImage} />
                  <span className={styles.blogDate}>{blog.date}</span>
                </div>
                <h4 className={styles.blogTitle}>{blog.title}</h4>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Explore;
