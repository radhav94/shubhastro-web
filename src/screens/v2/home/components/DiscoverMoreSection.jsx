import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../utils/routes/Paths";
import SectionHeader from "./SectionHeader";
import vedikKundli from "../../../../assets/images/vedic-kundli.svg";
import numerology from "../../../../assets/images/numerology.svg";
import matchmaking from "../../../../assets/images/matchmaking.svg";
import tarot from "../../../../assets/images/tarot.svg";
import styles from "../Home.module.scss";

const DiscoverMoreSection = ({ data = [], title, showMore }) => {
  const navigate = useNavigate();

  // Use API data if available, otherwise use default items
  const discoverItems =
    data.length > 0
      ? data.map((item, index) => {
          // Determine path based on slug
          let path = "/explore";
          if (item.slug === "vedic-kundli") {
            path = PATH.privateRoutes.KUNDLI.path;
          } else if (item.slug === "numerology") {
            path = PATH.privateRoutes.NUMEROLOGY.path;
          } else if (item.slug === "match-making") {
            path = PATH.privateRoutes.MATCHMAKING.path;
          } else if (item.slug === "tarot") {
            path = PATH.privateRoutes.TAROT_CARD_V2.path;
          } else if (item.redirect_url) {
            path = item.redirect_url;
          }

          // Background colors for cards
          const backgrounds = ["#D43400", "#752B29", "#A560CA", "#3E93C9"];

          return {
            id: item._id || item.ID || index,
            title: item.title,
            description: item.description || "",
            image: item.image_url || item.icon || vedikKundli,
            background: backgrounds[index % backgrounds.length],
            path: path,
          };
        })
      : [
          {
            id: 1,
            title: "Vedic Kundli",
            description:
              "Discover the blueprint of your destiny by vedic wisdom.",
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
            description:
              "Explore cosmic compatibility for love, marriage and harmony.",
            image: matchmaking,
            background: "#A560CA",
            path: PATH.privateRoutes.MATCHMAKING.path,
          },
          {
            id: 4,
            title: "Tarot",
            description:
              "Unveil the unseen and gain clarity with card readings.",
            image: tarot,
            background: "#3E93C9",
            path: PATH.privateRoutes.TAROT_CARD_V2.path,
          },
        ];

  if (discoverItems.length === 0) return null;

  return (
    <section className={styles.discoverSection}>
      <div className={styles.discoverHeader}>
        <SectionHeader title={title || "DISCOVER MORE"} />
        {showMore && (
          <button
            className={styles.viewAllBtn}
            onClick={() => navigate("/explore")}
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      <div className={styles.discoverGrid}>
        {discoverItems.map((item) => (
          <div
            key={item.id}
            className={styles.discoverCard}
            style={{ background: item.background }}
            onClick={() => navigate(item.path)}
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
