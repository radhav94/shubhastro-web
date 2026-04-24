import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "../Home.module.scss";
import { Toast } from "../../../../component";

const PanditAISection = ({ data }) => {
  const navigate = useNavigate();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  const panditTitle = data?.title || "Pandit AI";

  const handleClick = () => {
    if (!userIdLocal) {
      Toast.error("Please login to continue");
      navigate("/login");
      return;
    }
    // Open the PanditAI bubble
    window.dispatchEvent(new CustomEvent("panditai:ask", { detail: { query: "" } }));
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <section
      className={styles.panditAISection}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Open Pandit AI"
    >
      <span className={styles.panditAIOrbit} />
      <span className={styles.panditAIGlow} />
      <div className={styles.panditAICard}>
        <div className={styles.panditIntro}>
          <div className={styles.panditInfo}>
            <div className={styles.panditAvatar}>
              <Sparkles size={22} />
            </div>
            <div className={styles.panditText}>
              <span className={styles.panditEyebrow}>AI Astrology Guide</span>
              <span className={styles.panditName}>
                {panditTitle} <span className={styles.sparkle}>✨</span>
              </span>
              <span className={styles.panditRole}>AI Assistant</span>
            </div>
          </div>
          <div className={styles.panditCaption}>
            Instant guidance for life, career, love, and more.
          </div>
        </div>
        <div className={styles.panditActionGroup}>
          <span className={styles.panditActionLabel}>Ask</span>
          <span className={styles.panditPrompt}>Pandit AI</span>
          <span className={styles.panditArrow}>
            <ArrowRight size={18} />
          </span>
        </div>
      </div>
    </section>
  );
};

export default PanditAISection;
