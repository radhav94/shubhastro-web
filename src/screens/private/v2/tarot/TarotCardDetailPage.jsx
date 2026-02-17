import { useState, useEffect } from 'react'
import ChevronLeft from '../components/ui/ChevronLeft'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  useGetTarotCardDetailsQuery,
  useGetRomanticBreakupQuery,
  useGetBusinessBreakupQuery
} from '../../../../redux/api/tarot/tarotApi'
import PrimaryLoader from '../../../../component/UI/PrimaryLoader'
import styles from './TarotCardDetailPage.module.css'
import { DefaultImages } from '../../../../utils/appImages'

const TarotCardDetailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { card, cards, reading, isMultiCard, cardNames } = location.state || { 
    reading: { title: 'Yes/ No Tarot', apiEndpoint: 'yes-no' },
    card: { id: 1, name: 'the-fool' }
  }

  // State for tab selection (for multi-card readings)
  const [activeTab, setActiveTab] = useState(0)

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
  const cardName = currentCard?.card_id || currentCard?.id || currentCard?.name || 'the-fool'
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
    return <PrimaryLoader />
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
      )}

      <div className={styles.content}>
        <div className={styles.cardDisplay}>
          {displayData.card_image ? (
            <img 
              src={displayData.card_image?.classic || displayData.card_image?.artwork || displayData.card_image || DefaultImages.TarotCardDefault} 
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

        {(displayData.card_name || displayData.name) && (
          <h2 className={styles.cardName}>{displayData.card_name || displayData.name}</h2>
        )}

        {displayData.card_number && (
          <p className={styles.cardNumber}>{displayData.card_number}</p>
        )}

        {displayData.answer && (
          <p className={styles.answer}>Answer: {displayData.answer}</p>
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
                  <p className={styles.readingDescription}>{displayData.description}</p>
                )}

                {displayData.meaning && (
                  <div className={styles.meaningSection}>
                    <h3 className={styles.sectionTitle}>Meaning</h3>
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
  )
}

export default TarotCardDetailPage
