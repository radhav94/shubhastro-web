import { useState, useEffect, useRef } from 'react'
import ChevronLeft from '../components/ui/ChevronLeft'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './TarotCardSelectionPage.module.css'
import { useGetTarotShuffleDataQuery } from '../../../../redux/api/tarot/tarotApi'
import toast from 'react-hot-toast'

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
  const [cards, setCards] = useState([])
  const containerRef = useRef(null)

  const { data: shuffleData } = useGetTarotShuffleDataQuery(
    { shuffle_type: 'major', lang: 'en' },
    { refetchOnMountOrArgChange: true }
  )

  // When API data arrives, run the original 3-phase shuffle animation
  useEffect(() => {
    if (shuffleData?.response?.length > 0) {
      const rawCards = shuffleData.response

      // Phase 1: set cards and collapse to center stack
      setCards(rawCards)
      setIsShuffling(true)

      // Phase 2: after 500ms, Fisher-Yates shuffle the array
      const t1 = setTimeout(() => {
        const shuffled = [...rawCards]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        setCards(shuffled)

        // Phase 3: 50ms later remove shuffling → CSS transition fans cards out
        const t2 = setTimeout(() => setIsShuffling(false), 50)
        return () => clearTimeout(t2)
      }, 500)

      return () => clearTimeout(t1)
    }
  }, [shuffleData])

  const handleCardClick = (card) => {
    if (isShuffling) return

    if (isMultiCardReading) {
      if (selectedCards.find(c => c.id === card.id)) {
        setSelectedCards(selectedCards.filter(c => c.id !== card.id))
      } else if (selectedCards.length < maxCards) {
        setSelectedCards([...selectedCards, card])
      }
    } else {
      navigate('/tarot-card', { state: { card, reading } })
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

        <div className={styles.cardsContainer} ref={containerRef}>
          {cards.map((card, index) => {
            const isSelected = isMultiCardReading && selectedCards.find(c => c.id === card.id)
            const totalCards = cards.length
            const centerIndex = (totalCards - 1) / 2
            const offset = index - centerIndex
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
              ? `translateX(0px) translateY(0px) rotate(${(index - centerIndex) * 2}deg)`
              : `translateX(${spread}px) translateY(${curveHeight + selectedLift}px) rotate(${angle}deg)`

            return (
              <div
                key={card.id}
                className={`${styles.card} ${isSelected ? styles.selectedCard : ''} ${isShuffling ? styles.shuffling : ''}`}
                style={{ transform, zIndex: index }}
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
