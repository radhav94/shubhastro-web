import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sortContentByOrder } from "../sectionRendererV2";
import SectionTitle from "./shared/SectionTitle";
import useRequireAuth from "../../../../utils/hooks/useRequireAuth";

const COMMUNITY_AVATARS_FALLBACK = [];

// Routes that require authentication
const AUTH_REQUIRED_PATHS = [];

/**
 * Mobile-only AI Services 2×2 grid.
 * Desktop rendering is handled inline in HomeV2's hero section.
 */
const AiServicesSection = memo(({ sectionData, styles, onlineCount }) => {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const items = sortContentByOrder(sectionData?.content || []);

  const handleCardClick = useCallback((item) => {
    const url = item?.redirect_url || item?.link;
    if (url) {
      if (AUTH_REQUIRED_PATHS.some(path => url.startsWith(path))) {
        if (!requireAuth()) return;
      }
      navigate(url);
    }
  }, [navigate, requireAuth]);

  if (!items.length) return null;

  return (
    <section className={styles.mobileAiGrid}>
      <SectionTitle
        title={sectionData?.display_title || sectionData?.title}
        styles={styles}
      />
      <div className={styles.mobileAiGridRow}>
        {items.map((item, index) => (
          <div
            key={item._id || index}
            className={`${styles.mobileAiCard} ${styles[item.className] || ""}`}
            onClick={() => handleCardClick(item)}
            style={{ cursor: item?.redirect_url || item?.link ? "pointer" : "default" }}
          >
            {item.ellipseClass && <div className={styles[item.ellipseClass]} />}
            {item.tag && <span className={styles.featureTag}>{item.tag}</span>}
            {!item.tag && <span className={styles.featureTag}>New</span>}
            <h3>{item.display_title || item.title}</h3>
            {item.description && <p>{item.description}</p>}
            {item.action_btn && (
              <button className={styles.fcCtaLight}>{item.action_btn}</button>
            )}
            {item.image_url_web || item.icon ? (
              <img
                src={item.image_url_web || item.icon}
                alt={item.title || ""}
                className={styles.mobileAiCardImg}
                loading="lazy"
              />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
});

AiServicesSection.displayName = "AiServicesSection";

export default AiServicesSection;
