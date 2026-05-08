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
      // If profile has a saved kundliId, use it. Otherwise send full details.
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
    <div className={styles.container}>
      {(isLoadingProfiles || isGenerating) && <PrimaryLoader />}

      <h1 className={styles.pageTitle}>Occult Services</h1>
      <p className={styles.pageSubtitle}>
        Explore mystical practices — tarot, numerology, reiki healing, and spiritual protection
      </p>

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

      <button className={styles.generateBtn} onClick={handleGenerate} disabled={!selectedProfile || isGenerating}>
        {isGenerating ? "Analyzing..." : "Get Occult Reading"}
      </button>

      <div className={styles.infoSection}>
        <h3 className={styles.infoTitle}>What are Occult Services?</h3>
        <p className={styles.infoText}>
          Occult sciences encompass ancient mystical practices that help you gain clarity,
          heal energy imbalances, and shield yourself from negative influences.
        </p>
        <div className={styles.featureGrid}>
          {[
            { icon: "🔮", title: "Tarot Reading", desc: "Gain clarity on life decisions through card interpretations" },
            { icon: "🔢", title: "Numerology", desc: "Discover the hidden meaning behind your numbers" },
            { icon: "🛡️", title: "Spiritual Protection", desc: "Shield yourself from negative energies" },
            { icon: "✨", title: "Reiki Healing", desc: "Balance your energy centers for well-being" },
          ].map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
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
