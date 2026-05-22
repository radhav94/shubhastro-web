import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { sortContentByOrder } from "../sectionRendererV2";
import SectionTitle from "./shared/SectionTitle";

const SLUG_ROUTES = {
  "vedic-kundli": "/kundli",
  kundli: "/kundli",
  numerology: "/numerology",
  tarot: "/tarot",
  "tarot-reading": "/tarot",
  matchmaking: "/match-making",
  "match-making": "/match-making",
  "kundli-matching": "/match-making",
  panchang: "/panchang",
};

const DISCOVER_BGS = ["#ffe4e400", "#fff3e400", "#e4eeff00", "#f0e4ff00"];

const DiscoverMoreSectionV2 = memo(({ sectionData, styles }) => {
  const navigate = useNavigate();
  const items = useMemo(() => sortContentByOrder(sectionData?.content || []), [sectionData?.content]);

  if (!items.length) return null;

  return (
    <div className={styles.discoverBox}>
      <div className={`${styles.titleWithBottomDevider} ${styles.tWBmarginBottomZero}`}>
        <SectionTitle
          title={sectionData?.display_title || sectionData?.title || "DISCOVER MORE"}
          styles={styles}
        />
      </div>
      <div className={styles.discoverGrid}>
        {items.map((item, i) => {
          const route = item.redirect_url || SLUG_ROUTES[item.slug] || (item.slug ? `/${item.slug}` : null);
          return (
            <div
              key={item.ID || item.slug || item.title}
              className={styles.discoverItem}
              onClick={() => route && navigate(route)}
              style={{ cursor: route ? "pointer" : "default" }}
              role={route ? "button" : undefined}
              tabIndex={route ? 0 : undefined}
              onKeyDown={(e) => route && e.key === "Enter" && navigate(route)}
            >
              <div
                className={styles.discoverIconBox}
                style={{
                  background: item.image_url
                    ? `url(${item.image_url}) center/100% no-repeat, ${DISCOVER_BGS[i % 4]}`
                    : DISCOVER_BGS[i % 4],
                }}
              />
              <span>{item.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

DiscoverMoreSectionV2.displayName = "DiscoverMoreSectionV2";

export default DiscoverMoreSectionV2;
