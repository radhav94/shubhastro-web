import { useState, useMemo, useRef, useEffect, useId } from "react";
import TTSButton from "../../../../../../component/UI/TTSButton";
import styles from "./Planetary.module.scss";

const PlanetaryCard = ({ planet }) => {
  const [showMore, setShowMore] = useState(false);
  const [showFullAffliction, setShowFullAffliction] = useState(false);

  // Declared above the early return below: this component already trips
  // rules-of-hooks with a useMemo after that return, and adding to the problem
  // would make the real ordering harder to reason about.
  const cardRef = useRef(null);
  const expandedRef = useRef(null);
  const isFirstRender = useRef(true);
  const detailsId = useId();

  /*
   * The Show More button sits at the bottom of the card and the ~10 revealed
   * sections are inserted *above* it. Expanding therefore pushed the button far
   * down the document — several screens' worth of astrology prose on a phone —
   * while the beginning of the new content ended up well above the viewport.
   * The visible result of the tap was that the button left the finger and the
   * page appeared to jump, with nothing obviously new where the user was
   * looking. Same class as the FAQ accordion: put the state change on screen.
   *
   * Expanding scrolls to the top of the revealed content, which is what the tap
   * was asking for. Collapsing scrolls back to the card so the reader is not
   * dropped somewhere arbitrary once the prose disappears.
   */
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const target = showMore ? expandedRef.current : cardRef.current;
    if (!target) return;
    // rAF so the newly rendered sections are laid out before measuring.
    const frame = requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: showMore ? "start" : "nearest",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [showMore]);

  if (!planet || !planet.planet_considered) {
    return null;
  }

  const safe = (value, fallback = "") =>
    value !== undefined && value !== null && value !== "" ? value : fallback;

  const toggleShowMore = () => {
    setShowMore(!showMore);
  };

  const toggleAffliction = () => {
    setShowFullAffliction(!showFullAffliction);
  };

  // Function to get first 2 sentences from text
  const getTruncatedText = (text) => {
    if (!text || text === "—") return text;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (sentences.length <= 2) return text;
    return sentences.slice(0, 2).join(' ');
  };

  const afflictionText = safe(planet.affliction, "—");
  const truncatedAffliction = getTruncatedText(afflictionText);
  const shouldShowAfflictionToggle = afflictionText !== "—" && afflictionText !== truncatedAffliction;

  // Build TTS text from all card content (independent of showMore state)
  const ttsText = useMemo(() => {
    const parts = [];
    
    if (safe(planet.planet_considered)) {
      parts.push(`${safe(planet.planet_considered)} Consideration.`);
    }
    if (safe(planet.planet_definitions)) {
      parts.push(`Definition: ${safe(planet.planet_definitions)}`);
    }
    if (safe(planet.affliction)) {
      parts.push(`Affliction: ${safe(planet.affliction)}`);
    }
    if (safe(planet.gayatri_mantra)) {
      parts.push(`Gayatri Mantra: ${safe(planet.gayatri_mantra)}`);
    }
    if (safe(planet.general_prediction)) {
      parts.push(`General Prediction: ${safe(planet.general_prediction)}`);
    }
    if (safe(planet.planet_zodiac_prediction)) {
      parts.push(`Planet Zodiac Prediction: ${safe(planet.planet_zodiac_prediction)}`);
    }
    if (safe(planet.personalised_prediction)) {
      parts.push(`Personalised Prediction: ${safe(planet.personalised_prediction)}`);
    }

    return parts.join(" ");
  }, [planet]);

  return (
    <div className={styles.card} ref={cardRef}>
      {/* Title */}
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          {safe(planet.planet_considered, "—")} Consideration
        </h2>
        <TTSButton text={ttsText} />
      </div>

      {/* Content - Always Visible */}
      <div className={styles.contentWrapper}>
        {/* Planet Definition */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Definition
          </h2>
          <p size_16 color="#555" className={styles.sectionContent}>
            {safe(planet.planet_definitions, "—")}
          </p>
        </div>
        {/* Affliction */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Affliction
          </h2>
          <div className={styles.sectionContent}>
            <span className={styles.afflictionText}>
              {showFullAffliction ? afflictionText : truncatedAffliction}
              {/*
                This toggle expands text in place, right next to the finger, so
                it needs no scroll handling — only the missing semantics.
              */}
              {shouldShowAfflictionToggle && (
                <button
                  type="button"
                  className={styles.inlineShowMore}
                  onClick={toggleAffliction}
                  aria-expanded={showFullAffliction}
                >
                  {showFullAffliction ? 'Show Less' : 'Show More'}
                </button>
              )}
            </span>
          </div>
        </div>

        {/* Additional Content - Hidden by default */}
        {showMore && (
          <div ref={expandedRef} id={detailsId} role="region" aria-label="More planetary details">
            {/* Mantra */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Gayatri Mantra
              </h2>
              <p color="#555" className={styles.sectionContent}>
                {safe(planet.gayatri_mantra, "—")}
              </p>
            </div>

            {/* General Prediction */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                General Prediction
              </h2>
              <p color="#555" className={styles.sectionContent}>
                {safe(planet.general_prediction, "—")}
              </p>
            </div>

            {/* Zodiac Prediction */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Planet Zodiac Prediction
              </h2>
              <p color="#555" className={styles.sectionContent}>
                {safe(planet.planet_zodiac_prediction, "—")}
              </p>
            </div>

            {/* Personalised Prediction */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Personalised Prediction
              </h2>
              <p color="#555" className={styles.sectionContent}>
                {safe(planet.personalised_prediction, "—")}
              </p>
            </div>

            {/* Long Qualities */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Long Qualities
              </h2>
              <p color="#555" className={styles.sectionContent}>
                {safe(planet.qualities_long, "—")}
              </p>
            </div>
            {/*Short  Qualities */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                short Qualities
              </h2>
              <p color="#555" className={styles.sectionContent}>
                {safe(planet.qualities_short, "—")}
              </p>
            </div>

            {/* Verbal Location */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Verbal Location
              </h2>
              <p color="#555" className={styles.sectionContent}>
                {safe(planet.verbal_location, "—")}
              </p>
            </div>

            {/* Zodiac Lord Location */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Zodiac Lord Location
              </h2>
              <p color="#555" className={styles.sectionContent}>
                {safe(planet.zodiac_lord_location, "—")}
              </p>
            </div>

            {/* Zodiac Lord Strength */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Zodiac Lord Strength
              </h2>
              <p color="#555" className={styles.sectionContent}>
                {safe(planet.zodiac_lord_strength, "—")}
              </p>
            </div>

            {/* Tags */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Character Traits
              </h2>

              <div className={styles.tagContainer}>
                {(planet.character_keywords_positive ?? [])?.map((k, idx) => (
                  <span
                    key={`pos-${idx}`}
                    className={`${styles.tag} ${styles.tagPositive}`}
                  >
                    {k ?? "—"}
                  </span>
                ))}

                {(planet.character_keywords_negative ?? [])?.map((k, idx) => (
                  <span
                    key={`neg-${idx}`}
                    className={`${styles.tag} ${styles.tagNegative}`}
                  >
                    {k ?? "—"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Show More Button - Always at the bottom */}
        <div className={styles.showMoreContainer}>
          <button
            type="button"
            className={styles.showMoreBtn}
            onClick={toggleShowMore}
            aria-expanded={showMore}
            aria-controls={showMore ? detailsId : undefined}
          >
            {showMore ? 'Show Less' : 'Show More'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanetaryCard;
