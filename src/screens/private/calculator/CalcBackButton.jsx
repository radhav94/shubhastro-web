import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import styles from "./CalcBackButton.module.scss";

/**
 * Shared "go back" bar used on every calculator report.
 *
 * @param {Object} props
 * @param {() => boolean} [props.onBack] - Optional interceptor. If it returns
 *   true, the default navigate(-1) is skipped. Screens use this to let an open
 *   in-page popup consume the Back press instead of leaving the report.
 */
const CalcBackButton = ({ onBack }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Let the screen consume the press first (e.g. close/step-back a popup).
    if (onBack && onBack() === true) return;
    navigate(-1);
  };

  return (
    <>
      <div className={styles.calcBackBar}>
        <div className={styles.backBtnInner}>
          <button className={styles.backBtn} onClick={handleClick} aria-label="Go back">
            <ChevronLeft size={22} />
          </button>
        </div>
      </div>
      <div className={styles.spacer} />
    </>
  );
};

export default CalcBackButton;
