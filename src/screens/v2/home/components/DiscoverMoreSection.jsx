import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../utils/routes/Paths";
import SectionHeader from "./SectionHeader";
import vedikKundli from "../../../../assets/images/vedic-kundli.svg";
import numerology from "../../../../assets/images/numerology.svg";
import matchmaking from "../../../../assets/images/matchmaking.svg";
import tarot from "../../../../assets/images/tarot.svg";
import styles from "../Home.module.scss";

const DiscoverMoreSection = () => {
  const navigate = useNavigate();

  const discoverItems = [
    {
      id: 1,
      title: "Vedic Kundli",
      description: "Discover the blueprint of your destiny by vedic wisdom.",
      image: vedikKundli,
      background: "#D43400",
      path: PATH.privateRoutes.KUNDLI.path,
    },
    {
      id: 2,
      title: "Numerology",
      description: "Decode the power of numbers and their influence.",
      image: numerology,
      background: "#752B29",
      path: PATH.privateRoutes.NUMEROLOGY.path,
    },
    {
      id: 3,
      title: "Match-making",
      description: "Explore cosmic compatibility for love, marriage and harmony.",
      image: matchmaking,
      background: "#A560CA",
      path: PATH.privateRoutes.MATCHMAKING.path,
    },
    {
      id: 4,
      title: "Tarot",
      description: "Unveil the unseen and gain clarity with card readings.",
      image: tarot,
      background: "#3E93C9",
      path: PATH.privateRoutes.TAROT_CARD_V2.path,
    },
  ];

  return (
    <section className={styles.discoverSection}>
      <div className={styles.discoverHeader}>
        <SectionHeader title="DISCOVER MORE" />
        <button className={styles.viewAllBtn}>
          <ChevronRight size={24} />
        </button>
      </div>

      <div className={styles.discoverGrid}>
        {discoverItems.map((item) => (
          <div
            key={item.id}
            className={styles.discoverCard}
            style={{ background: item.background }}
            onClick={() => navigate("/explore")}
          >
            <div className={styles.discoverContent}>
              <h3 className={styles.discoverTitle}>{item.title}</h3>
              <p className={styles.discoverText}>{item.description}</p>
            </div>
            <img
              src={item.image}
              alt={item.title}
              className={styles.discoverImage}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default DiscoverMoreSection;
