import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import styles from "./LalKitab.module.scss";
import { useGetAllKundlisQuery } from "../../../services/appServices/kundliServicesNew";
import { useGenerateLalKitabTevaMutation } from "../../../redux/api/lalKitab/lalKitabApi";
import { ProfileManager } from "../../../component/UI/Profile";
import { Toast } from "../../../component";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import useRequireAuth from "../../../utils/hooks/useRequireAuth";
import { setSelectedKundli } from "../../../redux/kundli/kundliSlice";
import TTSButton from "../../../component/UI/TTSButton";
import BackButton from "../../../component/UI/BackButton/BackButton";
import laalKitaabImg from "../../../assets/images/laalkitabNewImg.png";

const features = [
  { icon: "🏠", title: "Houses Analysis",   desc: "Detailed analysis of all 12 houses with planetary positions" },
  { icon: "🪐", title: "Planet Insights",   desc: "In-depth interpretation of each planet with personalized remedies" },
  { icon: "⚖️", title: "Debts Analysis",    desc: "Karmic debts from self, father, mother, relatives, and spouse" },
  { icon: "📊", title: "Chart View",        desc: "Visual Lal Kitab chart with downloadable image" },
  { icon: "💊", title: "Remedies",          desc: "Simple daily-life remedies to mitigate negative planetary effects" },
  { icon: "🔮", title: "Predictions",       desc: "Life predictions based on your unique planetary configuration" },
];

const LalKitab = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const requireAuth = useRequireAuth();

  const [showProfileManager, setShowProfileManager] = useState(false);
  const [selectedProfile, setSelectedProfileLocal] = useState(null);

  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  const setSelectedProfile = (profile) => {
    setSelectedProfileLocal(profile);
    dispatch(setSelectedKundli(profile));
  };

  useEffect(() => {
    if (selectedKundli && !selectedKundli._id?.startsWith("temp_") && selectedKundli._id !== selectedProfile?._id) {
      setSelectedProfileLocal(selectedKundli);
    }
  }, [selectedKundli]);

  const token = localStorage.getItem("shubhtalk_customer_token");
  const isLoggedIn = !!token;

  const { data: kundliData, isLoading: isLoadingProfiles } = useGetAllKundlisQuery(undefined, { skip: !token });
  const profiles = kundliData?.data || [];

  const [generateTeva, { isLoading: isGenerating }] = useGenerateLalKitabTevaMutation();

  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      const isValidSelection = selectedKundli && !selectedKundli._id?.startsWith("temp_") && profiles.some((p) => p._id === selectedKundli._id);
      if (isValidSelection) {
        setSelectedProfileLocal(selectedKundli);
      } else {
        setSelectedProfile(profiles[0]);
      }
    }
  }, [profiles.length, selectedProfile]);

  const handleGenerate = async () => {
    if (!isLoggedIn) { requireAuth(); return; }
    if (!selectedProfile?._id) { Toast.error("Please select a Kundli profile first"); return; }
    try {
      const result = await generateTeva(String(selectedProfile._id)).unwrap();
      const lalKitabId = (result?.data || result)?._id;
      if (lalKitabId) {
        navigate(`/laal-kitab/${lalKitabId}`, { state: { tevaData: result?.data || result } });
      } else {
        Toast.error("Failed to generate Lal Kitab");
      }
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to generate Lal Kitab Teva");
    }
  };

  const infoText = "Lal Kitab is a unique system of astrology that provides simple yet powerful remedies for planetary afflictions. Unlike traditional Vedic astrology, Lal Kitab focuses on practical remedies that can be performed in daily life to mitigate negative planetary effects.";

  return (
    <>
      <BackButton />
    <div className={styles.page}>
      {(isGenerating || isLoadingProfiles) && <PrimaryLoader />}

      {/* ── Hero Banner ── */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>Ancient Wisdom · Modern Insights</span>
          <h1 className={styles.heroTitle}>Lal Kitab</h1>
          <p className={styles.heroDesc}>
            Unlock the secrets of your destiny through the ancient wisdom of Lal Kitab.
            Get personalized planetary analysis, karmic debt insights, and powerful daily remedies.
          </p>

          {/* Profile selector */}
          <div className={styles.profileBox}>
            <p className={styles.profileLabel}>Select your Kundli profile to begin</p>
            {selectedProfile ? (
              <div className={styles.selectedCard} onClick={() => setShowProfileManager(true)}>
                <div className={styles.avatar}>{(selectedProfile.name || "U").charAt(0).toUpperCase()}</div>
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>{selectedProfile.name}</span>
                  <span className={styles.profileMeta}>
                    {selectedProfile.day}/{selectedProfile.month}/{selectedProfile.year} · {selectedProfile.place}
                  </span>
                </div>
                <span className={styles.changeChip}>Change ›</span>
              </div>
            ) : (
              <button className={styles.selectBtn} onClick={() => { if (!isLoggedIn) { requireAuth(); return; } setShowProfileManager(true); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                Select Kundli Profile
              </button>
            )}

            <button
              className={styles.generateBtn}
              onClick={handleGenerate}
              disabled={!selectedProfile || isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className={styles.spinner} />
                  Generating your Teva...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                  Generate Lal Kitab Teva
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hero image */}
        <div className={styles.heroImgWrap}>
          <img src={laalKitaabImg} alt="Lal Kitab" className={styles.heroImg} />
          <div className={styles.heroGlow} />
        </div>
      </div>

      {/* ── What is Lal Kitab ── */}
      <div className={styles.infoSection}>
        <div className={styles.infoHeader}>
          <h2 className={styles.infoTitle}>
            What is <span className={styles.orange}>Lal Kitab?</span>
          </h2>
          <TTSButton text={`What is Lal Kitab? ${infoText}`} />
        </div>
        <p className={styles.infoText}>{infoText}</p>

        {/* Feature cards */}
        <div className={styles.featureGrid}>
          {features.map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <div>
                <h4 className={styles.featureTitle}>{f.title}</h4>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Manager Modal */}
      <ProfileManager
        isOpen={showProfileManager}
        onClose={() => setShowProfileManager(false)}
        onProfileSelect={(profile) => { setSelectedProfile(profile); setShowProfileManager(false); }}
        selectedProfileId={selectedProfile?._id}
        title="Select Kundli"
        enabledOperations={{ list: true, add: true, edit: true, delete: true }}
      />
    </div>
    </>
  );
};

export default LalKitab;
