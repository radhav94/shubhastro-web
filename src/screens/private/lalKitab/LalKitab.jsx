import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import styles from "./LalKitab.module.scss";
import { useGetAllKundlisQuery } from "../../../services/appServices/kundliServicesNew";
import { useGenerateLalKitabTevaMutation } from "../../../redux/api/lalKitab/lalKitabApi";
import { ProfileManager, GuestKundliAuthModal } from "../../../component/UI/Profile";
import { Toast } from "../../../component";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import useRequireAuth from "../../../utils/hooks/useRequireAuth";
import { setSelectedKundli } from "../../../redux/kundli/kundliSlice";
import TTSButton from "../../../component/UI/TTSButton";
import BackButton from "../../../component/UI/BackButton/BackButton";
import laalKitaabImg from "../../../assets/images/laalkitabNewImg.png";
import useAIWowSubscriptionGate from "../aiwow/hooks/useAIWowSubscriptionGate";

const features = [
  { icon: "🏠", title: "Houses Analysis",   desc: "Detailed analysis of all 12 houses with planetary positions" },
  { icon: "🪐", title: "Planet Insights",   desc: "In-depth interpretation of each planet with personalized remedies" },
  { icon: "⚖️", title: "Debts Analysis",    desc: "Karmic debts from self, father, mother, relatives, and spouse" },
  { icon: "📊", title: "Chart View",        desc: "Visual Laal Kitab chart with downloadable image" },
  { icon: "💊", title: "Remedies",          desc: "Simple daily-life remedies to mitigate negative planetary effects" },
  { icon: "🔮", title: "Predictions",       desc: "Life predictions based on your unique planetary configuration" },
];

const LalKitab = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const requireAuth = useRequireAuth();

  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const pendingGuestActionRef = useRef(null);
  const [selectedProfile, setSelectedProfileLocal] = useState(null);
  const [guestGenerating, setGuestGenerating] = useState(false);

  // Listen for guest generation trigger (survives component remount after auth).
  //
  // There must be a matching "done" event. Previously only the start event
  // existed, so an instance that received it but did not own the awaited
  // generate call had no way to clear the flag — it sat permanently showing
  // "Generating your Teva..." with the button disabled, and every further click
  // was a dead click until a full page reload.
  useEffect(() => {
    const start = () => setGuestGenerating(true);
    const done = () => setGuestGenerating(false);
    window.addEventListener("lalkitab:generating", start);
    window.addEventListener("lalkitab:generated", done);
    return () => {
      window.removeEventListener("lalkitab:generating", start);
      window.removeEventListener("lalkitab:generated", done);
    };
  }, []);

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
  const { runWithEntitlement, subscriptionModal, showSubscriptionModal } = useAIWowSubscriptionGate({ featureName: "lal-kitab" });

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

  const doGenerate = async (profile) => {
    if (!profile?._id) { Toast.error("Please select a Kundli profile first"); return; }
    window.dispatchEvent(new Event("lalkitab:generating"));

    // try/finally is load-bearing: if anything inside throws, the "generating"
    // flag has to be cleared or the button stays disabled forever.
    try {
      // Route the generate call through the subscription gate — shows the plans
      // popup on PREMIUM_REQUIRED (and the extended popup on EXTENDED), then
      // retries generation after purchase.
      const result = await runWithEntitlement(async () => {
        try {
          return await generateTeva(String(profile._id)).unwrap();
        } catch (err) {
          return err?.data || { success: false, error: err };
        }
      });

      if (result?.blocked) return;

      if (result?.success === false) {
        Toast.error(result?.error?.message || result?.message || "Failed to generate Laal Kitab Teva");
        return;
      }

      const lalKitabId = (result?.data || result)?._id;
      if (lalKitabId) {
        navigate(`/laal-kitab/${lalKitabId}`, { state: { tevaData: result?.data || result } });
      } else {
        Toast.error("Failed to generate Laal Kitab");
      }
    } catch (err) {
      console.error("Laal Kitab generation failed:", err);
      Toast.error("Something went wrong. Please try again.");
    } finally {
      setGuestGenerating(false);
      window.dispatchEvent(new Event("lalkitab:generated"));
    }
  };

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      pendingGuestActionRef.current = (profile) => doGenerate(profile);
      setShowGuestAuthModal(true);
      return;
    }
    // A logged-in user with no saved kundli has no profile selected. Open the
    // picker rather than leaving the button inert — it used to be `disabled`,
    // which swallowed the tap and left the user with nothing to act on.
    if (!selectedProfile) {
      Toast.error("Select a Kundli profile to generate your Laal Kitab");
      setShowProfileManager(true);
      return;
    }
    doGenerate(selectedProfile);
  };

  const infoText = "Laal Kitab is a unique system of astrology that provides simple yet powerful remedies for planetary afflictions. Unlike traditional Vedic astrology, Laal Kitab focuses on practical remedies that can be performed in daily life to mitigate negative planetary effects.";

  return (
    <>
      <BackButton />
    <div className={styles.page}>
      {/* Hide the fullscreen loader while the subscription/plans popup is open,
          otherwise it covers the popup and the CTA looks stuck "Generating...". */}
      {(isGenerating || guestGenerating || isLoadingProfiles) && !showSubscriptionModal && <PrimaryLoader />}

      {/* ── Hero Banner ── */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>Ancient Wisdom · Modern Insights</span>
          <h1 className={styles.heroTitle}>Laal Kitab</h1>
          <p className={styles.heroDesc}>
            Unlock the secrets of your destiny through the ancient wisdom of Laal Kitab.
            Get personalized planetary analysis, karmic debt insights, and powerful daily remedies.
          </p>

          {/* Profile selector — only shown for logged-in users */}
          {isLoggedIn && (
          <div className={styles.profileBox}>
            <p className={styles.profileLabel}>Select your Kundli profile to begin</p>
            {selectedProfile ? (
              <button type="button" className={styles.selectedCard} onClick={() => setShowProfileManager(true)}>
                <div className={styles.avatar}>{(selectedProfile.name || "U").charAt(0).toUpperCase()}</div>
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>{selectedProfile.name}</span>
                  <span className={styles.profileMeta}>
                    {selectedProfile.day}/{selectedProfile.month}/{selectedProfile.year} · {selectedProfile.place}
                  </span>
                </div>
                <span className={styles.changeChip}>Change ›</span>
              </button>
            ) : (
              <button className={styles.selectBtn} onClick={() => { if (!isLoggedIn) { requireAuth(); return; } setShowProfileManager(true); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                Select Kundli Profile
              </button>
            )}

            {/* Only disabled while a generation is genuinely in flight — the
                spinner and "Generating your Teva..." label explain that state.
                The missing-profile case is handled in handleGenerate so the tap
                gets a response instead of being swallowed. */}
            <button
              className={styles.generateBtn}
              onClick={handleGenerate}
              disabled={(isGenerating || guestGenerating) && !showSubscriptionModal}
            >
              {((isGenerating || guestGenerating) && !showSubscriptionModal) ? (
                <>
                  <span className={styles.spinner} />
                  Generating your Teva...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                  Generate Laal Kitab 
                </>
              )}
            </button>
          </div>
          )}

          {/* Guest user CTA */}
          {!isLoggedIn && (
          <div className={styles.profileBox}>
            <button
              className={styles.generateBtn}
              onClick={handleGenerate}
              disabled={(isGenerating || guestGenerating) && !showSubscriptionModal}
            >
              {((isGenerating || guestGenerating) && !showSubscriptionModal) ? (
                <>
                  <span className={styles.spinner} />
                  Generating your Teva...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                  Generate Laal Kitab 
                </>
              )}
            </button>
          </div>
          )}
        </div>

        {/* Hero image */}
        <div className={styles.heroImgWrap}>
          <img src={laalKitaabImg} alt="Laal Kitab" className={styles.heroImg} />
          <div className={styles.heroGlow} />
        </div>
      </div>

      {/* ── What is Laal Kitab ── */}
      <div className={styles.infoSection}>
        <div className={styles.infoHeader}>
          <h2 className={styles.infoTitle}>
            What is <span className={styles.orange}>Laal Kitab?</span>
          </h2>
          <TTSButton text={`What is Laal Kitab? ${infoText}`} />
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

      <GuestKundliAuthModal
        isOpen={showGuestAuthModal}
        onClose={() => { setShowGuestAuthModal(false); pendingGuestActionRef.current = null; }}
        onSuccess={(profile) => {
          setShowGuestAuthModal(false);
          if (profile?._id) setSelectedProfile(profile);
          // Do NOT auto-run generation after registration. The user taps
          // "Generate Laal Kitab" again — that click runs the subscription
          // check (plans popup → buy → analyze). Prevents auto-generating the
          // moment the welcome-bonus popup closes.
          pendingGuestActionRef.current = null;
        }}
      />
    </div>
    {subscriptionModal}
    </>
  );
};

export default LalKitab;
