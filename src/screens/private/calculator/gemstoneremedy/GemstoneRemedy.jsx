import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  Info,
  Star,
  Clock,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  Download,
  Share2,
  Gem,
  Target,
  TrendingUp,
  Scale,
  ChevronRight,
  Search,
  ShoppingCart,
  Shuffle,
} from "lucide-react";
import { BsChatDots } from "react-icons/bs";
import { MdOutlinePhoneInTalk } from "react-icons/md";
import { createPortal } from "react-dom";

import { useGetGemStoneReportQuery } from "../../../../redux/api/kundli/planetApi";
import { buildVedicParam } from "../../../../utils/VedicParams.js/vedicParams";
import TTSButton from "../../../../component/UI/TTSButton";
import CalcReportLoader from "../CalcReportLoader";
import CalcBackButton from "../CalcBackButton";
import RecommendedAstrologersModal from "../../../../component/UI/modal/RecommendedAstrologersModal/RecommendedAstrologersModal";
import useRecommendationOffer from "../../../../utils/hooks/useRecommendationOffer";
import { Toast } from "../../../../component";
import ganpatiArt from "../../../../assets/images/muhurat/ganpati.png";
import heroFlourish from "../../../../assets/images/rashi/decor/hero-flourish.png";
import heroFlourishLeft from "../../../../assets/images/rashi/decor/hero-flourish-left.png";
import styles from "./GemstoneRemedy.module.scss";

/*
  Kundli-based Gemstone Remedy report.

  Data flow mirrors the Rashi report and the in-Kundli Gemstones tab: the birth
  form lives in Redux (`state.form.kundliPayload`), is turned into the shared
  vedic params, and drives `useGetGemStoneReportQuery`. The API's single
  `response` object (name, planet, description, good_results, time_to_wear,
  day, mantra, ...) is re-skinned here into the hero / expert-verify / benefit
  layout from the design.

  Note: the gem-suggestion endpoint has no dedicated auspicious-muhurat block,
  so the "Auspicious Muhurat" card is derived honestly from the fields it does
  send (the recommended wearing day + the short "time to wear" line) rather than
  inventing a precise clock time the API never returned.
*/

/*
  The design shows five benefit tiles with distinct icons. `good_results` from
  the API is a free-form list whose length and wording vary by gemstone, so the
  icons are assigned by position (cycling if there are more than five) — they are
  decorative accents, not a fixed taxonomy, so order never changes the meaning.
*/
const RESULT_ICONS = [ShieldCheck, Target, Sparkles, TrendingUp, Scale];

// A small hosted gemstone illustration keyed by the stone name, with a graceful
// fallback: the response carries no image, so we resolve one from the name and
// fall back to a generic gem glyph tile if it can't be loaded.
const GEM_IMAGE_BASE = "https://assets.shubhastro.ai/images/gemstones";

const slugifyGem = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/['’]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const titleCase = (value) =>
  String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const GemstoneRemedy = () => {
  const navigate = useNavigate();

  // The report is for signed-in users only. A guest who lands here directly is
  // sent to the Kundli form, where the sign-up flow runs on submit.
  const isLoggedIn = Boolean(localStorage.getItem("shubhtalk_customer_token"));
  useEffect(() => {
    if (!isLoggedIn) navigate("/kundli", { replace: true });
  }, [isLoggedIn, navigate]);

  const kundliPayload = useSelector((state) => state?.form?.kundliPayload);
  const userDetails = useSelector((state) => state?.form?.userDetails);

  const queryArgs = useMemo(
    () => (kundliPayload ? buildVedicParam(kundliPayload) : null),
    [kundliPayload]
  );

  const { data, isLoading } = useGetGemStoneReportQuery(
    queryArgs || skipToken,
    { skip: !queryArgs || !isLoggedIn }
  );

  const gem = data?.response;

  // Call / Chat open the plain recommendation list; closing it reveals the
  // discounted one once. See useRecommendationOffer.
  const recommendation = useRecommendationOffer();

  // The in-page back button shows the discounted offer once as an exit-intent
  // prompt; after that a Back press leaves the report normally.
  const backOfferShownRef = useRef(false);

  const [gemImgFailed, setGemImgFailed] = useState(false);

  const firstName = String(userDetails?.name || "").trim().split(/\s+/)[0] || "";

  const gemImage = useMemo(() => {
    if (gemImgFailed || !gem?.name) return "";
    const slug = slugifyGem(gem.name);
    return slug ? `${GEM_IMAGE_BASE}/${slug}.png` : "";
  }, [gem?.name, gemImgFailed]);

  const goodResults = useMemo(
    () => (Array.isArray(gem?.good_results) ? gem.good_results.filter(Boolean) : []),
    [gem?.good_results]
  );

  const ttsScript = useMemo(() => {
    if (!gem) return "";
    return [
      firstName ? `${firstName}, here is your gemstone remedy.` : "Your gemstone remedy.",
      gem.name && `Recommended gemstone: ${gem.name}.`,
      gem.planet && `It is worn to strengthen ${gem.planet}.`,
      gem.description,
      goodResults.length ? `Good results: ${goodResults.join(", ")}.` : "",
      gem.time_to_wear && `Time to wear: ${gem.time_to_wear}`,
      gem.mantra && `Mantra: ${gem.mantra}`,
    ]
      .filter(Boolean)
      .join(" ");
  }, [gem, firstName, goodResults]);

  // Share via the native sheet, falling back to copying the URL.
  const handleShare = async () => {
    const shareData = {
      title: gem?.name ? `${gem.name} — Gemstone Remedy` : "Gemstone Remedy",
      text: gem?.name
        ? `My recommended gemstone is ${gem.name}. Check your gemstone remedy on ShubhAstro.`
        : "Check your gemstone remedy on ShubhAstro.",
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      Toast.success("Link copied to clipboard");
    } catch {
      // User dismissed the share sheet, or the API is unavailable — ignore.
    }
  };

  // No PDF pipeline here, so use the browser's print dialog ("Save as PDF").
  const handleDownload = () => window.print();

  if (!isLoggedIn) return <CalcReportLoader />;
  if (!queryArgs || isLoading) return <CalcReportLoader />;
  if (!gem) return <div className={styles.empty}>No gemstone recommendation found</div>;

  const wearDay = titleCase(gem.day);

  return (
    <div className={styles.wrapper}>
      {/* Exit-intent offer on the in-page back button (same pattern as Rashi):
            - popup open      -> Back steps back inside it;
            - popup closed and offer not shown yet -> open the discounted offer;
            - offer already shown once -> Back navigates away as usual. */}
      <CalcBackButton
        onBack={() => {
          if (recommendation.isOpen) {
            recommendation.dismiss();
            return true;
          }
          if (!backOfferShownRef.current) {
            backOfferShownRef.current = true;
            recommendation.openOffer("chat");
            return true;
          }
          return false;
        }}
      />

      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>
          {firstName ? `${firstName}'s ` : ""}Gemstone <span>Remedy</span>
        </h1>
        <TTSButton text={ttsScript} />
      </div>

      <div className={styles.layout}>
        {/* ── MAIN COLUMN ─────────────────────────────────────────────── */}
        <div className={styles.main}>
          {/* HERO — gemstone image + "Recommended for you" */}
          <section className={styles.hero}>
            <img
              src={heroFlourish}
              alt=""
              aria-hidden="true"
              className={styles.heroFlourish}
            />
            <img
              src={heroFlourishLeft}
              alt=""
              aria-hidden="true"
              className={styles.heroFlourishLeft}
            />

            <div className={styles.heroGemWrap}>
              {gemImage ? (
                <img
                  src={gemImage}
                  alt={gem.name || "Recommended gemstone"}
                  className={styles.heroGem}
                  onError={() => setGemImgFailed(true)}
                  loading="lazy"
                />
              ) : (
                <span className={styles.heroGemFallback} aria-hidden="true">
                  <Gem size={44} />
                </span>
              )}
            </div>

            <div className={styles.heroCopy}>
              <span className={styles.heroBadge}>Personalized Recommendation</span>
              <h2 className={styles.heroTitle}>Recommended for you</h2>
              <p className={styles.heroText}>
                Based on your Kundli
                {gem.planet ? (
                  <>
                    , <strong className={styles.hl}>{gem.planet}</strong> is in a
                    challenging placement, and wearing{" "}
                  </>
                ) : (
                  ", wearing "
                )}
                <strong className={styles.hl}>{gem.name}</strong>
                {gem.other_name ? ` (${gem.other_name})` : ""} is advised to
                strengthen it.
              </p>
            </div>
          </section>

          {/* ABOUT */}
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardTitleIcon}>
                <Info size={16} aria-hidden="true" />
              </span>
              About {gem.name}
              {gem.other_name ? ` (${gem.other_name})` : ""}
            </h3>
            {gem.description && <p className={styles.cardBody}>{gem.description}</p>}
            <p className={styles.cardHint}>
              <Info size={13} aria-hidden="true" /> For the best results, choose a
              gemstone that is suitable for your chart and free from significant
              flaws.
            </p>
          </section>

          {/* GOOD RESULTS */}
          {goodResults.length > 0 && (
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>
                <span className={`${styles.cardTitleIcon} ${styles.iconGold}`}>
                  <Star size={16} aria-hidden="true" />
                </span>
                Good Results
              </h3>
              <div className={styles.resultGrid}>
                {goodResults.map((result, index) => {
                  const ResultIcon = RESULT_ICONS[index % RESULT_ICONS.length];
                  const [title, ...rest] = String(result).split(/[:\-–—]/);
                  const desc = rest.join(":").trim();
                  return (
                    <div className={styles.resultCard} key={`${result}-${index}`}>
                      <span className={styles.resultIcon}>
                        <ResultIcon size={16} aria-hidden="true" />
                      </span>
                      <p className={styles.resultTitle}>{title.trim()}</p>
                      {desc && <p className={styles.resultDesc}>{desc}</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* TIME TO WEAR + AUSPICIOUS MUHURAT */}
          <div className={styles.wearRow}>
            <section className={`${styles.card} ${styles.wearCard}`}>
              <h3 className={styles.cardTitle}>
                <span className={`${styles.cardTitleIcon} ${styles.iconBlue}`}>
                  <Clock size={16} aria-hidden="true" />
                </span>
                Time to Wear
              </h3>
              {wearDay && <p className={styles.wearBig}>{wearDay}</p>}
              {gem.time_to_wear_short && (
                <p className={styles.wearSub}>{gem.time_to_wear_short}</p>
              )}
              <div className={styles.wearFacts}>
                {gem.finger && (
                  <div className={styles.wearFact}>
                    <span className={styles.wearFactLabel}>Finger</span>
                    <span className={styles.wearFactValue}>{gem.finger}</span>
                  </div>
                )}
                {gem.metal && (
                  <div className={styles.wearFact}>
                    <span className={styles.wearFactLabel}>Metal</span>
                    <span className={styles.wearFactValue}>{gem.metal}</span>
                  </div>
                )}
                {gem.weight && (
                  <div className={styles.wearFact}>
                    <span className={styles.wearFactLabel}>Weight</span>
                    <span className={styles.wearFactValue}>{gem.weight}</span>
                  </div>
                )}
              </div>
              {gem.time_to_wear && (
                <p className={styles.wearNote}>
                  <Sparkles size={13} aria-hidden="true" /> {gem.time_to_wear}
                </p>
              )}
            </section>

            <section className={`${styles.card} ${styles.wearCard}`}>
              <h3 className={styles.cardTitle}>
                <span className={`${styles.cardTitleIcon} ${styles.iconGold}`}>
                  <CalendarDays size={16} aria-hidden="true" />
                </span>
                Your Auspicious Day
              </h3>
              {wearDay ? (
                <p className={styles.wearBig}>{wearDay}</p>
              ) : (
                <p className={styles.wearBig}>—</p>
              )}
              <p className={styles.wearSub}>Most favourable day to begin wearing</p>
              {gem.mantra && (
                <div className={styles.mantraBox}>
                  <span className={styles.mantraLabel}>Mantra</span>
                  <p className={styles.mantraText}>{gem.mantra}</p>
                </div>
              )}
              <p className={styles.wearNote}>
                <Sparkles size={13} aria-hidden="true" /> Wear with faith and follow
                the recommended time for the best results.
              </p>
            </section>
          </div>

          {/* ── GEMSTONE CTAs: verify an owned stone / buy a certified one ── */}
          <div className={styles.ctaRow}>
            <section className={`${styles.card} ${styles.ctaCard}`}>
              <div className={styles.ctaBody}>
                <h3 className={styles.ctaTitle}>Already own this gemstone?</h3>
                <p className={styles.ctaText}>
                  Verify it with our Gemstone Authenticity scanner.
                </p>
                <button
                  type="button"
                  className={styles.ctaBtn}
                  onClick={() => navigate("/gemstone-authenticity")}
                >
                  Verify My Gemstone <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
              <span className={styles.ctaArt} aria-hidden="true">
                <Search size={40} />
              </span>
            </section>

            <section className={`${styles.card} ${styles.ctaCard}`}>
              <div className={styles.ctaBody}>
                <h3 className={styles.ctaTitle}>Ready to get your gemstone?</h3>
                <p className={styles.ctaText}>
                  Connect with certified sellers for original and high quality
                  {gem.name ? ` ${gem.name}` : " gemstones"}.
                </p>
                <button
                  type="button"
                  className={styles.ctaBtn}
                  onClick={() =>
                    navigate(
                      `/shop?q=${encodeURIComponent(gem.name || "gemstone")}`
                    )
                  }
                >
                  Get from Certified Seller{" "}
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
              <span className={styles.ctaArt} aria-hidden="true">
                <ShoppingCart size={40} />
              </span>
            </section>
          </div>

          {/* ── ALTERNATIVE REMEDIES ─────────────────────────────────────── */}
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>
              <span className={`${styles.cardTitleIcon} ${styles.iconViolet}`}>
                <Shuffle size={16} aria-hidden="true" />
              </span>
              Prefer an Alternative Remedy?
            </h3>
            <p className={styles.cardBody}>
              If you do not wish to wear a gemstone, you can try these remedies.
            </p>
            <div className={styles.altGrid}>
              {[
                {
                  icon: "🕉",
                  title: "Mantra",
                  desc: gem.planet
                    ? `Regular chanting of ${gem.planet} mantra helps strengthen positive energies.`
                    : "Regular chanting of the ruling planet's mantra helps strengthen positive energies.",
                },
                {
                  icon: "₹",
                  title: "Charity",
                  desc: gem.day
                    ? `Charity on ${titleCase(gem.day)}s helps reduce the ill effects of ${gem.planet || "the planet"}.`
                    : `Charity on the recommended day helps reduce the ill effects of ${gem.planet || "the planet"}.`,
                },
                {
                  icon: "◎",
                  title: "Rudraksha",
                  desc: gem.planet
                    ? `${gem.planet} related Rudraksha may help bring stability and spiritual growth.`
                    : "A suitable Rudraksha may help bring stability and spiritual growth.",
                },
              ].map((alt) => (
                <div className={styles.altCard} key={alt.title}>
                  <span className={styles.altIcon} aria-hidden="true">
                    {alt.icon}
                  </span>
                  <p className={styles.altTitle}>{alt.title}</p>
                  <p className={styles.altDesc}>{alt.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <button
            type="button"
            className={styles.checkAnother}
            onClick={() => navigate("/kundli")}
          >
            View full Kundli <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>

        {/* ── SIDEBAR — EXPERT VERIFICATION ───────────────────────────── */}
        <aside className={styles.sidebar}>
          <div className={styles.verifyCard}>
            <div className={styles.cardTools}>
              <button
                type="button"
                className={styles.toolBtn}
                onClick={handleDownload}
                aria-label="Download report"
                title="Download"
              >
                <Download size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.toolBtn}
                onClick={handleShare}
                aria-label="Share report"
                title="Share"
              >
                <Share2 size={15} aria-hidden="true" />
              </button>
            </div>

            <span className={styles.verifyBadge}>★ Expert Verification</span>

            <h2 className={styles.verifyHeading}>
              Want an astrologer to verify this recommendation?
            </h2>

            <div className={styles.verifyPanel}>
              <p className={styles.verifyNote}>
                Connect with an experienced astrologer before choosing or wearing
                your gemstone.
              </p>
              <img
                src={ganpatiArt}
                alt=""
                aria-hidden="true"
                className={styles.verifyArt}
              />
            </div>

            <div className={styles.actions}>
              <a
                href="/astrologers"
                className={styles.actionPrimary}
                onClick={(event) => {
                  event.preventDefault();
                  recommendation.open("audio");
                }}
              >
                <MdOutlinePhoneInTalk size={15} aria-hidden="true" /> Call an astrologer
              </a>
              <a
                href="/chat-with-astrologers"
                className={styles.actionSecondary}
                onClick={(event) => {
                  event.preventDefault();
                  recommendation.open("chat");
                }}
              >
                <BsChatDots size={14} aria-hidden="true" /> Chat with astrologer
              </a>
              <button
                type="button"
                className={styles.actionTertiary}
                onClick={() => window.dispatchEvent(new CustomEvent("panditai:ask"))}
              >
                <Sparkles size={14} aria-hidden="true" /> Ask Pandit AI · Free
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile-only pinned actions — the sidebar Call/Chat are hidden on mobile.
          Portaled to <body> so `position: fixed` measures against the viewport. */}
      {createPortal(
        <div className={styles.mobileActionBar}>
          <a
            href="/chat-with-astrologers"
            className={styles.mobileActionChat}
            onClick={(event) => {
              event.preventDefault();
              recommendation.open("chat");
            }}
          >
            <BsChatDots size={16} aria-hidden="true" /> Chat with astrologer
          </a>
          <a
            href="/astrologers"
            className={styles.mobileActionCall}
            onClick={(event) => {
              event.preventDefault();
              recommendation.open("audio");
            }}
          >
            <MdOutlinePhoneInTalk size={16} aria-hidden="true" /> Call an astrologer
          </a>
        </div>,
        document.body
      )}

      <RecommendedAstrologersModal
        isOpen={recommendation.isOpen}
        variant={recommendation.stage === "offer" ? "offer" : "plain"}
        type={recommendation.type || "chat"}
        onDismiss={recommendation.dismiss}
        onFinish={recommendation.finish}
        onNothingToOffer={recommendation.finish}
        onExitClose={() => {}}
        onExitOffer={() => recommendation.openOffer("chat")}
        returnTo={`${window.location.pathname}${window.location.search}`}
      />
    </div>
  );
};

export default GemstoneRemedy;
