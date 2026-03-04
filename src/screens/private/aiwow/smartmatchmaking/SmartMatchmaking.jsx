import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const SmartMatchmaking = () => {
  const navigate = useNavigate();
  const [showSelectProfile, setShowSelectProfile] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [profileToEdit, setProfileToEdit] = useState(null);
  const [selectingType, setSelectingType] = useState(null); // PRIMARY | PARTNER
  const [primaryProfile, setPrimaryProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Get token using reusable function
  const token = getToken();

  // Fetch profiles
  const { data, refetch } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  const [createKundli, { isLoading: isCreating }] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();

  const profiles = data?.data || [];

  // Auto-select first profile as primary
  useEffect(() => {
    if (profiles.length && !primaryProfile) {
      setPrimaryProfile(profiles[0]);
    }
  }, [profiles, primaryProfile]);

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
    if (selectingType === "PRIMARY") {
      if (profile._id === partnerProfile?._id) return;
      setPrimaryProfile(profile);
    }

    if (selectingType === "PARTNER") {
      if (profile._id === primaryProfile?._id) return;
      setPartnerProfile(profile);
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
      day: dateObj.getDate(),
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      hour: data.unknownBirthTime ? "00" : String(parseInt(timeObj[0])).padStart(2, "0"),
      min: data.unknownBirthTime ? "00" : String(parseInt(timeObj[1])).padStart(2, "0"),
      second: "00",
      place: data.birthPlace,
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      tzone: 5.5,
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
      relation: "Self",
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

    if (!primaryProfile || !partnerProfile) {
      Toast.error('Please select both profiles');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Prepare User A data from primary profile
      const userA = {
        name: primaryProfile.name || 'User A',
        gender: primaryProfile.gender?.toLowerCase() || 'male',
        day: parseInt(primaryProfile.day),
        month: parseInt(primaryProfile.month),
        year: parseInt(primaryProfile.year),
        hour: parseInt(primaryProfile.hour || 0),
        min: parseInt(primaryProfile.min || 0),
        second: 0,
        place: primaryProfile.place || '',
        lat: String(primaryProfile.lat || '0'),
        lon: String(primaryProfile.lon || '0'),
        tzone: parseFloat(primaryProfile.tzone || 5.5)
      };

      // Prepare User B data from partner profile
      const userB = {
        name: partnerProfile.name || 'User B',
        gender: partnerProfile.gender?.toLowerCase() || 'female',
        day: parseInt(partnerProfile.day),
        month: parseInt(partnerProfile.month),
        year: parseInt(partnerProfile.year),
        hour: parseInt(partnerProfile.hour || 0),
        min: parseInt(partnerProfile.min || 0),
        second: 0,
        place: partnerProfile.place || '',
        lat: String(partnerProfile.lat || '0'),
        lon: String(partnerProfile.lon || '0'),
        tzone: parseFloat(partnerProfile.tzone || 5.5)
      };

      const apiResult = await analyzeSmartMatchmaking(userA, userB);

      if (apiResult.success) {
        setResult(apiResult.data);
      } else {
        setError(apiResult.error);
      }
    } catch (error) {
      console.error('Failed to analyze compatibility:', error);
      setError({ message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (result || error) {
      setResult(null);
      setError(null);
    } else {
      navigate(-1);
    }
  };

  const handleRetry = () => {
    setError(null);
    setResult(null);
  };

  return (
    <div className={styles.matchMakingMain}>
      <div className={styles.matchMaking}>
        <img className={styles.topImg} src={matchMakingImg} alt="img" />
        
        <div className={styles.matchMakingCard}>
          {!result && !error ? (
            <>
              <div className={styles.topTitles}>
                <h2>Smart Matchmaking</h2>
                <p>AI-enhanced compatibility analysis for relationships</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className={styles.matchMakingInputs}>
                  <div className={styles.matchInput}>
                    <label className="block font-medium mb-2">
                      Select Primary Profile
                    </label>
                    <div
                      onClick={() => {
                        setSelectingType("PRIMARY");
                        setShowSelectProfile(true);
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
                      onClick={() => {
                        setSelectingType("PARTNER");
                        setShowSelectProfile(true);
                      }}
                      className="flex items-center justify-between border rounded-xl px-4 py-3 bg-white cursor-pointer"
                    >
                      <span className={partnerProfile ? "" : "text-gray-400"}>
                        {partnerProfile?.name || "Select Profile"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-orange-500" />
                    </div>
                  </div>
                <button 
                  type="submit"
                  className={styles.matchMakingBtn} 
                  disabled={isLoading || !primaryProfile || !partnerProfile}
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
          ) : error ? (
            <div className={styles.errorSection}>
              <div className={styles.errorIcon}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="30" stroke="#ef4444" strokeWidth="2" fill="none"/>
                  <path d="M32 20V36" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="32" cy="44" r="2" fill="#ef4444"/>
                </svg>
              </div>

              <div className={styles.errorDetails}>
                <h3 className={styles.errorMessage}>{error.message}</h3>
                
                {error.details && (
                  <div className={styles.errorDetailsBox}>
                    {error.details.detectedIssue && (
                      <div className={styles.errorDetailItem}>
                        <strong>Issue Detected:</strong>
                        <p>{error.details.detectedIssue}</p>
                      </div>
                    )}
                    
                    {error.details.expected && (
                      <div className={styles.errorDetailItem}>
                        <strong>Expected:</strong>
                        <p>{error.details.expected}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button 
                className={styles.retryButton}
                onClick={handleRetry}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className={styles.resultSection}>
              {/* Overall Score Card */}
            <div className={styles.scoreCard}>
              <div className={styles.scoreCircle}>
                <div className={styles.scoreValue}>{result?.overallScore || 0}</div>
                <div className={styles.scoreMax}>/ 100</div>
              </div>
              <div className={styles.scoreInfo}>
                <h2 className={styles.compatibilityLevel}>{result?.compatibilityLevel || 'N/A'}</h2>
                <p className={styles.partnerNames}>
                  {primaryProfile?.name} & {partnerProfile?.name}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className={styles.summaryCard}>
              <h3 className={styles.cardTitle}>Summary</h3>
              <p className={styles.summaryText}>{result?.summary || 'No summary available'}</p>
            </div>

            {/* Category Scores */}
            <div className={styles.categoryCard}>
              <h3 className={styles.cardTitle}>Compatibility Breakdown</h3>
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
            <div className={styles.insightsCard}>
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

            {/* Personality Match */}
            <div className={styles.personalityCard}>
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
                    {result?.personalityMatch?.userA?.traits?.map((trait, idx) => (
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
                    {result?.personalityMatch?.userB?.traits?.map((trait, idx) => (
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
            <div className={styles.conflictCard}>
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
            <div className={styles.timelineCard}>
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
            <div className={styles.marriageCard}>
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
            <div className={styles.remediesCard}>
              <h3 className={styles.cardTitle}>Recommended Remedies</h3>
              <div className={styles.remediesList}>
                {result?.remedies?.map((remedy, idx) => (
                  <div key={idx} className={styles.remedyItem}>
                    <div className={styles.remedyHeader}>
                      <span className={styles.remedyWho}>
                        {remedy.who === 'userA' 
                          ? primaryProfile?.name 
                          : remedy.who === 'userB' 
                          ? partnerProfile?.name 
                          : 'Both'}
                      </span>
                    </div>
                    <p className={styles.remedyText}>{remedy.remedy}</p>
                    <p className={styles.remedyPurpose}>
                      <strong>Purpose:</strong> {remedy.purpose}
                    </p>
                  </div>
                )) || <p className={styles.noData}>No remedies available</p>}
              </div>
            </div>

            <button className={styles.newAnalysisButton} onClick={handleRetry}>
              New Analysis
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
    </div>
  );
};

export default SmartMatchmaking;
