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

  // Each entry: { position, card, slot } where slot is the fixed assignment (1-based)
  const [selections, setSelections] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const [animationReady, setAnimationReady] = useState(false)
  const containerRef = useRef(null)

  // Derived state for backward compatibility
  const selectedCards = selections.map((s) => s.card)
  const selectedPositions = selections.map((s) => s.position)

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
      const existingSelection = selections.find((s) => s.position === positionIndex)
      if (existingSelection) {
        // Deselect: remove this position but keep slot assignments of others intact
        setSelections((prev) => prev.filter((s) => s.position !== positionIndex))
        return
      }

      if (selections.length >= maxCards) return

      // Determine the next available slot (1-based)
      const usedSlots = selections.map((s) => s.slot)
      let nextSlot = 1
      while (usedSlots.includes(nextSlot)) {
        nextSlot++
      }

      const picked = pickRandomCard(selectedCards)
      if (picked) {
        setSelections((prev) => [...prev, { position: positionIndex, card: picked, slot: nextSlot }])
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
    if (selections.length !== maxCards) return
    setIsLoading(true)
    try {
      // Sort by slot to ensure correct order regardless of selection sequence
      const sortedSelections = [...selections].sort((a, b) => a.slot - b.slot)
      const sortedCards = sortedSelections.map((s) => s.card)

      if (isLoveTriangle) {
        navigate('/love-triangle-result', {
          state: {
            reading,
            selectedCards: {
              you: sortedCards[0],
              partner1: sortedCards[1],
              partner2: sortedCards[2]
            },
            type: 'love-triangle'
          }
        })
      } else if (isRomanticBreakup || isBusinessBreakup) {
        const card1 = sortedCards[0]
        const card2 = sortedCards[1]
        navigate('/tarot-card', {
          state: {
            cards: sortedCards,
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
            {['You', 'Partner 1', 'Partner 2'].map((label, i) => {
              const slot = i + 1
              const isDone = selections.some((s) => s.slot === slot)
              // Active = next available slot
              const usedSlots = selections.map((s) => s.slot)
              let nextSlot = 1
              while (usedSlots.includes(nextSlot)) nextSlot++
              const isActive = slot === nextSlot && selections.length < maxCards

              return (
                <span
                  key={label}
                  className={`${styles.sequenceItem} ${isActive ? styles.sequenceActive : ''} ${isDone ? styles.sequenceDone : ''}`}
                >
                  {slot}. {label}
                </span>
              )
            })}
          </div>
        )}

        {(isRomanticBreakup || isBusinessBreakup) && (
          <div className={styles.drawSequence}>
            {['You', 'Partner'].map((label, i) => {
              const slot = i + 1
              const isDone = selections.some((s) => s.slot === slot)
              const usedSlots = selections.map((s) => s.slot)
              let nextSlot = 1
              while (usedSlots.includes(nextSlot)) nextSlot++
              const isActive = slot === nextSlot && selections.length < maxCards

              return (
                <span
                  key={label}
                  className={`${styles.sequenceItem} ${isActive ? styles.sequenceActive : ''} ${isDone ? styles.sequenceDone : ''}`}
                >
                  {slot}. {label}
                </span>
              )
            })}
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
              selectedLift = isSelected ? -15 : 0
            } else if (isTablet) {
              angle = offset * 6.5; spread = offset * 50
              curveHeight = Math.pow(normalizedOffset, 2) * 55
              selectedLift = isSelected ? -20 : 0
            } else if (isLaptop) {
              angle = offset * 7.5; spread = offset * 65
              curveHeight = Math.pow(normalizedOffset, 2) * 70
              selectedLift = isSelected ? -25 : 0
            } else {
              angle = offset * 8; spread = offset * 75
              curveHeight = Math.pow(normalizedOffset, 2) * 80
              selectedLift = isSelected ? -30 : 0
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
                      {selections.find((s) => s.position === posIndex)?.slot}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {isMultiCardReading && (
          <button
            className={`${styles.showReadingButton} ${selections.length === maxCards ? '' : styles.disabled}`}
            disabled={selections.length !== maxCards || isLoading}
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
