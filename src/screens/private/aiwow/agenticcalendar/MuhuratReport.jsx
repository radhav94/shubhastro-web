import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCalendar,
  FiMapPin,
  FiClock,
  FiChevronDown,
  FiDownload,
  FiShare2,
} from "react-icons/fi";
import { BsChatDots } from "react-icons/bs";
import { MdOutlinePhoneInTalk } from "react-icons/md";
import { Sparkles, ShieldAlert } from "lucide-react";
import TTSButton from "../../../../component/UI/TTSButton";
import { PATH } from "../../../../utils/routes/Paths";
import bannerArt from "../../../../assets/images/muhurat/banner-art.png";
import bestOrnament from "../../../../assets/images/muhurat/best-ornament.png";
import slotArt1 from "../../../../assets/images/muhurat/slot-1.png";
import slotArt2 from "../../../../assets/images/muhurat/slot-2.png";
import slotArt3 from "../../../../assets/images/muhurat/slot-3.png";
import styles from "./MuhuratReport.module.scss";

/*
  The three slot illustrations came from one generation batch (identical
  timestamp, near-identical dimensions), so they are used as a set — one behind
  each card of the next favourable window, in file order. They are decorative and
  aria-hidden, so a different order changes the picture, never the meaning.
*/
const SLOT_ART = [slotArt1, slotArt2, slotArt3];

/*
  `quality` is the astrology engine's own verdict ("Excellent", "Very Good",
  "Good"), so it is displayed as sent and only mapped to a colour here. An
  earlier version of this screen derived the label from the slot's position in
  the list, which disagreed with the API — the top Marriage slot scores 88 and is
  graded "Very Good", not "Excellent".
*/
const QUALITY_CLASS = {
  excellent: "qualityExcellent",
  "very good": "qualityVeryGood",
  good: "qualityGood",
  average: "qualityAverage",
  acceptable: "qualityAverage",
};

const qualityClass = (quality) =>
  styles[QUALITY_CLASS[String(quality || "").trim().toLowerCase()] || "qualityAverage"];

/** "shubh_muhurat" -> "Shubh Muhurat" */
const titleiseType = (value) =>
  String(value || "")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (value) => {
  const d = parseDate(value);
  if (!d) return value || "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

const dayOffsetLabel = (value) => {
  const d = parseDate(value);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((d - today) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return null;
};

/** One favourable window. Collapsed to the essentials, with the engine's own
 *  long-form explanation available on demand rather than always on screen. */
const SlotRow = ({ timing }) => {
  const [open, setOpen] = useState(false);
  const explanation = timing?.details?.fullExplanation;
  const choghadiya = timing?.details?.choghadiya;

  return (
    <li className={styles.slot}>
      <div className={styles.slotHead}>
        <span className={styles.slotTime}>{timing.bestTimeRange}</span>
        {timing.quality && (
          <span className={`${styles.qualityChip} ${qualityClass(timing.quality)}`}>
            {timing.quality}
          </span>
        )}
        {choghadiya && <span className={styles.choghadiyaChip}>{choghadiya}</span>}
      </div>

      {/* `reason` is the personalised line (it references the user's own chart);
          `qualityReason` explains the grade. Both are the engine's wording. */}
      {timing.reason && <p className={styles.slotNote}>{timing.reason}</p>}
      {timing.qualityReason && <p className={styles.slotWhy}>{timing.qualityReason}</p>}

      {explanation && (
        <>
          <button
            type="button"
            className={styles.moreBtn}
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
          >
            {open ? "Hide details" : "Why this time"}
            <FiChevronDown
              size={13}
              className={open ? styles.moreIconOpen : styles.moreIcon}
              aria-hidden="true"
            />
          </button>
          {open && <p className={styles.slotExplain}>{explanation}</p>}
        </>
      )}
    </li>
  );
};

/**
 * Muhurat report.
 *
 * One tab per event. The API returns a separate entry per favourable window —
 * three per event per date, each with its own `rank`, `quality` and `details` —
 * so windows are grouped by date and ordered by rank rather than read off a
 * single "best + alternate" object.
 *
 * @param {Object} props
 * @param {Object} props.analysis - analyze response `data`
 * @param {string[]} [props.customOccasions]
 * @param {string} [props.locationLabel]
 * @param {Function} [props.onDownload]
 */
const MuhuratReport = ({ analysis, customOccasions = [], locationLabel, onDownload }) => {
  // event -> [{ date, timings: [rank-ordered] }]
  const byEvent = useMemo(() => {
    const timings = analysis?.optimalTimings || [];
    const events = new Map();

    timings.forEach((timing) => {
      const name = timing?.eventName || "Timing";
      const date = String(timing?.bestDate || "").slice(0, 10);
      if (!events.has(name)) events.set(name, new Map());
      const dates = events.get(name);
      if (!dates.has(date)) dates.set(date, []);
      dates.get(date).push(timing);
    });

    return [...events.entries()].map(([name, dates]) => ({
      name,
      days: [...dates.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, list]) => ({
          date,
          timings: [...list].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)),
        })),
    }));
  }, [analysis?.optimalTimings]);

  const [activeEvent, setActiveEvent] = useState(byEvent[0]?.name || null);

  // Selections change between runs, so an event no longer in the response must
  // not leave the report showing an empty tab.
  useEffect(() => {
    if (!byEvent.length) return;
    if (!byEvent.some((g) => g.name === activeEvent)) setActiveEvent(byEvent[0].name);
  }, [byEvent, activeEvent]);

  const active = byEvent.find((g) => g.name === activeEvent) || byEvent[0];
  const today = active?.days?.[0] || null;
  const nextDay = active?.days?.[1] || null;
  const best = today?.timings?.[0] || null;

  /*
    Avoid windows come with the analysis, keyed by date — no second request and
    no risk of quoting a Rahu Kaal that disagrees with the one the muhurat was
    scored against. An earlier version fetched these from the panchang API
    separately, which was both an extra round trip and a second source of truth.
  */
  const avoidPeriods = useMemo(() => {
    const windows = analysis?.avoidWindows || [];
    /*
      Matched strictly on date, with no "first entry" fallback. In range mode the
      API returns one window set per date, in neither sorted nor tab order
      (25-30 Aug came back as 27, 26, 28), and each event lands on a different
      date — so falling back to windows[0] would quietly show one day's Rahu Kaal
      against another day's muhurat. Better to show no avoid panel than the wrong
      day's.
    */
    const forDay = windows.find((w) => String(w?.date || "").slice(0, 10) === today?.date);
    if (!forDay) return [];
    return [
      { label: "Rahu Kaal", range: forDay.rahuKaal, note: forDay.rahuKaalDescription },
      { label: "Gulika Kaal", range: forDay.gulikaKaal, note: forDay.gulikaKaalDescription },
      {
        label: "Yamakanta Kaal",
        range: forDay.yamakantaKaal,
        note: forDay.yamakantaKaalDescription,
      },
    ].filter((p) => p.range);
  }, [analysis?.avoidWindows, today?.date]);

  /*
    Share falls back to the clipboard: navigator.share is unavailable on desktop
    Safari and on Chrome over plain http, and a share button that silently does
    nothing is worse than one that says it copied.
  */
  const handleShare = async () => {
    if (!active) return;
    const text = [
      `Best muhurat for ${active.name}`,
      best?.bestTimeRange && `${best.bestTimeRange} on ${formatDate(today?.date)}`,
      best?.quality && `Rated ${best.quality}`,
    ]
      .filter(Boolean)
      .join(" — ");
    const payload = { title: `${active.name} muhurat`, text, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(payload);
      else await navigator.clipboard.writeText(`${text}\n${payload.url}`);
    } catch {
      /* user dismissed the sheet */
    }
  };

  if (!byEvent.length || !active) return null;

  const ttsScript = [
    `${active.name} muhurat report.`,
    today?.date && `For ${formatDate(today.date)}.`,
    ...(today?.timings || []).map((t) =>
      [t.bestTimeRange, t.quality && `rated ${t.quality}`, t.reason].filter(Boolean).join(", ")
    ),
    avoidPeriods.length > 0 &&
      `Avoid, ${avoidPeriods.map((p) => `${p.label} ${p.range}`).join(", ")}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.report}>
      {byEvent.length > 1 && (
        <div className={styles.tabs} role="tablist">
          {byEvent.map((group) => (
            <button
              key={group.name}
              type="button"
              role="tab"
              aria-selected={group.name === active.name}
              className={`${styles.tab} ${group.name === active.name ? styles.tabOn : ""}`}
              onClick={() => setActiveEvent(group.name)}
            >
              {group.name}
              {customOccasions.includes(group.name) && (
                <span className={styles.customTag}>Custom</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.main}>
          <header className={styles.banner}>
            <img src={bannerArt} alt="" aria-hidden="true" className={styles.bannerArt} />
            <div className={styles.bannerCopy}>
              <h2 className={styles.bannerTitle}>{active.name}</h2>
              <p className={styles.bannerText}>
                Select an auspicious time for your {active.name.toLowerCase()} and
                begin with confidence.
              </p>
              {/* Panchang context for the day, sent with every window. */}
              {today?.timings?.[0]?.details && (
                <p className={styles.dayContext}>
                  {[
                    today.timings[0].details.tithi,
                    today.timings[0].details.nakshatra &&
                      `${today.timings[0].details.nakshatra} Nakshatra`,
                    today.timings[0].details.yoga &&
                      `${today.timings[0].details.yoga} Yoga`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
            <span className={styles.bannerTts}>
              <TTSButton text={ttsScript} />
            </span>
          </header>

          <div className={styles.panelRow}>
            {today?.timings?.length > 0 && (
              <section className={styles.panel}>
                <h3 className={styles.panelTitle}>
                  <Sparkles size={16} className={styles.iconGood} aria-hidden="true" />
                  Favorable Muhurats
                </h3>
                <p className={styles.panelSub}>
                  {formatDate(today.date)}
                  {dayOffsetLabel(today.date) ? ` (${dayOffsetLabel(today.date)})` : ""} ·{" "}
                  {today.timings.length}{" "}
                  {/* A date range returns a single best window per event, a
                      single-day request returns three — so this count is not
                      always plural. */}
                  {today.timings.length === 1 ? "auspicious window" : "auspicious windows"}
                </p>
                <ul className={styles.slotList}>
                  {today.timings.map((timing) => (
                    <SlotRow
                      key={`${timing.bestTimeRange}-${timing.rank}`}
                      timing={timing}
                    />
                  ))}
                </ul>
              </section>
            )}

            {avoidPeriods.length > 0 && (
              <section className={styles.panel}>
                <h3 className={styles.panelTitle}>
                  <ShieldAlert size={16} className={styles.iconBad} aria-hidden="true" />
                  Avoid Periods
                </h3>
                {/* Naming the date matters here: across a range each event sits
                    on a different day, so "avoid 2:15 PM" is meaningless without
                    saying which day it belongs to. */}
                <p className={styles.panelSub}>
                  {formatDate(today?.date)} · times to avoid new beginnings
                </p>
                <ul className={styles.slotList}>
                  {avoidPeriods.map((period) => (
                    <li key={period.label} className={styles.slot}>
                      <div className={styles.slotHead}>
                        <span className={styles.slotTime}>{period.range}</span>
                        <span className={`${styles.qualityChip} ${styles.qualityAvoid}`}>
                          {period.label}
                        </span>
                      </div>
                      {period.note && <p className={styles.slotNote}>{period.note}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Only when the analysis actually covered a second date. A single-day
              request returns one date, so this stays hidden rather than
              re-presenting the same day's lower-ranked windows as a later one. */}
          {nextDay?.timings?.length > 0 && (
            <section className={styles.nextPanel}>
              <h3 className={styles.panelTitle}>
                <FiCalendar size={16} className={styles.iconNext} aria-hidden="true" />
                Next Favorable Window
                {dayOffsetLabel(nextDay.date) && (
                  <span className={styles.nextBadge}>{dayOffsetLabel(nextDay.date)}</span>
                )}
              </h3>
              <p className={styles.panelSub}>
                {formatDate(nextDay.date)} · {nextDay.timings.length}{" "}
                {nextDay.timings.length === 1 ? "timing" : "timings"} available
              </p>
              <div className={styles.nextGrid}>
                {nextDay.timings.map((timing, index) => (
                  <div key={`${timing.bestTimeRange}-${timing.rank}`} className={styles.nextCard}>
                    <img
                      src={SLOT_ART[index % SLOT_ART.length]}
                      alt=""
                      aria-hidden="true"
                      className={styles.nextCardArt}
                    />
                    <span className={styles.slotTime}>{timing.bestTimeRange}</span>
                    {timing.quality && (
                      <span className={`${styles.qualityChip} ${qualityClass(timing.quality)}`}>
                        {timing.quality}
                      </span>
                    )}
                    {timing.reason && <p className={styles.slotNote}>{timing.reason}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.bestCard}>
            <img src={bestOrnament} alt="" aria-hidden="true" className={styles.bestOrnament} />

            {/* Sit above the ornament, which is purely backdrop here. */}
            <div className={styles.cardTools}>
              {onDownload && (
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={onDownload}
                  aria-label="Download report"
                >
                  <FiDownload size={15} />
                </button>
              )}
              <button
                type="button"
                className={styles.toolBtn}
                onClick={handleShare}
                aria-label="Share this muhurat"
              >
                <FiShare2 size={15} />
              </button>
            </div>

            <span className={styles.bestBadge}>★ Best Muhurat</span>

            <p className={styles.bestMeta}>
              {today?.date && (
                <span>
                  <FiCalendar size={12} aria-hidden="true" /> {formatDate(today.date)}
                </span>
              )}
              {locationLabel && (
                <span>
                  <FiMapPin size={12} aria-hidden="true" /> {locationLabel}
                </span>
              )}
            </p>

            {best?.bestTimeRange && (
              <h3 className={styles.bestTime}>
                <FiClock size={17} aria-hidden="true" /> {best.bestTimeRange}
              </h3>
            )}

            <p className={styles.bestChips}>
              {best?.quality && (
                <span className={`${styles.qualityChip} ${qualityClass(best.quality)}`}>
                  {best.quality}
                </span>
              )}
              {best?.muhuratType && (
                <span className={styles.choghadiyaChip}>{titleiseType(best.muhuratType)}</span>
              )}
              {Number.isFinite(best?.muhuratScore) && (
                <span className={styles.scoreChip}>{best.muhuratScore}/100</span>
              )}
            </p>

            {best?.reason && <p className={styles.bestReason}>{best.reason}</p>}

            {/* Rule broken by a small lotus, as in the design. Inline SVG rather
                than an asset — it is three paths and needs to inherit colour. */}
            <div className={styles.divider} aria-hidden="true">
              <span className={styles.dividerMark}>
                <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
                  <path
                    d="M11 11C11 6.5 8.5 3 5 1c-.6 2.2.2 6.6 6 10Z"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <path
                    d="M11 11c0-4.5 2.5-8 6-10 .6 2.2-.2 6.6-6 10Z"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                  <path d="M11 11V4" stroke="currentColor" strokeWidth="1" />
                </svg>
              </span>
            </div>

            <p className={styles.verifyNote}>
              Want an astrologer to verify this timing for your important event?
            </p>

            <div className={styles.actions}>
              <Link
                to={PATH.privateRoutes.ASTROLOGERS_LIST.path}
                className={styles.actionPrimary}
              >
                <MdOutlinePhoneInTalk size={15} aria-hidden="true" /> Call an astrologer
              </Link>
              <Link to="/chat-with-astrologers" className={styles.actionSecondary}>
                <BsChatDots size={14} aria-hidden="true" /> Chat with astrologer
              </Link>
              <Link to="/ai-wow" className={styles.actionTertiary}>
                <Sparkles size={14} aria-hidden="true" /> Ask Shubh AI · Free
              </Link>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
};

export default MuhuratReport;
