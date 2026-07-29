import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styles from './AuraLanding.module.scss';
import SmileIcon from '../../../../assets/icons/Smile.png';
import EnergyLevelsIcon from '../../../../assets/icons/energylevels.png';
import ChakraIcon from '../../../../assets/icons/chakra.png';
import AuraSizeIcon from '../../../../assets/icons/aurasize.png';
import TTSButton from '../../../../component/UI/TTSButton';
import { getAIWowInstructionImage } from '../../../../utils/appImages';
import { setAuraImage } from '../../../../redux/aiwow/aiwowSlice';
import { compressImage } from '../../../../utils/helper/compressImage';
import { trackEvent } from '../../../../utils/analytics';
import { useGetAiWowPageDataQuery } from '../../../../redux/api/aiwow/aiwowApi';
import { GuestKundliAuthModal } from '../../../../component/UI/Profile';

const AuraLanding = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const pendingActionRef = useRef(null);
  const selectedProfile = useSelector((state) => state.aiwow.selectedKundliProfile);
  const gender = selectedProfile?.identity?.toLowerCase() || selectedProfile?.gender?.toLowerCase() || 'male';
  const { data: aiwowData } = useGetAiWowPageDataQuery();
  const featureTitle = aiwowData?.data?.list?.flatMap(s => s.content || [])?.find(f => f.slug === 'aura-photography')?.title || 'AI Powered Aura Photography';

  // Guests must add a kundli + verify OTP before capturing/uploading a photo.
  const runOrAuth = (action) => {
    const token = localStorage.getItem("shubhtalk_customer_token");
    if (!token) {
      pendingActionRef.current = action;
      setShowGuestAuthModal(true);
      return;
    }
    action();
  };

  const handleGuestAuthSuccess = () => {
    setShowGuestAuthModal(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) action();
  };

  const handleCamera = () => {
    navigate('/ai-wow/aura-photography/camera');
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      trackEvent("shubh_ai_input_provided", { feature_name: "aura-photography", input_type: "image" });
      compressImage(file).then((dataUrl) => {
        // Guests must authenticate at the moment the photo is submitted.
        runOrAuth(() => {
          dispatch(setAuraImage(dataUrl));
          navigate('/ai-wow/aura-photography/capture');
        });
      });
    }
  };

  const features = [
    {
      icon: SmileIcon,
      title: 'Aura Color Detection',
      description: 'Discover the dominant colors in your aura and what they reveal about your energy',
    },
    {
      icon: EnergyLevelsIcon,
      title: 'Energy Analysis',
      description: 'Understand your current energy state and emotional vibrations',
    },
    {
      icon: ChakraIcon,
      title: 'Chakra Alignment',
      description: 'Get insights into your chakra balance and energy flow',
    },
    {
      icon: AuraSizeIcon,
      title: 'Spiritual Insights',
      description: 'Receive personalized guidance based on your aura reading and birth chart',
    },
  ];

  return (
    <>
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.title}>{featureTitle}</h1>
        </div>
      </header>

      <div className={styles.content}>
        {/* Instructions Section - At Top */}
        <div className={styles.instructionsWrapper}>
          <h2 className={styles.instructionsTitle}>Before you start</h2>

          <div className={styles.middleContent}>
            <div className={styles.imageWrapper}>
              <img 
                src={getAIWowInstructionImage('aura', gender)} 
                alt="Aura example" 
                className={styles.auraImage}
              />
              <div className={styles.frameCorner} style={{ top: 0, left: 0 }}></div>
              <div className={styles.frameCorner} style={{ top: 0, right: 0 }}></div>
              <div className={styles.frameCorner} style={{ bottom: 0, left: 0 }}></div>
              <div className={styles.frameCorner} style={{ bottom: 0, right: 0 }}></div>
            </div>

            <div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '0', right: '0', display: 'flex' }}>
                  <TTSButton text={`Good Lighting. Ensure your room is well-lit for accurate aura capture. Neutral Background. Stand against a plain background for best results. Camera Permission. Allow camera access when prompted. Disclaimer. This aura analysis is for informational and spiritual guidance purposes only. The analysis combines AI technology with astrological principles to provide insights about your energy field and emotional state.`} />
                </span>
                <div className={styles.checklistSection}>
                  <div className={styles.checkItem}>
                    <div className={styles.checkIcon}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className={styles.checkTitle}>Good Lighting</h3>
                      <p className={styles.checkDescription}>Ensure your room is well-lit for accurate aura capture</p>
                    </div>
                  </div>

                  <div className={styles.checkItem}>
                    <div className={styles.checkIcon}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className={styles.checkTitle}>Neutral Background</h3>
                      <p className={styles.checkDescription}>Stand against a plain background for best results</p>
                    </div>
                  </div>

                  <div className={styles.checkItem}>
                    <div className={styles.checkIcon}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className={styles.checkTitle}>Camera Permission</h3>
                      <p className={styles.checkDescription}>Allow camera access when prompted</p>
                    </div>
                  </div>
                </div>

                <div className={styles.disclaimer}>
                  <h4 className={styles.disclaimerTitle}>Disclaimer</h4>
                  <p className={styles.disclaimerText}>
                    This aura analysis is for informational and spiritual guidance purposes only. The analysis combines AI technology with astrological principles to provide insights about your energy field and emotional state.
                  </p>
                </div>

                <div className={styles.buttonGroup}>
                  <button 
                    className={styles.uploadButton}
                    onClick={handleUpload}
                  >
                    Upload Photo
                  </button>
                  <button 
                    className={styles.cameraButton}
                    onClick={handleCamera}
                  >
                    Use Camera
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Section - Below */}
        <div className={styles.featuresWrapper}>
          <h2 className={styles.featuresTitle}>What you'll discover</h2>
          <p className={styles.featuresDescription}>
            Capture and analyze your aura to reveal your energy field, emotional state, and spiritual essence. Combine ancient wisdom with modern AI technology for deep insights.
          </p>

          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.iconWrapper}>
                  <img src={feature.icon} alt={feature.title} className={styles.featureIcon} />
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <GuestKundliAuthModal
      isOpen={showGuestAuthModal}
      onClose={() => setShowGuestAuthModal(false)}
      onSuccess={handleGuestAuthSuccess}
    />
    </>
  );
};

export default AuraLanding;
