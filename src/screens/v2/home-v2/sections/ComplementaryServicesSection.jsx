import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sortContentByOrder } from "../sectionRendererV2";

const SLUG_PATHS = {
  "free-kundli": "/kundli",
  "talk-to-astrologer": "/chat-to-astrologer",
  "daily-horoscope": "/daily-horoscope",
};

const ComplementaryServicesSection = memo(({ sectionData, styles }) => {
  const navigate = useNavigate();
  const content = sortContentByOrder(sectionData?.content || []);

  const handleClick = useCallback((slug) => {
    navigate(SLUG_PATHS[slug] || "/");
  }, [navigate]);

  if (!content.length) return null;

  return (
    <>
      {content.map((card) => (
        <div
          key={card.ID || card.slug || card.title}
          className={styles.qCard}
          onClick={() => handleClick(card.slug)}
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
        </div>
      ))}
    </>
  );
});

ComplementaryServicesSection.displayName = "ComplementaryServicesSection";

export default ComplementaryServicesSection;
