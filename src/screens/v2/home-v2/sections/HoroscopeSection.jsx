import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Heart, Briefcase, Activity, Coins, ChevronRight, Clock, Palette, Hash, Orbit } from "lucide-react";
import {
  useFetchDailyQuery,
  useFetchTomorrowQuery,
  useFetchWeeklyQuery,
} from "../../../../redux/api/horoscope/zodiacApi";
import { zodiacSignImages } from "../../../private/horoscope/zodiac";
import styles from "./HoroscopeSection.module.scss";

/* The 12 signs in API order (id = the `zodiac` query param), with Hindi (Vedic)
   names and ruling planets — both fixed astronomical facts, not per-day data. */
const SIGNS = [
  { id: 1, name: "Aries", key: "aries", hindi: "Mesh", planet: "Mars" },
  { id: 2, name: "Taurus", key: "taurus", hindi: "Vrishabh", planet: "Venus" },
  { id: 3, name: "Gemini", key: "gemini", hindi: "Mithun", planet: "Mercury" },
  { id: 4, name: "Cancer", key: "cancer", hindi: "Kark", planet: "Moon" },
  { id: 5, name: "Leo", key: "leo", hindi: "Singh", planet: "Sun" },
  { id: 6, name: "Virgo", key: "virgo", hindi: "Kanya", planet: "Mercury" },
  { id: 7, name: "Libra", key: "libra", hindi: "Tula", planet: "Venus" },
  { id: 8, name: "Scorpio", key: "scorpio", hindi: "Vrishchik", planet: "Mars" },
  { id: 9, name: "Sagittarius", key: "sagittarius", hindi: "Dhanu", planet: "Jupiter" },
  { id: 10, name: "Capricorn", key: "capricorn", hindi: "Makar", planet: "Saturn" },
  { id: 11, name: "Aquarius", key: "aquarius", hindi: "Kumbh", planet: "Saturn" },
  { id: 12, name: "Pisces", key: "pisces", hindi: "Meen", planet: "Jupiter" },
];

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "week", label: "Week" },
];

/* A per-sign fixed "lucky time" window — the API doesn't return one, so this is
   a stable, sign-based value (not random per render). */
const LUCKY_TIME = {
  aries: "3:00 PM – 5:00 PM",
  taurus: "6:00 AM – 8:00 AM",
  gemini: "10:00 AM – 12:00 PM",
  cancer: "7:00 PM – 9:00 PM",
  leo: "12:00 PM – 2:00 PM",
  virgo: "9:00 AM – 11:00 AM",
  libra: "4:00 PM – 6:00 PM",
  scorpio: "8:00 PM – 10:00 PM",
  sagittarius: "11:00 AM – 1:00 PM",
  capricorn: "5:00 AM – 7:00 AM",
  aquarius: "2:00 PM – 4:00 PM",
  pisces: "6:00 PM – 8:00 PM",
};

/* score -> word, matching the design (Strong / Excellent / Good / Average). */
const scoreLabel = (score) => {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Strong";
  if (score >= 55) return "Good";
  if (score >= 35) return "Average";
  return "Low";
};

/* The four pillars shown as bars, mapped to the API's bot_response keys. */
const PILLARS = [
  { key: "relationship", label: "Love", icon: Heart, tone: "Love" },
  { key: "career", label: "Career", icon: Briefcase, tone: "Career" },
  { key: "health", label: "Health", icon: Activity, tone: "Health" },
  { key: "finances", label: "Money", icon: Coins, tone: "Money" },
];

const titleCaseColor = (c) =>
  String(c || "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const HoroscopeSection = ({ sectionData }) => {
  const [period, setPeriod] = useState("today");
  const [signId, setSignId] = useState(1);

  const sign = SIGNS.find((s) => s.id === signId) || SIGNS[0];

  // Fetch only the active period; the other two are skipped.
  const daily = useFetchDailyQuery(signId, { skip: period !== "today" });
  const tomorrow = useFetchTomorrowQuery(signId, { skip: period !== "tomorrow" });
  const weekly = useFetchWeeklyQuery(signId, { skip: period !== "week" });

  const active = period === "today" ? daily : period === "tomorrow" ? tomorrow : weekly;
  const isLoading = active.isLoading || active.isFetching;
  const res = active.data?.response;
  const bot = res?.bot_response || {};

  const prediction =
    bot.total_score?.split_response ||
    bot.career?.split_response ||
    bot.relationship?.split_response ||
    "";

  const dateLabel = useMemo(() => {
    const d = new Date();
    if (period === "tomorrow") d.setDate(d.getDate() + 1);
    const opts = { day: "numeric", month: "short", year: "numeric" };
    if (period === "week") return "This Week";
    return `${period === "tomorrow" ? "Tomorrow" : "Today"} ${d.toLocaleDateString("en-GB", opts)}`;
  }, [period]);

  const luckyColor = res?.lucky_color;
  const luckyColorCode = res?.lucky_color_code;
  const luckyNumber = Array.isArray(res?.lucky_number)
    ? res.lucky_number.join(", ")
    : res?.lucky_number;

  const heading = sectionData?.display_title || sectionData?.title;

  const LUCKY = [
    { icon: Clock, label: "Lucky Time", value: LUCKY_TIME[sign.key] || "—" },
    {
      icon: Palette,
      label: "Lucky Color",
      value: titleCaseColor(luckyColor) || "—",
      color: luckyColorCode,
    },
    { icon: Hash, label: "Lucky Number", value: luckyNumber ?? "—" },
    { icon: Orbit, label: "Planet", value: sign.planet },
  ];

  return (
    <section className={styles.section} aria-label="Daily Horoscope">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.badge}>
            <Sparkles size={12} aria-hidden="true" /> Your Daily Horoscope
          </span>
          <h2 className={styles.title}>
            {heading ? (
              heading
            ) : (
              <>
                Your Daily <span className={styles.titleAccent}>Horoscope</span> Reading
              </>
            )}
          </h2>
          <p className={styles.subtitle}>Pick your raashi to see today&apos;s pillars at a glance.</p>
        </div>

        <div className={styles.periodToggle} role="tablist" aria-label="Horoscope period">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={period === p.id}
              className={`${styles.periodBtn} ${period === p.id ? styles.periodActive : ""}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reading card */}
      <div className={styles.card}>
        {/* Left: sign visual + facts */}
        <div className={styles.left}>
          <div className={styles.signVisual}>
            <img
              className={styles.signImg}
              src={zodiacSignImages[sign.key]}
              alt={sign.name}
            />
          </div>
          <span className={styles.dateChip}>{dateLabel}</span>
          <h3 className={styles.signName}>{sign.name}</h3>
          <p className={styles.signHindi}>{sign.hindi}</p>

          <div className={styles.luckyGrid}>
            {LUCKY.map((item) => {
              const Icon = item.icon;
              return (
                <div className={styles.luckyItem} key={item.label}>
                  <span className={styles.luckyIcon}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <p className={styles.luckyLabel}>{item.label}</p>
                    <p className={styles.luckyValue}>
                      {item.color && (
                        <span
                          className={styles.colorDot}
                          style={{ background: item.color }}
                          aria-hidden="true"
                        />
                      )}
                      {isLoading ? "…" : item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: prediction + pillars + CTAs */}
        <div className={styles.right}>
          <span className={styles.quoteMark} aria-hidden="true">
            <Sparkles size={18} />
          </span>

          {isLoading ? (
            <>
              <div className={styles.skeletonBlock} style={{ height: 14, marginBottom: 8 }} />
              <div className={styles.skeletonBlock} style={{ height: 14, width: "90%", marginBottom: 8 }} />
              <div className={styles.skeletonBlock} style={{ height: 14, width: "70%", marginBottom: 20 }} />
            </>
          ) : (
            <p className={styles.prediction}>{prediction}</p>
          )}

          <div className={styles.bars}>
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const score = Math.max(0, Math.min(100, Number(bot[pillar.key]?.score ?? 0)));
              return (
                <div className={styles.barRow} key={pillar.key}>
                  <span className={styles.barLabel}>
                    <span className={`${styles.barLabelIcon} ${styles[`iconTint${pillar.tone}`]}`}>
                      <Icon size={13} aria-hidden="true" />
                    </span>
                    {pillar.label}
                  </span>
                  <span className={`${styles.barTrack} ${styles[`trackTint${pillar.tone}`]}`}>
                    <span
                      className={`${styles.barFill} ${styles[`tone${pillar.tone}`]}`}
                      style={{ width: `${isLoading ? 0 : score}%` }}
                    />
                  </span>
                  <span className={`${styles.barValue} ${styles[`badge${pillar.tone}`]}`}>
                    {isLoading ? "—" : scoreLabel(score)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.ctaRow}>
            <Link
              to={`/horoscope/daily/${sign.name}-free-horoscope`}
              className={styles.ctaPrimary}
            >
              Read Full Horoscope <ChevronRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/ai-wow" className={styles.ctaSecondary}>
              <Sparkles size={14} aria-hidden="true" /> Ask Shubh AI
            </Link>
            <Link to="/chat-with-astrologers" className={styles.ctaLink}>
              Discuss Your Horoscope
            </Link>
          </div>
        </div>
      </div>

      {/* Zodiac strip */}
      <div className={styles.zodiacStrip} role="tablist" aria-label="Choose zodiac sign">
        {SIGNS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === signId}
            className={`${styles.zodiacItem} ${s.id === signId ? styles.zodiacActive : ""}`}
            onClick={() => setSignId(s.id)}
          >
            <img className={styles.zodiacIcon} src={zodiacSignImages[s.key]} alt="" aria-hidden="true" />
            <p className={styles.zodiacName}>{s.name}</p>
            <p className={styles.zodiacHindi}>{s.hindi}</p>
          </button>
        ))}
      </div>
    </section>
  );
};

export default HoroscopeSection;
