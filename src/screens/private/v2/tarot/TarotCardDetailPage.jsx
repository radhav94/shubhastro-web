import { useState, useEffect } from 'react'
import ChevronLeft from '../components/ui/ChevronLeft'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  useGetTarotCardDetailsQuery,
  useGetRomanticBreakupQuery,
  useGetBusinessBreakupQuery
} from '../../../../redux/api/tarot/tarotApi'
import PrimaryLoader from '../../../../component/UI/PrimaryLoader'
import TTSButton from '../../../../component/UI/TTSButton'
import styles from './TarotCardDetailPage.module.css'
import { DefaultImages } from '../../../../utils/appImages'

const TarotCardDetailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect to tarot page if opened directly without navigation state
  useEffect(() => {
    if (!location.state) {
      navigate('/tarot', { replace: true })
    }
  }, [location.state, navigate])

  const { card, cards, reading, isMultiCard, cardNames } = location.state || {}

  // State for tab selection (for multi-card readings)
  const [activeTab, setActiveTab] = useState(0)

  // Show loader while redirecting
  if (!location.state) {
    return <PrimaryLoader isLoading={true} />
  }

  // Determine if this is a breakup reading
  const isRomanticBreakup = reading?.title === 'Romantic Breakup'
  const isBusinessBreakup = reading?.title === 'Business Breakup'
  const isBreakupReading = isMultiCard && (isRomanticBreakup || isBusinessBreakup)
  
  const currentCard = isBreakupReading ? cards[activeTab] : card

  // For breakup readings, use specific API hooks
  const { 
    data: romanticBreakupData, 
    isLoading: isLoadingRomantic, 
    error: errorRomantic 
  } = useGetRomanticBreakupQuery(
    {
      card_cause: cardNames?.card_cause,
      card_advise: cardNames?.card_advise,
      lang: 'en',
    },
    {
      skip: !isRomanticBreakup || !cardNames,
    }
  )

  const { 
    data: businessBreakupData, 
    isLoading: isLoadingBusiness, 
    error: errorBusiness 
  } = useGetBusinessBreakupQuery(
    {
      card_cause: cardNames?.card_cause,
      card_advise: cardNames?.card_advise,
      lang: 'en',
    },
    {
      skip: !isBusinessBreakup || !cardNames,
    }
  )

  // For regular readings, use the generic API
  // card.id = slug like "the_lovers", card.name = display like "The Lovers"
  const cardName = currentCard?.card_id || currentCard?.id || 'the-fool'
  const readingEndpoint = reading?.apiEndpoint || 'yes-no'
  
  const { 
    data: regularData, 
    isLoading: isLoadingRegular, 
    error: errorRegular 
  } = useGetTarotCardDetailsQuery(
    {
      reading_endpoint: readingEndpoint,
      card_name: cardName,
      lang: 'en',
    },
    {
      skip: isBreakupReading || !cardName || !readingEndpoint,
    }
  )

  // Determine which data to use
  let data, isLoading, error
  if (isRomanticBreakup) {
    data = romanticBreakupData
    isLoading = isLoadingRomantic
    error = errorRomantic
  } else if (isBusinessBreakup) {
    data = businessBreakupData
    isLoading = isLoadingBusiness
    error = errorBusiness
  } else {
    data = regularData
    isLoading = isLoadingRegular
    error = errorRegular
  }

  console.log('Card details API response:', data)
  console.log('Is breakup reading:', isBreakupReading)
  console.log('Card names:', cardNames)

  if (isLoading) {
    return <PrimaryLoader isLoading={true} />
  }

  if (error) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.headerWrap}>
          <div className={styles.header}>
            <button className={styles.backButton} onClick={() => navigate(-1)}>
              <ChevronLeft size={24} />
            </button>
            <h1 className={styles.title}>{reading.title}</h1>
          </div>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>Failed to load card details. Please try again.</p>
          </div>
        </div>
      </div>
    )
  }

  const cardData = data?.response || {}
  const isDaily = readingEndpoint === 'daily'
  
  // For breakup readings, get the appropriate card data based on active tab
  let displayData = cardData
  if (isBreakupReading && cardData.cause && cardData.advise) {
    // Tab 0 = You (cause), Tab 1 = Partner (advise)
    displayData = activeTab === 0 ? cardData.cause : cardData.advise
  }

  // Build full TTS text from all card content
  const fullTtsText = (() => {
    const parts = [];
    const name = displayData.card_name || displayData.name;
    if (name) parts.push(name);
    if (displayData.answer) parts.push(`Answer: ${displayData.answer}`);
    if (displayData.traits?.length) parts.push(`Traits: ${displayData.traits.join(', ')}`);
    if (isDaily) {
      if (cardData.health) parts.push(`Health. ${cardData.health}`);
      if (cardData.relationship) parts.push(`Relationship. ${cardData.relationship}`);
      if (cardData.career) parts.push(`Career. ${cardData.career}`);
      if (cardData.finance) parts.push(`Finance. ${cardData.finance}`);
    } else if (isBreakupReading) {
      if (displayData.description) parts.push(displayData.description);
    } else {
      if (displayData.description) parts.push(`Reading and Guidance. ${displayData.description}`);
      if (displayData.careerPaths?.length) parts.push(`Career Paths: ${displayData.careerPaths.join(', ')}`);
      if (displayData.meaning) parts.push(displayData.meaning);
      if (displayData.upright) parts.push(`Upright. ${displayData.upright}`);
      if (displayData.reversed) parts.push(`Reversed. ${displayData.reversed}`);
    }
    return parts.join('. ');
  })();

  return (
    <div className={styles.detailPage}>
      <div className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>{reading.title}</h1>
        </div>
        </div>
      {/* Tabs for Breakup Readings */}
      {isBreakupReading && (
        <div className={styles.tabsContainer}>
          <div className={styles.tabsContainerWrap}>
            <button 
              className={`${styles.tab} ${activeTab === 0 ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(0)}
            >
              You
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 1 ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(1)}
            >
              Partner
            </button>
          </div>
        </div>
      )}

      <div className={styles.content}>
        {/* Left side - Card image */}
        <div className={styles.cardDisplayWrap}>
          <div className={styles.cardDisplay}>
            {displayData.card_image ? (
              <img 
                src={displayData.card_image?.artwork || displayData.card_image?.classic || displayData.card_image || DefaultImages.TarotCardDefault} 
                alt={displayData.card_name || displayData.name || 'Tarot Card'}
                className={styles.tarotCard}
              />
            ) : (
              <img 
                src="/images/empress-tarot.jpg" 
                alt="Tarot Card"
                className={styles.tarotCard}
              />
            )}
          </div>
        </div>

        {/* Right side - Title, description, reading details */}
        <div className={styles.cardTextWrap}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%' }}>
            {(displayData.card_name || displayData.name) && (
              <h2 className={styles.cardName}>{displayData.card_name || displayData.name}</h2>
            )}
            <TTSButton text={fullTtsText} />
          </div>

          {displayData.card_number && (
            <p className={styles.cardNumber}>{displayData.card_number}</p>
          )}

          {displayData.answer && (
            <p className={styles.answer}>
              Answer:{' '}
              <span style={{
                color: displayData.answer.toLowerCase() === 'yes' ? '#16a34a' : '#dc2626',
                fontWeight: 700,
              }}>
                {displayData.answer}
              </span>
            </p>
          )}

          {/* Traits Capsules */}
          {displayData.traits && displayData.traits.length > 0 && (
            <div className={styles.traitsContainer}>
              {displayData.traits.map((trait, index) => (
                <span key={index} className={styles.traitCapsule}>
                  {trait}
                </span>
              ))}
            </div>
          )}

          {/* Daily Format - Health, Relationship, Career, Finance */}
          {isDaily ? (
            <div className={styles.dailyContainer}>
              {cardData.health && (
                <div className={styles.dailySection}>
                  <h3 className={styles.dailySectionTitle}>💪 Health</h3>
                  <p className={styles.dailySectionText}>{cardData.health}</p>
                </div>
              )}

              {cardData.relationship && (
                <div className={styles.dailySection}>
                  <h3 className={styles.dailySectionTitle}>❤️ Relationship</h3>
                  <p className={styles.dailySectionText}>{cardData.relationship}</p>
                </div>
              )}

              {cardData.career && (
                <div className={styles.dailySection}>
                  <h3 className={styles.dailySectionTitle}>💼 Career</h3>
                  <p className={styles.dailySectionText}>{cardData.career}</p>
                </div>
              )}

              {cardData.finance && (
                <div className={styles.dailySection}>
                  <h3 className={styles.dailySectionTitle}>💰 Finance</h3>
                  <p className={styles.dailySectionText}>{cardData.finance}</p>
                </div>
              )}
            </div>
          ) : (
            /* Regular Format - Title, Description, Meaning, etc. */
            <div className={styles.readingSection}>
              {/* Breakup Reading - Show description */}
              {isBreakupReading && displayData.description && (
                <div className={styles.meaningSection}>
                  <h3 className={styles.sectionTitle}>
                    {activeTab === 0 ? '🔍 Cause of Breakup' : '💡 Advice for Moving Forward'}
                  </h3>
                  <p className={styles.readingDescription}>{displayData.description}</p>
                </div>
              )}

              {/* Regular readings */}
              {!isBreakupReading && (
                <>
                  {displayData.title && (
                    <h2 className={styles.readingTitle}>{displayData.title}</h2>
                  )}
                  
                  {displayData.description && (
                    <div className={styles.meaningSection}>
                      <h3 className={styles.sectionTitle}>📖 Reading and Guidance</h3>
                      <p className={styles.readingDescription}>{displayData.description}</p>
                    </div>
                  )}

                  {displayData.careerPaths && displayData.careerPaths.length > 0 && (
                    <div className={styles.meaningSection}>
                      <h3 className={styles.sectionTitle}>🎯 Career Paths</h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                        {displayData.careerPaths.map((path, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: "linear-gradient(90deg, #f75801, #d43400)",
                              color: "#fff",
                              padding: "6px 14px",
                              borderRadius: "20px",
                              fontSize: "13px",
                              fontWeight: "500",
                            }}
                          >
                            {path}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {displayData.meaning && (
                    <div className={styles.meaningSection}>
                      <h3 className={styles.sectionTitle}>
                        {readingEndpoint === 'yes-no' ? '🔮 Answer' : 'Meaning'}
                      </h3>
                      <p className={styles.readingDescription}>{displayData.meaning}</p>
                    </div>
                  )}

                  {displayData.upright && (
                    <div className={styles.meaningSection}>
                      <h3 className={styles.sectionTitle}>Upright</h3>
                      <p className={styles.readingDescription}>{displayData.upright}</p>
                    </div>
                  )}

                  {displayData.reversed && (
                    <div className={styles.meaningSection}>
                      <h3 className={styles.sectionTitle}>Reversed</h3>
                      <p className={styles.readingDescription}>{displayData.reversed}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TarotCardDetailPage
