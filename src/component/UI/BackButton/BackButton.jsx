import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import styles from "./BackButton.module.scss";

const BackButton = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.backBar}>
      <div className={styles.backBtnInner}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft size={22} />
        </button>
      </div>
    </div>
  );
};

export default BackButton;
