import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Star,
  Quote,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Lock,
  Users,
  Headphones,
} from "lucide-react";
import styles from "./TestimonialsSection.module.scss";

/* Bottom trust bar stats. */
const TRUST = [
  { icon: ShieldCheck, title: "Verified Astrologers", sub: "Carefully screened & background verified" },
  { icon: Lock, title: "100% Private", sub: "Your conversations are safe & confidential" },
  { icon: Star, title: "4.8 / 5 Rating", sub: "Average user rating from real consultations" },
  { icon: Users, title: "10K+ Happy Users", sub: "Across India and beyond" },
  { icon: Headphones, title: "50+ Astrologers", sub: "Expert astrologers available right now" },
];

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

const Stars = ({ count = 5 }) => (
  <span className={styles.stars} aria-label={`${count} star rating`}>
    {Array.from({ length: count }).map((_, i) => (
      <Star key={i} size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" />
    ))}
  </span>
);

const TestimonialsSection = ({ sectionData }) => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef(null);

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

  // Filter chips: "All" plus every distinct category present in the data. Only
  // shown when there's more than one category to choose between.
  const filters = useMemo(() => {
    const cats = Array.from(
      new Set(allTestimonials.map((t) => t.category).filter(Boolean))
    );
    return ["All", ...cats];
  }, [allTestimonials]);

  const items = useMemo(
    () =>
      activeFilter === "All"
        ? allTestimonials
        : allTestimonials.filter((t) => t.category === activeFilter),
    [activeFilter, allTestimonials]
  );

  // Reset scroll + active card whenever the filter changes.
  useEffect(() => {
    setActiveIndex(0);
    if (trackRef.current) trackRef.current.scrollLeft = 0;
  }, [activeFilter]);

  // Throttle scroll work to one run per animation frame. The handler measures
  // layout (offsetLeft/Width), so running it on every scroll event forced a
  // reflow + re-render dozens of times per second during a smooth scroll — that
  // burst is what made the arrows feel like they took seconds to respond.
  const rafRef = useRef(0);

  const measureNearest = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll("[data-card]");
    if (!cards.length) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < cards.length; i += 1) {
      const card = cards[i];
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    }
    // Only re-render when the centred card actually changed.
    setActiveIndex((prev) => (prev === nearest ? prev : nearest));
  }, []);

  const handleScroll = useCallback(() => {
    if (rafRef.current) return; // already scheduled this frame
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      measureNearest();
    });
  }, [measureNearest]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const scrollToCard = useCallback((index) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelectorAll("[data-card]")[index];
    if (!card) return;
    // Update the active card immediately so the arrow/dot feels instant, rather
    // than waiting for the smooth-scroll animation's onScroll to catch up.
    setActiveIndex(index);
    track.scrollTo({
      left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, []);

  // Mirror activeIndex in a ref so rapid arrow clicks step from the latest
  // position rather than a stale closure value (state hasn't re-rendered yet
  // between two quick clicks).
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const step = useCallback(
    (dir) => {
      const next = Math.min(
        Math.max(activeIndexRef.current + dir, 0),
        items.length - 1
      );
      scrollToCard(next);
    },
    [items.length, scrollToCard]
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
          <span className={styles.badge}>
            <Sparkles size={12} aria-hidden="true" /> Real Experiences
          </span>
          <h2 className={styles.title}>
            {heading ? (
              heading
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

          {/* Filter chips — only when there's more than one category. */}
          {filters.length > 1 && (
            <div className={styles.filters} role="tablist" aria-label="Filter testimonials">
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === f}
                  className={`${styles.filterChip} ${activeFilter === f ? styles.filterActive : ""}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Carousel */}
        <div className={styles.carousel}>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowPrev}`}
            onClick={() => step(-1)}
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>

          <div className={styles.track} ref={trackRef} onScroll={handleScroll}>
            {items.map((t, i) => (
              <article
                key={t.id}
                data-card
                className={`${styles.card} ${i === activeIndex ? styles.cardActive : ""}`}
              >
                <div className={styles.cardTop}>
                  <Stars count={t.rating} />
                  {t.category && <span className={styles.tag}>{t.category}</span>}
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
                      <BadgeCheck size={14} aria-hidden="true" /> Verified Consultation
                    </span>
                  )}
                </div>

                {(t.type || t.date) && (
                  <div className={styles.cardFooter}>
                    <Quote size={13} aria-hidden="true" />{" "}
                    {[t.type, t.date].filter(Boolean).join(" · ")}
                  </div>
                )}
              </article>
            ))}
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
                onClick={() => scrollToCard(i)}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Trust bar */}
        <div className={styles.trustBar}>
          {TRUST.map((item) => {
            const Icon = item.icon;
            return (
              <div className={styles.trustItem} key={item.title}>
                <span className={styles.trustIcon}>
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div className={styles.trustText}>
                  <p className={styles.trustTitle}>{item.title}</p>
                  <p className={styles.trustSub}>{item.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
