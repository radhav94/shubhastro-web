import styles from './ChatNotificationBanner.module.scss'
import { IoClose } from 'react-icons/io5'
import { getAstrologerDefaultImage } from '../../../utils/appImages'

const ChatNotificationBanner = ({ senderName, message, imageUrl, gender, onClose, onClick }) => {
  const avatarSrc = imageUrl || getAstrologerDefaultImage(gender)

  return (
    <div className={styles.banner} onClick={() => { if (onClick) onClick(); onClose(); }}>
      <img src={avatarSrc} alt={senderName} className={styles.avatar} onError={(e) => { e.target.src = getAstrologerDefaultImage(gender) }} />
      <div className={styles.content}>
        <p className={styles.title}>New message from {senderName}</p>
        <p className={styles.message}>{message}</p>
      </div>
      <button className={styles.closeBtn} onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close notification">
        <IoClose size={18} />
      </button>
    </div>
  )
}

export default ChatNotificationBanner
