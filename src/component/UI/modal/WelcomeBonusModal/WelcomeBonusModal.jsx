import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styles from "./WelcomeBonusModal.module.scss";
import { IoClose } from "react-icons/io5";
import welcomeBg from "../../../../assets/images/welcome-bonus-bg.webp";
import welcomeBgMobile from "../../../../assets/images/welcome-bonus-bg-mobile.webp";
import welcomeIcon from "../../../../assets/images/welcome-bonus-icon.webp";
import { useWalletBalance } from "../../../../screens/private/wallet/useWalletBalance";

const WelcomeBonusModal = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  // Use the same wallet-balance source as the header so the amount matches what
  // the app shows (it persists to localStorage and refreshes on wallet events).
  const { balance, refreshWallet } = useWalletBalance();

  // Show the bonus whenever the flag is set. Checked on mount AND on every
  // navigation, so it works even when this modal is mounted persistently
  // (e.g. the user is registered mid-flow and then lands on a result screen).
  useEffect(() => {
    if (localStorage.getItem("shubhtalk_show_welcome_bonus") === "true") {
      localStorage.removeItem("shubhtalk_show_welcome_bonus");
      setIsOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      // Pull the latest balance so the just-credited welcome bonus is reflected.
      refreshWallet();
    }
  }, [isOpen, refreshWallet]);

  const amount = balance ?? 0;

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
          <p className={styles.amount}>₹{amount}</p>
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
