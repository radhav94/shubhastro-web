import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sortContentByOrder } from "../sectionRendererV2";
import SectionTitle from "./shared/SectionTitle";

import laalKitaabImg from "../../../../assets/images/laal-kitaab.png";
import occultWorldImg from "../../../../assets/images/occult-world.png";
import aiPanditMic from "../../../../assets/images/ai-pandit-mic.png";
import avatar1 from "../../../../assets/images/community-avatar-1.png";
import avatar2 from "../../../../assets/images/community-avatar-2.png";
import avatar3 from "../../../../assets/images/community-avatar-3.png";
import avatar4 from "../../../../assets/images/community-avatar-4.png";

const COMMUNITY_AVATARS = [avatar1, avatar2, avatar3, avatar4];

/**
 * Mobile-only AI Services 2×2 grid.
 * Desktop rendering is handled inline in HomeV2's hero section.
 */
const AiServicesSection = memo(({ sectionData, styles, onlineCount }) => {
  const navigate = useNavigate();
  const items = sortContentByOrder(sectionData?.content || []);

  const handlePanditClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent("panditai:ask", { detail: { query: "" } }));
  }, []);

  if (!items.length) return null;

  const [laalKitaab, occult, aiPandit, liveCommunity] = items;

  return (
    <section className={styles.mobileAiGrid}>
      <SectionTitle
        title={sectionData?.display_title || sectionData?.title || "AI SERVICES"}
        styles={styles}
      />
      <div className={styles.mobileAiGridRow}>
        {laalKitaab && (
          <div className={`${styles.mobileAiCard} ${styles.laalKitaab}`} onClick={() => navigate("/laal-kitab")}>
            <span className={styles.featureTag}>New</span>
            <h3>{laalKitaab.display_title || laalKitaab.title || "Laal Kitaab"}</h3>
            <button className={styles.featureCta}>{laalKitaab.action_btn || "Explore Laal Kitaab >"}</button>
            <img
              src={laalKitaab.image_url_web || laalKitaab.icon || laalKitaabImg}
              alt={laalKitaab.title || "Laal Kitaab"}
              className={styles.mobileAiCardImg}
              loading="lazy"
            />
          </div>
        )}

        {occult && (
          <div className={`${styles.mobileAiCard} ${styles.occultWorld}`} onClick={() => navigate("/occult")}>
            <div className={styles.occultEllipse} />
            <span className={styles.featureTag}>New</span>
            <h3>{occult.display_title || occult.title || "Occult World"}</h3>
            <button className={styles.fcCtaLight}>{occult.action_btn || "Explore Occult >"}</button>
            <img
              src={occult.image_url_web || occult.icon || occultWorldImg}
              alt={occult.title || "Occult World"}
              className={styles.mobileAiCardImg}
              loading="lazy"
            />
          </div>
        )}

        {aiPandit && (
          <div className={`${styles.mobileAiCard} ${styles.aiPanditVoice}`} onClick={handlePanditClick}>
            <span className={styles.featureTag}>New</span>
            <h3>{aiPandit.display_title || aiPandit.title || "AI Pandit (Voice)"}</h3>
            <button className={styles.panditTalkBtn}>{aiPandit.action_btn || "Talk Now ›"}</button>
            <img
              src={aiPandit.image_url_web || aiPandit.icon || aiPanditMic}
              alt={aiPandit.title || "AI Pandit"}
              className={styles.mobileAiCardImg}
              loading="lazy"
            />
          </div>
        )}

        {liveCommunity && (
          <div className={styles.mobileAiCard} onClick={() => navigate("/live")}>
            <span className={styles.featureTag}>New</span>
            <h3>{liveCommunity.display_title || liveCommunity.title || "ShubhAstro Live Community"}</h3>
            <button className={styles.liveCommunityBtn}>{liveCommunity.action_btn || "Join Live Now ›"}</button>
            <div className={styles.liveCommunityAvatars}>
              {COMMUNITY_AVATARS.map((av, i) => (
                <img key={i} src={av} alt="" className={styles.liveCommunityAvatarImg} loading="lazy" />
              ))}
              <span className={styles.liveCommunityCount}>
                +{onlineCount}
                <br />
                Online
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

AiServicesSection.displayName = "AiServicesSection";

export default AiServicesSection;
