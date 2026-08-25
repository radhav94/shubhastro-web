import { useState, useEffect, useRef } from 'react'
import ChevronLeft from '../components/ui/ChevronLeft'
import { useNavigate } from 'react-router-dom'
import styles from './TarotReadingPage.module.css'

const TarotReadingPage = () => {
  const navigate = useNavigate()
  const [displayedCards, setDisplayedCards] = useState(10)
  const observerRef = useRef(null)

  const allTarotReadings = [
    // { id: 1, title: 'Daily Cosmic Guidance', type: 'Free', apiEndpoint: 'daily' },
    { id: 1, title: 'Yes/ No Tarot', type: '', apiEndpoint: 'yes-no' },
    { id: 2, title: 'Career Select', type: '', apiEndpoint: 'career-select' },
    { id: 3, title: 'Love Triangle', type: '', apiEndpoint: 'love-triangle' },
    { id: 4, title: 'Daily Horoscope', type: '', apiEndpoint: 'daily' },
    { id: 5, title: 'In Depth Love', type: '', apiEndpoint: 'in-depth-love' },
    { id: 6, title: 'Erotic Love', type: '', apiEndpoint: 'erotic-love' },
    { id: 7, title: 'Made for Each Other', type: '', apiEndpoint: 'made-for-each-other-or-not' },
    { id: 8, title: 'Flirt Reading', type: '', apiEndpoint: 'flirt-reading' },
    { id: 9, title: 'Romantic Breakup', type: '', apiEndpoint: 'romantic-breakup' },
    { id: 10, title: 'Business Breakup', type: '', apiEndpoint: 'business-breakup' },

    // { id: 10, title: 'Financial Future', type: 'Paid', apiEndpoint: 'daily' },
    // { id: 11, title: 'Health Reading', type: 'Free', apiEndpoint: 'daily' },
    // { id: 12, title: 'Spiritual Path', type: 'Paid', apiEndpoint: 'daily' },
    // { id: 13, title: 'Past Life', type: 'Paid', apiEndpoint: 'daily' },
    // { id: 14, title: 'Dream Analysis', type: 'Free', apiEndpoint: 'daily' },
    // { id: 15, title: 'Soul Mate', type: 'Paid', apiEndpoint: 'made-for-each-other-or-not' },
    // { id: 16, title: 'Life Purpose', type: 'Free', apiEndpoint: 'daily' }
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedCards < allTarotReadings.length) {
          setDisplayedCards(prev => Math.min(prev + 4, allTarotReadings.length))
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [displayedCards, allTarotReadings.length])

  const handleCardClick = (reading) => {
    navigate('/tarot-card-selection', { 
      state: { 
        reading,
        cards: [] 
      } 
    })
  }

  /*
    The reading cards are the entire point of this page, and they were plain
    `<div onClick>` — no role, no tab stop, no key handler. So the only way to
    start any tarot reading was a mouse or a tap: keyboard users could not reach
    them at all, and assistive tech saw ten unlabelled divs.

    Given button semantics rather than swapped to `<button>` so the existing
    absolute-positioned card layout (badge, image, overlaid content) keeps
    working untouched.
  */
  const cardActivation = (reading) => ({
    role: 'button',
    tabIndex: 0,
    'aria-label': `${reading.title} tarot reading`,
    onClick: () => handleCardClick(reading),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleCardClick(reading)
      }
    },
  })

  return (
    <div className={styles.tarotReadingPage}>
      <div className={styles.tarotHeader}>
        <div className={styles.taroteHeaderInner}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.tarotTitle}>Tarot Reading</h1>
        </div>
      </div>

      <div className={styles.tarotIntro}>
        <h2 className={styles.tarotHeading}>Let the Cards Guide You </h2>
        <p className={styles.tarotDescription}>
          Discover insights into love, career and life through tarot readings. Choose a reading below to begin.
        </p>
      </div>

      <div className={styles.tarotGrid}>
        {allTarotReadings.slice(0, displayedCards).map((reading) => (
          <div
            key={reading.id}
            className={styles.tarotCard}
            {...cardActivation(reading)}
          >
            {/*
              Only rendered when there is actually a badge to show. Every reading
              in the list above currently has `type: ''`, which meant
              `styles[''.toLowerCase()]` resolved to undefined and the class came
              out as the literal string "tarotBadge undefined" — and because
              .tarotBadge is absolutely positioned with 10px/32px padding, each
              card carried an empty ~64x30px transparent element pinned over its
              top edge. Harmless for clicks (they bubble to the card), but it is
              stray DOM with a bogus class on every card.
            */}
            {reading.type ? (
              <span
                className={`${styles.tarotBadge} ${styles[reading.type.toLowerCase()] || ''}`.trim()}
              >
                {reading.type}
              </span>
            ) : null}
            <div className={styles.tarotCardContent}>
              <h3 className={styles.tarotCardTitle}>{reading.title}</h3>
              <div className={styles.tarotCardImage}>
                <img src="/images/4card_black.png" alt="Tarot Cards" />
              </div>
                <svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
                  <defs>
                    <linearGradient id={`cardBg-${reading.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#f5f5f5', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#d0d0d0', stopOpacity: 1 }} />
                    </linearGradient>
                    <radialGradient id={`sunCenter-${reading.id}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#ffb700', stopOpacity: 1 }} />
                    </radialGradient>
                    <linearGradient id={`skyGrad-${reading.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#87ceeb', stopOpacity: 0.8 }} />
                      <stop offset="100%" style={{ stopColor: '#4682b4', stopOpacity: 0.8 }} />
                    </linearGradient>
                  </defs>
                  
                  {/* Card 1 - Back left */}
                  <g transform="translate(20, 100) rotate(-25)" opacity="0.85">
                    <rect x="0" y="0" width="75" height="120" rx="6" fill={`url(#cardBg-${reading.id})`} stroke="#8b7355" strokeWidth="2"/>
                    <rect x="5" y="5" width="65" height="110" rx="4" fill={`url(#skyGrad-${reading.id})`}/>
                    <circle cx="37.5" cy="50" r="20" fill={`url(#sunCenter-${reading.id})`} stroke="#d4a574" strokeWidth="2"/>
                    {/* Sun rays */}
                    <g stroke="#ff6347" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="37.5" y1="25" x2="37.5" y2="18"/>
                      <line x1="37.5" y1="82" x2="37.5" y2="75"/>
                      <line x1="12" y1="50" x2="19" y2="50"/>
                      <line x1="63" y1="50" x2="56" y2="50"/>
                      <line x1="18" y1="31" x2="23" y2="36"/>
                      <line x1="57" y1="69" x2="52" y2="64"/>
                      <line x1="18" y1="69" x2="23" y2="64"/>
                      <line x1="57" y1="31" x2="52" y2="36"/>
                    </g>
                    {/* Decorative elements */}
                    <path d="M 15 90 Q 37.5 85 60 90" stroke="#8b7355" strokeWidth="1.5" fill="none"/>
                    <circle cx="20" cy="100" r="3" fill="#d4a574"/>
                    <circle cx="55" cy="100" r="3" fill="#d4a574"/>
                  </g>
                  
                  {/* Card 2 - Middle left */}
                  <g transform="translate(65, 85) rotate(-12)" opacity="0.9">
                    <rect x="0" y="0" width="75" height="120" rx="6" fill={`url(#cardBg-${reading.id})`} stroke="#8b7355" strokeWidth="2"/>
                    <rect x="5" y="5" width="65" height="110" rx="4" fill={`url(#skyGrad-${reading.id})`}/>
                    <circle cx="37.5" cy="50" r="20" fill={`url(#sunCenter-${reading.id})`} stroke="#d4a574" strokeWidth="2"/>
                    <g stroke="#ff6347" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="37.5" y1="25" x2="37.5" y2="18"/>
                      <line x1="37.5" y1="82" x2="37.5" y2="75"/>
                      <line x1="12" y1="50" x2="19" y2="50"/>
                      <line x1="63" y1="50" x2="56" y2="50"/>
                      <line x1="18" y1="31" x2="23" y2="36"/>
                      <line x1="57" y1="69" x2="52" y2="64"/>
                      <line x1="18" y1="69" x2="23" y2="64"/>
                      <line x1="57" y1="31" x2="52" y2="36"/>
                    </g>
                    <path d="M 15 90 Q 37.5 85 60 90" stroke="#8b7355" strokeWidth="1.5" fill="none"/>
                    <circle cx="20" cy="100" r="3" fill="#d4a574"/>
                    <circle cx="55" cy="100" r="3" fill="#d4a574"/>
                  </g>
                  
                  {/* Card 3 - Middle right */}
                  <g transform="translate(115, 85) rotate(12)" opacity="0.9">
                    <rect x="0" y="0" width="75" height="120" rx="6" fill={`url(#cardBg-${reading.id})`} stroke="#8b7355" strokeWidth="2"/>
                    <rect x="5" y="5" width="65" height="110" rx="4" fill={`url(#skyGrad-${reading.id})`}/>
                    <circle cx="37.5" cy="50" r="20" fill={`url(#sunCenter-${reading.id})`} stroke="#d4a574" strokeWidth="2"/>
                    <g stroke="#ff6347" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="37.5" y1="25" x2="37.5" y2="18"/>
                      <line x1="37.5" y1="82" x2="37.5" y2="75"/>
                      <line x1="12" y1="50" x2="19" y2="50"/>
                      <line x1="63" y1="50" x2="56" y2="50"/>
                      <line x1="18" y1="31" x2="23" y2="36"/>
                      <line x1="57" y1="69" x2="52" y2="64"/>
                      <line x1="18" y1="69" x2="23" y2="64"/>
                      <line x1="57" y1="31" x2="52" y2="36"/>
                    </g>
                    <path d="M 15 90 Q 37.5 85 60 90" stroke="#8b7355" strokeWidth="1.5" fill="none"/>
                    <circle cx="20" cy="100" r="3" fill="#d4a574"/>
                    <circle cx="55" cy="100" r="3" fill="#d4a574"/>
                  </g>
                  
                  {/* Card 4 - Back right */}
                  <g transform="translate(165, 100) rotate(25)" opacity="0.85">
                    <rect x="0" y="0" width="75" height="120" rx="6" fill={`url(#cardBg-${reading.id})`} stroke="#8b7355" strokeWidth="2"/>
                    <rect x="5" y="5" width="65" height="110" rx="4" fill={`url(#skyGrad-${reading.id})`}/>
                    <circle cx="37.5" cy="50" r="20" fill={`url(#sunCenter-${reading.id})`} stroke="#d4a574" strokeWidth="2"/>
                    <g stroke="#ff6347" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="37.5" y1="25" x2="37.5" y2="18"/>
                      <line x1="37.5" y1="82" x2="37.5" y2="75"/>
                      <line x1="12" y1="50" x2="19" y2="50"/>
                      <line x1="63" y1="50" x2="56" y2="50"/>
                      <line x1="18" y1="31" x2="23" y2="36"/>
                      <line x1="57" y1="69" x2="52" y2="64"/>
                      <line x1="18" y1="69" x2="23" y2="64"/>
                      <line x1="57" y1="31" x2="52" y2="36"/>
                    </g>
                    <path d="M 15 90 Q 37.5 85 60 90" stroke="#8b7355" strokeWidth="1.5" fill="none"/>
                    <circle cx="20" cy="100" r="3" fill="#d4a574"/>
                    <circle cx="55" cy="100" r="3" fill="#d4a574"/>
                  </g>
                </svg>
            </div>
          </div>
        ))}
      </div>

      {displayedCards < allTarotReadings.length && (
        <div ref={observerRef} className={styles.loadingTrigger} />
      )}
    </div>
  )
}

export default TarotReadingPage
