import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
import RecommendedAstrologersModal from "../../../../component/UI/modal/RecommendedAstrologersModal/RecommendedAstrologersModal";
import useRecommendationOffer from "../../../../utils/hooks/useRecommendationOffer";
import bannerArt from "../../../../assets/images/muhurat/banner-art.png";
import slotArt1 from "../../../../assets/images/muhurat/slot-1.png";
import slotArt2 from "../../../../assets/images/muhurat/slot-2.png";
import slotArt3 from "../../../../assets/images/muhurat/slot-3.png";
import ganpatiArt from "../../../../assets/images/muhurat/ganpati.png";
import favMuhuratIcon from "../../../../assets/images/muhurat/fav-1.png";
import excellentIcon from "../../../../assets/images/muhurat/fav-2.png";
import beforeEveningIcon from "../../../../assets/images/muhurat/fav-3.png";
import afterEveningIcon from "../../../../assets/images/muhurat/fav-4.png";
import avoidRahuIcon from "../../../../assets/images/muhurat/avoid-rahu.png";
import avoidGulikaIcon from "../../../../assets/images/muhurat/avoid-gulika.png";
import avoidYamakantaIcon from "../../../../assets/images/muhurat/avoid-yamakanta.png";
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

/*
  A window has "passed" when its date is the actual current day and its end time
  is already behind the current clock. Parses the end of a "hh:mm AM - hh:mm PM"
  range. Returns false for any other day or an unparseable range.
*/
const isWindowPassed = (timeRange, dateIso) => {
  if (!timeRange || !dateIso) return false;
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (dateIso !== todayIso) return false; // only today's windows can be "passed"

  const end = String(timeRange).split("-")[1]?.trim();
  const m = end && end.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return false;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const mer = m[3].toUpperCase();
  if (mer === "PM" && hh !== 12) hh += 12;
  if (mer === "AM" && hh === 12) hh = 0;
  const endMinutes = hh * 60 + mm;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return endMinutes < nowMinutes;
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
/**
 * Parse the START time of a window like "6:30 PM - 7:15 PM" (or "18:30-19:15")
 * into minutes-since-midnight. Returns null when it can't be parsed.
 */
const parseStartMinutes = (range) => {
  const first = String(range || "").split(/[-–—]/)[0]?.trim();
  if (!first) return null;
  const m = first.match(/(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  const mer = (m[3] || "").toLowerCase().replace(/\./g, "");
  if (mer === "pm" && h !== 12) h += 12;
  else if (mer === "am" && h === 12) h = 0;
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  return h * 60 + min;
};

// 6:30 PM as minutes-since-midnight.
const EVENING_CUTOFF_MIN = 18 * 60 + 30;

const SlotRow = ({ timing, passed = false, dateLabel = "" }) => {
  const [open, setOpen] = useState(false);
  const explanation = timing?.details?.fullExplanation;
  const choghadiya = timing?.details?.choghadiya;
  // Excellent windows get their own icon; every OTHER window gets a
  // before/after-6:30 PM icon based on its start time.
  const isExcellent = String(timing?.quality || "").trim().toLowerCase() === "excellent";
  const startMin = parseStartMinutes(timing?.bestTimeRange);
  const timeOfDayIcon =
    isExcellent || startMin == null
      ? null
      : startMin < EVENING_CUTOFF_MIN
        ? beforeEveningIcon
        : afterEveningIcon;

  // The leading icon for this row's circular tile: Excellent windows use their
  // own mark; every other window uses the before/after-6:30 PM icon.
  const leadingIcon = isExcellent ? excellentIcon : timeOfDayIcon;

  return (
    <li className={`${styles.slot} ${passed ? styles.slotPassed : ""}`}>
      <div className={styles.slotRow}>
        {leadingIcon && (
          <span className={styles.slotIconTile} aria-hidden="true">
            <img src={leadingIcon} alt="" className={styles.slotIconImg} />
          </span>
        )}
        <div className={styles.slotBody}>
          <div className={styles.slotHead}>
            <span className={styles.slotTime}>{timing.bestTimeRange}</span>
            {timing.quality && (
              <span className={`${styles.qualityChip} ${qualityClass(timing.quality)}`}>
                {timing.quality}
              </span>
            )}
            {choghadiya && <span className={styles.choghadiyaChip}>{choghadiya}</span>}
            {passed && (
              <span className={styles.passedChip}>
                <FiClock size={12} aria-hidden="true" /> Passed
              </span>
            )}
          </div>

          {dateLabel && (
            <p className={styles.slotDateLine}>
              <FiCalendar size={12} aria-hidden="true" /> {dateLabel}
            </p>
          )}

          {/* `reason` is the personalised line (it references the user's own
              chart); `qualityReason` explains the grade. */}
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
        </div>
      </div>
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
const MuhuratReport = ({ analysis, customOccasions = [], locationLabel, onDownload, isTodayView = false }) => {
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

  // Same two-stage recommendation popup as the Rashi / Face reports: Call/Chat
  // open a matched astrologer list first and only escalate to the discounted
  // offer on dismiss.
  const recommendation = useRecommendationOffer();

  // Selections change between runs, so an event no longer in the response must
  // not leave the report showing an empty tab.
  useEffect(() => {
    if (!byEvent.length) return;
    if (!byEvent.some((g) => g.name === activeEvent)) setActiveEvent(byEvent[0].name);
  }, [byEvent, activeEvent]);

  const active = byEvent.find((g) => g.name === activeEvent) || byEvent[0];
  /*
    Split the grouped days into a "primary" day and a "next" day.

    Primary = today's date if the response includes it, else the earliest day.
    Next    = the first day AFTER the primary day.

    This keeps the "Today" flow correct even when the API returns two dates
    (today + tomorrow): today's windows fill "Favorable Muhurats" and tomorrow's
    fill "Next Favorable Window". When only one date comes back, `nextDay` is
    null and the panel stays hidden.
  */
  /*
    Split the active event's day(s) by the analysis range, not the browser
    clock: `analysis.fromDate` is the primary day (its windows fill "Favorable
    Muhurats") and any later date — e.g. `analysis.toDate` — is the "Next
    Favorable Window". The backend's notion of "today" comes from the requested
    fromDate, which can differ from the device date, so matching on that keeps
    today's windows and tomorrow's windows in the right panels.
  */
  const fromIso = String(analysis?.fromDate || "").slice(0, 10);
  const { today, nextDay } = useMemo(() => {
    const days = active?.days || [];
    if (!days.length) return { today: null, nextDay: null };

    // Range / single-day (non-"Today") view: show EVERY favourable window across
    // ALL dates in "Favorable Muhurats", not just the first date. The API
    // returns one window per date across a range (e.g. 21st/24th/28th/30th), so
    // reading only days[0]/days[1] dropped the rest. Flatten every day's timings
    // (each tagged with its own date) into a single list; there is no separate
    // "Next Favorable Window" outside the Today flow.
    if (!isTodayView || !fromIso) {
      if (days.length <= 1) {
        return { today: days[0] || null, nextDay: null };
      }
      const allTimings = days.flatMap((d) =>
        (d.timings || []).map((t) => ({ ...t, _date: d.date }))
      );
      return {
        today: { date: days[0].date, timings: allTimings, multiDate: true },
        nextDay: null,
      };
    }

    const primary = days.find((d) => d.date === fromIso) || null;
    let later = days.find((d) => d.date > fromIso) || null;

    /*
      Today view must always show a "Next Favorable Window". If the active event
      itself has no later-dated window, borrow the next day's windows from any
      other event in the response (earliest later date, best-ranked first) so the
      section is present regardless of which event is selected.
    */
    if (!later) {
      const laterByDate = new Map();
      byEvent.forEach((ev) => {
        (ev.days || []).forEach((d) => {
          if (d.date > fromIso) {
            if (!laterByDate.has(d.date)) laterByDate.set(d.date, []);
            laterByDate.get(d.date).push(...(d.timings || []));
          }
        });
      });
      const earliestLater = [...laterByDate.keys()].sort((a, b) => a.localeCompare(b))[0];
      if (earliestLater) {
        later = {
          date: earliestLater,
          timings: [...laterByDate.get(earliestLater)].sort(
            (a, b) => (a.rank ?? 99) - (b.rank ?? 99)
          ),
        };
      }
    }

    // If the active event has no window on the primary day, its (later) window
    // is the "next" one — leaving Favorable Muhurats empty for that event.
    if (!primary) return { today: null, nextDay: later || days[0] || null };
    return { today: primary, nextDay: later };
  }, [active, byEvent, fromIso, isTodayView]);

  // "Best Muhurat" always shows the rank-1 window for the active event across
  // ALL its dates — not just the first window in whatever panel order. Lowest
  // rank wins; ties break on the higher muhuratScore.
  const best = useMemo(() => {
    const allTimings = (active?.days || []).flatMap((d) =>
      (d.timings || []).map((t) => ({ ...t, _date: d.date }))
    );
    if (!allTimings.length) return null;
    return [...allTimings].sort((a, b) => {
      const rankDiff = (a.rank ?? 99) - (b.rank ?? 99);
      if (rankDiff !== 0) return rankDiff;
      return (b.muhuratScore ?? 0) - (a.muhuratScore ?? 0);
    })[0];
  }, [active]);

  /*
    Avoid windows come with the analysis, keyed by date — no second request and
    no risk of quoting a Rahu Kaal that disagrees with the one the muhurat was
    scored against. An earlier version fetched these from the panchang API
    separately, which was both an extra round trip and a second source of truth.
  */
  const avoidPeriods = useMemo(() => {
    const windows = analysis?.avoidWindows || [];
    if (!windows.length) return [];

    /*
      In a multi-date range every day's avoid windows are shown (matching the
      "Favorable Muhurats" panel, which now lists every date). For a single-day /
      Today view we show just that day's windows, matched strictly on date.

      The windows arrive in neither sorted nor tab order (25/24/21 above), so
      sort by date first, then expand each day into its three periods, each
      tagged with its own date.
    */
    const daysToShow = today?.multiDate
      ? [...windows].sort((a, b) =>
          String(a?.date || "").localeCompare(String(b?.date || ""))
        )
      : windows.filter((w) => String(w?.date || "").slice(0, 10) === today?.date);

    return daysToShow.flatMap((w) => {
      const day = String(w?.date || "").slice(0, 10);
      return [
        { label: "Rahu Kaal", range: w.rahuKaal, note: w.rahuKaalDescription, iconImg: avoidRahuIcon, date: day },
        { label: "Gulika Kaal", range: w.gulikaKaal, note: w.gulikaKaalDescription, iconImg: avoidGulikaIcon, date: day },
        {
          label: "Yamakanta Kaal",
          range: w.yamakantaKaal,
          note: w.yamakantaKaalDescription,
          iconImg: avoidYamakantaIcon,
          date: day,
        },
      ].filter((p) => p.range);
    });
  }, [analysis?.avoidWindows, today?.date, today?.multiDate]);

  /*
    Share falls back to the clipboard: navigator.share is unavailable on desktop
    Safari and on Chrome over plain http, and a share button that silently does
    nothing is worse than one that says it copied.
  */
  const handleShare = async () => {
    if (!active) return;
    const text = [
      `Best muhurat for ${active.name}`,
      best?.bestTimeRange && `${best.bestTimeRange} on ${formatDate(best?._date || best?.bestDate || today?.date)}`,
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
        {/* Banner is a direct child of the layout grid (not inside .main) so
            that on mobile the "Best Muhurat" card can sit directly beneath it,
            above the panels. On desktop it stays in the left column, row 1. */}
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

        <div className={styles.main}>
          <div className={styles.panelRow}>
            {today?.timings?.length > 0 && (
              <section className={styles.panel}>
                <h3 className={styles.panelTitle}>
                  <img src={favMuhuratIcon} alt="" aria-hidden="true" className={styles.panelTitleIcon} />
                  Favorable Muhurats
                </h3>
                <p className={styles.panelSub}>
                  {today.multiDate ? (
                    <>
                      {today.timings.length}{" "}
                      {today.timings.length === 1 ? "auspicious window" : "auspicious windows"}{" "}
                      across your selected dates
                    </>
                  ) : (
                    <>
                      {formatDate(today.date)}
                      {dayOffsetLabel(today.date) ? ` (${dayOffsetLabel(today.date)})` : ""} ·{" "}
                      {today.timings.length}{" "}
                      {/* A date range returns a single best window per event, a
                          single-day request returns three — so this count is not
                          always plural. */}
                      {today.timings.length === 1 ? "auspicious window" : "auspicious windows"}
                    </>
                  )}
                </p>
                <ul className={styles.slotList}>
                  {today.timings.map((timing) => (
                    <SlotRow
                      key={`${timing._date || today.date}-${timing.bestTimeRange}-${timing.rank}`}
                      timing={timing}
                      dateLabel={formatDate(timing._date || today.date)}
                      passed={isTodayView && isWindowPassed(timing.bestTimeRange, today.date)}
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
                  {today?.multiDate
                    ? "Times to avoid across your selected dates"
                    : `${formatDate(today?.date)} · times to avoid new beginnings`}
                </p>
                <ul className={styles.slotList}>
                  {avoidPeriods.map((period) => {
                    return (
                      <li key={`${period.date}-${period.label}`} className={styles.slot}>
                        <div className={styles.slotRow}>
                          <span className={styles.slotIconTile} aria-hidden="true">
                            <img src={period.iconImg} alt="" className={styles.slotIconImg} />
                          </span>
                          <div className={styles.slotBody}>
                            <div className={styles.slotHead}>
                              <span className={styles.slotTime}>{period.range}</span>
                              <span className={`${styles.qualityChip} ${styles.qualityAvoid}`}>
                                {period.label}
                              </span>
                            </div>
                            {period.date && (
                              <p className={styles.slotDateLine}>
                                <FiCalendar size={12} aria-hidden="true" /> {formatDate(period.date)}
                              </p>
                            )}
                            {period.note && <p className={styles.slotNote}>{period.note}</p>}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>

          {/*
            Next Favorable Window — shown ONLY in the "Today" view (with
            tomorrow's windows when available, or the empty note otherwise). In
            range / other views every window already sits in "Favorable
            Muhurats", so this section is not rendered there at all — even empty.
          */}
          {isTodayView && (
            <section className={styles.nextPanel}>
              <h3 className={styles.panelTitle}>
                <FiCalendar size={16} className={styles.iconNext} aria-hidden="true" />
                Next Favorable Window
                {nextDay?.date && dayOffsetLabel(nextDay.date) && (
                  <span className={styles.nextBadge}>{dayOffsetLabel(nextDay.date)}</span>
                )}
              </h3>
              {nextDay?.timings?.length > 0 ? (
                <>
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
                </>
              ) : (
                <p className={styles.panelSub}>
                  No favorable window found for the next day.
                </p>
              )}
            </section>
          )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.bestCard}>
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
              {(best?._date || best?.bestDate || today?.date) && (
                <span>
                  <FiCalendar size={12} aria-hidden="true" />{" "}
                  {formatDate(best?._date || best?.bestDate || today?.date)}
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

            {/* Verify prompt — peach panel with a faint Ganesha watermark on the
                right (decorative). If the art fails to load it's hidden so the
                panel still reads cleanly. */}
            <div className={styles.verifyPanel}>
              <p className={styles.verifyNote}>
                Want an astrologer to verify this timing for your important event?
              </p>
              <img
                src={ganpatiArt}
                alt=""
                aria-hidden="true"
                className={styles.verifyArt}
              />
            </div>

            <div className={styles.actions}>
              {/*
                Call/Chat open the matched-astrologer recommendation popup first
                (same as the Rashi / Face reports). Kept as real <a href> so
                middle-click / open-in-new-tab still reach the listing.
              */}
              <a
                href={PATH.privateRoutes.ASTROLOGERS_LIST.path}
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

      {/* Mobile-only pinned actions. The sidebar's Call/Chat buttons are hidden
          on mobile; these fixed buttons take their place (same as the Rashi
          report). Portaled to <body> so `position: fixed` is measured against
          the viewport rather than any transformed/animated ancestor in the
          Muhurat-calendar page tree. */}
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
            href={PATH.privateRoutes.ASTROLOGERS_LIST.path}
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
        // Nothing discounted to show -> the close press just closes.
        onNothingToOffer={recommendation.finish}
        // Enables "closing the offer leaves the report". The actual history
        // navigation is handled inside the modal (it knows about its own guard
        // history entry); this is just the opt-in / notification hook.
        onExitClose={() => {}}
        // First browser Back on the report opens the discounted offer instead
        // of leaving (this report has no in-page back button).
        onExitOffer={() => recommendation.openOffer("chat")}
        // Bring the user back to this Muhurat report after the chat ends
        // (only when the chat was started from here).
        returnTo={`${window.location.pathname}${window.location.search}`}
      />
    </div>
  );
};

export default MuhuratReport;
