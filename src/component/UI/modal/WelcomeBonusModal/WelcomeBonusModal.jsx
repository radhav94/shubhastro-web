import { useState } from "react";
import styles from "./WelcomeBonusModal.module.scss";
import { IoClose } from "react-icons/io5";
import welcomeBg from "../../../../assets/images/welcome-bonus-bg.webp";
import welcomeBgMobile from "../../../../assets/images/welcome-bonus-bg-mobile.webp";
import welcomeIcon from "../../../../assets/images/welcome-bonus-icon.webp";

const WelcomeBonusModal = () => {
  const [isOpen, setIsOpen] = useState(() => {
    const showBonus = localStorage.getItem("shubhtalk_show_welcome_bonus");
    if (showBonus === "true") {
      localStorage.removeItem("shubhtalk_show_welcome_bonus");
      return true;
    }
    return false;
  });

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close">
          <IoClose size={22} />
        </button>
        <div className={styles.bgWrapper}>
          <img src={welcomeBg} alt="" className={`${styles.bgImage} ${styles.bgDesktop}`} />
          <img src={welcomeBgMobile} alt="" className={`${styles.bgImage} ${styles.bgMobile}`} />
        </div>
        <div className={styles.content}>
          <img src={welcomeIcon} alt="Bonus" className={styles.icon} />
          <p className={styles.welcome}>Welcome to ShubhAstro!</p>
          <h2 className={styles.title}>A Little Gift From Us</h2>
          <p className={styles.amount}>₹1,000</p>
          <div className={styles.badge}>
            <span>₹</span> Welcome bonus added to your wallet
          </div>
          <p className={styles.desc}>
            Use it to talk to expert astrologers & begin your cosmic journey.
          </p>
          <button className={styles.doneBtn} onClick={() => setIsOpen(false)}>
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBonusModal;
