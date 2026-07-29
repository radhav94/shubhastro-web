import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styles from './ClothColorInstructions.module.scss';
import { getAIWowInstructionImage } from '../../../../utils/appImages';
import { setClothColorImage } from '../../../../redux/aiwow/aiwowSlice';
import TTSButton from '../../../../component/UI/TTSButton';
import { Toast } from '../../../../component';
import { compressImage } from '../../../../utils/helper/compressImage';
import { trackEvent } from '../../../../utils/analytics';
import { useGetAiWowPageDataQuery } from '../../../../redux/api/aiwow/aiwowApi';
import { GuestKundliAuthModal } from '../../../../component/UI/Profile';

const ClothColorInstructions = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const pendingActionRef = useRef(null);
  const selectedProfile = useSelector((state) => state.aiwow.selectedKundliProfile);
  const gender = selectedProfile?.identity?.toLowerCase() || selectedProfile?.gender?.toLowerCase() || 'male';

  const { data: aiwowData } = useGetAiWowPageDataQuery();
  const featureTitle = aiwowData?.data?.list?.flatMap(s => s.content || [])?.find(f => f.slug === 'clothes-colour-analysis')?.title || 'Colour Clothes Analysis';

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
    navigate('/ai-wow/clothes-colour-analysis/camera');
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      trackEvent("shubh_ai_input_provided", { feature_name: "clothes-colour-analysis", input_type: "image" });
      compressImage(file)
        .then((dataUrl) => {
          // Guests must authenticate at the moment the photo is submitted.
          runOrAuth(() => {
            dispatch(setClothColorImage(dataUrl));
            navigate('/ai-wow/clothes-colour-analysis/capture');
          });
        })
        .catch((err) => {
          console.error('Failed to process selected image:', err);
          Toast.error('Could not read that image. Please try a different photo.');
        });
    }
    // Reset so selecting the same file again re-triggers onChange (iOS Safari).
    event.target.value = '';
  };

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
          <h1 className={styles.headerTitle}>{featureTitle}</h1>
        </div>
      </header>
      <div className={styles.content}>
        <h2 className={styles.title}>Before you start</h2>

        <div className={styles.middleContent}>
          <div className={styles.imageWrapper}>
            <img 
              src={getAIWowInstructionImage('clothColor', gender)} 
              alt="Clothes example" 
              className={styles.clothesImage}
            />
            <div className={styles.frameCorner} style={{ top: 0, left: 0 }}></div>
            <div className={styles.frameCorner} style={{ top: 0, right: 0 }}></div>
            <div className={styles.frameCorner} style={{ bottom: 0, left: 0 }}></div>
            <div className={styles.frameCorner} style={{ bottom: 0, right: 0 }}></div>
          </div>

        <div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '0', right: '0', display: 'flex' }}>
            <TTSButton text={`Analyze Wardrobe Choices. Examine how the choice of clothing colors reflects personal traits and moods. Identify Color Preferences. Explore which colors individuals gravitate towards and what they signify about their personality. Assess Seasonal Impact. Consider how seasonal color trends influence personal style and self-expression. Disclaimer. This color analysis is for informational purposes only and is not a substitute for professional style advice. Our insights are generated using advanced algorithms.`} />
          </span>
        <div className={styles.checklistSection}>
          <div className={styles.checkItem}>
            <div className={styles.checkIcon}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className={styles.checkTitle}>Analyze Wardrobe Choices</h3>
              <p className={styles.checkDescription}>Examine how the choice of clothing colors reflects personal traits and moods.</p>
            </div>
          </div>

          <div className={styles.checkItem}>
            <div className={styles.checkIcon}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className={styles.checkTitle}>Identify Color Preferences</h3>
              <p className={styles.checkDescription}>Explore which colors individuals gravitate towards and what they signify about their personality.</p>
            </div>
          </div>

          <div className={styles.checkItem}>
            <div className={styles.checkIcon}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className={styles.checkTitle}>Assess Seasonal Impact</h3>
              <p className={styles.checkDescription}>Consider how seasonal color trends influence personal style and self-expression.</p>
            </div>
          </div>
        </div>

        <div className={styles.disclaimer}>
          <h4 className={styles.disclaimerTitle}>Disclaimer</h4>
          <p className={styles.disclaimerText}>
            This color analysis is for informational purposes only and is not a substitute for professional style advice. Our insights are generated using advanced algorithms.
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
    </div>

    <GuestKundliAuthModal
      isOpen={showGuestAuthModal}
      onClose={() => setShowGuestAuthModal(false)}
      onSuccess={handleGuestAuthSuccess}
    />
    </>
  );
};

export default ClothColorInstructions;
