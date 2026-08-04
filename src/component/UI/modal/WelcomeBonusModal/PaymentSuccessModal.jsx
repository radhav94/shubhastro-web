import { useNavigate } from "react-router-dom";
import styles from "./WelcomeBonusModal.module.scss";
import { IoClose } from "react-icons/io5";
import welcomeBg from "../../../../assets/images/welcome-bonus-bg.webp";
import welcomeBgMobile from "../../../../assets/images/welcome-bonus-bg-mobile.webp";
import welcomeIcon from "../../../../assets/images/welcome-bonus-icon.webp";

const PaymentSuccessModal = ({ isOpen, onClose, amount, redirectTo = "/" }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleExplore = () => {
    onClose();
    if (redirectTo) {
      navigate(redirectTo);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <IoClose size={22} />
        </button>
        <div className={styles.bgWrapper}>
          <img src={welcomeBg} alt="" className={`${styles.bgImage} ${styles.bgDesktop}`} />
          <img src={welcomeBgMobile} alt="" className={`${styles.bgImage} ${styles.bgMobile}`} />
        </div>
        <div className={styles.content}>
          <img src={welcomeIcon} alt="Success" className={styles.icon} />
          <p className={styles.welcome}>Payment Successful!</p>
          <h2 className={styles.title}>Your Wallet is Topped Up</h2>
          <p className={styles.amount}>₹{amount}</p>
          <div className={styles.badge}>
             Amount added to your wallet
          </div>
          <p className={styles.desc}>
            You're all set! Connect with astrologers and continue your journey.
          </p>
          <button className={styles.doneBtn} onClick={handleExplore}>
            Explore Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
