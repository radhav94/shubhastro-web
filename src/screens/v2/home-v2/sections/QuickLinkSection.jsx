import { memo, useCallback, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sortContentByOrder } from "../sectionRendererV2";
import SectionTitle from "./shared/SectionTitle";
import defaultQuickImage from "../../../../assets/images/default_quickimage.png";

const SLUG_ROUTE_MAP = {
  horoscope: "/daily-horoscope",
  dasha: "/kundli?tab=dasha",
  "sade-sati": "/shani-sade-sati-calculator",
  "sade sati": "/shani-sade-sati-calculator",
  numerology: "/numerology-calculator",
  remed: "/kundli?tab=free-report&subtab=remedies",
  birth: "/kundli",
  kundli: "/kundli",
  match: "/match-making",
  session: "/profile",
  order: "/profile",
  talk: "/chat-to-astrologer",
  consult: "/chat-to-astrologer",
  astrologer: "/chat-to-astrologer",
};

const resolveRoute = (item, navigate) => {
  if (item.is_internal === true || item.is_internal === "true") {
    const path = item.redirect_url || item.slug;
    if (path) navigate(path.startsWith("/") ? path : `/${path}`);
    return;
  }

  if (item.redirect_url) {
    window.open(item.redirect_url, "_blank", "noopener,noreferrer");
    return;
  }

  const slug = item.slug || item.title?.toLowerCase().replace(/\s+/g, "-") || "";
  for (const [keyword, route] of Object.entries(SLUG_ROUTE_MAP)) {
    if (slug.includes(keyword)) {
      if (keyword === "session" || keyword === "order") {
        navigate(route, { state: { activeTab: "Order History" } });
      } else {
        navigate(route);
      }
      return;
    }
  }
  if (slug) navigate(`/${slug}`);
};

const SCROLL_AMOUNT = 200;

const QuickLinkSection = memo(({ sectionData, styles }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const items = sortContentByOrder(sectionData?.content || []);

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setHasOverflow(el.scrollWidth > el.clientWidth);
  }, []);

  useEffect(() => {
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [checkOverflow, items.length]);

  const handleScroll = useCallback((direction) => {
    scrollRef.current?.scrollBy({
      left: direction * SCROLL_AMOUNT,
      behavior: "smooth",
    });
  }, []);

  if (!items.length) return null;

  return (
    <section className={styles.quickGrid}>
      <div className={styles.quickGridHeader}>
        <SectionTitle title={sectionData?.display_title || sectionData?.title || "QUICK LINKS"} styles={styles} />
      </div>

      <div className={styles.quickScrollWrap}>
        {hasOverflow && (
          <button className={styles.quickArrow} onClick={() => handleScroll(-1)} aria-label="Scroll left">
            ‹
          </button>
        )}

        <div className={styles.gridRow} ref={scrollRef}>
          {items.map((item) => (
            <div
              key={item.ID || item.slug || item.title}
              className={styles.gridItem}
              onClick={() => resolveRoute(item, navigate)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && resolveRoute(item, navigate)}
            >
              <div className={styles.gridIconBox}>
                <img
                  src={item.image_url_web || item.image_url || item.icon || defaultQuickImage}
                  alt={item.title}
                  loading="lazy"
                />
              </div>
              <span>{item.title}</span>
            </div>
          ))}
        </div>

        {hasOverflow && (
          <button className={styles.quickArrow} onClick={() => handleScroll(1)} aria-label="Scroll right">
            ›
          </button>
        )}
      </div>
    </section>
  );
});

QuickLinkSection.displayName = "QuickLinkSection";

export default QuickLinkSection;
