import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sortContentByOrder } from "../sectionRendererV2";
import SectionTitle from "./shared/SectionTitle";
import useRequireAuth from "../../../../utils/hooks/useRequireAuth";
import { getToken } from "../../../../utils/token";

const COMMUNITY_AVATARS_FALLBACK = [];

// Routes that require authentication. Guests hitting one of these get the guest
// login popup (via onRequireGuestAuth) instead of being redirected to /login.
const AUTH_REQUIRED_PATHS = ["/live"];

/**
 * Mobile-only AI Services 2×2 grid.
 * Desktop rendering is handled inline in HomeV2's hero section.
 *
 * @param {(url: string) => void} [onRequireGuestAuth] - called when a guest taps
 *   an auth-required card; the parent opens the inline guest login popup and
 *   navigates to `url` on success.
 */
const AiServicesSection = memo(({ sectionData, styles, onlineCount, onRequireGuestAuth }) => {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  /*
   * Cards with no destination are dropped rather than rendered.
   *
   * Clarity, Mobile Safari on the homepage: repeated dead clicks on image
   * elements. This is the mobile-only AI grid, so it is one of the tile
   * surfaces in play. `handleCardClick` is `if (url) { ... navigate(url) }`
   * with no else, so a CMS card missing both `redirect_url` and `link`
   * absorbed the tap silently — while still showing artwork, a "New" tag, a
   * heading and an `action_btn` that looks like a button.
   *
   * The old hint for that state was `cursor: "default"`, which does not exist
   * on a touch device. The card looked identical to a working one.
   */
  const items = sortContentByOrder(sectionData?.content || []).filter(
    (item) => !!(item?.redirect_url || item?.link)
  );

  const handleCardClick = useCallback((item) => {
    const url = item?.redirect_url || item?.link;
    if (url) {
      if (AUTH_REQUIRED_PATHS.some(path => url.startsWith(path))) {
        // Guest: prefer the inline guest login popup if the parent provides it,
        // otherwise fall back to the standard login redirect.
        if (!getToken()) {
          if (onRequireGuestAuth) {
            onRequireGuestAuth(url);
            return;
          }
          if (!requireAuth()) return;
        }
      }
      navigate(url);
    }
  }, [navigate, requireAuth, onRequireGuestAuth]);

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
            /*
             * role/tabIndex/onKeyDown: every card that reaches here has a
             * destination, so it is genuinely actionable and has to be
             * reachable and operable without a pointer. It stays a div rather
             * than becoming a <button> because the card contains an
             * `action_btn` <button>, and nesting interactive elements inside a
             * button is invalid; the inner button has no handler of its own and
             * works by bubbling up to this one.
             *
             * The `cursor` inline style is gone — with URL-less cards filtered
             * out there is no longer a "not clickable" state to signal, and the
             * class already sets pointer.
             */
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick(item);
              }
            }}
          >
            {item.ellipseClass && <div className={styles[item.ellipseClass]} />}
            {item.tag && <span className={styles.featureTag}>{item.tag}</span>}
            {!item.tag && <span className={styles.featureTag}>New</span>}
            <h3>{item.display_title || item.title}</h3>
            {item.description && <p>{item.description}</p>}
            {item.action_btn && (
              <button className={styles.fcCtaLight}>{item.action_btn}</button>
            )}
            {/* alt="" on the card art — the <h3> above already carries the title,
                so describing the image with it announced the title twice. */}
            {item.image_url_web || item.icon ? (
              <img
                src={item.image_url_web || item.icon}
                alt=""
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
