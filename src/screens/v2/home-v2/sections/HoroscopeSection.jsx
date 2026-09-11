import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ChevronRight } from "lucide-react";
import {
  useFetchDailyQuery,
  useFetchTomorrowQuery,
  useFetchWeeklyQuery,
  useFetchYearlyQuery,
} from "../../../../redux/api/horoscope/zodiacApi";
import { zodiacSignImages } from "../../../private/horoscope/zodiac";
import luckyNumberIcon from "../../../../assets/horoscope/lucky-number.png";
import luckyColorIcon from "../../../../assets/horoscope/lucky-color.png";
import pillarLoveIcon from "../../../../assets/horoscope/pillar-love.png";
import pillarCareerIcon from "../../../../assets/horoscope/pillar-career.png";
import pillarHealthIcon from "../../../../assets/horoscope/pillar-health.png";
import pillarMoneyIcon from "../../../../assets/horoscope/pillar-money.png";
import readFullIcon from "../../../../assets/horoscope/read-full.png";
import discussUserIcon from "../../../../assets/horoscope/discuss-user.png";
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
  // Yearly tab hidden for now — the year query/derivation below stays in place
  // so re-adding it is a one-line change.
];

/* score -> word, matching the design (Strong / Excellent / Good / Average). */
const scoreLabel = (score) => {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Strong";
  if (score >= 55) return "Good";
  if (score >= 35) return "Average";
  return "Low";
};

/* The four pillars shown as bars. `keys` lists the candidate bot_response field
   names for each — the API's naming varies (relationship vs love, finances vs
   finance/money), so we try each and use the first that carries a score. */
const PILLARS = [
  { keys: ["relationship", "love", "relationships"], label: "Love", img: pillarLoveIcon, tone: "Love" },
  { keys: ["career", "profession", "work"], label: "Career", img: pillarCareerIcon, tone: "Career" },
  { keys: ["health", "physique", "wellbeing"], label: "Health", img: pillarHealthIcon, tone: "Health" },
  { keys: ["finances", "finance", "money", "wealth"], label: "Money", img: pillarMoneyIcon, tone: "Money" },
];

/* Read a pillar's 0–100 score from bot_response, tolerant of key-name and shape
   differences: the score may be `bot[key].score`, or bot[key] itself may be the
   number, and keys can arrive in any case. Returns 0 when nothing matches. */
const pillarScore = (bot, keys) => {
  if (!bot || typeof bot !== "object") return 0;
  // Build a lowercase-keyed lookup once per call so casing never blocks a match.
  const lower = {};
  for (const k of Object.keys(bot)) lower[k.toLowerCase()] = bot[k];
  for (const key of keys) {
    const node = lower[key.toLowerCase()];
    if (node == null) continue;
    const raw = typeof node === "object" ? (node.score ?? node.value ?? node.percentage) : node;
    const num = Number(raw);
    if (Number.isFinite(num) && num > 0) return Math.max(0, Math.min(100, num));
  }
  return 0;
};

const titleCaseColor = (c) =>
  String(c || "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/* Merge the CMS horoscope section's per-sign content onto the fixed SIGNS list.
   The API query needs the numeric `id` (which the CMS mirrors as `ID`), and the
   ruling planet is a fixed astronomical fact, so those stay local. From the CMS
   payload we take, per sign (matched by slug):
     - signIllustrationUrl → the large sign visual
     - signLogoUrl         → the small zodiac-strip icon
     - sanskritName        → the Hindi/Vedic name
   each falling back to the bundled art / local value when absent. */
const buildSigns = (sectionData) => {
  const content = Array.isArray(sectionData?.content) ? sectionData.content : [];
  if (!content.length) {
    return SIGNS.map((s) => ({
      ...s,
      img: zodiacSignImages[s.key],
      icon: zodiacSignImages[s.key],
    }));
  }
  const norm = (v) => String(v || "").trim().toLowerCase();
  return SIGNS.map((s) => {
    const match = content.find((c) => {
      const cand = norm(c.slug) || norm(c.title);
      return cand === s.key || cand === norm(s.name);
    });
    return {
      ...s,
      hindi: match?.sanskritName || s.hindi,
      // Large illustration for the sign visual; small logo for the strip icon.
      img: match?.signIllustrationUrl || zodiacSignImages[s.key],
      icon: match?.signLogoUrl || match?.signIllustrationUrl || zodiacSignImages[s.key],
    };
  });
};

/* Render `text` with every occurrence of `word` (case-insensitive) wrapped in
   the orange .titleAccent span — used so the CMS title accents "Horoscope"
   like the hardcoded fallback. */
const accentWord = (text, word) => {
  const str = String(text || "");
  const parts = str.split(new RegExp(`(${word})`, "ig"));
  return parts.map((part, i) =>
    part.toLowerCase() === word.toLowerCase() ? (
      <span key={i} className={styles.titleAccent}>{part}</span>
    ) : (
      part
    )
  );
};

const HoroscopeSection = ({ sectionData }) => {
  const [period, setPeriod] = useState("today");
  const [signId, setSignId] = useState(1);

  // Sign list with images resolved from the CMS payload (falling back to the
  // bundled zodiac art). Recomputed only when the section content changes.
  const signs = useMemo(() => buildSigns(sectionData), [sectionData]);

  const sign = signs.find((s) => s.id === signId) || signs[0];

  // Fetch only the active period; the others are skipped.
  const daily = useFetchDailyQuery(signId, { skip: period !== "today" });
  const tomorrow = useFetchTomorrowQuery(signId, { skip: period !== "tomorrow" });
  const weekly = useFetchWeeklyQuery(signId, { skip: period !== "week" });
  /*
    Yearly uses a different endpoint and shape from the daily/weekly ones:
    `prediction/yearly` returns `response.phase_1..phase_4`, each with its own
    `period` (e.g. "January to March"), a `prediction`, and per-category
    sub-objects ({ physique, health, relationship, career, ... } each with a
    `score` + `prediction`). There's no top-level `bot_response` or `lucky_*`, so
    the year view builds its prediction from the four phases and its pillar
    scores by averaging each category across them.
  */
  const yearly = useFetchYearlyQuery(signId, { skip: period !== "year" });

  const active =
    period === "today"
      ? daily
      : period === "tomorrow"
        ? tomorrow
        : period === "week"
          ? weekly
          : yearly;
  const isLoading = active.isLoading || active.isFetching;
  const res = active.data?.response;

  // Ordered list of the year's four phase objects (when the year view is active).
  const yearPhases = useMemo(() => {
    if (period !== "year" || !res) return [];
    return ["phase_1", "phase_2", "phase_3", "phase_4"]
      .map((k) => res[k])
      .filter(Boolean);
  }, [period, res]);

  /*
    Pillar scores. For daily/weekly they come straight off `bot_response`
    (bot[key].score). For the year they're the average of each category's score
    across the four phases, so a single bar represents the whole year.
  */
  const bot = res?.bot_response || {};
  const yearScores = useMemo(() => {
    if (period !== "year" || yearPhases.length === 0) return null;
    const avg = (key) => {
      const nums = yearPhases
        .map((p) => Number(p?.[key]?.score))
        .filter((n) => Number.isFinite(n));
      if (!nums.length) return 0;
      return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
    };
    return {
      relationship: avg("relationship"),
      career: avg("career"),
      health: avg("health"),
      finances: avg("finances"),
    };
  }, [period, yearPhases]);

  // Show the bars with real fills as soon as data has arrived — don't blank them
  // to 0 on a background refetch (isFetching), only before any data.
  const showBars = period === "year" ? yearPhases.length > 0 : Object.keys(bot).length > 0;

  const prediction =
    period === "year"
      ? yearPhases
          .map((p) => (p.period ? `${p.period}\n${p.prediction || ""}` : p.prediction || ""))
          .filter(Boolean)
          .join("\n\n")
      : bot.total_score?.split_response ||
        bot.career?.split_response ||
        bot.relationship?.split_response ||
        "";

  const dateLabel = useMemo(() => {
    const d = new Date();
    if (period === "tomorrow") d.setDate(d.getDate() + 1);
    const opts = { day: "numeric", month: "short", year: "numeric" };
    if (period === "week") return "This Week";
    if (period === "year") return `Year ${d.getFullYear()}`;
    return `${period === "tomorrow" ? "Tomorrow" : "Today"} ${d.toLocaleDateString("en-GB", opts)}`;
  }, [period]);

  const luckyColor = res?.lucky_color;
  const luckyColorCode = res?.lucky_color_code;
  const luckyNumber = Array.isArray(res?.lucky_number)
    ? res.lucky_number.join(", ")
    : res?.lucky_number;

  const heading = sectionData?.display_title || sectionData?.title;

  // "Read Full Horoscope" target — routes to the matching period page for the
  // selected sign (lowercase slug), e.g. Tomorrow + Aries -> /tomorrow-horoscope/aries.
  const fullHoroscopeHref = useMemo(() => {
    const slug = sign.key; // "aries", "taurus", ...
    const base =
      period === "tomorrow"
        ? "/tomorrow-horoscope"
        : period === "week"
          ? "/weekly-horoscope"
          : period === "year"
            ? "/yearly-horoscope"
            : "/daily-horoscope";
    return `${base}/${slug}`;
  }, [period, sign.key]);

  // The design's left card shows just two lucky facts — Lucky Number and Lucky
  // Color — side by side (not the earlier 4-item grid with Lucky Time / Planet).
  const LUCKY = [
    { img: luckyNumberIcon, label: "Lucky Number", value: luckyNumber ?? "—" },
    {
      img: luckyColorIcon,
      label: "Lucky Color",
      value: titleCaseColor(luckyColor) || "—",
      color: luckyColorCode,
    },
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
              accentWord(heading, "Horoscope")
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
        {/* Left: big sign illustration on the left, details column on the right
            (date chip → sign name → lucky boxes), as in the design. */}
        <div className={styles.left}>
          <div className={styles.signVisual}>
            <img
              className={styles.signImg}
              src={sign.img || zodiacSignImages[sign.key]}
              alt={sign.name}
            />
          </div>

          <div className={styles.leftContent}>
            <span className={styles.dateChip}>{dateLabel}</span>
            <h3 className={styles.signName}>{sign.name}</h3>
            <p className={styles.signHindi}>{sign.hindi}</p>

            <div className={styles.luckyGrid}>
              {LUCKY.map((item) => {
                return (
                  <div className={styles.luckyItem} key={item.label}>
                    <span className={styles.luckyIcon}>
                      <img src={item.img} alt="" className={styles.luckyIconImg} aria-hidden="true" />
                    </span>
                    <div>
                      <p className={styles.luckyLabel}>{item.label}</p>
                      <p className={styles.luckyValue}>
                        {isLoading ? "…" : item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: prediction + pillars + CTAs */}
        <div className={styles.right}>
          <span className={styles.quoteMark} aria-hidden="true">&#8220;&#8220;</span>

          {isLoading ? (
            <>
              <div className={styles.skeletonBlock} style={{ height: 14, marginBottom: 8 }} />
              <div className={styles.skeletonBlock} style={{ height: 14, width: "90%", marginBottom: 8 }} />
              <div className={styles.skeletonBlock} style={{ height: 14, width: "70%", marginBottom: 20 }} />
            </>
          ) : (
            <p className={styles.prediction}>{prediction}</p>
          )}

          {/* Love/Career/Health/Money bars. Daily/weekly read straight off
              bot_response; the year view uses the per-pillar averages across the
              four quarters (yearScores). */}
          <div className={styles.bars}>
            {PILLARS.map((pillar) => {
              const score =
                period === "year"
                  ? (yearScores?.[pillar.keys[0]] ?? 0)
                  : pillarScore(bot, pillar.keys);
              return (
                <div className={styles.barRow} key={pillar.label}>
                  <span className={styles.barLabel}>
                    <span className={`${styles.barLabelIcon} ${styles[`iconTint${pillar.tone}`]}`}>
                      <img src={pillar.img} alt="" className={styles.barLabelIconImg} aria-hidden="true" />
                    </span>
                    {pillar.label}
                  </span>
                  <span className={`${styles.barTrack} ${styles[`trackTint${pillar.tone}`]}`}>
                    {/* Fill to the API score. Only forced to 0 on the very first
                        load (no data yet); during a background refetch we keep
                        the current score so the bar never flashes empty. */}
                    <span
                      className={`${styles.barFill} ${styles[`tone${pillar.tone}`]}`}
                      style={{ width: `${showBars ? score : 0}%` }}
                    />
                  </span>
                  <span className={`${styles.barValue} ${styles[`badge${pillar.tone}`]}`}>
                    {showBars ? scoreLabel(score) : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.ctaRow}>
            <Link
              to={fullHoroscopeHref}
              className={styles.ctaPrimary}
            >
              <img src={readFullIcon} alt="" className={styles.ctaIcon} aria-hidden="true" />
              Read Full Horoscope <ChevronRight size={16} aria-hidden="true" />
            </Link>
            <button
              type="button"
              className={styles.ctaSecondary}
              onClick={() => window.dispatchEvent(new CustomEvent("panditai:ask"))}
            >
              <Sparkles size={14} aria-hidden="true" /> Ask Pandit AI
            </button>
            <Link to="/astrologers" className={styles.ctaLink}>
              <img src={discussUserIcon} alt="" className={styles.ctaLinkIcon} aria-hidden="true" />
              Discuss Your Horoscope
            </Link>
          </div>
        </div>
      </div>

      {/* Zodiac strip */}
      <div className={styles.zodiacStrip} role="tablist" aria-label="Choose zodiac sign">
        {signs.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === signId}
            className={`${styles.zodiacItem} ${s.id === signId ? styles.zodiacActive : ""}`}
            onClick={() => setSignId(s.id)}
          >
            <img className={styles.zodiacIcon} src={s.icon || zodiacSignImages[s.key]} alt="" aria-hidden="true" />
            <p className={styles.zodiacName}>{s.name}</p>
            <p className={styles.zodiacHindi}>{s.hindi}</p>
          </button>
        ))}
      </div>
    </section>
  );
};

export default HoroscopeSection;
