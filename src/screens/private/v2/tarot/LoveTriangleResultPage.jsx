import { useState } from "react";
import ChevronLeft from "../components/ui/ChevronLeft";
import { useNavigate, useLocation } from "react-router-dom";
import { useGetLoveTriangleTarotQuery } from "../../../../redux/api/tarot/tarotApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import TTSButton from "../../../../component/UI/TTSButton";
import styles from "./LoveTriangleResultPage.module.css";

const LoveTriangleResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { reading, selectedCards } = location.state || {};

  const [activeTab, setActiveTab] = useState("you");

  // Extract card names from selected cards — id is string from shuffle API e.g. "the_star"
  const cardSelf = selectedCards?.you?.id || "the-hermit";
  const cardLover1 = selectedCards?.partner1?.id || "the-high-priestess";
  const cardLover2 = selectedCards?.partner2?.id || "the-devil";

  // Fetch love triangle data from API
  const { data, isLoading, error, refetch } = useGetLoveTriangleTarotQuery(
    {
      card_self: cardSelf,
      card_lover1: cardLover1,
      card_lover2: cardLover2,
      lang: "en",
    },
    {
      skip: !cardSelf || !cardLover1 || !cardLover2,
    },
  );

  const tabs = [
    { id: "you", label: "You" },
    { id: "partner1", label: "Partner 1" },
    { id: "partner2", label: "Partner 2" },
  ];

  // `navigate(-1)` is inert on the first history entry — a shared link landing
  // straight on a result, or a refresh.
  const goBack = () =>
    location.key !== "default" ? navigate(-1) : navigate("/tarot");

  // The header and tab strip stay put while the panel below re-renders from its
  // top, which can be well above the viewport after scrolling — so a tab tap
  // changed nothing near the finger.
  const handleTabChange = (id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return <PrimaryLoader isLoading={true} />;
  }

  const apiResponse = data?.response || {};

  // Treat a malformed payload exactly like a failed request. Every field below
  // used to be read straight off `apiResponse.self` / `.lover1` / `.lover2`
  // (including `.card_image.artwork`), so a 200 that didn't carry those keys
  // threw a TypeError mid-render and took the page down with it.
  const hasReading = !!(apiResponse.self && apiResponse.lover1 && apiResponse.lover2);

  if (error || !hasReading) {
    return (
      <div className={styles.resultPage}>
          <div className={styles.headerWrap}>
            <div className={styles.header}>
            <button type="button" className={styles.backButton} onClick={goBack} aria-label="Go back">
              <ChevronLeft size={24} />
            </button>
            <h1 className={styles.title}>{reading?.title || "Love Triangle"}</h1>
          </div>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>Failed to load reading.</p>
            {/* "Please try again" with nothing to press is a dead end — the only
                control on the screen was Back. */}
            <button type="button" className={styles.retryButton} onClick={() => refetch()}>
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Map API response to tabs. `description` has to resolve to a string: the
  // fallbacks used to be `apiResponse.lover1` / `apiResponse.card_lover2`, i.e.
  // objects, and rendering an object as a React child is its own crash.
  const toCard = (source, titleFallback, nameFallback) => ({
    name: source?.name || nameFallback,
    title: source?.title || titleFallback || "",
    description: source?.description || "No description available",
    image: source?.card_image?.artwork || source?.card_image?.classic || "",
    traits: source?.traits || [],
  });

  const cardData = {
    you: toCard(apiResponse.self, apiResponse.card_self_title, "Card Self"),
    partner1: toCard(apiResponse.lover1, apiResponse.card_lover1_title, "Card Lover 1"),
    partner2: toCard(apiResponse.lover2, apiResponse.card_lover2_title, "Card Lover 2"),
  };

  const currentCard = cardData[activeTab] || cardData.you;

  return (
    <div className={styles.resultPage}>
      <div className={styles.headerWrap}>
        <div className={styles.header}>
          <button type="button" className={styles.backButton} onClick={goBack} aria-label="Go back">
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>{reading?.title || "Love Triangle"}</h1>
        </div>
      </div>

      <div className={styles.tabsWrap} role="tablist" aria-label="Reading sections">
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.cardDisplay}>
          {currentCard.image ? (
            <img
              src={currentCard.image}
              alt={currentCard.name}
              className={styles.tarotCard}
            />
          ) : (
            <img
              src="/images/empress-tarot.jpg"
              alt={currentCard.name}
              className={styles.tarotCard}
            />
          )}
        </div>
        
        <div>
        {currentCard.name && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <h2 className={styles.cardName}>{currentCard.name}</h2>
            <TTSButton text={`${currentCard.name}. ${currentCard.traits?.length ? 'Traits: ' + currentCard.traits.join(', ') + '. ' : ''}Reading and Guidance. ${currentCard.description}`} />
          </div>
        )}

        {/* Traits Capsules */}
        {currentCard.traits && currentCard.traits.length > 0 && (
          <div className={styles.traitsContainer}>
            {currentCard.traits.map((trait, index) => (
              <span key={index} className={styles.traitCapsule}>
                {trait}
              </span>
            ))}
          </div>
        )}

        <div className={styles.readingSection}>
          {currentCard.title && (
            <h2 className={styles.readingTitle}>{currentCard.title}</h2>
          )}
          <h3 className={styles.sectionTitle}>📖 Reading and Guidance</h3>
          <p className={styles.readingDescription}>{currentCard.description}</p>
        </div>

        {/* <button className={styles.goBackButton} onClick={() => navigate(-1)}>
          Go Back
        </button> */}
      </div>
    </div>
    </div>
  );
};

export default LoveTriangleResultPage;
