import { memo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sortContentByOrder } from "../sectionRendererV2";
import defaultSquareImg from "../../../../assets/images/default_image_square_500x500.png"
const SLUG_PATHS = {
  "free-kundli": "/kundli",
  "generate-my-kundli": "/kundli",
  "kundli": "/kundli",
  "talk-to-astrologer": "/astrologers",
  "talk-to-an-astrologer": "/astrologers",
  "astrologers": "/astrologers",
  "daily-horoscope": "/daily-horoscope",
  "explore-horoscope": "/daily-horoscope",
  "explore-daily-horoscope": "/daily-horoscope",
  "horoscope": "/daily-horoscope",
};

const ComplementaryServicesSection = memo(({ sectionData, styles }) => {
  const content = sortContentByOrder(sectionData?.content || []);

  if (!content.length) return null;

  return (
    <>
      {content.map((card) => (
        <Link
          key={card.ID || card.slug || card.title}
          className={styles.qCard}
          to={SLUG_PATHS[card.slug] || `/${card.slug}` || "/"}
        >
          <div className={styles.qText}>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
          <div className={styles.qImgWrap}>
            <div className={styles.qImgGlow} />
            <img
              src={card.image_url || card.icon || defaultSquareImg}
              alt={card.title}
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </Link>
      ))}
    </>
  );
});

ComplementaryServicesSection.displayName = "ComplementaryServicesSection";

export default ComplementaryServicesSection;
