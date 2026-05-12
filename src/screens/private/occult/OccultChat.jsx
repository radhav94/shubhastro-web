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
import occultWorldImg from "../../../assets/images/occult-world.png";

const features = [
  { icon: "🔮", title: "Tarot Reading",       desc: "Gain clarity on life decisions through ancient card interpretations" },
  { icon: "🔢", title: "Numerology",           desc: "Discover the hidden meaning behind your birth numbers" },
  { icon: "🛡️", title: "Spiritual Protection", desc: "Shield yourself from negative energies and evil eye" },
  { icon: "✨", title: "Reiki Healing",        desc: "Balance your energy centers for holistic well-being" },
  { icon: "🌙", title: "Moon Rituals",         desc: "Harness lunar energy for manifestation and release" },
  { icon: "🧿", title: "Dosha Analysis",       desc: "Identify and remedy planetary doshas in your chart" },
];

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
    if (selectedKundli && selectedKundli._id !== selectedProfile?._id) {
      setSelectedProfileLocal(selectedKundli);
    }
  }, [selectedKundli]);

  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      const match = selectedKundli && profiles.some((p) => p._id === selectedKundli._id);
      setSelectedProfile(match ? selectedKundli : profiles[0]);
    }
  }, [profiles.length]);

  const handleGenerate = async () => {
    if (!token) { requireAuth(); return; }
    if (!selectedProfile?._id) { Toast.error("Please select a Kundli profile first"); return; }
    try {
      const body = selectedProfile._id?.startsWith("temp_")
        ? { kundliDetails: { name: selectedProfile.name, gender: selectedProfile.gender, day: Number(selectedProfile.day), month: Number(selectedProfile.month), year: Number(selectedProfile.year), hour: Number(selectedProfile.hour), min: Number(selectedProfile.min), second: 0, lat: String(selectedProfile.lat || "0"), lon: String(selectedProfile.lon || "0"), tzone: selectedProfile.tzone ?? 5.5, place: selectedProfile.place } }
        : { kundliId: selectedProfile._id };

      const result = await getOccultDasha(body).unwrap();
      const data = result?.message?.message || result?.message || result;
      if (data) {
        navigate(PATH.privateRoutes.OCCULT_RESULT.path, { state: { result: data, profile: selectedProfile } });
      } else {
        Toast.error("Failed to generate reading");
      }
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to generate Occult Dosha analysis");
    }
  };

  return (
    <div className={styles.page}>
      {(isLoadingProfiles || isGenerating) && <PrimaryLoader />}

      {/* ── Hero ── */}
      <div className={styles.hero}>
        {/* Decorative orbs */}
        <div className={styles.orb1} />
        <div className={styles.orb2} />

        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>✦ Ancient Mystical Sciences ✦</span>
          <h1 className={styles.heroTitle}>Occult World</h1>
          <p className={styles.heroDesc}>
            Explore the mystical realm of ancient sciences. Uncover hidden truths, heal energy imbalances,
            and receive powerful spiritual guidance tailored to your cosmic blueprint.
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
              <button className={styles.selectBtn} onClick={() => setShowProfileManager(true)}>
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
                <><span className={styles.spinner} /> Analyzing your chart...</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                  </svg>
                  Get Occult Reading
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hero image */}
        <div className={styles.heroImgWrap}>
          <div className={styles.imgGlow} />
          <img src={occultWorldImg} alt="Occult World" className={styles.heroImg} />
        </div>
      </div>

      {/* ── Info Section ── */}
      <div className={styles.infoSection}>
        <div className={styles.infoHeader}>
          <h2 className={styles.infoTitle}>
            What are <span className={styles.purple}>Occult Sciences?</span>
          </h2>
        </div>
        <p className={styles.infoText}>
          Occult sciences encompass ancient mystical practices that help you gain clarity,
          heal energy imbalances, and shield yourself from negative influences.
          From tarot to numerology, these time-tested tools offer profound insights into your life's journey.
        </p>

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

      <ProfileManager
        isOpen={showProfileManager}
        onClose={() => setShowProfileManager(false)}
        onProfileSelect={(profile) => { setSelectedProfile(profile); setShowProfileManager(false); }}
        selectedProfileId={selectedProfile?._id}
        title="Select Kundli"
        enabledOperations={{ list: true, add: true, edit: true, delete: true }}
      />
    </div>
  );
};

export default OccultChat;
