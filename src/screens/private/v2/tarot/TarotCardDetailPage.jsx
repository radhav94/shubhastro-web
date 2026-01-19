import ChevronLeft from '../components/ui/ChevronLeft'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGetTarotCardDetailsQuery } from '../../../../redux/api/tarot/tarotApi'
import PrimaryLoader from '../../../../component/UI/PrimaryLoader'
import styles from './TarotCardDetailPage.module.css'

const TarotCardDetailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { card, reading } = location.state || { 
    reading: { title: 'Yes/ No Tarot', apiEndpoint: 'yes-no' },
    card: { id: 1, name: 'the-fool' }
  }

  // Fetch card details from API
  const cardName = card?.id || card?.name || 'the-fool'
  const readingEndpoint = reading?.apiEndpoint || 'yes-no'
  
  const { data, isLoading, error } = useGetTarotCardDetailsQuery(
    {
      reading_endpoint: readingEndpoint,
      card_name: cardName,
      lang: 'en',
    },
    {
      skip: !cardName || !readingEndpoint,
    }
  )

  console.log('Card details API response:', data)
  console.log('Card name used:', cardName)
  console.log('Reading endpoint:', readingEndpoint)

  if (isLoading) {
    return <PrimaryLoader />
  }

  if (error) {
    return (
      <div className={styles.detailPage}>
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
    )
  }

  const cardData = data?.response || {}
  const isDaily = readingEndpoint === 'daily'

  return (
    <div className={styles.detailPage}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.title}>{reading.title}</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.cardDisplay}>
          {cardData.card_image ? (
            <img 
              src={cardData.card_image?.classic || cardData.card_image?.artwork || cardData.card_image} 
              alt={cardData.card_name || cardData.name || 'Tarot Card'}
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

        {(cardData.card_name || cardData.name) && (
          <h2 className={styles.cardName}>{cardData.card_name || cardData.name}</h2>
        )}

        {cardData.card_number && (
          <p className={styles.cardNumber}>{cardData.card_number}</p>
        )}

        {cardData.answer && (
          <p className={styles.answer}>Answer: {cardData.answer}</p>
        )}

        {/* Traits Capsules */}
        {cardData.traits && cardData.traits.length > 0 && (
          <div className={styles.traitsContainer}>
            {cardData.traits.map((trait, index) => (
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
            {cardData.title && (
              <h2 className={styles.readingTitle}>{cardData.title}</h2>
            )}
            
            {cardData.description && (
              <p className={styles.readingDescription}>{cardData.description}</p>
            )}

            {cardData.meaning && (
              <div className={styles.meaningSection}>
                <h3 className={styles.sectionTitle}>Meaning</h3>
                <p className={styles.readingDescription}>{cardData.meaning}</p>
              </div>
            )}

            {cardData.upright && (
              <div className={styles.meaningSection}>
                <h3 className={styles.sectionTitle}>Upright</h3>
                <p className={styles.readingDescription}>{cardData.upright}</p>
              </div>
            )}

            {cardData.reversed && (
              <div className={styles.meaningSection}>
                <h3 className={styles.sectionTitle}>Reversed</h3>
                <p className={styles.readingDescription}>{cardData.reversed}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TarotCardDetailPage
