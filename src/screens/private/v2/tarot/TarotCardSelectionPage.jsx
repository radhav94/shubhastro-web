import { useState, useRef, useEffect } from 'react'
import ChevronLeft from '../components/ui/ChevronLeft'
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

  // Debug logging
  console.log('🎴 TarotCardSelectionPage - location.state:', location.state)
  console.log('🎴 TarotCardSelectionPage - reading:', reading)
  console.log('🎴 TarotCardSelectionPage - cardsData:', cardsData)

  // Check if it's Love Triangle reading (3 cards) or Breakup readings (2 cards)
  const isLoveTriangle = reading.title === 'Love Triangle'
  const isRomanticBreakup = reading.title === 'Romantic Breakup'
  const isBusinessBreakup = reading.title === 'Business Breakup'
  const isMultiCardReading = isLoveTriangle || isRomanticBreakup || isBusinessBreakup

  console.log('🎴 isLoveTriangle:', isLoveTriangle)
  console.log('🎴 isMultiCardReading:', isMultiCardReading)

  let maxCards = 1
  if (isLoveTriangle) maxCards = 3
  else if (isRomanticBreakup || isBusinessBreakup) maxCards = 2

  const [selectedCards, setSelectedCards] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const containerRef = useRef(null)

  // Skip API hooks - we'll call them manually on button click
  const [skipQuery, setSkipQuery] = useState(true)

  // Use cards from API or fallback to default (10 cards)
  const initialCards = cardsData.length > 0
    ? cardsData.map((card, index) => ({
      id: index + 1,
      pattern: 'floral',
      ...card
    }))
    : [
      { id: 1, name: 'the-fool', pattern: 'floral' },
      { id: 2, name: 'the-magician', pattern: 'floral' },
      { id: 3, name: 'the-high-priestess', pattern: 'floral' },
      { id: 4, name: 'the-empress', pattern: 'floral' },
      { id: 5, name: 'the-emperor', pattern: 'floral' },
      { id: 6, name: 'the-hierophant', pattern: 'floral' },
      { id: 7, name: 'the-lovers', pattern: 'floral' },
      { id: 8, name: 'the-chariot', pattern: 'floral' },
      { id: 9, name: 'strength', pattern: 'floral' },
      { id: 10, name: 'the-hermit', pattern: 'floral' }
    ]

  const [cards, setCards] = useState(initialCards)

  // Auto-shuffle on mount (e.g. when navigating back from tarot-card page)
  useEffect(() => {
    const timer = setTimeout(() => handleShuffle(), 300)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCardClick = (card) => {
    if (isShuffling) return
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
    if (isShuffling) return

    // Phase 1: collapse cards to center
    setIsShuffling(true)
    setSelectedCards([])

    // Phase 2: after collapse, shuffle the array and fan back out
    setTimeout(() => {
      const shuffled = [...cards]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      setCards(shuffled)

      // Phase 3: remove shuffling state so cards fan out with transition
      setTimeout(() => {
        setIsShuffling(false)
      }, 50)
    }, 500)
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
      <div className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
        </div>
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

            // Create normalized offset first (needed for calculations)
            const normalizedOffset = offset / centerIndex // -1 to 1

            // Responsive spread values based on screen width
            const screenWidth = window.innerWidth
            const isMobile = screenWidth <= 480
            const isTablet = screenWidth > 480 && screenWidth <= 768
            const isLaptop = screenWidth > 768 && screenWidth <= 1024

            // Fan layout - cards spread in proper semicircular arc with responsive spacing
            let angle, spread, curveHeight, selectedLift

            if (isMobile) {
              angle = offset * 5
              spread = offset * 32
              curveHeight = Math.pow(normalizedOffset, 2) * 35
              selectedLift = isSelected ? -25 : 0
            } else if (isTablet) {
              angle = offset * 6.5
              spread = offset * 50
              curveHeight = Math.pow(normalizedOffset, 2) * 55
              selectedLift = isSelected ? -35 : 0
            } else if (isLaptop) {
              angle = offset * 7.5
              spread = offset * 65
              curveHeight = Math.pow(normalizedOffset, 2) * 70
              selectedLift = isSelected ? -40 : 0
            } else {
              // Desktop
              angle = offset * 8
              spread = offset * 75
              curveHeight = Math.pow(normalizedOffset, 2) * 80
              selectedLift = isSelected ? -40 : 0
            }

            // Apply vertical lift for semicircular curve
            const verticalLift = curveHeight

            const rotation = angle
            const zIndex = index

            // During shuffle: collapse all cards to center stack
            const transform = isShuffling
              ? `translateX(0px) translateY(0px) rotate(${(index - centerIndex) * 2}deg)`
              : `translateX(${spread}px) translateY(${verticalLift + selectedLift}px) rotate(${rotation}deg)`

            return (
              <div
                key={card.id}
                className={`${styles.card} ${isSelected ? styles.selectedCard : ''} ${isShuffling ? styles.shuffling : ''}`}
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
