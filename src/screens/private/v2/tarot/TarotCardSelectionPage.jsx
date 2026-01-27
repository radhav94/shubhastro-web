import { useState, useRef } from 'react'
import ChevronLeft from '../components/ui/ChevronLeft'
import { Shuffle } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './TarotCardSelectionPage.module.css'
import { 
  useGetLoveTriangleTarotQuery, 
  useGetRomanticBreakupQuery, 
  useGetBusinessBreakupQuery 
} from '../../../../redux/api/tarot/tarotApi'
import toast from 'react-hot-toast'

const TarotCardSelectionPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const reading = location.state?.reading || { title: 'Yes/ No Tarot' }
  const cardsData = location.state?.cards || []
  
  // Check if it's Love Triangle reading (3 cards) or Breakup readings (2 cards)
  const isLoveTriangle = reading.title === 'Love Triangle'
  const isRomanticBreakup = reading.title === 'Romantic Breakup'
  const isBusinessBreakup = reading.title === 'Business Breakup'
  const isMultiCardReading = isLoveTriangle || isRomanticBreakup || isBusinessBreakup
  
  let maxCards = 1
  if (isLoveTriangle) maxCards = 3
  else if (isRomanticBreakup || isBusinessBreakup) maxCards = 2
  
  const [selectedCards, setSelectedCards] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef(null)

  // Skip API hooks - we'll call them manually on button click
  const [skipQuery, setSkipQuery] = useState(true)

  // Use cards from API or fallback to default (10 cards)
  const cards = cardsData.length > 0 
    ? cardsData.map((card, index) => ({ 
        id: index + 1, 
        pattern: 'floral',
        ...card 
      }))
    : [
        { id: 1, pattern: 'floral' },
        { id: 2, pattern: 'floral' },
        { id: 3, pattern: 'floral' },
        { id: 4, pattern: 'floral' },
        { id: 5, pattern: 'floral' },
        { id: 6, pattern: 'floral' },
        { id: 7, pattern: 'floral' },
        { id: 8, pattern: 'floral' },
        { id: 9, pattern: 'floral' },
        { id: 10, pattern: 'floral' }
      ]

  const handleCardClick = (card) => {
    console.log('Selected card:', card)
    
    if (isMultiCardReading) {
      // For multi-card readings (Love Triangle, Romantic Breakup, Business Breakup)
      if (selectedCards.find(c => c.id === card.id)) {
        // Deselect if already selected
        setSelectedCards(selectedCards.filter(c => c.id !== card.id))
      } else if (selectedCards.length < maxCards) {
        // Add to selection if under limit
        setSelectedCards([...selectedCards, card])
      }
    } else {
      // For other readings, navigate immediately
      navigate('/tarot-card', { state: { card, reading } })
    }
  }

  const handleShuffle = () => {
    // Shuffle cards array
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    // Note: You may need to update the cards state if you want to persist the shuffle
    console.log('Cards shuffled')
  }

  const handleShowReading = async () => {
    if (selectedCards.length !== maxCards) return

    setIsLoading(true)

    try {
      if (isLoveTriangle) {
        // Love Triangle - navigate to special result page with selected cards
        navigate('/love-triangle-result', {
          state: {
            reading,
            selectedCards: {
              you: selectedCards[0],
              partner1: selectedCards[1],
              partner2: selectedCards[2]
            },
            type: 'love-triangle'
          }
        })
      } else if (isRomanticBreakup || isBusinessBreakup) {
        // Breakup readings - fetch data and navigate
        const card1 = selectedCards[0]
        const card2 = selectedCards[1]
        
        // Navigate to result page with selected cards
        // The TarotCardDetailPage will handle the API call
        navigate('/tarot-card', {
          state: {
            cards: selectedCards,
            reading,
            isMultiCard: true,
            cardNames: {
              card_cause: card1.card_id || card1.id,
              card_advise: card2.card_id || card2.id
            }
          }
        })
      }
    } catch (error) {
      console.error('Error fetching reading:', error)
      toast.error('Failed to fetch reading. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.selectionPage}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <button className={styles.shuffleButton} onClick={handleShuffle}>
          <Shuffle size={24} />
        </button>
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>{reading.title}</h1>
        <p className={styles.subtitle}>
          {isMultiCardReading
            ? `Choose ${maxCards} cards for your reading (${selectedCards.length}/${maxCards} selected)` 
            : 'Choose a card to find out your tarot horoscope'}
        </p>

        <p className={styles.tapText}>Tap to pick</p>

        <div 
          className={styles.cardsContainer}
          ref={containerRef}
        >
          {cards.map((card, index) => {
            const isSelected = isMultiCardReading && selectedCards.find(c => c.id === card.id)
            const totalCards = cards.length
            const centerIndex = (totalCards - 1) / 2
            const offset = index - centerIndex
            
            // Fan layout - cards spread from center like in video
            const angle = offset * 8 // rotation angle
            const spread = offset * 45 // horizontal spread
            const verticalLift = Math.abs(offset) * 18 // arc curve
            
            // Selected card moves up from its position
            const selectedLift = isSelected ? -30 : 0
            
            const rotation = angle
            const zIndex = isSelected ? 100 : index

            const transform = `translateX(${spread}px) translateY(${verticalLift + selectedLift}px) rotate(${rotation}deg)`

            return (
              <div
                key={card.id}
                className={`${styles.card} ${isSelected ? styles.selectedCard : ''}`}
                style={{
                  transform,
                  zIndex,
                }}
                onClick={() => handleCardClick(card)}
              >
                <div className={styles.cardBack}>
                  <img src="/images/black-back-card.jpg" alt="Tarot Card Back" />
                  {isSelected && (
                    <div className={styles.selectedBadge}>
                      {selectedCards.findIndex(c => c.id === card.id) + 1}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {isMultiCardReading && (
          <button 
            className={`${styles.showReadingButton} ${selectedCards.length === maxCards ? '' : styles.disabled}`}
            disabled={selectedCards.length !== maxCards || isLoading}
            onClick={handleShowReading}
          >
            {isLoading ? 'Loading...' : 'Show Reading'}
          </button>
        )}
      </div>
    </div>
  )
}

export default TarotCardSelectionPage
