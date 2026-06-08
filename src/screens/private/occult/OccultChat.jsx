import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import styles from "./OccultChat.module.scss";
import { useGetAllKundlisQuery } from "../../../services/appServices/kundliServicesNew";
import { useGetOccultDashaMutation } from "../../../redux/api/occult/occultApi";
import { ProfileManager } from "../../../component/UI/Profile";
import { Toast } from "../../../component";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import useRequireAuth from "../../../utils/hooks/useRequireAuth";
import { setSelectedKundli } from "../../../redux/kundli/kundliSlice";
import { PATH } from "../../../utils/routes/Paths";
import BackButton from "../../../component/UI/BackButton/BackButton";
import aiImage from "../../../assets/images/Ai Image.png";
import occultImg from "../../../assets/images/occult-img.svg";

const OccultChat = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const requireAuth = useRequireAuth();

  const [showProfileManager, setShowProfileManager] = useState(false);
  const [selectedProfile, setSelectedProfileLocal] = useState(null);
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  const token = localStorage.getItem("shubhtalk_customer_token");
  const { data: kundliData, isLoading: isLoadingProfiles } = useGetAllKundlisQuery(undefined, { skip: !token });
  const profiles = kundliData?.data || [];
  const [getOccultDasha, { isLoading: isGenerating }] = useGetOccultDashaMutation();

  const setSelectedProfile = (profile) => {
    setSelectedProfileLocal(profile);
    dispatch(setSelectedKundli(profile));
  };

  useEffect(() => {
    if (selectedKundli && !selectedKundli._id?.startsWith("temp_") && selectedKundli._id !== selectedProfile?._id) {
      setSelectedProfileLocal(selectedKundli);
    }
  }, [selectedKundli]);

  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      const isValidSelection = selectedKundli && !selectedKundli._id?.startsWith("temp_") && profiles.some((p) => p._id === selectedKundli._id);
      setSelectedProfile(isValidSelection ? selectedKundli : profiles[0]);
    }
  }, [profiles.length]);

  const handleGenerate = async () => {
    if (!token) { requireAuth(); return; }
    if (!selectedProfile?._id) { Toast.error("Please select a Kundli profile first"); return; }

    try {
      const body = selectedProfile._id?.startsWith("temp_")
        ? {
            kundliDetails: {
              name: selectedProfile.name,
              gender: selectedProfile.gender,
              day: Number(selectedProfile.day),
              month: Number(selectedProfile.month),
              year: Number(selectedProfile.year),
              hour: Number(selectedProfile.hour),
              min: Number(selectedProfile.min),
              second: 0,
              lat: String(selectedProfile.lat || "0"),
              lon: String(selectedProfile.lon || "0"),
              tzone: selectedProfile.tzone ?? 5.5,
              place: selectedProfile.place,
            },
          }
        : { kundliId: selectedProfile._id };

      const result = await getOccultDasha(body).unwrap();
      const historyId = result?.message?._id || result?._id;
      const data = result?.message?.message || result?.message || result;
      if (data) {
        navigate(PATH.privateRoutes.OCCULT_RESULT.path, { state: { result: data, profile: selectedProfile, historyId } });
      } else {
        Toast.error("Failed to generate reading");
      }
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to generate Occult Dosha analysis");
    }
  };

  const benefits = [
    { icon: "☸", label: "Understand karmic patterns" },
    { icon: "✧", label: "Remove negative energy" },
    { icon: "☀", label: "Gain emotional clarity" },
    { icon: "☽", label: "Improve spiritual balance" },
    { icon: "⛩", label: "Experience inner peace" },
  ];

  return (
    <>
      <BackButton />
    <div className={styles.container}>
      {(isLoadingProfiles || isGenerating) && <PrimaryLoader />}

      {/* Hero Section - Two columns */}
      <div className={styles.heroRow}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>
            Occult Services –<br />
            <span className={styles.heroTitleItalic}>Reveal Hidden Energies in Your Life</span>
          </h1>
          <p className={styles.heroBadge}>
            {/* <span className={styles.heroBadgeIcon}>🔮</span> */}
            Trusted Spiritual Guidance at ShubhAstro.ai
          </p>
          <p className={styles.heroDesc}>
            Sometimes recurring problems in career, relationships, finances, or mental peace may be connected to deeper spiritual and karmic influences. Occult services help uncover these hidden energies and guide individuals toward positivity, balance, and emotional healing.
          </p>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.aiCard}>
            {/* <div className={styles.aiIconWrap}>
              <img src={aiImage} alt="AI" className={styles.aiIconImg} />
            </div> */}
            <div className={styles.aiContent}>
              <h3 className={styles.aiCardTitle}>AI-powered occult analysis</h3>
              <p className={styles.aiCardText}>
                At ShubhAstro.ai, we offer AI-powered occult analysis based on ancient Vedic astrology principles. Our advanced Dosha Analysis helps identify spiritual afflictions like Kala Sarpa Dosha, Pitra Dosha, and Nazar Dosha that may create obstacles and negativity in life.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Selection */}
      <div className={styles.profileSection}>
        <div className={styles.profileSectionLeft}>
          <span className={styles.heroBadge}>AI-powered occult analysis</span>
          <h1 class={styles.heroTitle}>Occult World</h1>
          <p class={styles.heroDesc}>At ShubhAstro.ai, we offer AI-powered occult analysis based on ancient Vedic astrology principles. Our advanced Dosha Analysis helps identify spiritual afflictions like Kala Sarpa Dosha, Pitra Dosha, and Nazar Dosha that may create obstacles and negativity in life.</p>
          {/* <h2 className={styles.sectionTitle}>Select Kundli Profile</h2> */}
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
            <button className={styles.selectBtn} onClick={() => { if (!token) { requireAuth(); return; } setShowProfileManager(true); }}>
              + Select Kundli Profile
            </button>
          )}
          <button className={styles.generateBtn} onClick={handleGenerate} disabled={!selectedProfile || isGenerating}>
            {isGenerating ? "Analyzing..." : "Get Occult Reading"}
          </button>
        </div>
        <img src={occultImg} alt="occult" />

      </div>


      {/* Bottom Two Column Section */}
      <div className={styles.bottomRow}>
        <div className={styles.remediesCard}>
          <div className={styles.remediesIconWrap}>
            <span className={styles.remediesIcon}>🪷</span>
          </div>
          <div className={styles.remediesContent}>
            <h3 className={styles.remediesTitle}>Personalized Remedies & Spiritual Healing</h3>
            <p className={styles.remediesSubtitle}>— Find Peace, Protection & Positive Energy —</p>
            <p className={styles.remediesDesc}>
              Our occult experts provide personalized spiritual remedies including aura cleansing, energy balancing, and protective rituals designed to reduce negative influences and improve emotional well-being.
            </p>
          </div>
        </div>

        <div className={styles.benefitsCard}>
          <h3 className={styles.benefitsTitle}>Occult services at ShubhAstro.ai can help you:</h3>
          <ul className={styles.benefitsList}>
            {benefits.map((item) => (
              <li key={item.label} className={styles.benefitItem}>
                <span className={styles.benefitCheck}>✓</span>
                <span className={styles.benefitLabel}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Closing Banner */}
      <div className={styles.closingBanner}>
        <div className={styles.closingIconWrap}>
          <span className={styles.closingIcon}>✦</span>
        </div>
        <p className={styles.closingText}>
          Whether you are facing emotional stress, repeated setbacks, or spiritual confusion, our trusted occult guidance helps you move toward a more positive and peaceful life with ancient wisdom and modern technology.
        </p>
      </div>

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

export default OccultChat;
