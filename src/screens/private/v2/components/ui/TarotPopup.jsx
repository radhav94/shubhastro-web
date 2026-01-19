import { useEffect, useState } from 'react'
import { useGetTarotShuffleDataQuery } from '../../../../../redux/api/tarot/tarotApi'
import styles from './TarotPopup.module.css'

const TarotPopup = ({ isOpen, onClose, onBeginReading, reading }) => {
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data, isLoading, error } = useGetTarotShuffleDataQuery(
    {
      shuffle_type: 'major',
      lang: 'en',
    },
    {
      skip: !shouldFetch,
    }
  )

  useEffect(() => {
    if (data && shouldFetch) {
      onBeginReading(data.response)
      setShouldFetch(false)
    }
  }, [data, shouldFetch, onBeginReading])

  const handleBeginClick = () => {
    setShouldFetch(true)
  }

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.popupOverlay} onClick={handleOverlayClick}>
      <div className={styles.popupContent}>
        <div className={styles.dragHandle}></div>
        
        <div className={styles.iconContainer}>
          <svg className={styles.icon} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            {/* Globe with orbiting elements */}
            <g stroke="#000" strokeWidth="2" fill="none">
              {/* Central globe */}
              <circle cx="50" cy="50" r="20" />
              
              {/* Latitude lines */}
              <ellipse cx="50" cy="50" rx="20" ry="8" />
              <ellipse cx="50" cy="50" rx="20" ry="14" />
              
              {/* Longitude lines */}
              <ellipse cx="50" cy="50" rx="8" ry="20" />
              <ellipse cx="50" cy="50" rx="14" ry="20" />
              
              {/* Orbit ring 1 */}
              <ellipse cx="50" cy="50" rx="35" ry="15" transform="rotate(-30 50 50)" />
              
              {/* Orbit ring 2 */}
              <ellipse cx="50" cy="50" rx="35" ry="15" transform="rotate(30 50 50)" />
              
              {/* Orbiting circles */}
              <circle cx="50" cy="20" r="4" fill="#000" />
              <circle cx="78" cy="45" r="4" fill="#000" />
              <circle cx="65" cy="70" r="4" fill="#000" />
              <circle cx="22" cy="55" r="4" fill="#000" />
            </g>
          </svg>
        </div>

        <p className={styles.message}>
          Relax your thoughts and centre your attention before drawing the cards.
        </p>

        <button 
          className={styles.beginButton} 
          onClick={handleBeginClick}
          disabled={isLoading}
        >
          {isLoading ? 'Loading Cards...' : 'Begin Reading'}
        </button>

        {error && (
          <p className={styles.error}>
            Failed to load cards. Please try again.
          </p>
        )}
      </div>
    </div>
  )
}

export default TarotPopup
