import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import styles from "./BackButton.module.scss";

const BackButton = ({ onClick, fallbackPath = "/" }) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }
    // If there's no same-origin referrer, user likely landed directly on this page
    const referrer = document.referrer;
    const isSameOrigin = referrer && new URL(referrer).origin === window.location.origin;
    
    if (isSameOrigin) {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  };

  return (
    <div className={styles.backBar}>
      <div className={styles.backBtnInner}>
        <button className={styles.backBtn} onClick={handleBack} aria-label="Go back">
          <ChevronLeft size={22} />
        </button>
      </div>
    </div>
  );
};

export default BackButton;
