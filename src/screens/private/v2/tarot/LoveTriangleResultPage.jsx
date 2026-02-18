import { useState } from "react";
import ChevronLeft from "../components/ui/ChevronLeft";
import { useNavigate, useLocation } from "react-router-dom";
import { useGetLoveTriangleTarotQuery } from "../../../../redux/api/tarot/tarotApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./LoveTriangleResultPage.module.css";

const LoveTriangleResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { reading, selectedCards } = location.state || {};

  const [activeTab, setActiveTab] = useState("you");

  // Extract card names from selected cards
  const cardSelf =
    selectedCards?.you?.id || selectedCards?.you?.name || "the-hermit";
  const cardLover1 =
    selectedCards?.partner1?.id ||
    selectedCards?.partner1?.name ||
    "the-high-priestess";
  const cardLover2 =
    selectedCards?.partner2?.id || selectedCards?.partner2?.name || "the-devil";

  // Fetch love triangle data from API
  const { data, isLoading, error } = useGetLoveTriangleTarotQuery(
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

  console.log("Love Triangle API response:", data);
  console.log("Selected cards:", { cardSelf, cardLover1, cardLover2 });

  const tabs = [
    { id: "you", label: "You" },
    { id: "partner1", label: "Partner 1" },
    { id: "partner2", label: "Partner 2" },
  ];

  if (isLoading) {
    return <PrimaryLoader />;
  }

  if (error) {
    return (
      <div className={styles.resultPage}>
          <div className={styles.headerWrap}>
            <div className={styles.header}>
            <button className={styles.backButton} onClick={() => navigate(-1)}>
              <ChevronLeft size={24} />
            </button>
            <h1 className={styles.title}>{reading?.title || "Love Triangle"}</h1>
          </div>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>
              Failed to load reading. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const apiResponse = data?.response || {};
  console.log("Processed API response:", apiResponse);

  // Map API response to tabs
  const cardData = {
    you: {
      name: apiResponse?.self?.name || "Card Self",
      title: apiResponse.card_self_title || "Your Card",
      description:
        apiResponse.self.description ||
        apiResponse.card_self ||
        "No description available",
      image: apiResponse.self.card_image.artwork,
      traits: apiResponse.self.traits || [],
    },
    partner1: {
      name: apiResponse.lover1.name || "Card Lover 1",
      title: apiResponse.lover1.title || "Partner 1 Card",
      description:
        apiResponse.lover1.description ||
        apiResponse.lover1 ||
        "No description available",
      image: apiResponse.lover1.card_image.artwork,
      traits: apiResponse.lover1.traits || [],
    },
    partner2: {
      name: apiResponse.lover2.name || "Card Lover 2",
      title: apiResponse.card_lover2_title || "Partner 2 Card",
      description:
        apiResponse.lover2.description ||
        apiResponse.card_lover2 ||
        "No description available",
      image: apiResponse.lover2.card_image.artwork,
      traits: apiResponse.lover2.traits || [],
    },
  };

  const currentCard = cardData[activeTab];

  return (
    <div className={styles.resultPage}>
      <div className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>{reading?.title || "Love Triangle"}</h1>
        </div>
      </div>

      <div className={styles.tabsWrap}>
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab.id)}
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

        {currentCard.name && (
          <h2 className={styles.cardName}>{currentCard.name}</h2>
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
          <p className={styles.readingDescription}>{currentCard.description}</p>
        </div>

        <button className={styles.goBackButton} onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    </div>
  );
};

export default LoveTriangleResultPage;
