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
    if (selectedKundli && selectedKundli._id !== selectedProfile?._id) {
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
      if (selectedKundli && profiles.some((p) => p._id === selectedKundli._id)) {
        setSelectedProfileLocal(selectedKundli);
      } else {
        setSelectedProfile(profiles[0]);
      }
    }
  }, [profiles.length, selectedProfile]);

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      requireAuth();
      return;
    }
    if (!selectedProfile?._id) {
      Toast.error("Please select a Kundli profile first");
      return;
    }
    try {
      const kundliId = typeof selectedProfile._id === "string" ? selectedProfile._id : String(selectedProfile._id);
      const result = await generateTeva(kundliId).unwrap();
      const tevaData = result?.data || result;
      const lalKitabId = tevaData?._id;
      if (lalKitabId) {
        navigate(`/lal-kitab/${lalKitabId}`, { state: { tevaData } });
      } else {
        Toast.error("Failed to generate Lal Kitab");
      }
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to generate Lal Kitab Teva");
    }
  };

  return (
    <div className={styles.container}>
      {(isGenerating || isLoadingProfiles) && <PrimaryLoader />}

      <h1 className={styles.pageTitle}>Lal Kitab</h1>
      <p className={styles.pageSubtitle}>
        Generate your personalized Lal Kitab Teva based on your birth chart
      </p>

      {/* Profile Selection */}
      <div className={styles.profileSection}>
        <h2 className={styles.sectionTitle}>Select Kundli Profile</h2>

        {selectedProfile ? (
          <div className={styles.selectedCard} onClick={() => setShowProfileManager(true)}>
            <div className={styles.selectedAvatar}>
              {(selectedProfile.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className={styles.selectedInfo}>
              <span className={styles.selectedName}>{selectedProfile.name}</span>
              <span className={styles.selectedDetails}>
                {selectedProfile.day}/{selectedProfile.month}/{selectedProfile.year} • {selectedProfile.place}
              </span>
            </div>
            <span className={styles.changeBtn}>Change</span>
          </div>
        ) : (
          <button className={styles.selectBtn} onClick={() => setShowProfileManager(true)}>
            + Select Kundli Profile
          </button>
        )}
      </div>

      {/* Generate Button */}
      <button
        className={styles.generateBtn}
        onClick={handleGenerate}
        disabled={!selectedProfile || isGenerating}
      >
        {isGenerating ? "Generating..." : "Generate Lal Kitab Teva"}
      </button>

      {/* Info Section */}
      <div className={styles.infoSection} style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
          <TTSButton text="What is Lal Kitab? Lal Kitab is a unique system of astrology that provides simple yet powerful remedies for planetary afflictions. Unlike traditional Vedic astrology, Lal Kitab focuses on practical remedies that can be performed in daily life to mitigate negative planetary effects." />
        </span>
        <h3 className={styles.infoTitle}>What is Lal Kitab?</h3>
        <p className={styles.infoText}>
          Lal Kitab is a unique system of astrology that provides simple yet powerful remedies
          for planetary afflictions. Unlike traditional Vedic astrology, Lal Kitab focuses on
          practical remedies that can be performed in daily life to mitigate negative planetary effects.
        </p>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🏠</span>
            <h4>Houses Analysis</h4>
            <p>Detailed analysis of all 12 houses with planetary positions</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🪐</span>
            <h4>Planet Insights</h4>
            <p>In-depth interpretation of each planet with personalized remedies</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>⚖️</span>
            <h4>Debts Analysis</h4>
            <p>Karmic debts from self, father, mother, relatives, and spouse</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>📊</span>
            <h4>Chart View</h4>
            <p>Visual Lal Kitab chart with downloadable image</p>
          </div>
        </div>
      </div>

      {/* Profile Manager Modal */}
      <ProfileManager
        isOpen={showProfileManager}
        onClose={() => setShowProfileManager(false)}
        onProfileSelect={(profile) => {
          setSelectedProfile(profile);
          setShowProfileManager(false);
        }}
        selectedProfileId={selectedProfile?._id}
        title="Select Kundli"
        enabledOperations={{ list: true, add: true, edit: true, delete: true }}
      />
    </div>
  );
};

export default LalKitab;
