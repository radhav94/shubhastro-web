import { useState } from 'react'
import ChevronLeft from '../components/ui/ChevronLeft'
import { Shuffle } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './LoveTriangleSelectionPage.module.css'

const LoveTriangleSelectionPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const reading = location.state?.reading || { title: 'Love Triangle' }
  const cardsData = location.state?.cards || []
  
  const [selectedCards, setSelectedCards] = useState({
    you: null,
    partner1: null,
    partner2: null
  })

  const [flippedCards, setFlippedCards] = useState({
    you: null,
    partner1: null,
    partner2: null
  })

  // Organize cards into 3 rows of 3 cards each
  const rows = [
    { 
      id: 'you', 
      label: 'You', 
      cards: cardsData.slice(0, 3).length > 0 ? cardsData.slice(0, 3) : [
        { id: 1, name: 'the-hierophant' },
        { id: 2, name: 'five-of-pentacles' },
        { id: 3, name: 'the-lovers' }
      ]
    },
    { 
      id: 'partner1', 
      label: 'Partner 1', 
      cards: cardsData.slice(3, 6).length > 0 ? cardsData.slice(3, 6) : [
        { id: 4, name: 'the-hierophant' },
        { id: 5, name: 'the-chariot' },
        { id: 6, name: 'the-star' }
      ]
    },
    { 
      id: 'partner2', 
      label: 'Partner 2', 
      cards: cardsData.slice(6, 9).length > 0 ? cardsData.slice(6, 9) : [
        { id: 7, name: 'the-moon' },
        { id: 8, name: 'the-sun' },
        { id: 9, name: 'five-of-pentacles' }
      ]
    }
  ]

  const handleCardSelect = (rowId, cardData) => {
    setFlippedCards(prev => ({
      ...prev,
      [rowId]: cardData.id || cardData.name
    }))
    setSelectedCards(prev => ({
      ...prev,
      [rowId]: cardData
    }))
  }

  const handleShowReading = () => {
    if (selectedCards.you !== null && selectedCards.partner1 !== null && selectedCards.partner2 !== null) {
      navigate('/love-triangle-result', { 
        state: { 
          reading,
          selectedCards,
          type: 'love-triangle'
        } 
      })
    }
  }

  const isAllSelected = selectedCards.you !== null && selectedCards.partner1 !== null && selectedCards.partner2 !== null

  return (
    <div className={styles.selectionPage}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <button className={styles.shuffleButton}>
          <Shuffle size={24} />
        </button>
      </div>
      <div className={styles.content}>
        <h1 className={styles.title}>{reading.title}</h1>
        <p className={styles.subtitle}>Choose one card from each row.</p>
        <div className={styles.cardsGrid}>
          {rows.map((row) => (
            <div key={row.id} className={styles.row}>
              <div className={styles.rowLabel}>{row.label}</div>
              <div className={styles.cardsRow}>
                {row.cards.map((card, cardIndex) => {
                  const cardId = card.id || card.name || cardIndex
                  const isFlipped = flippedCards[row.id] === cardId
                  const containerClass = [styles.cardContainer, isFlipped ? styles.flipped : ''].join(' ')
                  const cardBackClass = [styles.card, styles.cardBack].join(' ')
                  const cardFrontClass = [styles.card, styles.cardFront].join(' ')
                  
                  return (
                    <div key={cardId} className={containerClass} onClick={() => handleCardSelect(row.id, card)}>
                      <div className={styles.cardInner}>
                        <div className={cardBackClass}>
                          <img src="/images/black-back-card.jpg" alt="Card Back" />
                        </div>
                        <div className={cardFrontClass}>
                          <img src="/images/empress-tarot.jpg" alt="Tarot Card" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <button className={[styles.showReadingButton, !isAllSelected ? styles.disabled : ''].join(' ')} onClick={handleShowReading} disabled={!isAllSelected}>
          Show Reading
        </button>
      </div>
    </div>
  )
}

export default LoveTriangleSelectionPage
