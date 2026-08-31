import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useNavigationType } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronDown } from 'lucide-react';
import styles from './SmartMatchmaking.module.scss';
import { Toast } from '../../../../component';
import { analyzeSmartMatchmaking } from '../../../../services/appServices/aiWowService';
import { 
  useGetAllKundlisQuery,
  useCreateKundliMutation,
  useDeleteKundliMutation 
} from '../../../../services/appServices/kundliServicesNew';
import { getToken } from '../../../../utils/token';
import ProfileListingModal from '../../../../component/UI/Profile/ProfileListingModal';
import AddProfileModal from '../../../../component/UI/Profile/AddProfileModal';
import EditProfileModal from '../../../../component/UI/Profile/EditProfileModal';
import DeleteConfirmationModal from '../../../../component/UI/modal/deleteModal/DeleteConfirmationModal';
import matchMakingImg from '../../../../assets/images/match-making-top-img.svg';
import matchMakingImgBottom from '../../../../assets/images/match-making-bottom-img.svg';
import { PATH } from '../../../../utils/routes/Paths';
import TTSButton from '../../../../component/UI/TTSButton';
import { trackEvent } from '../../../../utils/analytics';
import useAIWowSubscriptionGate from '../hooks/useAIWowSubscriptionGate';
import { setSmartMatchmakingResult, clearSmartMatchmakingResult } from '../../../../redux/aiwow/aiwowSlice';
import DownloadReportModal from '../components/DownloadReportModal';
import { useAIWowDownload } from '../hooks/useAIWowDownload';
// import { setSelectedKundli } from '../../../../redux/kundli/kundliSlice';

const SmartMatchmaking = () => {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const dispatch = useDispatch();
  const { runWithEntitlement, subscriptionModal } = useAIWowSubscriptionGate({ featureName: 'smart-matchmaking' });
  const savedMatchmakingResult = useSelector((state) => state.aiwow.smartMatchmaking?.result);
  const isBackNavigation = navigationType === 'POP';
  const restoredResult = isBackNavigation ? savedMatchmakingResult : null;
  const [showSelectProfile, setShowSelectProfile] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [profileToEdit, setProfileToEdit] = useState(null);
  // Synchronous guard against a rapid double tap firing the analyze API twice.
  const isSubmittingRef = useRef(false);
  const [selectingType, setSelectingType] = useState(null); // PRIMARY | PARTNER
  const [primaryProfile, setPrimaryProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(restoredResult);
  const [rawApiResult, setRawApiResult] = useState(() => {
    if (restoredResult?._id || restoredResult?.historyId) {
      return { ...restoredResult, _id: restoredResult._id || restoredResult.historyId };
    }
    return null;
  });

  const downloadResultData = useMemo(() => {
    if (!rawApiResult) return null;
    return { ...rawApiResult, featureName: 'Smart-Matchmaking' };
  }, [rawApiResult]);

  const {
    isDownloading, showDownloadModal, setShowDownloadModal,
    downloadPrice, walletBalance,
    handleDownloadClick, handleConfirmDownload,
  } = useAIWowDownload({ resultData: downloadResultData });

  // Get token using reusable function
  const token = getToken();

  // Fetch profiles
  const { data, refetch } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  const [createKundli, { isLoading: isCreating }] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();

  const profiles = data?.data || [];

  // Track match making feature open (once on mount)
  useEffect(() => {
    trackEvent("match_making_opened", {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen to header profile changes from Redux
  const headerSelectedKundli = useSelector((state) => state.kundli.selectedKundli);

  // Auto-select: prefer Redux global profile, fallback to first
  useEffect(() => {
    if (!profiles.length) return;
    if (primaryProfile) return;

    if (headerSelectedKundli?._id) {
      const found = profiles.find(p => p._id === headerSelectedKundli._id);
      if (found) {
        setPrimaryProfile(found);
        return;
      }
    }

    setPrimaryProfile(profiles[0]);
  }, [profiles, primaryProfile]);

  // Sync primary profile when changed elsewhere (e.g. Kundli screen)
  useEffect(() => {
    if (!headerSelectedKundli?._id) return;
    if (headerSelectedKundli._id !== primaryProfile?._id && profiles.some(p => p._id === headerSelectedKundli._id)) {
      setPrimaryProfile(headerSelectedKundli);
    }
  }, [headerSelectedKundli, profiles]);

  // Filtered profiles list
  const filteredProfiles = profiles.filter((p) => {
    if (selectingType === "PRIMARY") {
      return p._id !== partnerProfile?._id;
    } else if (selectingType === "PARTNER") {
      return p._id !== primaryProfile?._id;
    }
    return true;
  });

  // Handle profile selection
  const handleSelectProfile = (profile) => {
    /*
      Picking the profile already used on the other side is a no-op, and it used
      to `return` before the modal was closed — so the tap left the sheet open
      and unchanged, with nothing to indicate why. Say what happened and close
      it like any other selection.
    */
    const clashesWithOtherSide =
      (selectingType === "PRIMARY" && profile._id === partnerProfile?._id) ||
      (selectingType === "PARTNER" && profile._id === primaryProfile?._id);

    if (clashesWithOtherSide) {
      Toast.error('That profile is already selected on the other side. Pick a different one.');
      setShowSelectProfile(false);
      setSelectingType(null);
      return;
    }

    if (selectingType === "PRIMARY") {
      setPrimaryProfile(profile);
      // Check if both are same gender
      if (partnerProfile && profile.gender === partnerProfile.gender) {
        Toast.error('Matchmaking requires one male and one female profile');
        trackEvent(profile.gender === 'female' ? "match_making_validation_failed_same_gender_female" : "match_making_validation_failed_same_gender_male", {});
      } else if (partnerProfile) {
        trackEvent("match_making_profiles_selected", { profile_a_id: profile._id, profile_b_id: partnerProfile._id });
      }
    }

    if (selectingType === "PARTNER") {
      setPartnerProfile(profile);
      // Check if both are same gender
      if (primaryProfile && primaryProfile.gender === profile.gender) {
        Toast.error('Matchmaking requires one male and one female profile');
        trackEvent(profile.gender === 'female' ? "match_making_validation_failed_same_gender_female" : "match_making_validation_failed_same_gender_male", {});
      } else if (primaryProfile) {
        trackEvent("match_making_profiles_selected", { profile_a_id: primaryProfile._id, profile_b_id: profile._id });
      }
    }

    setShowSelectProfile(false);
    setSelectingType(null);
  };

  // Handle delete profile
  const handleDeleteProfile = (e, profileId) => {
    e.stopPropagation();
    setProfileToDelete(profileId);
    setShowDeleteModal(true);
  };

  // Handle edit profile
  const handleEditProfile = (profile) => {
    setProfileToEdit(profile);
    setShowSelectProfile(false);
    setShowEditProfile(true);
  };

  // Confirm delete profile
  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return;

    try {
      await deleteKundli(profileToDelete).unwrap();
      Toast.success("Profile deleted successfully");
      await refetch();

      // Clear selections if deleted profile was selected
      if (primaryProfile?._id === profileToDelete) {
        setPrimaryProfile(null);
      }
      if (partnerProfile?._id === profileToDelete) {
        setPartnerProfile(null);
      }

      setShowDeleteModal(false);
      setProfileToDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
      Toast.error(err?.data?.message || "Failed to delete profile");
      setShowDeleteModal(false);
      setProfileToDelete(null);
    }
  };

  // Build kundli payload
  const buildKundliPayload = (data) => {
    const dateObj = new Date(data.birthDate);
    const timeObj = data.birthTime ? data.birthTime.split(":") : ["0", "0"];

    return {
      name: data.name,
      gender: data.identity.toLowerCase(),
      // Matchmaking profiles are created with the relation field hidden
      // (matchmakingMode), so `data.relation` is empty here. Default to
      // "Others" rather than leaving it unset: the edit flow's Self/relation
      // constraints (see EditProfileModal) treat a "Self" relation specially,
      // and profiles created without a relation used to end up being edited as
      // "Self", which then collided with the "a Self profile already exists"
      // rule. "Others" keeps every matchmaking profile out of that special case.
      relation: data.relation || "Others",
      day: dateObj.getDate(),
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      hour: data.unknownBirthTime ? "00" : String(parseInt(timeObj[0])).padStart(2, "0"),
      min: data.unknownBirthTime ? "00" : String(parseInt(timeObj[1])).padStart(2, "0"),
      second: "00",
      place: data.birthPlace,
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      tzone: data.timezone ?? 5.5,
    };
  };

  // Check for duplicate kundli
  const isDuplicateKundli = (payload, list) =>
    list.some(
      (k) =>
        k.name.trim().toLowerCase() === payload.name.trim().toLowerCase() &&
        k.gender.toLowerCase() === payload.gender.toLowerCase() &&
        Number(k.day) === Number(payload.day) &&
        Number(k.month) === Number(payload.month) &&
        Number(k.year) === Number(payload.year) &&
        Number(k.hour) === Number(payload.hour) &&
        Number(k.min) === Number(payload.min) &&
        Math.abs(Number(k.lat) - Number(payload.lat)) < 0.0001 &&
        Math.abs(Number(k.lon) - Number(payload.lon)) < 0.0001 &&
        k.place.trim().toLowerCase() === payload.place.trim().toLowerCase()
    );

  // Handle submit add profile
  const handleSubmitProfile = async (formData) => {
    try {
      const payload = buildKundliPayload(formData);

      if (isDuplicateKundli(payload, profiles)) {
        Toast.error("This profile already exists");
        throw new Error("Duplicate profile");
      }

      const result = await createKundli(payload).unwrap();
      Toast.success("Profile added successfully");
      await refetch();

      // Auto-select the newly created profile
      if (result?.data) {
        const newProfile = result.data;
        if (selectingType === "PRIMARY") {
          setPrimaryProfile(newProfile);
          // dispatch(setSelectedKundli(newProfile));
        } else if (selectingType === "PARTNER") {
          setPartnerProfile(newProfile);
        }
      }

      setShowAddProfile(false);
      setSelectingType(null);
    } catch (err) {
      console.error("Create error:", err);
      Toast.error(err?.data?.message || err?.message || "Failed to add profile");
      throw err;
    }
  };

  // Handle submit edit profile
  const handleSubmitEditProfile = async (formData) => {
    try {
      if (!profileToEdit) return;

      // Delete old profile
      await deleteKundli(profileToEdit._id).unwrap();

      // Create new profile with updated data
      const payload = buildKundliPayload(formData);
      const result = await createKundli(payload).unwrap();

      Toast.success("Profile updated successfully");
      await refetch();

      // Update selections if edited profile was selected
      if (result?.data) {
        if (primaryProfile?._id === profileToEdit._id) {
          setPrimaryProfile(result.data);
          // dispatch(setSelectedKundli(result.data));
        }
        if (partnerProfile?._id === profileToEdit._id) {
          setPartnerProfile(result.data);
        }
      }

      setShowEditProfile(false);
      setProfileToEdit(null);
    } catch (err) {
      console.error("Edit error:", err);
      Toast.error(err?.data?.message || "Failed to update profile");
      throw err;
    }
  };

  // Get edit initial data
  const getEditInitialData = () => {
    if (!profileToEdit) return null;

    return {
      name: profileToEdit.name,
      identity:
        profileToEdit.gender === "male"
          ? "Male"
          : profileToEdit.gender === "female"
            ? "Female"
            : "Others",
      // Always "Others" in matchmaking. Relation is a meaningless concept here
      // (the add form hides the field entirely), so we don't trust whatever is
      // stored on the record — older matchmaking profiles were created/edited
      // as "Self", which is exactly what the edit modal showed and what
      // collided with the "a Self profile already exists" rule. Forcing
      // "Others" keeps every matchmaking profile — old or new — out of the
      // Self special case.
      relation: "Others",
      birthDate: `${profileToEdit.year}-${String(profileToEdit.month).padStart(2, "0")}-${String(profileToEdit.day).padStart(2, "0")}`,
      birthTime: `${String(profileToEdit.hour).padStart(2, "0")}:${String(profileToEdit.min).padStart(2, "0")}`,
      birthPlace: profileToEdit.place,
      unknownBirthTime: false,
      latitude: profileToEdit.lat,
      longitude: profileToEdit.lon,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    /*
      Every blocking condition is checked here and answered with a message.
      They used to live in the submit button's `disabled` expression instead
      (`isLoading || !primary || !partner || sameGender`), which meant the tap
      produced no event at all: no toast, no focus move, nothing. The only hint
      was a same-gender toast fired back at selection time, several seconds and
      one modal-close earlier. Tapping the button after that did literally
      nothing, forever — which is what the rage clicks on this screen look like.
    */
    if (isLoading || isSubmittingRef.current) {
      Toast.info('Still analyzing — this takes a few seconds.');
      return;
    }

    if (!primaryProfile || !partnerProfile) {
      Toast.error(
        !primaryProfile && !partnerProfile
          ? 'Select both profiles to compare.'
          : !primaryProfile
          ? 'Select a primary profile to compare.'
          : "Select your partner's profile to compare."
      );
      trackEvent("match_making_validation_failed_missing_fields", { missing_fields: !primaryProfile ? "primary_profile" : "partner_profile" });
      return;
    }

    // A profile saved without a gender makes the equality check below true
    // (undefined === undefined), so it would otherwise be reported as a
    // same-gender clash and the user would have no idea what to change.
    if (!primaryProfile.gender || !partnerProfile.gender) {
      Toast.error('One of these profiles has no gender saved. Edit the profile to set it, then try again.');
      trackEvent("match_making_validation_failed_missing_fields", { missing_fields: "gender" });
      return;
    }

    if (primaryProfile.gender === partnerProfile.gender) {
      Toast.error('Matchmaking needs one male and one female profile. Change one of the selections to continue.');
      trackEvent(primaryProfile.gender === 'female' ? "match_making_validation_failed_same_gender_female" : "match_making_validation_failed_same_gender_male", {});
      return;
    }

    isSubmittingRef.current = true;

    try {
      setIsLoading(true);

      const apiResult = await runWithEntitlement(() => analyzeSmartMatchmaking(primaryProfile._id, partnerProfile._id));

      // Entitlement block handled by the gate itself (plans popup, recharge
      // redirect or its own toast), so stay quiet here rather than stacking a
      // second message on top of it.
      if (apiResult.blocked) {
        setIsLoading(false);
        return;
      }

      if (apiResult.success) {
        setResult(apiResult.data);
        dispatch(setSmartMatchmakingResult(apiResult.data));
        setRawApiResult(apiResult.data);
        trackEvent("match_making_result_generated", {
          total_gunas: apiResult.data?.totalGunas ?? apiResult.data?.total_gunas,
          compatibility_score: apiResult.data?.compatibilityScore ?? apiResult.data?.compatibility_score,
        });
        trackEvent("match_making_result_viewed", { profile_a_id: primaryProfile._id, profile_b_id: partnerProfile._id });
      } else {
        // Show toast with backend error message only
        Toast.error(apiResult.error?.message || 'Matchmaking analysis failed');
      }
    } catch (err) {
      /*
        This used to call setError, but `error` was never rendered anywhere on
        the screen (ESLint flagged it as an unused variable). So an unexpected
        failure spun the button, stopped, and said nothing at all — the user's
        only option was to tap Analyze again and get the same silence.
      */
      console.error('Failed to analyze compatibility:', err);
      Toast.error('Something went wrong while analyzing compatibility. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (result) {
      setResult(null);
      setRawApiResult(null);
      dispatch(clearSmartMatchmakingResult());
    } else {
      navigate(-1);
    }
  };

  return (
    <>
    <div className={styles.matchMakingMain}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.title}>Smart Matchmaking</h1>
          {result && (
            <button className={styles.downloadButton} onClick={handleDownloadClick} disabled={isDownloading}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 15V19A2 2 0 0119 21H5A2 2 0 013 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {isDownloading ? "Downloading..." : "Download"}
            </button>
          )}
        </div>
      </header>

      <div className={styles.matchMaking}>
        <img className={styles.topImg} src={matchMakingImg} alt="img" />
        
        <div className={styles.matchMakingCard}>
          {!result ? (
            <>
              <div className={styles.topTitles}>
                <h2>AI-Enhanced Compatibility</h2>
                <p>Discover deep insights about your relationship compatibility</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className={styles.matchMakingInputs}>
                  <div className={styles.matchInput}>
                    <label className="block font-medium mb-2">
                      Select Primary Profile
                    </label>
                    {/*
                      Both selectors are divs styled with cursor-pointer, so
                      they read as controls but had no role, no tab stop and no
                      key handler — unreachable by keyboard and invisible to
                      assistive tech. Given as button semantics rather than
                      swapped to <button> so the existing Tailwind layout
                      classes keep working unchanged.
                    */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectingType("PRIMARY");
                        setShowSelectProfile(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectingType("PRIMARY");
                          setShowSelectProfile(true);
                        }
                      }}
                      className="flex items-center justify-between border rounded-xl px-4 py-3 bg-white cursor-pointer"
                    >
                      <span>{primaryProfile?.name || "Select Profile"}</span>
                      <ChevronDown className="w-4 h-4 text-orange-500" />
                    </div>
                  </div>

                  <div className={styles.matchInput}>
                    <label className="block font-medium mb-2">
                      Select Partner's Profile
                    </label>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectingType("PARTNER");
                        setShowSelectProfile(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectingType("PARTNER");
                          setShowSelectProfile(true);
                        }
                      }}
                      className="flex items-center justify-between border rounded-xl px-4 py-3 bg-white cursor-pointer"
                    >
                      <span className={partnerProfile ? "" : "text-gray-400"}>
                        {partnerProfile?.name || "Select Profile"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-orange-500" />
                    </div>
                  </div>
                {/*
                  aria-disabled rather than `disabled`: a disabled button fires
                  no click and no submit, so every blocked tap was swallowed in
                  silence. handleSubmit now owns the validation and names the
                  reason, so the button has to stay reachable to reach it.
                */}
                <button 
                  type="submit"
                  className={styles.matchMakingBtn} 
                  aria-disabled={isLoading || !primaryProfile || !partnerProfile || (primaryProfile?.gender === partnerProfile?.gender)}
                >
                  {isLoading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Analyzing Compatibility...
                    </>
                  ) : (
                    <>
                      Analyze Compatibility
                      <svg xmlns="http://www.w3.org/2000/svg" width="7" height="14" viewBox="0 0 7 14" fill="none">
                        <path d="M0.75 12.63L5.64 7.74C6.2175 7.1625 6.2175 6.2175 5.64 5.64L0.75 0.75" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
                </div>

              </form>

              <img className={styles.bottomImg} src={matchMakingImgBottom} alt="img" />
            </>
          ) : (
            <div className={styles.resultSection}>
              {/* Score and Summary Wrapper */}
              <div className={styles.scoreSummaryWrapper}>
                {/* Overall Score Card */}
                <div className={styles.scoreCard} style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                    <TTSButton text={`Compatibility Score: ${result?.ashtakootScore || 0} out of ${result?.ashtakootMaxScore}. ${result?.compatibilityLevel || 'N/A'}. ${primaryProfile?.name} and ${partnerProfile?.name}`} />
                  </span>
                  <div className={styles.scoreCircle}>
                    <div className={styles.scoreValue}>{result?.ashtakootScore || 0}</div>
                    <div className={styles.scoreMax}>/{result?.ashtakootMaxScore}</div>
                  </div>
                  <div className={styles.scoreInfo}>
                    <h2 className={styles.compatibilityLevel}>{result?.compatibilityLevel || 'N/A'}</h2>
                    <p className={styles.partnerNames}>
                      {primaryProfile?.name} & {partnerProfile?.name}
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className={styles.summaryCard} style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                    <TTSButton text={`Summary. ${result?.summary || 'No summary available'}`} />
                  </span>
                  <h3 className={styles.cardTitle}>Summary</h3>
                  <p className={styles.summaryText}>{result?.summary || 'No summary available'}</p>
                </div>
              </div>

            {/* Category Scores */}
            <div className={styles.categoryCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                <TTSButton text={`Compatibility Breakdown. ${result?.categoryScores ? Object.entries(result.categoryScores).map(([k, v]) => k.replace(/([A-Z])/g, ' $1').trim() + ': ' + v + ' percent').join('. ') : ''}`} />
              </span>
              <div className={styles.compatibilityHeaderRow}>
                <h3 className={styles.cardTitle}>Compatibility Breakdown</h3>
                <div className={styles.overallScoreValue}>Overall Compatibility Score: {result.overallScore}%</div>
              </div>
              <div className={styles.categoryList}>
                {result?.categoryScores && Object.entries(result.categoryScores).map(([key, value]) => (
                  <div key={key} className={styles.categoryItem}>
                    <div className={styles.categoryHeader}>
                      <span className={styles.categoryLabel}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span className={styles.categoryValue}>{value}%</span>
                    </div>
                    <div className={styles.categoryBar}>
                      <div 
                        className={styles.categoryBarFill} 
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Astrology Insights */}
            <div className={styles.insightsCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                <TTSButton text={`Astrological Insights. Guna Milan: ${result?.astrologyInsights?.gunaMilan || 0} out of 36. Manglik Status: ${result?.astrologyInsights?.manglikStatus || 'N/A'}. Dasha Alignment: ${result?.astrologyInsights?.dashaAlignment || 'N/A'}. Dominant Planets: ${result?.astrologyInsights?.dominantPlanets?.join(', ') || 'N/A'}`} />
              </span>
              <h3 className={styles.cardTitle}>Astrological Insights</h3>
              <div className={styles.insightsGrid}>
                <div className={styles.insightItem}>
                  <div className={styles.insightIcon}>🌟</div>
                  <div className={styles.insightContent}>
                    <div className={styles.insightLabel}>Guna Milan</div>
                    <div className={styles.insightValue}>{result?.astrologyInsights?.gunaMilan || 0}/36</div>
                  </div>
                </div>
                <div className={styles.insightItem}>
                  <div className={styles.insightIcon}>🔥</div>
                  <div className={styles.insightContent}>
                    <div className={styles.insightLabel}>Manglik Status</div>
                    <div className={styles.insightValue}>{result?.astrologyInsights?.manglikStatus || 'N/A'}</div>
                  </div>
                </div>
                <div className={styles.insightItem}>
                  <div className={styles.insightIcon}>⏰</div>
                  <div className={styles.insightContent}>
                    <div className={styles.insightLabel}>Dasha Alignment</div>
                    <div className={styles.insightValue}>{result?.astrologyInsights?.dashaAlignment || 'N/A'}</div>
                  </div>
                </div>
                <div className={styles.insightItem}>
                  <div className={styles.insightIcon}>🪐</div>
                  <div className={styles.insightContent}>
                    <div className={styles.insightLabel}>Dominant Planets</div>
                    <div className={styles.insightValue}>
                      {result?.astrologyInsights?.dominantPlanets?.join(', ') || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

             {/* Ashtakoot Details */}
            <div className={styles.insightsCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                <TTSButton text={`Ashtakoot Details. Varna: ${result?.astrologyInsights?.ashtakootDetails?.varna ?? '0'} out of 1. Vasya: ${result?.astrologyInsights?.ashtakootDetails?.vasya ?? '0'} out of 2. Tara: ${result?.astrologyInsights?.ashtakootDetails?.tara ?? '0'} out of 3. Yoni: ${result?.astrologyInsights?.ashtakootDetails?.yoni ?? '0'} out of 4. Graha Maitri: ${result?.astrologyInsights?.ashtakootDetails?.grahamaitri ?? '0'} out of 5. Gana: ${result?.astrologyInsights?.ashtakootDetails?.gana ?? '0'} out of 6. Bhakoot: ${result?.astrologyInsights?.ashtakootDetails?.bhakoot ?? '0'} out of 7. Nadi: ${result?.astrologyInsights?.ashtakootDetails?.nadi ?? '0'} out of 8`} />
              </span>
              <h3 className={styles.cardTitle}>Ashtakoot Details</h3>
              <div className={styles.ashtakootGrid}>
                <div className={styles.ashtakootItem}>
                  <div className={styles.ashtakootLabel}>Varna</div>
                  <div className={styles.ashtakootValue}>{result?.astrologyInsights?.ashtakootDetails?.varna ?? '0'}/1</div>
                </div>
                <div className={styles.ashtakootItem}>
                  <div className={styles.ashtakootLabel}>Vasya</div>
                  <div className={styles.ashtakootValue}>{result?.astrologyInsights?.ashtakootDetails?.vasya ?? '0'}/2</div>
                </div>
                <div className={styles.ashtakootItem}>
                  <div className={styles.ashtakootLabel}>Tara</div>
                  <div className={styles.ashtakootValue}>{result?.astrologyInsights?.ashtakootDetails?.tara ?? '0'}/3</div>
                </div>
                <div className={styles.ashtakootItem}>
                  <div className={styles.ashtakootLabel}>Yoni</div>
                  <div className={styles.ashtakootValue}>{result?.astrologyInsights?.ashtakootDetails?.yoni ?? '0'}/4</div>
                </div>
                <div className={styles.ashtakootItem}>
                  <div className={styles.ashtakootLabel}>Graha Maitri</div>
                  <div className={styles.ashtakootValue}>{result?.astrologyInsights?.ashtakootDetails?.grahamaitri ?? '0'}/5</div>
                </div>
                <div className={styles.ashtakootItem}>
                  <div className={styles.ashtakootLabel}>Gana</div>
                  <div className={styles.ashtakootValue}>{result?.astrologyInsights?.ashtakootDetails?.gana ?? '0'}/6</div>
                </div>
                <div className={styles.ashtakootItem}>
                  <div className={styles.ashtakootLabel}>Bhakoot</div>
                  <div className={styles.ashtakootValue}>{result?.astrologyInsights?.ashtakootDetails?.bhakoot ?? '0'}/7</div>
                </div>
                <div className={styles.ashtakootItem}>
                  <div className={styles.ashtakootLabel}>Nadi</div>
                  <div className={styles.ashtakootValue}>{result?.astrologyInsights?.ashtakootDetails?.nadi ?? '0'}/8</div>
                </div>
              </div>
            </div>

            {/* Personality Match */}
            <div className={styles.personalityCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                <TTSButton text={`Personality Match. ${primaryProfile?.name}: ${result?.personalityMatch?.[primaryProfile?.name]?.traits?.join(', ') || 'No traits'}. ${partnerProfile?.name}: ${result?.personalityMatch?.[partnerProfile?.name]?.traits?.join(', ') || 'No traits'}. Relationship Dynamic: ${result?.personalityMatch?.dynamic || 'N/A'}`} />
              </span>
              <h3 className={styles.cardTitle}>Personality Match</h3>
              
              <div className={styles.personalityGrid}>
                <div className={styles.personalityBox}>
                  <div className={styles.personalityHeader}>
                    <div className={styles.personalityAvatar}>
                      {primaryProfile?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.personalityName}>{primaryProfile?.name}</div>
                  </div>
                  <div className={styles.traitsList}>
                    {result?.personalityMatch?.[primaryProfile?.name]?.traits?.map((trait, idx) => (
                      <span key={idx} className={styles.traitTag}>{trait}</span>
                    )) || <span className={styles.traitTag}>No traits available</span>}
                  </div>
                </div>

                <div className={styles.personalityBox}>
                  <div className={styles.personalityHeader}>
                    <div className={styles.personalityAvatar}>
                      {partnerProfile?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.personalityName}>{partnerProfile?.name}</div>
                  </div>
                  <div className={styles.traitsList}>
                    {result?.personalityMatch?.[partnerProfile?.name]?.traits?.map((trait, idx) => (
                      <span key={idx} className={styles.traitTag}>{trait}</span>
                    )) || <span className={styles.traitTag}>No traits available</span>}
                  </div>
                </div>
              </div>

              <div className={styles.dynamicBox}>
                <div className={styles.dynamicLabel}>Relationship Dynamic</div>
                <p className={styles.dynamicText}>{result?.personalityMatch?.dynamic || 'No dynamic information available'}</p>
              </div>
            </div>

            {/* Conflict Prediction */}
            <div className={styles.conflictCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                <TTSButton text={`Potential Challenges. ${result?.conflictPrediction?.map(c => c.area + ': ' + c.riskLevel + ' Risk. ' + c.reason)?.join('. ') || 'No conflict predictions available'}`} />
              </span>
              <h3 className={styles.cardTitle}>Potential Challenges</h3>
              <div className={styles.conflictList}>
                {result?.conflictPrediction?.map((conflict, idx) => (
                  <div key={idx} className={styles.conflictItem}>
                    <div className={styles.conflictHeader}>
                      <span className={styles.conflictArea}>{conflict.area}</span>
                      <span className={`${styles.riskBadge} ${styles[`risk${conflict.riskLevel}`]}`}>
                        {conflict.riskLevel} Risk
                      </span>
                    </div>
                    <p className={styles.conflictReason}>{conflict.reason}</p>
                  </div>
                )) || <p className={styles.noData}>No conflict predictions available</p>}
              </div>
            </div>

            {/* Future Timeline */}
            <div className={styles.timelineCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                <TTSButton text={`Future Timeline. ${result?.futureTimeline?.map(p => p.period + ': ' + p.theme + '. ' + p.riskLevel + ' Risk')?.join('. ') || 'No timeline data available'}`} />
              </span>
              <h3 className={styles.cardTitle}>Future Timeline</h3>
              <div className={styles.timelineList}>
                {result?.futureTimeline?.map((phase, idx) => (
                  <div key={idx} className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelinePeriod}>{phase.period}</span>
                        <span className={`${styles.riskBadge} ${styles[`risk${phase.riskLevel}`]}`}>
                          {phase.riskLevel} Risk
                        </span>
                      </div>
                      <p className={styles.timelineTheme}>{phase.theme}</p>
                    </div>
                  </div>
                )) || <p className={styles.noData}>No timeline data available</p>}
              </div>
            </div>

            {/* Marriage Recommendation */}
            <div className={styles.marriageCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                <TTSButton text={`Marriage Recommendation. Suitable for Marriage: ${result?.marriageRecommendation?.suitable ? 'Yes' : 'No'}${result?.marriageRecommendation?.bestMarriageWindow ? '. Best Marriage Window: ' + result.marriageRecommendation.bestMarriageWindow : ''}${result?.marriageRecommendation?.riskIfDelayed ? '. Risk if Delayed: ' + result.marriageRecommendation.riskIfDelayed : ''}`} />
              </span>
              <h3 className={styles.cardTitle}>Marriage Recommendation</h3>
              <div className={styles.marriageContent}>
                <div className={styles.marriageStatus}>
                  <div className={styles.marriageIcon}>
                    {result?.marriageRecommendation?.suitable ? '✅' : '⚠️'}
                  </div>
                  <div className={styles.marriageText}>
                    <div className={styles.marriageLabel}>Suitable for Marriage</div>
                    <div className={styles.marriageValue}>
                      {result?.marriageRecommendation?.suitable ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
                
                {result?.marriageRecommendation?.bestMarriageWindow && 
                 result.marriageRecommendation.bestMarriageWindow !== 'Not applicable due to age difference' && (
                  <div className={styles.marriageInfo}>
                    <div className={styles.marriageInfoLabel}>Best Marriage Window</div>
                    <div className={styles.marriageInfoValue}>
                      {result.marriageRecommendation.bestMarriageWindow}
                    </div>
                  </div>
                )}
                
                {result?.marriageRecommendation?.riskIfDelayed && 
                 result.marriageRecommendation.riskIfDelayed !== 'Not applicable due to age difference' && (
                  <div className={styles.marriageInfo}>
                    <div className={styles.marriageInfoLabel}>Risk if Delayed</div>
                    <div className={styles.marriageInfoValue}>
                      {result.marriageRecommendation.riskIfDelayed}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Remedies */}
            <div className={styles.remediesCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                <TTSButton text={`Recommended Remedies. ${result?.remedies?.map(r => r.remedy + '. Purpose: ' + r.purpose)?.join('. ') || 'No remedies available'}`} />
              </span>
              <h3 className={styles.cardTitle}>Recommended Remedies</h3>
              <div className={styles.remediesList}>
                {result?.remedies?.map((remedy, idx) => {
                  // Determine who the remedy is for
                  let remedyFor = 'Both';
                  if (remedy.who === 'userA') {
                    remedyFor = primaryProfile?.name;
                  } else if (remedy.who === 'userB') {
                    remedyFor = partnerProfile?.name;
                  } else if (remedy.who && remedy.who.toLowerCase() === 'both') {
                    remedyFor = 'Both';
                  } else if (remedy.who) {
                    // Use the actual value from API if it's something else
                    remedyFor = remedy.who;
                  }

                  return (
                    <div key={idx} className={styles.remedyItem}>
                      <div className={styles.remedyHeader}>
                        <span className={styles.remedyWho}>
                          {remedyFor}
                        </span>
                      </div>
                      <p className={styles.remedyText}>{remedy.remedy}</p>
                      <p className={styles.remedyPurpose}>
                        <strong>Purpose:</strong> {remedy.purpose}
                      </p>
                    </div>
                  );
                }) || <p className={styles.noData}>No remedies available</p>}
              </div>
            </div>

            <button className={styles.newAnalysisButton} onClick={() => navigate(PATH.privateRoutes.ASTROLOGERS_LIST.path)}>
              Consult With Expert Astrologer
            </button>
          </div>
          )}
        </div>
      </div>

      {/* SELECT PROFILE POPUP */}
      <ProfileListingModal
        isOpen={showSelectProfile}
        onClose={() => {
          setShowSelectProfile(false);
          setSelectingType(null);
        }}
        profiles={filteredProfiles}
        selectedProfileId={
          selectingType === "PRIMARY"
            ? primaryProfile?._id
            : partnerProfile?._id
        }
        onSelectProfile={handleSelectProfile}
        onDeleteProfile={(profileId) =>
          handleDeleteProfile({ stopPropagation: () => {} }, profileId)
        }
        onEditProfile={handleEditProfile}
        onAddProfile={() => {
          setShowAddProfile(true);
          setShowSelectProfile(false);
        }}
        title={
          selectingType === "PRIMARY"
            ? "Select Primary Profile"
            : "Select Partner's Profile"
        }
        showAddButton={true}
        showDeleteButton={true}
        showEditButton={true}
        emptyMessage="No profiles found. Add a profile to get started."
      />

      {/* Add Profile Modal */}
      <AddProfileModal
        isOpen={showAddProfile}
        onClose={() => {
          setShowAddProfile(false);
          setSelectingType(null);
        }}
        onSubmit={handleSubmitProfile}
        isLoading={isCreating}
        title="Add Profile"
        showProfileListing={true}
        profiles={profiles}
        selectedProfileId={
          selectingType === "PRIMARY"
            ? primaryProfile?._id
            : partnerProfile?._id
        }
        onSelectProfile={(profile) => {
          if (selectingType === "PRIMARY") {
            setPrimaryProfile(profile);
          } else if (selectingType === "PARTNER") {
            setPartnerProfile(profile);
          }
        }}
        onDeleteProfile={(profileId) => {
          setProfileToDelete(profileId);
          setShowDeleteModal(true);
        }}
        matchmakingMode={true}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => {
          setShowEditProfile(false);
          setProfileToEdit(null);
        }}
        onSubmit={handleSubmitEditProfile}
        isLoading={isCreating}
        title="Edit Profile"
        initialData={getEditInitialData()}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Profile"
          message="Are you sure you want to delete this profile? This action cannot be undone."
          onCancel={() => {
            setShowDeleteModal(false);
            setProfileToDelete(null);
          }}
          onConfirm={confirmDeleteProfile}
        />
      )}
      {subscriptionModal}
    </div>

    <DownloadReportModal
      isOpen={showDownloadModal}
      onClose={() => setShowDownloadModal(false)}
      onDownload={handleConfirmDownload}
      featureName="Smart Matchmaking Report"
      downloadCost={downloadPrice}
      walletBalance={walletBalance ?? 0}
      isDownloading={isDownloading}
      showLanguageSelection={false}
    />
    </>
  );
};

export default SmartMatchmaking;
