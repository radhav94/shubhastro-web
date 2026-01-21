import { MessageSquare, Phone, Video, X } from 'lucide-react'
import styles from './ConnectAstrologerPopup.module.css'

const ConnectAstrologerPopup = ({ isOpen, onClose, astrologer, onChatStart, onCallStart }) => {
  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleConnect = async (type) => {
    if (!astrologer) return
    
    let success = false
    
    if (type === 'chat') {
      success = await onChatStart(astrologer)
    } else if (type === 'call') {
      success = await onCallStart(astrologer, 'audio')
    } else if (type === 'video') {
      success = await onCallStart(astrologer, 'video')
    }
    
    // Only close if successful (kundli modal will open)
    if (success) {
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.popup}>
        <div className={styles.dragHandle}></div>
        
        <div className={styles.header}>
          <h2 className={styles.title}>
            Connect with {astrologer?.firstName || 'Astrologer'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.optionsGrid}>
          {/* Chat Option */}
          <div className={styles.optionCard} onClick={() => handleConnect('chat')}>
            <div className={styles.iconCircle}>
              <MessageSquare size={32} strokeWidth={2} />
            </div>
            <h3 className={styles.optionTitle}>Chat</h3>
            <p className={styles.optionPrice}>₹20/ min</p>
          </div>

          {/* Call Option */}
          <div className={styles.optionCard} onClick={() => handleConnect('call')}>
            <div className={styles.iconCircle}>
              <Phone size={32} strokeWidth={2} />
            </div>
            <h3 className={styles.optionTitle}>Call</h3>
            <p className={styles.optionPrice}>₹20/ min</p>
          </div>

          {/* Video Call Option */}
          <div className={styles.optionCard} onClick={() => handleConnect('video')}>
            <div className={styles.iconCircle}>
              <Video size={32} strokeWidth={2} />
            </div>
            <h3 className={styles.optionTitle}>Video call</h3>
            <p className={styles.optionPrice}>₹20/ min</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectAstrologerPopup
