import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Star,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import styles from "./TestimonialsSection.module.scss";

/*
 * Normalise a CMS testimonial item into the shape the card renders. The backend
 * field names for this section aren't finalised (dev returns it with an empty
 * content array), so each field is read from a list of likely keys and falls
 * back sensibly — the same defensive pattern used for product/astrologer reviews
 * elsewhere in the app. When the API sends nothing, the sample data below is
 * used so the section is never empty.
 */
/* Turn whatever date the API sends into "12 Aug 2026". ISO timestamps
   ("2026-08-12T00:00:00.000Z") were being shown raw in the card footer; a plain
   already-friendly string (or an unparseable value) is returned unchanged. */
const formatTestimonialDate = (raw) => {
  if (!raw) return "";
  const str = String(raw).trim();
  // Only try to parse ISO-ish / numeric dates; leave human strings as-is.
  if (!/^\d{4}-\d{2}-\d{2}/.test(str) && !/^\d+$/.test(str)) return str;
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const mapApiTestimonial = (item, index) => {
  const name =
    item.name ||
    item.user_name ||
    item.userName ||
    [item.firstName, item.lastName].filter(Boolean).join(" ") ||
    "ShubhAstro User";
  const ratingRaw =
    typeof item.rating === "object" ? item.rating?.average : item.rating;
  // The consultation label ("Career Consultation", etc.). The API sends this as
  // `service`; `category` is a separate (often empty) field.
  const service =
    item.service ||
    item.consultation_type ||
    item.consultationType ||
    item.type ||
    "";
  return {
    id: item.ID || item._id || item.id || `api-${index}`,
    // Filter chips key off this. `category` is empty in the payload, so fall
    // back to the service so the chips still group by consultation type.
    category: item.category || item.tag || service || "",
    rating: Math.round(Number(ratingRaw ?? item.stars ?? 5)) || 5,
    quote:
      item.review ||
      item.comment ||
      item.text ||
      item.description ||
      item.testimonial ||
      item.message ||
      "",
    name,
    city: item.city || item.location || item.place || "",
    type: service || "Consultation",
    // `isVerified` drives the "Verified Consultation" badge; default true only
    // when the field is absent, so an explicit false hides it.
    verified: item.isVerified !== false,
    date: formatTestimonialDate(
      item.date || item.consultation_date || item.created_at || item.createdAt || ""
    ),
    image:
      item.avatarUrl ||
      item.image ||
      item.profileImage ||
      item.avatar ||
      item.photo ||
      "",
  };
};

/* Deterministic soft-tinted initials avatar so no image request can 404. */
const avatarFor = (name) => {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='88' height='88'><rect width='88' height='88' rx='44' fill='%23f2d9c6'/><text x='50%25' y='50%25' dy='.35em' text-anchor='middle' font-family='Poppins, sans-serif' font-size='34' font-weight='700' fill='%23b45c2a'>${initials}</text></svg>`;
  return `data:image/svg+xml,${svg}`;
};

/*
  Render the section title with its LAST sentence highlighted in brand orange
  (e.g. "Real Guidance. <accent>Real Experiences.</accent>"). Splits on the
  first sentence-ending period so the CMS `display_title` gets the same accent
  as the hardcoded fallback. If there's no period, the whole title is accented.
*/
const renderHeading = (text) => {
  const match = /^(.*?[.!?])\s+(.+)$/.exec(text.trim());
  if (!match) {
    return <span className={styles.titleAccent}>{text}</span>;
  }
  return (
    <>
      {match[1]} <span className={styles.titleAccent}>{match[2]}</span>
    </>
  );
};

const Stars = ({ count = 5 }) => (
  <span className={styles.stars} aria-label={`${count} star rating`}>
    {Array.from({ length: count }).map((_, i) => (
      <Star key={i} size={18} fill="currentColor" strokeWidth={0} aria-hidden="true" />
    ))}
  </span>
);

const TestimonialsSection = ({ sectionData }) => {

  // Testimonials come only from the homepage CMS payload — no static/sample
  // fallback. If the API sends none, the section renders nothing (see guard
  // below) rather than showing placeholder reviews.
  const allTestimonials = useMemo(() => {
    const apiContent = Array.isArray(sectionData?.content) ? sectionData.content : [];
    return apiContent.map(mapApiTestimonial).filter((t) => t.quote);
  }, [sectionData]);

  const heading = sectionData?.display_title || sectionData?.title || "";
  // The descriptive line under the title. Use `description` — `sub_title` is the
  // short "Real Experiences" badge label and was duplicating the badge here.
  const subheading = sectionData?.description || "";

  // No category filtering — the carousel shows every testimonial from the CMS.
  const items = allTestimonials;
  const len = items.length;

  /*
    Seamless infinite slider. Instead of re-ordering cards each tick (which made
    them "jump" because React swapped DOM nodes), we render the SAME row of
    cards and slide it left/right via translateX so the active card lands in the
    centre. To loop without a backwards jerk at the ends, the list is rendered
    THREE times (prev clones · real · next clones). `pos` walks continuously;
    when it drifts into a clone region we snap it back by one real-list length
    with the transition disabled, so the motion looks endless.

    `pos` is the index into the tripled list currently centred. It starts in the
    middle copy so there's a full copy of runway on each side.
  */
  const [pos, setPos] = useState(len); // centre copy start
  const [animate, setAnimate] = useState(true);

  // Re-centre to the middle copy whenever the list length changes.
  useEffect(() => {
    setAnimate(false);
    setPos(len);
    // Re-enable the transition on the next frame so the reset itself doesn't
    // animate.
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [len]);

  // The real testimonial currently centred (used for dots + active styling).
  const activeIndex = len ? ((pos % len) + len) % len : 0;

  // Advance/retreat the centre by one card. Always animates.
  const step = useCallback(
    (dir) => {
      if (len <= 1) return;
      setAnimate(true);
      setPos((p) => p + dir);
    },
    [len]
  );

  // Jump directly to a specific real index (from the dots) via the shortest
  // path within the current copy.
  const goTo = useCallback(
    (realIdx) => {
      if (len <= 1) return;
      setAnimate(true);
      setPos((p) => {
        const cur = ((p % len) + len) % len;
        return p + (realIdx - cur);
      });
    },
    [len]
  );

  /*
    After a slide finishes, if we've walked into a clone copy, silently re-centre
    into the middle copy (same visual position, transition off) so there's
    always runway left and right — the seamless-loop trick.
  */
  const handleTransitionEnd = useCallback(() => {
    if (len <= 1) return;
    if (pos < len || pos >= len * 2) {
      setAnimate(false);
      setPos(len + (((pos % len) + len) % len));
    }
  }, [pos, len]);

  // Re-enable animation the frame after a silent re-centre.
  useEffect(() => {
    if (animate) return undefined;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  /*
    Auto-play: slide to the next card every few seconds, looping forever. Paused
    while the user hovers/touches the carousel, and skipped when there's only
    one card.
  */
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || len <= 1) return undefined;
    const id = setInterval(() => {
      setAnimate(true);
      setPos((p) => p + 1);
    }, 4000);
    return () => clearInterval(id);
  }, [paused, len]);

  // Tripled list (prev · real · next) that the track renders.
  const tripled = useMemo(
    () => (len ? [...items, ...items, ...items] : []),
    [items, len]
  );

  // No CMS testimonials → render nothing (no static placeholders). Placed after
  // all hooks so hook order stays stable.
  if (allTestimonials.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Testimonials">
      <span className={styles.watermark} aria-hidden="true" />

      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {heading ? (
              renderHeading(heading)
            ) : (
              <>
                Real Guidance. <span className={styles.titleAccent}>Real Experiences.</span>
              </>
            )}
          </h2>
          <p className={styles.subtitle}>
            {subheading ||
              "See how people use ShubhAstro to get clarity and make better decisions with trusted astrology guidance."}
          </p>
        </div>

        {/* Carousel — auto-plays; pauses while the user is interacting. */}
        <div
          className={styles.carousel}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowPrev}`}
            onClick={() => step(-1)}
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>

          <div className={styles.viewport}>
            <div
              className={styles.track}
              onTransitionEnd={handleTransitionEnd}
              style={{
                transform: `translate3d(calc(-1 * (${pos} * var(--card-step) + var(--card-w) / 2)), 0, 0)`,
                transition: animate
                  ? "transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1)"
                  : "none",
              }}
            >
            {tripled.map((t, i) => {
              const isActive = i === pos;
              return (
              <article
                key={i}
                data-card
                className={`${styles.card} ${isActive ? styles.cardActive : ""}`}
                aria-hidden={isActive ? undefined : true}
                onClick={isActive ? undefined : () => step(i > pos ? 1 : -1)}
              >
                <div className={styles.cardTop}>
                  <Stars count={t.rating} />
                  {t.date && <span className={styles.date}>{t.date}</span>}
                </div>

                <p className={`${styles.quote} notranslate`}>{t.quote}</p>

                <div className={styles.person}>
                  <div className={styles.personLeft}>
                    <img
                      className={styles.avatar}
                      src={t.image || avatarFor(t.name)}
                      alt=""
                      aria-hidden="true"
                      onError={(e) => { e.currentTarget.src = avatarFor(t.name); }}
                    />
                    <div>
                      <p className={styles.personName}>{t.name}</p>
                      {t.city && <p className={styles.personCity}>{t.city}</p>}
                    </div>
                  </div>
                  {t.verified && (
                    <span className={styles.verified}>
                      <BadgeCheck size={16} aria-hidden="true" /> Verified Consultation
                    </span>
                  )}
                </div>

              </article>
              );
            })}
            </div>
          </div>

          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowNext}`}
            onClick={() => step(1)}
            aria-label="Next testimonial"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Dots */}
        {items.length > 1 && (
          <div className={styles.dots} aria-hidden="true">
            {items.map((t, i) => (
              <button
                key={t.id}
                type="button"
                className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default TestimonialsSection;
