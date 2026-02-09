import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "../Home.module.scss";
import { voiceSocket } from "../../../../services/voiceSocketServices";
import { Toast } from "../../../../component";

const PanditAISection = ({ data, astrologerId, onChatStart }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  
  const panditTitle = data?.title || "Pandit AI";
  const panditDescription = data?.description || "1 Free Question";
  const aiAstrologerId = astrologerId;

  const handleAskQuestion = () => {
    if (!query.trim()) {
      Toast.error("Please enter your question");
      return;
    }

    if (!aiAstrologerId) {
      Toast.error("AI Astrologer not configured");
      return;
    }

    if (!userIdLocal) {
      Toast.error("Please login to continue");
      navigate("/login");
      return;
    }

    // If onChatStart handler is provided, use it (for proper flow with balance check, kundli selection)
    if (onChatStart) {
      // Create astrologer object for the hook
      const aiAstrologer = {
        _id: aiAstrologerId,
        firstName: panditTitle,
        isActive: true,
      };
      onChatStart(aiAstrologer, query);
    } else {
      // Direct chat initiation (fallback)
      console.log("💬 Initiating AI chat with query:", query);
      voiceSocket.emit("chat:initiate", {
        userId: userIdLocal,
        astrologerId: aiAstrologerId,
        initialMessage: query,
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAskQuestion();
    }
  };

  return (
    <section className={styles.panditAISection}>
      <div className={styles.panditAICard}>
        <div className={styles.panditInfo}>
          <div className={styles.panditAvatar}>
            <span>🧘‍♀️</span>
          </div>
          <div className={styles.panditText}>
            <span className={styles.panditName}>
              {panditTitle} <span className={styles.sparkle}>✨</span>
            </span>
            <span className={styles.panditRole}>AI Assistant</span>
          </div>
        </div>
        <button className={styles.freeQuestionBtn}>{panditDescription}</button>
      </div>

      <div className={styles.searchBar}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="When will I get a job?"
          className={styles.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className={styles.searchSubmit} onClick={handleAskQuestion}>
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
};

export default PanditAISection;
