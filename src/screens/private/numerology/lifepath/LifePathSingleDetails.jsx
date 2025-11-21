// src/components/LifePathSingle/LifePathSingleDetails.jsx
import React from "react";
import styles from "./LifePathSingle.module.scss";

const LifePathSingleDetails = ({ data }) => {
  if (!data) return null;

  // Control the order of sections
  const sectionOrder = [
    "destiny",
    "personality",
    "attitude",
    "character",
    "soul",
    "agenda",
    "purpose",
  ];

  const sections = sectionOrder
    .filter((key) => data[key])
    .map((key) => ({ key, ...data[key] }));

  const mainSection = sections[0];
  const totalNumbers = sections.length;

  const destinyNumber = data.destiny?.number ?? "—";
  const personalityNumber = data.personality?.number ?? "—";
  const purposeNumber = data.purpose?.number ?? "—";
  const soulTitle = data.soul?.title ?? "your inner self";
  const characterTitle = data.character?.title ?? "outer expression";

  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.breadcrumb}>Your Numbers</div>

            <h1 className={styles.title}>Your Numerology Blueprint</h1>

            <p className={styles.subtitle}>
              A high–definition snapshot of your destiny, personality and soul
              codes — distilled into one elegant profile.
            </p>

            <div className={styles.headerMetaRow}>
              <div className={styles.chipSoft}>
                <span className={styles.chipLabel}>Total Core Numbers</span>
                <span className={styles.chipValue}>{totalNumbers}</span>
              </div>
              {mainSection && (
                <div className={styles.chipSoft}>
                  <span className={styles.chipLabel}>Primary Frequency</span>
                  <span className={styles.chipValue}>
                    {mainSection.number} • {mainSection.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.headerRight}>
            {mainSection && (
              <div className={`${styles.pill} ${styles.gradientBorder}`}>
                <span className={styles.pillLabel}>Profile Type</span>
                <span className={styles.pillValue}>
                  {mainSection.number} • {mainSection.title}
                </span>
                <span className={styles.pillSub}>
                  {mainSection.category || "Core Blueprint"}
                </span>
              </div>
            )}
          </div>
        </header>

        <div className={styles.sectionDivider} />

        {/* Main layout */}
        <div className={styles.layout}>
          {/* Left: Highlight card */}
          {mainSection && (
            <section
              className={`${styles.highlightCard} ${styles.premiumCard}`}
            >
              <div className={styles.highlightTopRow}>
                <div className={styles.highlightNumberWrapper}>
                  <div className={styles.highlightNumber}>
                    {mainSection.number}
                  </div>
                  {mainSection.master && (
                    <span className={styles.masterTag}>Master Number</span>
                  )}
                </div>

                <div className={styles.highlightTitleBlock}>
                  <h2 className={styles.highlightTitle}>
                    {mainSection.title}
                  </h2>
                  <p className={styles.highlightTagline}>
                    {mainSection.category || "Core Blueprint"}
                  </p>
                </div>
              </div>

              <div className={styles.highlightText}>
                <p className={styles.highlightMeaning}>
                  {mainSection.meaning}
                </p>
                <p className={styles.highlightDescription}>
                  {mainSection.description}
                </p>
              </div>

              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Category</span>
                  <span className={styles.metaValue}>
                    {mainSection.category}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Core Vibration</span>
                  <span className={styles.metaValue}>
                    {mainSection.master ? "Intense • Amplified" : "Harmonised"}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Focus</span>
                  <span className={styles.metaValue}>
                    {mainSection.focus || "Life direction & soul evolution"}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Right: AI insight style card */}
          <section
            className={`${styles.aiCard} ${styles.premiumCard} ${styles.glass}`}
          >
            <div className={styles.aiHeader}>
              <span className={styles.aiDot} />
              <span className={styles.aiTitle}>AI Insight</span>
              <span className={styles.aiTag}>Generated Overview</span>
            </div>

            <p className={styles.aiBody}>
              Your chart weaves together{" "}
              <strong>{destinyNumber}</strong> Destiny,{" "}
              <strong>{personalityNumber}</strong> Personality and{" "}
              <strong>{purposeNumber}</strong> Divine Purpose — revealing a path
              where you are meant to guide, express and transform.
            </p>

            <p className={styles.aiBodySecondary}>
              You thrive when you honour both your inner{" "}
              <strong>{soulTitle}</strong> and your outer{" "}
              <strong>{characterTitle}</strong>, creating a life that is aligned,
              inspiring and quietly powerful. The more you embody this blend,
              the more magnetic and effortless your journey becomes.
            </p>

            <div className={styles.aiFooter}>
              <div className={styles.aiPillMini}>Aligned Expression</div>
              <div className={styles.aiPillMini}>Soul–Led Decisions</div>
              <div className={styles.aiPillMini}>Conscious Leadership</div>
            </div>
          </section>
        </div>

        {/* Grid of all sections */}
        <section className={styles.gridSection}>
          <div className={styles.gridHeader}>
            <h2>Core Numbers Overview</h2>
            <p>
              Explore each key number to understand how it shapes your
              motivations, personality and life direction. Think of this as your
              energetic “control panel”.
            </p>
          </div>

          <div className={styles.cardGrid}>
            {sections.map((section, index) => (
              <article
                key={section.key}
                className={`${styles.card} ${styles.premiumCardSoft}`}
                style={{ animationDelay: `${0.04 * index}s` }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardNumberWrapper}>
                    <span className={styles.cardNumber}>
                      {section.number}
                    </span>
                    {section.master && (
                      <span className={styles.cardMasterBadge}>Master</span>
                    )}
                  </div>

                  <div className={styles.cardTitleBlock}>
                    <h3 className={styles.cardTitle}>{section.title}</h3>
                    <span className={styles.cardCategory}>
                      {section.category}
                    </span>
                  </div>
                </div>

                <p className={styles.cardMeaning}>{section.meaning}</p>
                <p className={styles.cardDescription}>
                  {section.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LifePathSingleDetails;
