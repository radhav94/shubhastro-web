import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Calendar,
  ChevronRight,
  Clock,
  Gem,
  MapPin,
  Moon,
  Phone,
  Sparkles,
  Star,
  User,
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
import { BsChatDots } from "react-icons/bs";
import { useGetRashiCalQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./RashiReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import TTSButton from "../../../../component/UI/TTSButton";
import { zodiacSignImages } from "../../horoscope/zodiac";
import {
  getNakshatraImage,
  getRashiCoinImage,
  getRashiSignImage,
  rashiDecorTiles,
} from "../../../../utils/rashiImages";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";

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
const InsightCard = ({ icon, decor, title, lines, variant }) => {
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
    </section>
  );
};

const RashiReport = () => {
  const navigate = useNavigate();
  const stored = useSelector(selectCalculatorData("rashi_moon_sign"));
  const { data, isLoading } = useGetRashiCalQuery(stored, { skip: !stored });

  const response = data?.response;
  const enriched = response?.enriched;

  // Everything the header chips and hero need, resolved once.
  const hero = useMemo(() => {
    const sign = response?.moon_sign || "";
    const coinArt = getRashiCoinImage(sign);
    return {
      sign,
      // Landscape artwork behind the card's right edge.
      art: getRashiSignImage(sign),
      // Prefer the design's coin export; otherwise the glyph gets minted into a
      // CSS gold disc (see .heroCoinMinted).
      coin: coinArt || zodiacSignImages[sign.toLowerCase()] || "",
      coinIsArt: !!coinArt,
    };
  }, [response?.moon_sign]);

  // Split the decorative tiles down the two banner edges. Halved rather than
  // hardcoded to 3+3 so dropping a tile in or out of the folder still balances.
  const half = Math.ceil(rashiDecorTiles.length / 2);
  const leftTiles = rashiDecorTiles.slice(0, half);
  const rightTiles = rashiDecorTiles.slice(half);

  if (!stored || isLoading) return <PrimaryLoader isLoading={true} />;
  if (!response) return <div className={styles.empty}>No data found</div>;

  const { moon_sign: moonSign, prediction, bot_response: botResponse } = response;
  const e = enriched || {};
  const nakshatraArt = getNakshatraImage(e.nakshatra);
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
    { icon: User, label: "Name", value: stored?.name },
    { icon: Clock, label: "Time of Birth", value: formatTime(stored?.tob) },
    { icon: Calendar, label: "Date of Birth", value: formatDate(stored?.dob) },
    { icon: MapPin, label: "Place of Birth", value: stored?.place },
  ].filter((d) => d.value);

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />

      <div className={styles.layout}>
        <div className={styles.main}>
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
                  <img src={hero.coin} alt="" className={styles.heroCoin} />
                </div>
              )}

              {/* Sign block */}
              <div className={styles.heroSignBlock}>
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
                </dl>
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

              {hero.art && (
                <img src={hero.art} alt="" className={styles.heroArt} loading="lazy" />
              )}
            </section>
          )}

          {/* TODAY STRIP */}
          {(e.todayTransit || e.dayRating || e.luckyTime) && (
            <section className={styles.todayStrip}>
              {e.todayTransit && (
                <div className={styles.todayCard}>
                  <h3>Today for {moonSign}</h3>
                  <p>{e.todayTransit}</p>
                </div>
              )}
              {e.dayRating != null && (
                <div className={styles.todayCard}>
                  <h3>
                    Positive Day <DayRating rating={e.dayRating} />
                  </h3>
                  <p>Today the Moon favours your plans in line with this rating.</p>
                </div>
              )}
              {e.luckyTime && (
                <div className={styles.todayCard}>
                  <h3>Lucky Time — {e.luckyTime}</h3>
                  <p>Use this window for important calls, decisions and work that needs focus.</p>
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
                  {nakshatraArt && (
                    <figure className={styles.nakshatraFigure}>
                      <img src={nakshatraArt} alt="" loading="lazy" />
                      {e.deity && <figcaption>Deity: {e.deity}</figcaption>}
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
                  {e.compatible_rashis.map((c) => {
                    const glyph = zodiacSignImages[String(c.rashi || "").toLowerCase()];
                    return (
                      <li key={c.rashi}>
                        <div className={styles.compatHead}>
                          {glyph && <img src={glyph} alt="" />}
                          <span>{c.rashi}</span>
                        </div>
                        {c.reason && <p>{c.reason}</p>}
                      </li>
                    );
                  })}
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
            <h2 className={styles.sidebarTitle}>
              Want to know more{firstName ? `, ${firstName}` : ""}?
            </h2>

            {personalDetails.length > 0 && (
              <div className={styles.detailsCard}>
                <h3>Personal Details</h3>
                <dl>
                  {personalDetails.map((detail) => {
                    const Icon = detail.icon;
                    return (
                      <div key={detail.label}>
                        <dt>
                          <Icon size={13} aria-hidden="true" />
                          {detail.label}
                        </dt>
                        <dd>{detail.value}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}

            <p className={styles.sidebarNote}>
              Get your full birth chart, talk to our AI, or connect with a real astrologer.
            </p>

            <div className={styles.sidebarActions}>
              <Link to="/astrologers" className={styles.actionPrimary}>
                <Phone size={15} aria-hidden="true" /> Call an astrologer
              </Link>
              <Link to="/chat-with-astrologers" className={styles.actionSecondary}>
                <BsChatDots size={15} aria-hidden="true" /> Chat with astrologer
              </Link>
              <Link to="/ai-wow" className={styles.actionTertiary}>
                <Sparkles size={15} aria-hidden="true" /> Ask Shubh AI · Free
              </Link>
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
    </div>
  );
};

export default RashiReport;
