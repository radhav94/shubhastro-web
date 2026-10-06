import { useNavigate } from "react-router-dom";
import useFreeSession from "../../../utils/hooks/useFreeSession";
import { trackEvent } from "../../../utils/analytics";
import { PATH } from "../../../utils/routes/Paths";
import styles from "./TalkToAstrologer.module.scss";

/*
 * Offer banner above the astrologer list, from the astrologers list API.
 *
 *   free first session still available → `firstConsultationOffer` banner
 *   free session used                  → `firstRechargeOffer` banner, which
 *                                        opens the recharge page
 *   chosen offer null / no image       → no banner
 *
 * Signed-out visitors still have the free first session ahead of them, so they
 * get the consultation offer too.
 *
 * Image: `webBannerUrl` on desktop, `appBannerUrl` on mobile web (≤767px);
 * each falls back to the other when only one is sent.
 */

const MOBILE_MEDIA = "(max-width: 767px)";

const textOf = (v) => (typeof v === "string" ? v.trim() : "");

/** Banner images of the first usable entry in an offer (array or object). */
const bannerOf = (offer) => {
  const list = Array.isArray(offer) ? offer : offer ? [offer] : [];
  const hit = list.find((o) => textOf(o?.webBannerUrl) || textOf(o?.appBannerUrl));
  if (!hit) return null;
  const web = textOf(hit.webBannerUrl);
  const app = textOf(hit.appBannerUrl);
  return { web: web || app, app: app || web };
};

const BannerImage = ({ banner, alt }) => (
  <picture>
    <source media={MOBILE_MEDIA} srcSet={banner.app} />
    <img src={banner.web} alt={alt} className={styles.offerBannerImg} />
  </picture>
);

/** The offers may sit on the response root or under `data`. */
const readOffer = (response, key) => {
  if (!response) return undefined;
  if (response[key] !== undefined) return response[key];
  if (response.data && !Array.isArray(response.data) && response.data[key] !== undefined) {
    return response.data[key];
  }
  return undefined;
};

const FirstSessionOfferBanner = ({ response }) => {
  const navigate = useNavigate();
  const isFreeEligible = useFreeSession();
  const isLoggedIn = !!localStorage.getItem("shubhtalk_customer_token");
  const showConsultation = !isLoggedIn || isFreeEligible;

  const banner = bannerOf(
    readOffer(response, showConsultation ? "firstConsultationOffer" : "firstRechargeOffer")
  );
  if (!banner) return null;

  const alt = showConsultation
    ? "Your first consultation is free"
    : "First recharge offer";

  if (showConsultation) {
    return (
      <div className={styles.offerBanner}>
        <BannerImage banner={banner} alt={alt} />
      </div>
    );
  }

  const openRecharge = () => {
    trackEvent("first_recharge_banner_clicked", { route_path: window.location.pathname });
    const returnUrl = `${window.location.pathname}${window.location.search}`;
    navigate(`${PATH.privateRoutes.RECHARGE.path}?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  return (
    <button
      type="button"
      className={`${styles.offerBanner} ${styles.offerBannerBtn}`}
      onClick={openRecharge}
      aria-label="First recharge offer — recharge now"
    >
      <BannerImage banner={banner} alt={alt} />
    </button>
  );
};

export default FirstSessionOfferBanner;
