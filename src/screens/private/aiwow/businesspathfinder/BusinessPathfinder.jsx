import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './BusinessPathfinder.module.scss';
import { Toast } from '../../../../component';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import PrimaryLoader from '../../../../component/UI/PrimaryLoader';
import { useGetBusinessPathfinderOptionsQuery } from '../../../../redux/api/aiwow/aiwowApi';
import { ProfileManager } from '../../../../component/UI/Profile';
import { setSelectedKundliProfile } from '../../../../redux/aiwow/aiwowSlice';
import { setSelectedKundli } from '../../../../redux/kundli/kundliSlice';

const BusinessPathfinder = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile();
  const { data: optionsData, isLoading: optionsLoading } = useGetBusinessPathfinderOptionsQuery();
  const [showProfileSelector, setShowProfileSelector] = useState(false);

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
  });
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategorySelect = (cat) => {
    if (cat === 'Add Custom') {
      setShowCustomInput(true);
      setFormData(prev => ({ ...prev, category: '' }));
    } else {
      setShowCustomInput(false);
      setFormData(prev => ({ ...prev, category: cat, customCategory: '' }));
    }
  };

  const handleSubmit = async () => {
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
    if (!profile) {
      Toast.error('Please select a profile first');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        kundliId: profile._id,
        businessCategory: category,
        businessInfo: formData.businessInfo || '',
        scale: formData.scale,
        partnership: formData.partnership,
        timeline: formData.timeline,
        name: profile.name,
        gender: profile.gender || 'male',
        day: profile.day,
        month: profile.month,
        year: profile.year,
        hour: profile.hour || 0,
        min: profile.min || profile.minute || 0,
        second: 0,
        place: profile.place,
        lat: String(profile.lat),
        lon: String(profile.lon),
        tzone: profile.tzone || 5.5,
      };

      const token = localStorage.getItem('shubhtalk_customer_token');
      const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
      
      const response = await fetch(`${BASE_URL}/api/wow-suite/business-pathfinder/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        Toast.success('Report generated successfully!');
        // Navigate to result page with data
        navigate('/business-pathfinder/report', { state: { result: result.data } });
      } else {
        Toast.error(result.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Business Pathfinder error:', error);
      Toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading || optionsLoading) return <PrimaryLoader isLoading={true} />;

  return (
    <>
      {/* Header - outside container */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
        <button className={styles.backBtn} onClick={() => navigate('/ai-wow')}>
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
                className={`${styles.chip} ${showCustomInput ? styles.chipActive : ''}`}
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
                  placeholder="E.g. John Doe"
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
                    onClick={() => setFormData(prev => ({ ...prev, scale: value }))}
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
                    onClick={() => setFormData(prev => ({ ...prev, partnership: value }))}
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
                    onClick={() => setFormData(prev => ({ ...prev, timeline: value }))}
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
              placeholder="Enter Your Business Information"
              value={formData.businessInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, businessInfo: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.submitWrap}>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Generating...' : 'Generate my report'}
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
    </>
  );
};

export default BusinessPathfinder;
