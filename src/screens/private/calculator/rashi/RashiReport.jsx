import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ChevronRight,
  Clock,
  Crown,
  Download,
  Gem,
  MapPin,
  Moon,
  Phone,
  Share2,
  Sparkles,
  Star,
} from "lucide-react";
import heroFlourish from "../../../../assets/images/rashi/decor/hero-flourish.png";
import heroFlourishLeft from "../../../../assets/images/rashi/decor/hero-flourish-left.png";
import chipPlanet from "../../../../assets/images/rashi/icons/chip-planet.png";
import chipElements from "../../../../assets/images/rashi/icons/chip-elements.png";
import chipLuckyColor from "../../../../assets/images/rashi/icons/chip-lucky-color.png";
import chipLuckyDay from "../../../../assets/images/rashi/icons/chip-lucky-day.png";
import secPersonality from "../../../../assets/images/rashi/icons/sec-personality.png";
import secStrengths from "../../../../assets/images/rashi/icons/sec-strengths.png";
import secGrowth from "../../../../assets/images/rashi/icons/sec-growth.png";
import secLove from "../../../../assets/images/rashi/icons/sec-love.png";
import secCareer from "../../../../assets/images/rashi/icons/sec-career.png";
import secNakshatra from "../../../../assets/images/rashi/icons/sec-nakshatra.png";
import secCompatible from "../../../../assets/images/rashi/icons/sec-compatible.png";
import cardPersonality from "../../../../assets/images/rashi/decor/card-personality.png";
import cardStrengths from "../../../../assets/images/rashi/decor/card-strengths.png";
import cardGrowth from "../../../../assets/images/rashi/decor/card-growth.png";
import cardLove from "../../../../assets/images/rashi/decor/card-love.png";
import detailCardBg from "../../../../assets/images/rashi/decor/detail-card-bg.png";
import detailUserIcon from "../../../../assets/images/rashi/icons/detail-user.png";
import detailTimeIcon from "../../../../assets/images/rashi/icons/detail-time.png";
import detailCalendarIcon from "../../../../assets/images/rashi/icons/detail-calendar.png";
import detailPlaceIcon from "../../../../assets/images/rashi/icons/detail-place.png";
import careerArt from "../../../../assets/images/rashi/decor/career-art.png";
import { BsChatDots } from "react-icons/bs";
import { useGetRashiCalQuery } from "../../../../redux/api/calculator/calcApi";
import CalcReportLoader from "../CalcReportLoader";
import styles from "./RashiReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import TTSButton from "../../../../component/UI/TTSButton";
import { Toast } from "../../../../component";
import { zodiacSignImages } from "../../horoscope/zodiac";
import { rashiDecorTiles } from "../../../../utils/rashiImages";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import RecommendedAstrologersModal from "../../../../component/UI/modal/RecommendedAstrologersModal/RecommendedAstrologersModal";
import useRecommendationOffer from "../../../../utils/hooks/useRecommendationOffer";

/** Turn a value that may be a string, an array, or absent into an array of lines. */
const toLines = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

/** Join list-ish values for display: ["copper"] -> "Copper" */
const toText = (value) => {
  const lines = toLines(value);
  if (!lines.length) return "";
  return lines.join(", ");
};

const formatDate = (dob) => {
  if (!dob) return "";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return String(dob);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

/** "10:30" -> "10:30 AM". Left as-is when it already carries a meridiem. */
const formatTime = (tob) => {
  if (!tob) return "";
  if (/[ap]\.?m\.?/i.test(tob)) return tob;
  const [hRaw, mRaw = "00"] = String(tob).split(":");
  const h = Number(hRaw);
  if (Number.isNaN(h)) return tob;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(mRaw).padStart(2, "0")} ${suffix}`;
};

/*
  The API sends the dasha chain in graha shorthand ("Mo>Ve>Ju"). Shown raw it
  means nothing to a reader, and the snapshot copy right below it already talks
  about the "Venus sub-dasha" in words — so expand it and keep the two agreeing.
  Anything unrecognised passes through untouched rather than being dropped.
*/
const GRAHA_NAMES = {
  su: "Sun",
  mo: "Moon",
  ma: "Mars",
  me: "Mercury",
  ju: "Jupiter",
  ve: "Venus",
  sa: "Saturn",
  ra: "Rahu",
  ke: "Ketu",
};

const formatDasha = (chain) => {
  if (!chain || typeof chain !== "string") return "";
  return chain
    .split(/[>\-/›]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => GRAHA_NAMES[part.toLowerCase()] || part)
    .join(" › ");
};

/**
 * Hosted artwork, rendering nothing if it cannot be loaded.
 *
 * The per-sign images all come from the API (S3) now; the bundled copies that
 * used to back them have been removed. `local` is therefore optional and is only
 * passed where an already-shipped asset happens to fit — the zodiac glyphs the
 * horoscope screens use — so a failed request degrades to a glyph rather than to
 * a broken image, at no extra download.
 *
 * @param {Object} props
 * @param {string} [props.remote] - hosted URL from the API
 * @param {string} [props.local]  - optional already-bundled fallback
 */
const ArtImage = ({ remote, local, className, alt = "" }) => {
  const [remoteFailed, setRemoteFailed] = useState(false);
  const src = !remoteFailed && remote ? remote : local;
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt ? undefined : "true"}
      className={className}
      loading="lazy"
      onError={() => setRemoteFailed(true)}
    />
  );
};

/** Five stars, `rating` of them filled. */
const DayRating = ({ rating }) => {
  const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <span className={styles.stars} aria-label={`${filled} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          aria-hidden="true"
          className={i <= filled ? styles.starOn : styles.starOff}
          strokeWidth={2}
        />
      ))}
    </span>
  );
};

/**
 * A titled panel. `lines` may be a paragraph or a list — the API currently sends
 * single sentences for strengths/growth areas but the design shows them as
 * bullets, so render whichever arrives instead of assuming one shape.
 */
const InsightCard = ({ icon, decor, title, lines, variant, cornerArt }) => {
  const items = toLines(lines);
  if (!items.length) return null;
  return (
    <section className={`${styles.insightCard} ${variant ? styles[variant] : ""}`}>
      {/* Per-card swirl in the bottom-left corner. Comes pre-tinted to the card's
          accent colour, so there is nothing to theme here. */}
      {decor && (
        <img src={decor} alt="" aria-hidden="true" className={styles.cardDecor} />
      )}
      <h3 className={styles.insightTitle}>
        <img src={icon} alt="" className={styles.insightIcon} />
        {title}
      </h3>
      {items.length === 1 ? (
        <p className={styles.insightText}>{items[0]}</p>
      ) : (
        <ul className={styles.insightList}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {/* Optional sign artwork tucked into the bottom-right corner. Shown only on
          mobile (see .cardCornerArt) where the hero's own artwork is hidden. */}
      {cornerArt && (
        <ArtImage remote={cornerArt} className={styles.cardCornerArt} />
      )}
    </section>
  );
};

const RashiReport = () => {
  const navigate = useNavigate();
  const stored = useSelector(selectCalculatorData("rashi_moon_sign"));

  // The report is for signed-in users only. A guest who lands here directly
  // (e.g. via a bookmarked URL) is sent back to the calculator, where the
  // sign-up popup is shown on submit.
  const isLoggedIn = Boolean(localStorage.getItem("shubhtalk_customer_token"));
  useEffect(() => {
    if (!isLoggedIn) navigate("/rashi-calculator", { replace: true });
  }, [isLoggedIn, navigate]);

  const { data, isLoading } = useGetRashiCalQuery(stored, {
    skip: !stored || !isLoggedIn,
  });

  const response = data?.response;
  const enriched = response?.enriched;

  // The coin needs its own failure flag rather than going through ArtImage: when
  // the hosted logo is unavailable AND there is no local coin export, we drop to
  // the repo's flat zodiac glyph, which only looks right inside the CSS gold
  // disc. That styling decision depends on whether the load succeeded.
  const [signLogoFailed, setSignLogoFailed] = useState(false);

  // Call / Chat open the plain recommendation list; closing it reveals the
  // discounted one once. See useRecommendationOffer.
  const recommendation = useRecommendationOffer();

  // The in-page back button shows the discounted offer once as an exit-intent
  // prompt; after that a Back press leaves the report normally.
  const backOfferShownRef = useRef(false);

  // Everything the hero needs, resolved once. Both images come from the API.
  const hero = useMemo(() => {
    const sign = response?.moon_sign || "";
    const hostedLogo = signLogoFailed ? "" : enriched?.signLogoUrl || "";
    return {
      sign,
      // Landscape artwork behind the card's right edge, named per sign by the API.
      art: enriched?.signIllustrationUrl || "",
      /*
        The hosted logo, or the zodiac glyph struck into a CSS gold disc if it
        cannot be loaded. That glyph is not a rashi-report asset — it is the
        zodiac set the horoscope screens already ship — so this fallback adds no
        weight, and it keeps the hero from rendering an empty circle when S3 is
        unreachable.
      */
      coin: hostedLogo || zodiacSignImages[sign.toLowerCase()] || "",
      coinIsArt: !!hostedLogo,
    };
  }, [
    response?.moon_sign,
    enriched?.signLogoUrl,
    enriched?.signIllustrationUrl,
    signLogoFailed,
  ]);

  // Split the decorative tiles down the two banner edges. Halved rather than
  // hardcoded to 3+3 so dropping a tile in or out of the folder still balances.
  const half = Math.ceil(rashiDecorTiles.length / 2);
  const leftTiles = rashiDecorTiles.slice(0, half);
  const rightTiles = rashiDecorTiles.slice(half);

  // Reserves in-flow height while the request runs — see CalcReportLoader.
  // (Was a default `<PrimaryLoader isLoading />`, which is `position: fixed` and
  // so contributed no height, letting the footer ride up into the viewport until
  // the report landed.)
  if (!stored || isLoading) return <CalcReportLoader />;
  if (!response) return <div className={styles.empty}>No data found</div>;

  const { moon_sign: moonSign, prediction, bot_response: botResponse } = response;
  const e = enriched || {};

  const firstName = String(stored?.name || "").trim().split(/\s+/)[0] || "";

  const ttsScript = [
    `${stored?.name || "Your"} personal Rashi report.`,
    moonSign && `Your moon sign is ${moonSign}.`,
    e.todayTransit && `Today. ${e.todayTransit}`,
    e.personality && `Personality. ${e.personality}`,
    toText(e.snapshot?.strengths) && `Strengths. ${toText(e.snapshot?.strengths)}`,
    toText(e.snapshot?.growthAreas) && `Growth areas. ${toText(e.snapshot?.growthAreas)}`,
    toText(e.snapshot?.love) && `Love. ${toText(e.snapshot?.love)}`,
    toText(e.snapshot?.career) && `Career. ${toText(e.snapshot?.career)}`,
    e.nakshatraAbout && `About ${e.nakshatra}. ${e.nakshatraAbout}`,
    prediction,
  ]
    .filter(Boolean)
    .join(" ");

  /*
    Chip icons are the design's own exports (already colour-tinted, so no CSS
    gradient behind them). `tone` still sets the label colour, sampled from each
    icon: violet / orange / red / pink.
  */
  const chips = [
    { label: "Planet", value: e.rulingPlanet, icon: chipPlanet, tone: "toneViolet" },
    { label: "Elements", value: e.element, icon: chipElements, tone: "toneOrange" },
    { label: "Lucky Color", value: toText(e.luckyColors), icon: chipLuckyColor, tone: "toneRed" },
    { label: "Lucky Day", value: e.luckyDay, icon: chipLuckyDay, tone: "tonePink" },
  ].filter((c) => c.value);

  const personalDetails = [
    { icon: detailUserIcon, label: "Name", value: stored?.name },
    { icon: detailTimeIcon, label: "Time of Birth", value: formatTime(stored?.tob) },
    { icon: detailCalendarIcon, label: "Date of Birth", value: formatDate(stored?.dob) },
    { icon: detailPlaceIcon, label: "Place of Birth", value: stored?.place },
  ].filter((d) => d.value);

  // Share the report via the native share sheet, falling back to copying the URL.
  const handleShare = async () => {
    const shareData = {
      title: `${stored?.name ? stored.name + "'s " : ""}Rashi Report`,
      text: moonSign ? `My moon sign is ${moonSign}. Check your Rashi report on ShubhAstro.` : "Check your Rashi report on ShubhAstro.",
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

  // No PDF pipeline on this calculator report, so use the browser's print
  // dialog (which offers "Save as PDF").
  const handleDownload = () => window.print();

  return (
    <div className={styles.wrapper}>
      {/* Exit-intent offer on the in-page back button:
            - popup already open -> the Back steps back inside it (escalate the
              plain list to the offer, or close the offer);
            - popup closed and the offer hasn't been shown yet -> open the
              discounted offer instead of leaving the report;
            - offer already shown once -> let Back navigate away as usual. */}
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

      <div className={styles.layout}>
        {/* Header + hero live in their own group so that on mobile the sidebar
            ("Want to know more") can sit directly beneath the hero, above the
            Today strip and the rest of the report. On desktop this group sits
            in the left column above .main. */}
        <div className={styles.topGroup}>
          <header className={styles.pageHeader}>
            {/* Decorative only — the zodiac tiles carry no information, so they
                are aria-hidden and sit behind the copy rather than beside it. */}
            <div className={styles.decorLeft} aria-hidden="true">
              {leftTiles.map((src, i) => (
                <img src={src} alt="" key={`l${i}`} loading="lazy" />
              ))}
            </div>
            <div className={styles.decorRight} aria-hidden="true">
              {rightTiles.map((src, i) => (
                <img src={src} alt="" key={`r${i}`} loading="lazy" />
              ))}
            </div>

            <div className={styles.pageHeaderInner}>
              <h1 className={styles.pageTitle}>
                {stored?.name ? `${stored.name}'s ` : ""}Personal <span>Rashi</span> Report
              </h1>
              <p className={styles.pageSubtitle}>
                Explore your inner nature through your Moon sign, Nakshatra and planetary
                influences along with insights into love, career, strengths and areas of growth.
              </p>
            </div>
          </header>

          {/* HERO — coin, sign name, nakshatra placement, attribute chips, art */}
          {moonSign && (
            <section className={styles.hero}>
              {/*
                Top row: coin beside the sign header. Grouped so that on mobile
                the coin + badge + sign name stay on one line while the meta and
                attribute blocks below each take the card's full width.
              */}
              <div className={styles.heroTop}>
                {/*
                  Coin. When the design's own coin export is present it is used as
                  a plain image. Otherwise the gold disc is drawn in CSS with the
                  repo's zodiac glyph on top — that art is already correctly mapped
                  per sign, so this is right for all twelve signs today rather than
                  only for whichever coin files have been named.
                */}
                {hero.coin && (
                  <div
                    className={`${styles.heroCoinWrap} ${hero.coinIsArt ? "" : styles.heroCoinMinted}`}
                  >
                    <img
                      src={hero.coin}
                      alt=""
                      className={styles.heroCoin}
                      onError={() => setSignLogoFailed(true)}
                    />
                  </div>
                )}

                {/* Sign header — badge + sign name + read-aloud, with the
                    Nakshatra / Moon / Dasha meta stacked directly beneath. */}
                <div className={styles.heroSignHeader}>
                  <span className={styles.heroBadge}>
                    <Moon size={12} aria-hidden="true" /> Your Moon Sign
                  </span>

                  <div className={styles.heroSignRow}>
                    <h2 className={styles.heroSign}>{moonSign}</h2>
                    <span className={styles.heroTts}>
                      <TTSButton text={ttsScript} />
                    </span>
                  </div>

                  <dl className={styles.heroMeta}>
                    {e.nakshatra && (
                      <div>
                        <dt>
                          <MapPin size={13} aria-hidden="true" />
                          {e.nakshatraPada ? `Pada ${e.nakshatraPada}` : "Nakshatra"}
                        </dt>
                        <dd>{e.nakshatra} Nakshatra</dd>
                      </div>
                    )}
                    {e.moonDegree && (
                      <div>
                        <dt>
                          <Moon size={13} aria-hidden="true" />
                          Moon at
                        </dt>
                        <dd>
                          {e.moonDegree} {moonSign}
                        </dd>
                      </div>
                    )}
                    {formatDasha(e.currentDasha) && (
                      <div>
                        <dt>
                          <Clock size={13} aria-hidden="true" />
                          Current Dasha
                        </dt>
                        <dd>{formatDasha(e.currentDasha)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Attributes */}
              <div className={styles.heroAttributes}>
                {e.symbol && (
                  <span className={styles.heroSymbol}>
                    <span className={styles.heroSymbolIcon} aria-hidden="true">
                      <Gem size={14} strokeWidth={2.2} />
                    </span>
                    {e.symbol}
                  </span>
                )}

                {chips.length > 0 && (
                  <dl className={styles.chipGrid}>
                    {chips.map((c) => (
                      <div key={c.label} className={`${styles.chip} ${styles[c.tone]}`}>
                        <img src={c.icon} alt="" className={styles.chipIcon} />
                        <dt>{c.label}</dt>
                        <dd>{c.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>

              {/* Decorative flourishes — top-right and bottom-left corners.
                  Painted under the sign art and the copy. */}
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

              <ArtImage remote={hero.art} className={styles.heroArt} />
            </section>
          )}
        </div>

        <div className={styles.main}>
          {/* TODAY STRIP */}
          {(e.todayTransit || e.dayRating || e.luckyTime) && (
            <section className={styles.todayStrip}>
              {e.todayTransit && (
                <div className={`${styles.todayCard} ${styles.todayCardWarm}`}>
                  <h3>Today for {moonSign}</h3>
                  <p>{e.todayTransit}</p>
                </div>
              )}
              {e.dayRating != null && (
                <div className={`${styles.todayCard} ${styles.todayCardPink}`}>
                  <h3>
                    Positive Day <DayRating rating={e.dayRating} />
                  </h3>
                  <p>Today the Moon favours your plans in line with this rating.</p>
                </div>
              )}
              {e.luckyTime && (
                <div className={`${styles.todayCard} ${styles.todayCardLilac}`}>
                  <h3>Lucky Time — {e.luckyTime}</h3>
                  {/* The API now says what the window is actually good for, which
                      is specific to the day's transit. The generic line is kept
                      only for payloads that don't carry it yet. */}
                  <p>
                    {e.luckyTimeReason ||
                      "Use this window for important calls, decisions and work that needs focus."}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* INSIGHT GRID */}
          <div className={styles.insightGrid}>
            <InsightCard
              icon={secPersonality}
              decor={cardPersonality}
              title="Personality Snapshot"
              lines={e.personality}
            />
            <InsightCard
              icon={secStrengths}
              decor={cardStrengths}
              title="Your Strengths"
              lines={e.snapshot?.strengths}
            />
            <InsightCard
              icon={secGrowth}
              decor={cardGrowth}
              title="Growth Areas"
              lines={e.snapshot?.growthAreas}
            />
            <InsightCard
              icon={secLove}
              decor={cardLove}
              title="Love"
              lines={e.snapshot?.love}
            />
          </div>

          <InsightCard
            icon={secCareer}
            title="Career"
            lines={e.snapshot?.career}
            variant="wideCard"
            cornerArt={careerArt}
          />

          {/* NAKSHATRA + COMPATIBILITY */}
          <div className={styles.bottomRow}>
            {(e.nakshatra || e.nakshatraAbout) && (
              <section className={styles.nakshatraCard}>
                <h3 className={styles.insightTitle}>
                  <img src={secNakshatra} alt="" className={styles.insightIcon} />
                  Your Nakshatra: {e.nakshatra}
                </h3>

                <div className={styles.nakshatraBody}>
                  {/* No caption: the hosted artwork already carries the figure's
                      name rendered into the image itself, and the nakshatra's
                      deity is listed in the tag row beside it. */}
                  {e.godImageUrl && (
                    <figure className={styles.nakshatraFigure}>
                      <ArtImage remote={e.godImageUrl} />
                      {e.deity && (
                        <span className={styles.deityPill}>
                          <Crown size={15} aria-hidden="true" /> Deity: {e.deity}
                        </span>
                      )}
                    </figure>
                  )}

                  <div className={styles.nakshatraText}>
                    {e.nakshatraAbout && (
                      <>
                        <h4>About {e.nakshatra}</h4>
                        <p>{e.nakshatraAbout}</p>
                      </>
                    )}
                    <div className={styles.tagRow}>
                      {/* Deity is now shown as the pill over the god image. */}
                      {e.nakshatraSymbol && <span>Symbol: {e.nakshatraSymbol}</span>}
                      {e.gana && <span className={styles.tagCap}>Gana: {e.gana}</span>}
                      {toText(e.nature) && <span>Nature: {toText(e.nature)}</span>}
                      {e.nakshatraLord && <span>Lord: {e.nakshatraLord}</span>}
                      {e.animalSymbol && (
                        <span className={styles.tagCap}>Animal: {e.animalSymbol}</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {e.compatible_rashis?.length > 0 && (
              <section className={styles.compatCard}>
                <h3 className={styles.insightTitle}>
                  <img src={secCompatible} alt="" className={styles.insightIcon} />
                  Most Compatible Rashis
                </h3>
                <ul className={styles.compatList}>
                  {e.compatible_rashis.map((c) => (
                    <li key={c.rashi}>
                      <div className={styles.compatHead}>
                        {/* Each entry now carries its own hosted logo; the repo
                            glyph stays as the fallback. */}
                        <ArtImage
                          remote={c.signLogoUrl}
                          local={zodiacSignImages[String(c.rashi || "").toLowerCase()]}
                        />
                        <span>{c.rashi}</span>
                      </div>
                      {c.reason && <p>{c.reason}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* LUCKY EXTRAS — present in the payload, no home in the panels above */}
          {(toText(e.luckyGem) || toText(e.luckyNumbers) || toText(e.luckyLetters)) && (
            <section className={styles.luckyRow}>
              {toText(e.luckyGem) && (
                <div>
                  <span>Lucky Gem</span>
                  <p className={styles.tagCap}>{toText(e.luckyGem)}</p>
                </div>
              )}
              {toText(e.luckyNumbers) && (
                <div>
                  <span>Lucky Numbers</span>
                  <p>{toText(e.luckyNumbers)}</p>
                </div>
              )}
              {toText(e.luckyLetters) && (
                <div>
                  <span>Lucky Letters</span>
                  <p>{toText(e.luckyLetters)}</p>
                </div>
              )}
            </section>
          )}

          {/* The original long-form reading still ships in the payload. */}
          {(prediction || botResponse) && (
            <section className={styles.readingCard}>
              <h3 className={styles.insightTitle}>
                <img src={secPersonality} alt="" className={styles.insightIcon} />
                About Your Rashi
              </h3>
              {prediction && <p className={styles.insightText}>{prediction}</p>}
              {botResponse && <p className={styles.botText}>{botResponse}</p>}
            </section>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarInner}>
            <div className={styles.sidebarHead}>
              <span className={styles.sidebarHeadIcon} aria-hidden="true">
                <img src="/images/mobile-shubh-astro-logo.svg" alt="" />
              </span>
              <h2 className={styles.sidebarTitle}>
                Want to know more{firstName ? `, ${firstName}` : ""}?
              </h2>
              <div className={styles.sidebarHeadActions}>
                <button
                  type="button"
                  className={styles.sidebarIconBtn}
                  onClick={handleDownload}
                  aria-label="Download report"
                  title="Download"
                >
                  <Download size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.sidebarIconBtn}
                  onClick={handleShare}
                  aria-label="Share report"
                  title="Share"
                >
                  <Share2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            {personalDetails.length > 0 && (
              <div
                className={styles.detailsCard}
                style={{ backgroundImage: `url(${detailCardBg})` }}
              >
                <h3>Personal Details</h3>
                <dl>
                  {personalDetails.map((detail) => (
                    <div key={detail.label}>
                      <img
                        src={detail.icon}
                        alt=""
                        aria-hidden="true"
                        className={styles.detailIcon}
                      />
                      <span className={styles.detailText}>
                        {detail.label} : {detail.value}
                      </span>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <p className={styles.sidebarNote}>
              Get your full birth chart, talk to our AI, or connect with a real astrologer.
            </p>

            <div className={styles.sidebarActions}>
              {/*
                These used to be plain links to the listing pages. They now open
                the recommendation popup first, which is matched to the report the
                user is already reading — a better starting point than the full
                directory. The links stay as <a href> underneath so middle-click
                and "open in new tab" still reach the listing.
              */}
              <a
                href="/astrologers"
                className={styles.actionPrimary}
                onClick={(event) => {
                  event.preventDefault();
                  recommendation.open("audio");
                }}
              >
                <Phone size={15} aria-hidden="true" /> Call an astrologer
              </a>
              <a
                href="/chat-with-astrologers"
                className={styles.actionSecondary}
                onClick={(event) => {
                  event.preventDefault();
                  recommendation.open("chat");
                }}
              >
                <BsChatDots size={15} aria-hidden="true" /> Chat with astrologer
              </a>
              <button
                type="button"
                className={styles.actionTertiary}
                onClick={() => window.dispatchEvent(new CustomEvent("panditai:ask"))}
              >
                <Sparkles size={15} aria-hidden="true" /> Ask AI Pandit
              </button>
            </div>

            <button
              type="button"
              className={styles.checkAnother}
              onClick={() => navigate("/rashi-calculator")}
            >
              Check another Rashi <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile-only fixed action bar. The sidebar's Call/Chat buttons are
          hidden on mobile; these pinned buttons take their place so the two
          primary actions stay reachable while scrolling the report. */}
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
          <Phone size={16} aria-hidden="true" /> Call an astrologer
        </a>
      </div>

      <RecommendedAstrologersModal
        isOpen={recommendation.isOpen}
        variant={recommendation.stage === "offer" ? "offer" : "plain"}
        type={recommendation.type || "chat"}
        onDismiss={recommendation.dismiss}
        onFinish={recommendation.finish}
        // Nothing discounted to show -> the close press just closes.
        onNothingToOffer={recommendation.finish}
        // Browser Back on the report opens the discounted offer once (the
        // in-page < button does the same via onBack above).
        onExitOffer={() => {
          backOfferShownRef.current = true;
          recommendation.openOffer("chat");
        }}
        // Bring the user back to this report after the chat ends (only when the
        // chat was started from here).
        returnTo={`${window.location.pathname}${window.location.search}`}
      />
    </div>
  );
};

export default RashiReport;
