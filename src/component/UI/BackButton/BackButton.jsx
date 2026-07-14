import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import styles from "./BackButton.module.scss";

const BackButton = ({ onClick, fallbackPath = "/", disabled = false }) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (disabled) return;
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
        <button
          className={styles.backBtn}
          onClick={handleBack}
          aria-label="Go back"
          disabled={disabled}
          style={disabled ? { opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" } : undefined}
        >
          <ChevronLeft size={22} />
        </button>
      </div>
    </div>
  );
};

export default BackButton;
