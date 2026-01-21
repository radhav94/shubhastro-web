import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './KundliProfileModal.module.scss';
import { useGetAllKundlisQuery } from '../../../../services/appServices/kundliServicesNew';
import { Toast } from '../../../../component';

const KundliProfileModal = ({ isOpen, onClose, onSelectProfile, targetRoute }) => {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Get token
  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  // Fetch profiles
  const { data, isLoading } = useGetAllKundlisQuery(undefined, {
    skip: !token || !isOpen,
  });

  const profiles = data?.data || [];

  // Auto-select first profile
  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      setSelectedProfile(profiles[0]);
    }
  }, [profiles, selectedProfile]);

  const formatProfileDisplay = (profile) => {
    const initials = profile.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const birthDate = `${String(profile.day).padStart(2, '0')}/${String(profile.month).padStart(2, '0')}/${profile.year}`;
    const birthTime = profile.hour && profile.minute
      ? `${String(profile.hour).padStart(2, '0')}:${String(profile.minute).padStart(2, '0')}`
      : 'Unknown';

    return {
      initials,
      birthDate,
      birthTime,
      relation: profile.relation || 'Self',
    };
  };

  const handleSelectAndProceed = () => {
    if (!selectedProfile) {
      Toast.error('Please select a profile');
      return;
    }

    // Store selected profile
    localStorage.setItem('selectedKundliProfile', JSON.stringify(selectedProfile));
    
    // Call callback if provided
    if (onSelectProfile) {
      onSelectProfile(selectedProfile);
    }

    // Navigate to target route
    if (targetRoute) {
      navigate(targetRoute);
    }

    onClose();
  };

  const handleAddProfile = () => {
    // Navigate to kundli page to add profile
    navigate('/kundli');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHandle}></div>
        
        <div className={styles.sheetContent}>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
          <h2 className={styles.sheetTitle}>Select Profile</h2>
          
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <p>Loading profiles...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No profiles found. Please add a profile first.</p>
            </div>
          ) : (
            <div className={styles.profileList}>
              {profiles.map((profile) => {
                const formatted = formatProfileDisplay(profile);
                return (
                  <div
                    key={profile._id}
                    className={`${styles.profileItem} ${selectedProfile?._id === profile._id ? styles.selected : ''}`}
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <div className={styles.profileAvatar}>{formatted.initials}</div>
                    <div className={styles.profileInfo}>
                      <span className={styles.relationBadge}>{formatted.relation}</span>
                      <h3 className={styles.profileName}>{profile.name}</h3>
                      <p className={styles.profileDetails}>
                        {formatted.birthDate} • {formatted.birthTime}
                      </p>
                      <p className={styles.profileLocation}>{profile.place}</p>
                    </div>
                    <div className={styles.radioBtn}>
                      {selectedProfile?._id === profile._id ? "●" : "○"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button className={styles.addProfileBtn} onClick={handleAddProfile}>
              + Add Profile
            </button>
            <button 
              className={styles.proceedBtn} 
              onClick={handleSelectAndProceed}
              disabled={!selectedProfile}
            >
              Proceed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KundliProfileModal;
