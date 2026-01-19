import { useState, useRef } from 'react'
import ChevronLeft from '../components/ui/ChevronLeft'
import { Shuffle } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './TarotCardSelectionPage.module.css'

const TarotCardSelectionPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const reading = location.state?.reading || { title: 'Yes/ No Tarot' }
  const cardsData = location.state?.cards || []
  
  const [currentIndex, setCurrentIndex] = useState(2)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const containerRef = useRef(null)

  // Use cards from API or fallback to default
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
        { id: 7, pattern: 'floral' }
      ]

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setStartX(e.pageX || e.touches?.[0]?.pageX)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const currentX = e.pageX || e.touches?.[0]?.pageX
    const diff = currentX - startX
    setTranslateX(diff)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)

    const threshold = 80 // Increased threshold for smoother feel
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      } else if (translateX < 0 && currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    }
    setTranslateX(0)
  }

  const handleCardClick = (card) => {
    console.log('Selected card:', card)
    navigate('/tarot-card', { state: { card, reading } })
  }

  const handleShuffle = () => {
    // Shuffle animation
    setCurrentIndex(Math.floor(Math.random() * cards.length))
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
        <p className={styles.subtitle}>Choose a card to find out your tarot horoscope</p>

        <p className={styles.tapText}>Tap to pick</p>

        <div 
          className={styles.cardsContainer}
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          {cards.map((card, index) => {
            const offset = index - currentIndex
            const rotation = offset * 12 // 12 degrees per card
            const translateXPos = offset * 100 // Horizontal spacing
            const translateYPos = Math.abs(offset) * 30 // Arc effect
            const scale = index === currentIndex ? 1.15 : Math.max(0.75, 1 - Math.abs(offset) * 0.1)
            const zIndex = 10 - Math.abs(offset)
            const opacity = Math.abs(offset) > 2 ? 0 : Math.max(0.4, 1 - Math.abs(offset) * 0.2)
            const isVisible = Math.abs(offset) <= 2 // Show only 5 cards (center + 2 on each side)

            // Smooth drag effect
            const dragOffset = isDragging ? translateX * 0.3 : 0

            if (!isVisible) return null

            return (
              <div
                key={card.id}
                className={`${styles.card} ${index === currentIndex ? styles.activeCard : ''}`}
                style={{
                  transform: `translateX(calc(${translateXPos}px + ${dragOffset}px)) translateY(${translateYPos}px) rotate(${rotation}deg) scale(${scale})`,
                  zIndex,
                  opacity,
                  transition: isDragging ? 'none' : undefined
                }}
                onClick={() => index === currentIndex && handleCardClick(card)}
              >
                <div className={styles.cardBack}>
                  <img src="/images/black-back-card.jpg" alt="Tarot Card Back" />
                </div>
              </div>
            )
          })}
        </div>

        <div className={styles.dragHint}>
          <svg width="400" height="80" viewBox="0 0 400 80" className={styles.curvedArrow}>
            {/* Main curved arc */}
            <path 
              d="M 60 60 Q 200 10 340 60" 
              stroke="#999" 
              strokeWidth="2" 
              fill="none"
            />
            {/* Left arrow - adjusted to match curve angle */}
            <path 
              d="M 60 60 L 68 52 M 60 60 L 70 62" 
              stroke="#999" 
              strokeWidth="2" 
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className={styles.dragText}>Drag to Move</p>
        </div>
      </div>
    </div>
  )
}

export default TarotCardSelectionPage
