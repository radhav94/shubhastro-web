import { memo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sortContentByOrder } from "../sectionRendererV2";

const SLUG_PATHS = {
  "free-kundli": "/kundli",
  "talk-to-astrologer": "/chat-to-astrologer",
  "daily-horoscope": "/daily-horoscope",
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
          to={SLUG_PATHS[card.slug] || "/"}
        >
          <div className={styles.qText}>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
          <div className={styles.qImgWrap}>
            <div className={styles.qImgGlow} />
            <img
              src={card.image_url || card.icon}
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
