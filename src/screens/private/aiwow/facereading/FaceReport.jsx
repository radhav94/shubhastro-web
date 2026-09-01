import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { BsChatDots } from "react-icons/bs";
import { MdOutlinePhoneInTalk } from "react-icons/md";
import {
  Sparkles,
  CheckCircle2,
  Star,
  AlertTriangle,
  Briefcase,
  Heart,
  Compass,
  Orbit,
  ScanFace,
  Lightbulb,
  Download,
  Share2,
} from "lucide-react";
import TTSButton from "../../../../component/UI/TTSButton";
import { PATH } from "../../../../utils/routes/Paths";
import RecommendedAstrologersModal from "../../../../component/UI/modal/RecommendedAstrologersModal/RecommendedAstrologersModal";
import useRecommendationOffer from "../../../../utils/hooks/useRecommendationOffer";
import styles from "./FaceReport.module.scss";

/** "analyticalMind" -> "Analytical Mind" */
const titleise = (key) =>
  String(key || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

/*
  Aura colour names from the API are not always valid CSS ("Red-Orange"), which
  would paint transparent. Same table the previous screen used.
*/
const AURA_COLORS = {
  red: "#E53935", "red-orange": "#FF4500", orange: "#FB8C00", amber: "#FFB300",
  gold: "#FFC107", golden: "#FFC107", copper: "#B87333", yellow: "#FDD835",
  lime: "#C0CA33", green: "#2E9E4F", teal: "#009688", cyan: "#00ACC1",
  "light-blue": "#4FC3F7", "sky-blue": "#4FC3F7", blue: "#1E62D0",
  "royal-blue": "#3949AB", indigo: "#3F51B5", violet: "#8E24AA",
  purple: "#8E24AA", magenta: "#D81B60", pink: "#EC407A", brown: "#8D6E63",
  // Light/neutral aura colours need an explicit, *visible* swatch — the CSS
  // named "cream"/"white"/"ivory" are so pale they vanish on the report's
  // cream background, which is exactly why the donut's largest slice showed
  // no colour. Map them to a warmer, distinguishable tone instead.
  cream: "#E6C79C", ivory: "#E6D8B8", beige: "#D9C2A0", tan: "#D2A679",
  white: "#CFCFCF", silver: "#BDBDBD", gray: "#9E9E9E", grey: "#9E9E9E",
  black: "#212121",
};

const auraHex = (name) => {
  if (!name) return "#ccc";
  const key = String(name).trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (AURA_COLORS[key]) return AURA_COLORS[key];
  if (/^[a-z]+$/.test(key)) return key;
  for (const part of key.split("-")) if (AURA_COLORS[part]) return AURA_COLORS[part];
  return "#ccc";
};

/*
  Soft tinted background for the tier badge. `auraHex` can return a full #hex
  OR a bare CSS colour name (e.g. "blue"), so appending an alpha suffix isn't
  safe universally. For a 6-digit hex we add "1f" (~12% alpha); otherwise fall
  back to color-mix so named colours still get a light tint without producing
  an invalid value like "blue1f".
*/
const auraTierTint = (hex) =>
  /^#[0-9a-fA-F]{6}$/.test(hex)
    ? `${hex}1f`
    : `color-mix(in srgb, ${hex} 12%, transparent)`;

/* The API's own grading, mapped to a colour only. */
const LEVEL_CLASS = {
  excellent: "levelExcellent",
  "very good": "levelVeryGood",
  strong: "levelStrong",
  good: "levelGood",
  moderate: "levelModerate",
  developing: "levelModerate",
};
const levelClass = (level) =>
  styles[LEVEL_CLASS[String(level || "").trim().toLowerCase()] || "levelGood"];

const AURA_ORDER = { primary: 0, secondary: 1, tertiary: 2, quaternary: 3 };

/* Strongest first, by the API's own wording — module scope so the memo that
   uses it has no changing dependency. */
const LEVEL_RANK = ["excellent", "very good", "strong", "good", "moderate", "developing"];

/** Donut built from CSS conic-gradient — no chart library for four slices. */
const AuraDonut = ({ slices }) => {
  const total = slices.reduce((sum, s) => sum + s.percentage, 0) || 1;
  let cursor = 0;
  const stops = slices.map((s) => {
    const from = (cursor / total) * 360;
    cursor += s.percentage;
    const to = (cursor / total) * 360;
    return `${s.hex} ${from}deg ${to}deg`;
  });
  return (
    <div
      className={styles.donut}
      style={{ background: `conic-gradient(${stops.join(", ")})` }}
      role="img"
      aria-label={slices.map((s) => `${s.label} ${s.percentage}%`).join(", ")}
    >
      <span className={styles.donutHole} />
    </div>
  );
};

/**
 * Section panel.
 *
 * The heading is a row rather than a bare `h3`: the design puts a filled icon
 * tile on the left and a read-aloud control on the right of every section, and
 * both have to share that baseline.
 */
const Panel = ({ id, icon, tone, title, tts, children, wide }) => {
  const Icon = icon;
  return (
    <section className={`${styles.panel} ${wide ? styles.panelWide : ""}`} id={id}>
      <div className={styles.panelHead}>
        <h3 className={styles.panelTitle}>
          <span className={`${styles.panelIcon} ${styles[tone] || ""}`}>
            <Icon size={14} aria-hidden="true" />
          </span>
          {title}
        </h3>
        {tts && <TTSButton text={tts} />}
      </div>
      {children}
    </section>
  );
};

/*
  Card heading: dark label, coloured glyph.

  The colour used to be on the text, which made every heading compete with the
  body copy for attention and made the cards hard to scan. Carrying the meaning
  on the icon alone keeps the labels one weight, as in the design.
*/
const SubTitle = ({ icon, tone, children }) => {
  const Icon = icon;
  return (
    <h4 className={styles.subTitle}>
      {Icon && <Icon size={13} className={styles[tone]} aria-hidden="true" />}
      {children}
    </h4>
  );
};

const Bullets = ({ items }) => (
  <ul className={styles.bullets}>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

const TABS = [
  { id: "all", label: "Over All" },
  { id: "personality", label: "Personality" },
  { id: "aura", label: "Aura" },
  { id: "cosmic", label: "Cosmic" },
  { id: "features", label: "Features" },
  { id: "insights", label: "Insights" },
];

/**
 * AI face reading report.
 *
 * Presentational only — the data, download and subscription plumbing stays in
 * FaceReadingResult. Every field below is one the API actually sends; sections
 * and individual cards render only when their data is present, so a partial
 * response degrades to fewer cards rather than to empty panels.
 *
 * @param {Object} props
 * @param {Object} props.data - the analysis payload
 * @param {string} [props.faceImage]
 * @param {Function} [props.onDownload]
 */
const FaceReport = ({ data, faceImage, onDownload }) => {
  const {
    overallReading = {},
    personalityAnalysis = {},
    auraColors = {},
    facialFeatures = {},
    cosmicConnections = {},
    personalizedInsights = {},
  } = data || {};

  const personality = useMemo(
    () => Object.entries(personalityAnalysis).filter(([, v]) => v && (v.level || v.description)),
    [personalityAnalysis]
  );

  const features = useMemo(
    () =>
      Object.entries(facialFeatures).filter(
        ([, v]) => v && (v.shape || v.shapeType || v.interpretation)
      ),
    [facialFeatures]
  );

  const auraSlices = useMemo(
    () =>
      Object.entries(auraColors)
        .filter(([, v]) => v && v.percentage)
        .sort((a, b) => (AURA_ORDER[a[0]] ?? 9) - (AURA_ORDER[b[0]] ?? 9))
        .map(([tier, v]) => ({
          tier,
          label: v.color || titleise(tier),
          percentage: Number(v.percentage) || 0,
          meaning: v.meaning,
          hex: auraHex(v.color),
        })),
    [auraColors]
  );

  /*
    The banner's headline trait. `level` is the API's grading, so the strongest
    is picked by that order rather than by inventing a score.
  */
  const topTrait = useMemo(() => {
    if (!personality.length) return null;
    const ranked = [...personality].sort((a, b) => {
      const ra = LEVEL_RANK.indexOf(String(a[1].level || "").toLowerCase());
      const rb = LEVEL_RANK.indexOf(String(b[1].level || "").toLowerCase());
      return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb);
    });
    return { key: ranked[0][0], ...ranked[0][1] };
  }, [personality]);

  const [activeTab, setActiveTab] = useState("all");
  const shows = (id) => activeTab === "all" || activeTab === id;

  // Same two-stage recommendation popup the Rashi report uses: Call/Chat open a
  // matched astrologer list first, and only escalate to the discounted offer on
  // dismiss. Keeps the CTA behaviour identical across reports.
  const recommendation = useRecommendationOffer();

  /* The banner reads the headline summary only. The cards below it are read by
     the Over All panel's own button, so the two never speak the same text. */
  const ttsScript = overallReading.summary || "";

  /*
    A read-aloud script per section, built from that section's own fields — the
    design shows the speaker on every panel, and a single whole-page script would
    make each button read the same thing.
  */
  const sectionTts = {
    overall: [
      overallReading.strengths?.length && `Strengths. ${overallReading.strengths.join(". ")}`,
      overallReading.challenges?.length && `Challenges. ${overallReading.challenges.join(". ")}`,
      overallReading.careerSuggestions?.length &&
        `Career suggestions. ${overallReading.careerSuggestions.join(". ")}`,
      data?.uniqueTraits?.length && `Unique traits. ${data.uniqueTraits.join(". ")}`,
      overallReading.lifeAdvice && `Life advice. ${overallReading.lifeAdvice}`,
      overallReading.relationshipInsights &&
        `Relationship insights. ${overallReading.relationshipInsights}`,
      overallReading.spiritualGuidance &&
        `Spiritual guidance. ${overallReading.spiritualGuidance}`,
    ]
      .filter(Boolean)
      .join(" "),
    personality: personality
      .map(([key, v]) => `${titleise(key)}. ${v.level || ""}. ${v.description || ""}`)
      .join(" "),
    aura: auraSlices
      .map((s) => `${s.label}, ${s.percentage} percent. ${s.meaning || ""}`)
      .join(" "),
    cosmic: [
      cosmicConnections.dominantPlanet?.planet &&
        `Dominant planet ${cosmicConnections.dominantPlanet.planet}. ${cosmicConnections.dominantPlanet.influence || ""}`,
      cosmicConnections.zodiacAlignment?.sign &&
        `Zodiac alignment ${cosmicConnections.zodiacAlignment.sign}. ${cosmicConnections.zodiacAlignment.description || ""}`,
      cosmicConnections.elementalEnergy?.element &&
        `Elemental energy ${cosmicConnections.elementalEnergy.element}.`,
      cosmicConnections.spiritualPath?.path &&
        `Spiritual path. ${cosmicConnections.spiritualPath.path}`,
    ]
      .filter(Boolean)
      .join(" "),
    features: features
      .map(
        ([key, v]) =>
          `${titleise(key)}. ${v.shape || v.shapeType || ""}. ${v.interpretation || ""}`
      )
      .join(" "),
    insights: [
      personalizedInsights.birthChartCorrelation,
      personalizedInsights.planetaryInfluenceOnFace,
      personalizedInsights.karmaReflection,
      personalizedInsights.lifePathAlignment,
      personalizedInsights.remedies?.length &&
        `Remedies. ${personalizedInsights.remedies.join(". ")}`,
    ]
      .filter(Boolean)
      .join(" "),
  };

  /*
    Web Share where the browser has it, clipboard otherwise. Desktop Chrome has
    no share sheet, so without the fallback the button would do nothing there.
  */
  const handleShare = async () => {
    const url = typeof window === "undefined" ? "" : window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My AI Face Reading", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      // A cancelled share sheet rejects too, so this stays silent rather than
      // reporting a failure the user caused deliberately.
    }
  };

  /*
    Banner facts. Each carries its own icon tint so the four read as distinct at a
    glance, and each is dropped when the API did not send it — the row shrinks
    rather than showing a chip with no value.
  */
  const bannerChips = [
    topTrait && {
      label: "Strength",
      value: titleise(topTrait.key),
      icon: Sparkles,
      tone: "toneViolet",
    },
    (facialFeatures.faceShape?.shape || facialFeatures.faceShape?.shapeType) && {
      label: "Face Shape",
      value: facialFeatures.faceShape.shape || facialFeatures.faceShape.shapeType,
      icon: ScanFace,
      tone: "toneOrange",
    },
    cosmicConnections.dominantPlanet?.planet && {
      label: "Dominant Planet",
      value: cosmicConnections.dominantPlanet.planet,
      icon: Orbit,
      tone: "toneGold",
    },
    cosmicConnections.zodiacAlignment?.sign && {
      label: "Zodiac Alignment",
      value: cosmicConnections.zodiacAlignment.sign,
      icon: Compass,
      tone: "toneRed",
    },
  ].filter(Boolean);

  return (
    <div className={styles.report}>
      {/* ── BANNER ─────────────────────────────────────────────────────── */}
      <header className={styles.banner}>
        <div className={styles.bannerCopy}>
          {/* Fixed labels, as in the design — these name the report, they are not
              data, so they do not change with the reading. */}
          <p className={styles.kicker}>
            <span>AI Face Reading</span>
            <span>Personality</span>
            <span>ShubhAstro Insight</span>
          </p>
          <h1 className={styles.bannerTitle}>
            Overall Reading
            {ttsScript && (
              <span className={styles.bannerTts}>
                <TTSButton text={ttsScript} />
              </span>
            )}
          </h1>
          <p className={styles.bannerSub}>Your astro face personality</p>
          {overallReading.summary && (
            <p className={styles.bannerText}>{overallReading.summary}</p>
          )}

          {bannerChips.length > 0 && (
            <dl className={styles.metaChips}>
              {bannerChips.map((chip) => {
                // Assigned to a capitalised local: the eslint config exempts
                // uppercase variables but not parameters, so `chip.icon` cannot be
                // destructured as a component in the callback signature.
                const ChipIcon = chip.icon;
                return (
                  <div key={chip.label}>
                    <dt>
                      <span className={`${styles.chipIcon} ${styles[chip.tone]}`}>
                        <ChipIcon size={12} aria-hidden="true" />
                      </span>
                      {chip.label}
                    </dt>
                    <dd>{chip.value}</dd>
                  </div>
                );
              })}
            </dl>
          )}
        </div>

        {faceImage && (
          <figure className={styles.bannerPhoto}>
            {/* Four corner brackets, as in the design — a scan frame around a
                circular crop. Drawn in CSS rather than shipped as artwork so it
                inherits the theme colour and stays crisp at any size. */}
            <span className={styles.scanFrame} aria-hidden="true">
              <i /><i /><i /><i />
            </span>
            <img src={faceImage} alt="Your scan" />
            {/* Circle-check, not a shield: the design's mark reads as
                "done", and a shield reads as "secure" — different promise. */}
            <figcaption>
              <CheckCircle2 size={20} aria-hidden="true" /> Face Scan Complete
            </figcaption>
          </figure>
        )}


      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          {/*
            ── TABS ─────────────────────────────────────────────────────
            Inside the main column, not above the whole layout — the bar has to
            stop where the content panels stop, and living in the same grid
            track means it inherits that width instead of repeating the
            sidebar's 290px here.
          */}
          <div className={styles.tabs} role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabOn : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── OVER ALL ─────────────────────────────────────────────── */}
          {shows("all") && (
            <Panel
              id="overall"
              icon={Sparkles}
              tone="toneViolet"
              title="Over All"
              tts={sectionTts.overall}
              wide
            >
              <div className={styles.triGrid}>
                {overallReading.strengths?.length > 0 && (
                  <div className={styles.subCard}>
                    <SubTitle icon={Star} tone="inkGold">Strengths</SubTitle>
                    <Bullets items={overallReading.strengths} />
                  </div>
                )}
                {overallReading.challenges?.length > 0 && (
                  <div className={styles.subCard}>
                    <SubTitle icon={AlertTriangle} tone="inkOrange">Challenges</SubTitle>
                    <Bullets items={overallReading.challenges} />
                  </div>
                )}
                {overallReading.careerSuggestions?.length > 0 && (
                  <div className={styles.subCard}>
                    <SubTitle icon={Briefcase} tone="inkGreen">Career Suggestions</SubTitle>
                    <Bullets items={overallReading.careerSuggestions} />
                  </div>
                )}
              </div>

              <div className={styles.duoGrid}>
                {data?.uniqueTraits?.length > 0 && (
                  <div className={styles.subCard}>
                    <SubTitle icon={Sparkles} tone="inkViolet">Unique Traits</SubTitle>
                    <Bullets items={data.uniqueTraits} />
                  </div>
                )}
                {overallReading.lifeAdvice && (
                  <div className={styles.subCard}>
                    <SubTitle icon={Lightbulb} tone="inkGold">Life Advice</SubTitle>
                    <p className={styles.body}>{overallReading.lifeAdvice}</p>
                  </div>
                )}
                {overallReading.relationshipInsights && (
                  <div className={styles.subCard}>
                    <SubTitle icon={Heart} tone="inkPink">Relationship Insights</SubTitle>
                    <p className={styles.body}>{overallReading.relationshipInsights}</p>
                  </div>
                )}
                {overallReading.spiritualGuidance && (
                  <div className={styles.subCard}>
                    <SubTitle icon={Orbit} tone="inkViolet">Spiritual Guidance</SubTitle>
                    <p className={styles.body}>{overallReading.spiritualGuidance}</p>
                  </div>
                )}
              </div>
            </Panel>
          )}

          {/* ── PERSONALITY ──────────────────────────────────────────── */}
          {shows("personality") && personality.length > 0 && (
            <Panel
              id="personality"
              icon={Sparkles}
              tone="tonePink"
              title="Personality"
              tts={sectionTts.personality}
            >
              <div className={styles.duoGrid}>
                {personality.map(([key, value]) => (
                  <div key={key} className={styles.subCard}>
                    <h4 className={styles.traitHead}>
                      {titleise(key)}
                      {value.level && (
                        <span className={`${styles.levelChip} ${levelClass(value.level)}`}>
                          {value.level}
                        </span>
                      )}
                    </h4>
                    {value.description && <p className={styles.body}>{value.description}</p>}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <div className={styles.duoRow}>
            {/* ── AURA ───────────────────────────────────────────────── */}
            {shows("aura") && auraSlices.length > 0 && (
              <Panel
                id="aura"
                icon={Orbit}
                tone="toneGold"
                title="Aura"
                tts={sectionTts.aura}
              >
                <div className={styles.auraWrap}>
                  <AuraDonut slices={auraSlices} />
                  <dl className={styles.auraLegend}>
                    {auraSlices.map((slice) => (
                      <div key={slice.tier}>
                        <dt>
                          <span
                            className={styles.auraDot}
                            style={{ background: slice.hex }}
                            aria-hidden="true"
                          />
                          {slice.label} — {slice.percentage}%
                          <span
                            className={styles.auraTier}
                            style={{ background: auraTierTint(slice.hex), color: slice.hex }}
                          >
                            {titleise(slice.tier)}
                          </span>
                        </dt>
                        {slice.meaning && <dd>{slice.meaning}</dd>}
                      </div>
                    ))}
                  </dl>
                </div>
              </Panel>
            )}

            {/* ── COSMIC ─────────────────────────────────────────────── */}
            {shows("cosmic") && Object.keys(cosmicConnections).length > 0 && (
              <Panel
                id="cosmic"
                icon={Orbit}
                tone="toneRed"
                title="Cosmic"
                tts={sectionTts.cosmic}
              >
                <div className={styles.stack}>
                  {cosmicConnections.dominantPlanet?.planet && (
                    <div className={styles.subCard}>
                      <h4 className={styles.traitHead}>
                        Dominant Planet
                        <span className={`${styles.levelChip} ${styles.levelStrong}`}>
                          {cosmicConnections.dominantPlanet.planet}
                        </span>
                      </h4>
                      {cosmicConnections.dominantPlanet.influence && (
                        <p className={styles.body}>{cosmicConnections.dominantPlanet.influence}</p>
                      )}
                      {cosmicConnections.dominantPlanet.traits?.length > 0 && (
                        <p className={styles.chipRow}>
                          {cosmicConnections.dominantPlanet.traits.map((t) => (
                            <span key={t} className={styles.chip}>{t}</span>
                          ))}
                        </p>
                      )}
                    </div>
                  )}

                  {cosmicConnections.zodiacAlignment?.sign && (
                    <div className={styles.subCard}>
                      <h4 className={styles.traitHead}>
                        Zodiac Alignment
                        <span className={`${styles.levelChip} ${styles.levelGood}`}>
                          {cosmicConnections.zodiacAlignment.sign}
                        </span>
                      </h4>
                      {cosmicConnections.zodiacAlignment.description && (
                        <p className={styles.body}>
                          {cosmicConnections.zodiacAlignment.description}
                        </p>
                      )}
                      {cosmicConnections.zodiacAlignment.compatibility && (
                        <p className={styles.bodyMuted}>
                          Compatible with {cosmicConnections.zodiacAlignment.compatibility}
                        </p>
                      )}
                    </div>
                  )}

                  {cosmicConnections.elementalEnergy?.element && (
                    <div className={styles.subCard}>
                      <h4 className={styles.traitHead}>
                        Elemental Energy
                        <span className={`${styles.levelChip} ${styles.levelVeryGood}`}>
                          {cosmicConnections.elementalEnergy.element}
                        </span>
                      </h4>
                      {cosmicConnections.elementalEnergy.characteristics?.length > 0 && (
                        <p className={styles.chipRow}>
                          {cosmicConnections.elementalEnergy.characteristics.map((c) => (
                            <span key={c} className={styles.chip}>{c}</span>
                          ))}
                        </p>
                      )}
                    </div>
                  )}

                  {cosmicConnections.spiritualPath?.path && (
                    <div className={styles.subCard}>
                      <h4 className={styles.traitHead}>Spiritual Path</h4>
                      <p className={styles.body}>{cosmicConnections.spiritualPath.path}</p>
                      {cosmicConnections.spiritualPath.guidance && (
                        <p className={styles.bodyMuted}>
                          {cosmicConnections.spiritualPath.guidance}
                        </p>
                      )}
                      {cosmicConnections.spiritualPath.practices?.length > 0 && (
                        <p className={styles.chipRow}>
                          {cosmicConnections.spiritualPath.practices.map((p) => (
                            <span key={p} className={styles.chip}>{p}</span>
                          ))}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Panel>
            )}
          </div>

          {/* ── FEATURES ─────────────────────────────────────────────── */}
          {shows("features") && features.length > 0 && (
            <Panel
              id="features"
              icon={ScanFace}
              tone="toneOrange"
              title="Features"
              tts={sectionTts.features}
            >
              <div className={styles.duoGrid}>
                {features.map(([key, value]) => (
                  <div key={key} className={styles.subCard}>
                    <h4 className={styles.traitHead}>
                      {titleise(key)}
                      {(value.shape || value.shapeType) && (
                        <span className={`${styles.levelChip} ${styles.levelShape}`}>
                          Shape: {value.shape || value.shapeType}
                        </span>
                      )}
                    </h4>
                    {value.interpretation && (
                      <p className={styles.body}>{value.interpretation}</p>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* ── INSIGHTS ─────────────────────────────────────────────── */}
          {shows("insights") && Object.keys(personalizedInsights).length > 0 && (
            <Panel
              id="insights"
              icon={Lightbulb}
              tone="toneGold"
              title="Insights"
              tts={sectionTts.insights}
            >
              <div className={styles.triGrid}>
                {[
                  ["birthChartCorrelation", "Birth Chart Correlation"],
                  ["planetaryInfluenceOnFace", "Planetary Influence on Face"],
                  ["karmaReflection", "Karma Reflection"],
                  ["lifePathAlignment", "Life Path Alignment"],
                ].map(([key, label]) =>
                  personalizedInsights[key] ? (
                    <div key={key} className={styles.subCard}>
                      <SubTitle tone="inkBlue">{label}</SubTitle>
                      <p className={styles.body}>{personalizedInsights[key]}</p>
                    </div>
                  ) : null
                )}
                {personalizedInsights.remedies?.length > 0 && (
                  <div className={styles.subCard}>
                    <SubTitle tone="inkViolet">Astrological Remedies</SubTitle>
                    <Bullets items={personalizedInsights.remedies} />
                  </div>
                )}
              </div>
            </Panel>
          )}
        </div>

        {/* ── SIDEBAR ────────────────────────────────────────────────── */}
        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <div className={styles.sideTools}>
              {onDownload && (
                <button
                  type="button"
                  className={styles.sideToolBtn}
                  onClick={onDownload}
                  aria-label="Download report"
                  title="Download report"
                >
                  <Download size={15} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                className={styles.sideToolBtn}
                onClick={handleShare}
                aria-label="Share report"
                title="Share report"
              >
                <Share2 size={15} aria-hidden="true" />
              </button>
            </div>

            <p className={styles.sideKicker}>Your Personality</p>
            {topTrait && <h3 className={styles.sideTitle}>{titleise(topTrait.key)}</h3>}
            {(topTrait?.description || overallReading.summary) && (
              <p className={styles.sideBody}>
                {topTrait?.description || overallReading.summary}
              </p>
            )}

            {bannerChips.length > 0 && (
              <p className={styles.chipRow}>
                {bannerChips.slice(1).map((chip) => (
                  <span key={chip.label} className={styles.chip}>{chip.value}</span>
                ))}
              </p>
            )}

            <div className={styles.actions}>
              {/*
                Call/Chat open the matched-astrologer recommendation popup first
                (same as the Rashi report) instead of jumping straight to the
                listing. Kept as real <a href> so middle-click / open-in-new-tab
                still reach the listing page.
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
              <Link to="/ai-wow" className={styles.actionTertiary}>
                <Sparkles size={14} aria-hidden="true" /> Ask Shubh AI · Free
              </Link>
            </div>

            {onDownload && (
              <button type="button" className={styles.downloadLink} onClick={onDownload}>
                Download report
              </button>
            )}
          </div>
        </aside>
      </div>

      <RecommendedAstrologersModal
        isOpen={recommendation.isOpen}
        variant={recommendation.stage === "offer" ? "offer" : "plain"}
        type={recommendation.type || "chat"}
        onDismiss={recommendation.dismiss}
        onFinish={recommendation.finish}
        // Nothing discounted to show -> the close press just closes.
        onNothingToOffer={recommendation.finish}
      />
    </div>
  );
};

export default FaceReport;
