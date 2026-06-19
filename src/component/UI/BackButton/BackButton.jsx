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
    // If there's history to go back to, use browser back navigation
    // history.length > 1 means there's a previous entry in the session history
    if (window.history.length > 1) {
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
