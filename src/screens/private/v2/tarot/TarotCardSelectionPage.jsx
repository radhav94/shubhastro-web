import { useState, useEffect, useRef } from 'react'
import ChevronLeft from '../components/ui/ChevronLeft'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './TarotCardSelectionPage.module.css'
import { useGetTarotShuffleDataQuery } from '../../../../redux/api/tarot/tarotApi'
import toast from '../../../../component/toast'

const DISPLAY_CARD_COUNT = 10
const MAX_RECENT = 3

// Module-level so it survives component remounts
let recentPickedIds = []

const TarotCardSelectionPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const reading = location.state?.reading || { title: 'Yes/ No Tarot' }

  const isLoveTriangle = reading.title === 'Love Triangle'
  const isRomanticBreakup = reading.title === 'Romantic Breakup'
  const isBusinessBreakup = reading.title === 'Business Breakup'
  const isMultiCardReading = isLoveTriangle || isRomanticBreakup || isBusinessBreakup

  let maxCards = 1
  if (isLoveTriangle) maxCards = 3
  else if (isRomanticBreakup || isBusinessBreakup) maxCards = 2

  const [selectedCards, setSelectedCards] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const [animationReady, setAnimationReady] = useState(false)
  const containerRef = useRef(null)

  // Track which positions have been tapped (for visual highlight)
  const [selectedPositions, setSelectedPositions] = useState([])

  const { data: shuffleData } = useGetTarotShuffleDataQuery(
    { shuffle_type: 'major', lang: 'en' },
    { refetchOnMountOrArgChange: true }
  )

  const allCards = shuffleData?.response || []

  // Run shuffle animation on mount
  useEffect(() => {
    if (allCards.length > 0) {
      setIsShuffling(true)
      const t1 = setTimeout(() => {
        const t2 = setTimeout(() => {
          setIsShuffling(false)
          setAnimationReady(true)
          toast.success("Cards shuffled! Pick your card 🔮")
        }, 50)
        return () => clearTimeout(t2)
      }, 500)
      return () => clearTimeout(t1)
    }
  }, [allCards.length])

  const pickRandomCard = (currentSessionPicks) => {
    // Combine module-level recent + cards already picked in this session
    const excludeIds = [
      ...recentPickedIds,
      ...currentSessionPicks.map((c) => c.id),
    ]

    const available = allCards.filter(
      (card) => !excludeIds.includes(card?.id)
    )
    const pool = available.length > 0 ? available : allCards

    const randomIndex = Math.floor(Math.random() * pool.length)
    const picked = pool[randomIndex]

    // Update module-level sliding window
    if (picked?.id) {
      recentPickedIds = [...recentPickedIds, picked.id].slice(-MAX_RECENT)
    }

    console.log('--- TAROT PICK ---')
    console.log('Excluded IDs:', excludeIds)
    console.log('Pool size:', pool.length)
    console.log('Picked:', picked?.id)
    console.log('Recent IDs now:', [...recentPickedIds])

    return picked
  }

  const handleCardClick = (positionIndex) => {
    if (isShuffling || !animationReady) return
    if (allCards.length === 0) return

    if (isMultiCardReading) {
      // Check if this position is already selected
      if (selectedPositions.includes(positionIndex)) {
        // Deselect: remove this position and its corresponding card
        const posIdx = selectedPositions.indexOf(positionIndex)
        setSelectedPositions((prev) => prev.filter((p) => p !== positionIndex))
        setSelectedCards((prev) => prev.filter((_, i) => i !== posIdx))
        return
      }

      if (selectedCards.length >= maxCards) return

      const picked = pickRandomCard(selectedCards)
      if (picked) {
        setSelectedPositions((prev) => [...prev, positionIndex])
        setSelectedCards((prev) => [...prev, picked])
      }
    } else {
      // Single card reading — pick random and navigate
      const picked = pickRandomCard([])
      if (picked) {
        navigate('/tarot-card', { state: { card: picked, reading } })
      }
    }
  }

  const handleShowReading = async () => {
    if (selectedCards.length !== maxCards) return
    setIsLoading(true)
    try {
      if (isLoveTriangle) {
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
        const card1 = selectedCards[0]
        const card2 = selectedCards[1]
        navigate('/tarot-card', {
          state: {
            cards: selectedCards,
            reading,
            isMultiCard: true,
            cardNames: {
              card_cause: card1.id,
              card_advise: card2.id
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

  // Generate placeholder positions for the fan
  const placeholders = Array.from({ length: DISPLAY_CARD_COUNT }, (_, i) => i)

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

        {isLoveTriangle && (
          <div className={styles.drawSequence}>
            {['You', 'Partner 1', 'Partner 2'].map((label, i) => (
              <span
                key={label}
                className={`${styles.sequenceItem} ${selectedCards.length === i ? styles.sequenceActive : ''} ${selectedCards.length > i ? styles.sequenceDone : ''}`}
              >
                {i + 1}. {label}
              </span>
            ))}
          </div>
        )}

        <p className={styles.tapText}>Tap to pick</p>

        <div className={styles.cardsContainer} ref={containerRef}>
          {placeholders.map((posIndex) => {
            const isSelected = isMultiCardReading && selectedPositions.includes(posIndex)
            const totalCards = DISPLAY_CARD_COUNT
            const centerIndex = (totalCards - 1) / 2
            const offset = posIndex - centerIndex
            const normalizedOffset = centerIndex !== 0 ? offset / centerIndex : 0

            const screenWidth = window.innerWidth
            const isMobile = screenWidth <= 480
            const isTablet = screenWidth > 480 && screenWidth <= 768
            const isLaptop = screenWidth > 768 && screenWidth <= 1024

            let angle, spread, curveHeight, selectedLift
            if (isMobile) {
              angle = offset * 5; spread = offset * 32
              curveHeight = Math.pow(normalizedOffset, 2) * 35
              selectedLift = isSelected ? -25 : 0
            } else if (isTablet) {
              angle = offset * 6.5; spread = offset * 50
              curveHeight = Math.pow(normalizedOffset, 2) * 55
              selectedLift = isSelected ? -35 : 0
            } else if (isLaptop) {
              angle = offset * 7.5; spread = offset * 65
              curveHeight = Math.pow(normalizedOffset, 2) * 70
              selectedLift = isSelected ? -40 : 0
            } else {
              angle = offset * 8; spread = offset * 75
              curveHeight = Math.pow(normalizedOffset, 2) * 80
              selectedLift = isSelected ? -40 : 0
            }

            const transform = isShuffling
              ? `translateX(0px) translateY(0px) rotate(${(posIndex - centerIndex) * 2}deg)`
              : `translateX(${spread}px) translateY(${curveHeight + selectedLift}px) rotate(${angle}deg)`

            return (
              <div
                key={posIndex}
                className={`${styles.card} ${isSelected ? styles.selectedCard : ''} ${isShuffling ? styles.shuffling : ''}`}
                style={{ transform, zIndex: posIndex }}
                onClick={() => handleCardClick(posIndex)}
              >
                <div className={styles.cardBack}>
                  <img src="/images/black-back-card.jpg" alt="Tarot Card Back" />
                  {isSelected && (
                    <div className={styles.selectedBadge}>
                      {selectedPositions.indexOf(posIndex) + 1}
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
