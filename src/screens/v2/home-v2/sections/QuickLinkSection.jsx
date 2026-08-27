import { memo, useCallback, useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { sortContentByOrder } from "../sectionRendererV2";
import SectionTitle from "./shared/SectionTitle";
import defaultQuickImage from "../../../../assets/images/default_quickimage.png";

const SLUG_ROUTE_MAP = {
  horoscope: "/daily-horoscope",
  dasha: "/kundli?tab=dasha",
  "sade-sati": "/shani-sade-sati-calculator",
  "sade sati": "/shani-sade-sati-calculator",
  numerology: "/numerology-calculator",
  gemstone: "/kundli?tab=free-report&subtab=remedies&section=gemstones",
  remed: "/kundli?tab=free-report&subtab=remedies&section=rudraksha",
  birth: "/kundli",
  kundli: "/kundli",
  match: "/match-making",
  session: "/profile",
  order: "/profile",
  talk: "/astrologers",
  consult: "/astrologers",
  astrologer: "/astrologers",
};

/*
 * Resolve a quick-link tile's destination, or null when it has none.
 *
 * Clarity, Mobile Safari on the homepage: repeated dead clicks on image
 * elements from 00:42:59, the last at 00:44:47. These tiles are the homepage's
 * image-and-label grid, they are CMS-driven, and the old resolver navigated
 * inline with two arms that could return having done nothing at all:
 *
 *   1. is_internal true, but redirect_url and slug both empty
 *        -> `if (path) navigate(...)` never fired, function returned
 *   2. not internal, no redirect_url, and no slug AND no title
 *        -> fell past every SLUG_ROUTE_MAP keyword to `if (slug) navigate(...)`
 *
 * In both cases the tile still rendered — 64px of artwork with a label and
 * `cursor: pointer` — and swallowed every tap. Nothing repainted, so Clarity
 * logged a dead click, and a user who believes the tile is broken taps it
 * again, which is exactly the run in that session.
 *
 * Resolution is now a pure function returning a descriptor, so the caller can
 * drop tiles that resolve to nothing instead of rendering a trap. Same
 * rationale as ComplementaryServicesSection.resolveCardPath: an absent tile
 * beats one that eats the tap.
 */
const resolveQuickLink = (item) => {
  if (item?.is_internal === true || item?.is_internal === "true") {
    const path = item.redirect_url || item.slug;
    if (!path) return null;
    return { to: path.startsWith("/") ? path : `/${path}` };
  }

  if (item?.redirect_url) {
    return { href: item.redirect_url };
  }

  const slug =
    item?.slug || item?.title?.toLowerCase().replace(/\s+/g, "-") || "";
  for (const [keyword, route] of Object.entries(SLUG_ROUTE_MAP)) {
    if (slug.includes(keyword)) {
      // "session"/"order" land on /profile, which needs to be told which tab.
      return keyword === "session" || keyword === "order"
        ? { to: route, state: { activeTab: "Order History" } }
        : { to: route };
    }
  }

  return slug ? { to: `/${slug}` } : null;
};

const SCROLL_AMOUNT = 200;

const QuickLinkSection = memo(({ sectionData, styles }) => {
  const scrollRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  // Tiles with no resolvable destination are filtered out here, before render.
  const items = sortContentByOrder(sectionData?.content || [])
    .map((item) => ({ item, target: resolveQuickLink(item) }))
    .filter(({ target }) => !!target);

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
          {items.map(({ item, target }) => {
            const tileBody = (
              <>
                <div className={styles.gridIconBox}>
                  {/* alt="" — item.title is rendered as visible text in the <span>
                      just below, so a filled alt announced it twice. */}
                  <img
                    src={item.image_url_web || item.image_url || item.icon || defaultQuickImage}
                    alt=""
                    loading="lazy"
                  />
                </div>
                <span>{item.title}</span>
              </>
            );

            /*
             * Real anchors, not `div role="button"` + onClick. The tile is a
             * navigation, so letting the browser own the gesture buys back
             * everything a synthetic handler had to reimplement and didn't:
             * Space as well as Enter, middle-click and cmd-click, long-press
             * "open in new tab", a visible target in the status bar, and a
             * crawlable href. It also means a tap can no longer be absorbed by
             * JavaScript — if the href is there, the browser navigates.
             */
            return target.href ? (
              <a
                key={item.ID || item.slug || item.title}
                className={styles.gridItem}
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {tileBody}
              </a>
            ) : (
              <Link
                key={item.ID || item.slug || item.title}
                className={styles.gridItem}
                to={target.to}
                state={target.state}
              >
                {tileBody}
              </Link>
            );
          })}
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
