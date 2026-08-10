import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './BusinessPathfinder.module.scss';
import { Toast } from '../../../../component';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import PrimaryLoader from '../../../../component/UI/PrimaryLoader';
import { useGetBusinessPathfinderOptionsQuery } from '../../../../redux/api/aiwow/aiwowApi';
import { ProfileManager, GuestKundliAuthModal } from '../../../../component/UI/Profile';
import { setSelectedKundliProfile } from '../../../../redux/aiwow/aiwowSlice';
import { setSelectedKundli } from '../../../../redux/kundli/kundliSlice';
import LocationSearch from '../../../../utils/location/locationSearchVedic';
import useUserLocation from '../../../../utils/hooks/useUserLocation';
import { trackEvent } from '../../../../utils/analytics';
import useAIWowSubscriptionGate from '../hooks/useAIWowSubscriptionGate';

const BusinessPathfinder = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profile: rawProfile, isLoading: profileLoading } = useSelectedKundliProfile({ required: false });
  const token = localStorage.getItem('shubhtalk_customer_token');
  const profile = token ? rawProfile : null;
  const { data: optionsData, isLoading: optionsLoading } = useGetBusinessPathfinderOptionsQuery();
  const { runWithEntitlement, subscriptionModal, showSubscriptionModal } = useAIWowSubscriptionGate({ featureName: 'business-pathfinder' });
  const userLocation = useUserLocation();
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const pendingGuestActionRef = useRef(null);

  // Track feature open (once on mount)
  useEffect(() => {
    trackEvent("business_pathfinder_opened", {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill location when geolocation is enabled (not default Delhi)
  useEffect(() => {
    if (userLocation.loaded && !userLocation.isDefault && userLocation.locationName && userLocation.locationName !== "Your Location") {
      setFormData(prev => ({
        ...prev,
        businessLocation: userLocation.locationName,
        businessLat: String(userLocation.lat),
        businessLon: String(userLocation.lon),
      }));
    }
  }, [userLocation.loaded, userLocation.isDefault, userLocation.locationName]);
  const handleProfileSelect = (selected) => {
    if (selected) {
      dispatch(setSelectedKundliProfile(selected));
      dispatch(setSelectedKundli(selected));
      localStorage.setItem('selectedKundliProfile', JSON.stringify(selected));
    }
    setShowProfileSelector(false);
  };

  const options = optionsData?.data?.options || {};
  const BUSINESS_CATEGORIES = options.businessCategory || [];
  const BUSINESS_SCALES = options.scale || [];
  const PARTNERSHIPS = options.partnership || [];
  const TIMELINES = options.timeline || [];

  const [formData, setFormData] = useState({
    category: '',
    customCategory: '',
    scale: '',
    partnership: '',
    timeline: '',
    businessInfo: '',
    businessLocation: '',
    businessLat: '',
    businessLon: '',
    businessTzone: '',
  });
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Synchronous re-entry guard — `isSubmitting` state updates asynchronously,
  // so a rapid double tap (or the guest re-invoke path) can fire the analyze
  // API twice before the button disables. This ref blocks that immediately.
  const isSubmittingRef = useRef(false);

  const handleCategorySelect = (cat) => {
    if (cat === 'Add Custom') {
      setShowCustomInput(true);
      setFormData(prev => ({ ...prev, category: '' }));
    } else {
      setShowCustomInput(false);
      setFormData(prev => ({ ...prev, category: cat, customCategory: '' }));
      trackEvent("business_pathfinder_industry_selected", { industry: cat });
    }
  };

  const handleSubmit = async (overrideProfile = null) => {
    const token = localStorage.getItem('shubhtalk_customer_token');
    if (!token) {
      // Guest: remember the submit so it runs automatically once the user is
      // logged in. Pass the freshly created profile through so we don't rely on
      // the stale `profile` captured in this closure.
      pendingGuestActionRef.current = (newProfile) => handleSubmit(newProfile);
      setShowGuestAuthModal(true);
      return;
    }

    // Use the profile handed in by the guest-auth flow if provided, otherwise
    // fall back to the currently selected profile. Guard against a non-profile
    // argument (e.g. a click event when wired as onClick={handleSubmit}), which
    // would otherwise strip kundliId/name/day/month/year from the payload.
    const isProfile = overrideProfile && typeof overrideProfile === 'object' && overrideProfile._id;
    const activeProfile = isProfile ? overrideProfile : profile;

    const category = showCustomInput ? formData.customCategory : formData.category;
    
    if (!category) {
      Toast.error('Please select or enter a business category');
      return;
    }
    if (!formData.scale) {
      Toast.error('Please select a business scale');
      return;
    }
    if (!formData.partnership) {
      Toast.error('Please select partnership type');
      return;
    }
    if (!formData.timeline) {
      Toast.error('Please select a timeline');
      return;
    }
    if (!formData.businessLocation) {
      Toast.error('Please select a business location');
      return;
    }
    if (!activeProfile) {
      Toast.error('Please select a profile first');
      return;
    }

    // Block a second concurrent submit (double tap / re-invoke).
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsSubmitting(true);
    try {
      const payload = {
        kundliId: activeProfile._id,
        businessCategory: category,
        businessInfo: formData.businessInfo || '',
        scale: formData.scale,
        partnership: formData.partnership,
        timeline: formData.timeline,
        name: activeProfile.name,
        gender: activeProfile.gender || 'male',
        day: activeProfile.day,
        month: activeProfile.month,
        year: activeProfile.year,
        hour: activeProfile.hour || 0,
        min: activeProfile.min || activeProfile.minute || 0,
        second: 0,
        place: formData.businessLocation || activeProfile.place,
        lat: formData.businessLat || String(activeProfile.lat),
        lon: formData.businessLon || String(activeProfile.lon),
        tzone: formData.businessTzone !== '' ? formData.businessTzone : (activeProfile.tzone || 5.5),
      };

      const token = localStorage.getItem('shubhtalk_customer_token');
      const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
      
      // Route generation through the subscription gate — shows the plans popup
      // on PREMIUM_REQUIRED (and the extended popup on EXTENDED), then retries
      // after purchase.
      const result = await runWithEntitlement(async () => {
        const response = await fetch(`${BASE_URL}/api/wow-suite/business-pathfinder/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        return await response.json();
      });

      // Entitlement block handled by the gate (popup shown / user cancelled).
      if (result?.blocked) return;

      if (result.success) {
        Toast.success('Report generated successfully!');
        trackEvent("business_pathfinder_report_generated", {
          compatibility_score: result?.data?.compatibilityScore ?? result?.data?.compatibility_score,
        });
        // Navigate to result page with data
        navigate('/ai-wow/business-pathfinder/report', { state: { result: result.data } });
      } else {
        Toast.error(result.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Business Pathfinder error:', error);
      Toast.error('Something went wrong. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (profileLoading || optionsLoading) return <PrimaryLoader isLoading={true} />;

  return (
    <>
      {/* Fullscreen loader while the report is being generated (covers the
          automatic submit after guest login, where the button-level loader
          isn't visible to the user). */}
      <PrimaryLoader isLoading={isSubmitting && !showSubscriptionModal} message="Generating your report..." />

      {/* Header - outside container */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Profile Selector - centered in header */}
        <div className={styles.headerProfile} onClick={() => setShowProfileSelector(true)}>
          <span className={styles.profileLabel}>Select Profile</span>
          <span className={styles.profileName}>{profile?.name || 'Select Profile'} <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
        </div>
        </div>
      </div>

      <div className={styles.container}>
      {/* Title */}
      <div className={styles.mainTitle}>
        <span className={styles.titleBar}></span>
        <h1>BUSINESS PATHFINDER</h1>
      </div>

      {/* Banner */}
      <div className={styles.banner}>
        <h2>Lets understand your business journey</h2>
        <p>Just a few taps, and we will generate your personalized astrological business report.</p>
      </div>

      {/* Form */}
      <div className={styles.formSection}>

        {/* 1. Business Category */}
        <div className={styles.stepSection}>
          <div className={styles.stepNumber}>1</div>
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Business Category</h3>
            <p className={styles.stepSubtitle}>What type of business are you planning</p>
            <div className={styles.chipGrid}>
              {BUSINESS_CATEGORIES.map((cat) => {
                const catLabel = cat.label || cat.value || cat;
                const catValue = cat.value || cat.label || cat;
                return (
                  <button
                    key={catValue}
                    className={`${styles.chip} ${formData.category === catValue && !showCustomInput ? styles.chipActive : ''}`}
                    onClick={() => handleCategorySelect(catValue)}
                  >
                    {catLabel}
                  </button>
                );
              })}
              <button
                className={`${styles.chip} ${styles.chipCustom} ${showCustomInput ? styles.chipActive : ''}`}
                onClick={() => handleCategorySelect('Add Custom')}
              >
                Add Custom 
              </button>
            </div>

            {showCustomInput && (
              <div className={styles.customInputWrap}>
                <label>Add custom business name</label>
                <input
                  type="text"
                  placeholder=""
                  value={formData.customCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))}
                />
              </div>
            )}
          </div>
        </div>

        {/* 2. Business Scale */}
        <div className={styles.stepSection}>
          <div className={styles.stepNumber}>2</div>
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Business Scale</h3>
            <p className={styles.stepSubtitle}>What is the current or planned scale of your business?</p>
            <div className={styles.chipGrid}>
              {BUSINESS_SCALES.map((item) => {
                const label = item.label || item.value || item;
                const value = item.value || item.label || item;
                return (
                  <button
                    key={value}
                    className={`${styles.chip} ${formData.scale === value ? styles.chipActive : ''}`}
                    onClick={() => { setFormData(prev => ({ ...prev, scale: value })); trackEvent("business_pathfinder_scale_selected", { scale: value }); }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Partnership */}
        <div className={styles.stepSection}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Partnership</h3>
            <p className={styles.stepSubtitle}>Will you be doing this alone or with partner?</p>
            <div className={styles.chipGrid}>
              {PARTNERSHIPS.map((item) => {
                const label = item.label || item.value || item;
                const value = item.value || item.label || item;
                return (
                  <button
                    key={value}
                    className={`${styles.chip} ${formData.partnership === value ? styles.chipActive : ''}`}
                    onClick={() => { setFormData(prev => ({ ...prev, partnership: value })); trackEvent("business_pathfinder_partnership_selected", { partnership_type: value }); }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Timeline */}
        <div className={styles.stepSection}>
          <div className={styles.stepNumber}>4</div>
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Timeline</h3>
            <p className={styles.stepSubtitle}>When are you planning to start or launch?</p>
            <div className={styles.chipGrid}>
              {TIMELINES.map((item) => {
                const label = item.label || item.value || item;
                const value = item.value || item.label || item;
                return (
                  <button
                    key={value}
                    className={`${styles.chip} ${formData.timeline === value ? styles.chipActive : ''}`}
                    onClick={() => { setFormData(prev => ({ ...prev, timeline: value })); trackEvent("business_pathfinder_timeline_selected", { timeline: value }); }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. Business Information */}
        <div className={styles.stepSection}>
          <div className={styles.stepNumber}>5</div>
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Business Information</h3>
            <p className={styles.stepSubtitle}>Tell us more about your business (Optional)</p>
            <textarea
              className={styles.textarea}
              placeholder="E.g. I want to start a bakery in Mumbai"
              value={formData.businessInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, businessInfo: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        {/* 6. Business Location */}
        <div className={styles.stepSection}>
          <div className={styles.stepNumber}>6</div>
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Business Location</h3>
            <p className={styles.stepSubtitle}>Where are you planning to set up your business?</p>
            <LocationSearch
              value={formData.businessLocation}
              placeholder="Enter your location"
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  businessLocation: e.target.value,
                  businessLat: '',
                  businessLon: '',
                  businessTzone: '',
                }));
              }}
              onPlaceSelect={(place) => {
                setFormData(prev => ({
                  ...prev,
                  businessLocation: place.address,
                  businessLat: String(place.lat),
                  businessLon: String(place.lng),
                  businessTzone: place.timezone,
                }));
              }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.submitWrap}>
          <button
            className={styles.submitBtn}
            onClick={() => handleSubmit()}
            disabled={isSubmitting && !showSubscriptionModal}
          >
            {isSubmitting && !showSubscriptionModal ? 'Generating...' : 'Generate my report'}
          </button>
        </div>
      </div>
    </div>

    {/* Profile Manager Modal */}
    <ProfileManager
      isOpen={showProfileSelector}
      onClose={() => setShowProfileSelector(false)}
      onProfileSelect={handleProfileSelect}
      selectedProfileId={profile?._id}
      title="Select Profile"
      enabledOperations={{ list: true, add: true, edit: true, delete: true }}
    />
    {subscriptionModal}

    <GuestKundliAuthModal
      isOpen={showGuestAuthModal}
      onClose={() => { setShowGuestAuthModal(false); pendingGuestActionRef.current = null; }}
      onSuccess={(newProfile) => {
        setShowGuestAuthModal(false);
        if (newProfile?._id) {
          dispatch(setSelectedKundliProfile(newProfile));
          dispatch(setSelectedKundli(newProfile));
          localStorage.setItem('selectedKundliProfile', JSON.stringify(newProfile));
        }
        // Do NOT auto-run the report after registration. The user taps
        // "Generate my report" again — that click runs the subscription check
        // (plans popup → buy → analyze). This stops the report from
        // auto-generating the moment the welcome-bonus popup closes.
        pendingGuestActionRef.current = null;
      }}
    />
    </>
  );
};

export default BusinessPathfinder;
