import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaAngleDoubleDown, FaAngleDoubleUp } from "react-icons/fa";
import { useGetAiWowPageDataQuery } from "../../../../redux/api/aiwow/aiwowApi";
import { useGetAllKundlisQuery } from "../../../../services/appServices/kundliServicesNew";
import MobileAppModal from "../../../private/aiwow/components/MobileAppModal";
import styles from "./AIWowSection.module.scss";
import wireBg from "../../../../assets/images/wire-bg.svg";
import { useSelector } from "react-redux";
import { GuestKundliAuthModal } from "../../../../component/UI/Profile";

const COLLAPSED_COUNT = 4;

const TitleDivider = () => (
  <div className={styles.titleDivider}>
    <div className={styles.dividerLine}>
      <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
        <path d="M52.2858 0.406393C52.2858 0.630933 51.128 0.812789 49.6998 0.812789C48.2716 0.812789 0 0.630933 0 0.406393C0 0.181853 48.2719 0 49.6998 0C51.128 0 52.2858 0.181853 52.2858 0.406393Z" fill="#2A161B" fillOpacity="0.2" />
      </svg>
    </div>
    <span className={styles.dividerMoon}>
      <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
        <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303" />
      </svg>
    </span>
    <div className={styles.dividerLine}>
      <svg xmlns="http://www.w3.org/2000/svg" width="53" height="1" viewBox="0 0 53 1" fill="none">
        <path d="M0 0.406393C0 0.630933 1.15779 0.812789 2.58601 0.812789C4.01424 0.812789 52.2858 0.630933 52.2858 0.406393C52.2858 0.181853 4.01393 0 2.58601 0C1.15779 0 0 0.181853 0 0.406393Z" fill="#2A161B" fillOpacity="0.2" />
      </svg>
    </div>
  </div>
);

const SuiteSection = ({ title, features, onCardClick }) => (
  <div className={styles.suiteBlock}>
    <div className={styles.wowLabel}>
      <h3 className={styles.wowTitle}>{title}</h3>
      <TitleDivider />
    </div>
    <div className={styles.featureGrid}>
      {features.map((feature) => (
        <div
          key={feature.id || feature.slug}
          className={styles.featureCard}
          onClick={() => onCardClick(feature.slug)}
        >
          <div className={styles.featureIconWrap}>
            <img src={feature.icon} alt={feature.title} className={styles.featureIcon} />
          </div>
          <p className={styles.featureTitle}>{feature.title}</p>
        </div>
      ))}
    </div>
  </div>
);

const AIWowSection = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [showMobileAppModal, setShowMobileAppModal] = useState(false);
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const pendingSlugRef = useRef(null);
  const { data: aiwowData } = useGetAiWowPageDataQuery();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const selectedKundli = useSelector((state) => state.kundli.selectedKundli);

  const { data: profilesData } = useGetAllKundlisQuery(undefined, {
    skip: !isLoggedIn,
  });
  const profiles = profilesData?.data || [];
  const selfProfile = profiles.find((p) => p.relation === "Self") || profiles[0];

  const greetingName = (() => {
    if (!isLoggedIn) return "Guest";
    if (selectedKundli?.name) return selectedKundli.name;
    if (selfProfile?.name) return selfProfile.name;
    return "Guest";
  })();

  const sections = aiwowData?.data?.list || [];
  const activeSections = sections
    .filter((s) => s?.status)
    .map((s) => ({
      ...s,
      content: (s.content || []).filter((f) => f?.publishStatus),
    }))
    .filter((s) => s.content.length > 0);

  const firstSection = activeSections[0];
  const remainingSections = activeSections.slice(1);

  // Image-based features let guests browse the intro; auth is requested later
  // at the photo capture/upload step inside the feature flow.
  const guestAccessSlugs = [
    "ai-palmistry-scanner",
    "astro-face-reading",
    "signature-analysis",
    "clothes-colour-analysis",
    "gemstone-authenticity",
    "aura-photography",
  ];

  const navigateToFeature = (slug) => {
    if (slug === "ar-vastu-scanner") {
      setShowMobileAppModal(true);
    } else {
      const path = guestAccessSlugs.includes(slug) ? `/${slug}` : `/aiwow/${slug}`;
      navigate(path);
    }
  };

  const handleCardClick = (slug) => {
    // AR Vastu Scanner is an app-only feature — show its own modal directly,
    // never the guest kundli popup.
    if (slug === "ar-vastu-scanner") {
      setShowMobileAppModal(true);
      return;
    }
    // Guests: kundli-based features collect kundli + verify OTP up front;
    // image-based features are gated later at the photo step.
    if (!isLoggedIn && !guestAccessSlugs.includes(slug)) {
      pendingSlugRef.current = slug;
      setShowGuestAuthModal(true);
      return;
    }
    navigateToFeature(slug);
  };

  const handleGuestAuthSuccess = () => {
    setShowGuestAuthModal(false);
    const slug = pendingSlugRef.current;
    pendingSlugRef.current = null;
    if (slug) navigateToFeature(slug);
  };

  if (activeSections.length === 0) return null;

  const collapsedFeatures = (firstSection?.content || []).slice(0, COLLAPSED_COUNT);

  return (
    <div className={styles.aiWowMain}>
      {/* Badge */}
      <div className={styles.badge}>
        <span className={styles.badgeIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M8 2L9.4 6.6L14 8L9.4 9.4L8 14L6.6 9.4L2 8L6.6 6.6L8 2Z" fill="#e65100" />
            <path d="M17 3L17.8 5.2L20 6L17.8 6.8L17 9L16.2 6.8L14 6L16.2 5.2L17 3Z" fill="#e65100" />
            <path d="M17 12L17.6 13.8L19.5 14.5L17.6 15.2L17 17L16.4 15.2L14.5 14.5L16.4 13.8L17 12Z" fill="#e65100" />
          </svg>
        </span>
        <span className={styles.badgeText}>AI-POWERED ASTROLOGY</span>
      </div>
    <div className={styles.aiWowSectionWrap}>
    <section className={styles.aiWowSection}>
      <div className={styles.waveBg}>
        <img src={wireBg} alt="img" />
      </div>
      
      {/* <h1 className={styles.AIWowUserName}>Hello, John Doe!</h1> */}
      <h1 className={styles.AIWowUserName} key={`greeting-${greetingName}`}>Hello, <span className="notranslate">{greetingName}</span>!</h1>
      <h2 className={styles.heading}>
        Experience Astrology <span className={styles.headingHighlight}>Powered by AI</span>
      </h2>

      <p className={styles.description}>
        Get smarter, faster, and more personalized insights through an advanced AI-driven platform
        with your <strong>birth chart</strong>.
      </p>

      {/* Collapsed */}
      {!expanded && firstSection && (
        <>
          <div className={styles.wowLabel}>
            <h3 className={styles.wowTitle}>{firstSection.title}</h3>
            <TitleDivider />
          </div>
          <div className={styles.featureGrid}>
            {collapsedFeatures.map((feature) => (
              <div
                key={feature.id || feature.slug}
                className={styles.featureCard}
                onClick={() => handleCardClick(feature.slug)}
              >
                <div className={styles.featureIconWrap}>
                  <img src={feature.icon} alt={feature.title} className={styles.featureIcon} />
                </div>
                <p className={styles.featureTitle}>{feature.title}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Expanded */}
      {expanded && (
        <div className={styles.expandedContent}>
          {firstSection && (
            <SuiteSection title={firstSection.title} features={firstSection.content} onCardClick={handleCardClick} />
          )}
          {remainingSections.map((section) => (
            <SuiteSection key={section.ID || section.title} title={section.title} features={section.content} onCardClick={handleCardClick} />
          ))}
        </div>
      )}

      {/* Toggle Arrow */}
      <div
        className={`${styles.downArrow} ${!expanded ? styles.downArrowBounce : ""}`}
        onClick={() => setExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-label={expanded ? "Collapse section" : "Expand section"}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((prev) => !prev)}
      >
        {expanded ? <FaAngleDoubleUp /> : <FaAngleDoubleDown />}
      </div>

      <MobileAppModal
        isOpen={showMobileAppModal}
        onClose={() => setShowMobileAppModal(false)}
      />

      <GuestKundliAuthModal
        isOpen={showGuestAuthModal}
        onClose={() => {
          setShowGuestAuthModal(false);
          pendingSlugRef.current = null;
        }}
        onSuccess={handleGuestAuthSuccess}
      />
    </section>
    </div>
    </div>
  );
};

export default AIWowSection;
