import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import styles from "./CalcBackButton.module.scss";

const CalcBackButton = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className={styles.calcBackBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft size={22} />
        </button>
      </div>
      <div className={styles.spacer} />
    </>
  );
};

export default CalcBackButton;
