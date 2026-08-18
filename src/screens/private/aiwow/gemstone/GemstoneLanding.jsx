import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './GemstoneLanding.module.scss';
import ClarityIcon from '../../../../assets/icons/clarity.png';
import ColorGradingIcon from '../../../../assets/icons/colorgrading.png';
import CutPrecisionIcon from '../../../../assets/icons/curprecision.png';
import CaratIcon from '../../../../assets/icons/carat.png';
import TTSButton from '../../../../component/UI/TTSButton';
import { getAIWowInstructionImage } from '../../../../utils/appImages';
import { setGemstoneImage } from '../../../../redux/aiwow/aiwowSlice';
import { compressImage } from '../../../../utils/helper/compressImage';
import { trackEvent } from '../../../../utils/analytics';
import { useGetAiWowPageDataQuery } from '../../../../redux/api/aiwow/aiwowApi';
import { GuestKundliAuthModal } from '../../../../component/UI/Profile';
import { Toast } from '../../../../component';

const GemstoneLanding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const pendingActionRef = useRef(null);
  // compressImage re-encodes through a canvas and waits up to 8s before falling
  // back, and it used to run with no visible state at all: pick a photo, and the
  // page sat there. That silence is what gets read as a dead click, so the
  // buttons now report it.
  const [preparing, setPreparing] = useState(false);

  const { data: aiwowData } = useGetAiWowPageDataQuery();
  const featureTitle = aiwowData?.data?.list?.flatMap(s => s.content || [])?.find(f => f.slug === 'gemstone-authenticity')?.title || 'Gemstone Authenticity';

  const handleBack = () => {
    // `navigate(-1)` is inert on the first history entry — a shared link or an ad
    // landing straight on this feature.
    if (location.key !== 'default') navigate(-1);
    else navigate('/ai-wow');
  };

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
    if (preparing) {
      Toast.info('Preparing your photo — one moment.');
      return;
    }
    navigate('/ai-wow/gemstone-authenticity/camera', { replace: true });
  };

  const handleUpload = () => {
    if (preparing) {
      Toast.info('Preparing your photo — one moment.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      trackEvent("shubh_ai_input_provided", { feature_name: "gemstone-authenticity", input_type: "image" });
      setPreparing(true);
      compressImage(file)
        .then((dataUrl) => {
          // Guests must authenticate at the moment the photo is submitted.
          runOrAuth(() => {
            dispatch(setGemstoneImage(dataUrl));
            navigate('/ai-wow/gemstone-authenticity/capture', { replace: true });
          });
        })
        .catch((err) => {
          console.error('Failed to process selected image:', err);
          Toast.error('Could not read that image. Please try a different photo.');
        })
        .finally(() => setPreparing(false));
    }
    // Reset so selecting the same file again re-triggers onChange. Without this
    // a retry with the identical photo fires no event at all — the file dialog
    // opens, the same file is chosen, and nothing whatsoever happens.
    event.target.value = '';
  };

  const features = [
    {
      icon: ClarityIcon,
      title: 'Clarity Analysis',
      description: 'Assess gemstone clarity to reveal its inner beauty and potential market value.',
    },
    {
      icon: ColorGradingIcon,
      title: 'Color Grading',
      description: 'Evaluate color saturation to determine rarity and aesthetic appeal.',
    },
    {
      icon: CutPrecisionIcon,
      title: 'Cut Precision',
      description: 'Determine light performance based on the precision of angles and facets.',
    },
    {
      icon: CaratIcon,
      title: 'Carat Weight',
      description: 'Assess gemstone size and density to determine value and rarity.',
    },
  ];

  return (
    <>
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
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
                src={getAIWowInstructionImage('gemstone')} 
                alt="Gemstone example" 
                className={styles.gemstoneImage}
              />
              <div className={styles.frameCorner} style={{ top: 0, left: 0 }}></div>
              <div className={styles.frameCorner} style={{ top: 0, right: 0 }}></div>
              <div className={styles.frameCorner} style={{ bottom: 0, left: 0 }}></div>
              <div className={styles.frameCorner} style={{ bottom: 0, right: 0 }}></div>
            </div>

            <div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '0', right: '0', display: 'flex' }}>
                  <TTSButton text={`Verify Certification. Ensure the gemstone comes with a valid certification from a recognized authority. Inspect Clarity. Evaluate the clarity of the gemstone to determine its quality and authenticity. Examine Cut Quality. Assess the cut of the gemstone for precision and craftsmanship, which contribute to its value. Disclaimer. This gemstone authenticity check is for informational purposes only and should not replace professional appraisal. Our analysis is powered by advanced AI.`} />
                </span>
                <div className={styles.checklistSection}>
                  <div className={styles.checkItem}>
                    <div className={styles.checkIcon}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className={styles.checkTitle}>Verify Certification</h3>
                      <p className={styles.checkDescription}>Ensure the gemstone comes with a valid certification from a recognized authority.</p>
                    </div>
                  </div>

                  <div className={styles.checkItem}>
                    <div className={styles.checkIcon}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className={styles.checkTitle}>Inspect Clarity</h3>
                      <p className={styles.checkDescription}>Evaluate the clarity of the gemstone to determine its quality and authenticity.</p>
                    </div>
                  </div>

                  <div className={styles.checkItem}>
                    <div className={styles.checkIcon}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className={styles.checkTitle}>Examine Cut Quality</h3>
                      <p className={styles.checkDescription}>Assess the cut of the gemstone for precision and craftsmanship, which contribute to its value.</p>
                    </div>
                  </div>
                </div>

                <div className={styles.disclaimer}>
                  <h4 className={styles.disclaimerTitle}>Disclaimer</h4>
                  <p className={styles.disclaimerText}>
                    This gemstone authenticity check is for informational purposes only and should not replace professional appraisal. Our analysis is powered by advanced AI.
                  </p>
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    className={styles.uploadButton}
                    onClick={handleUpload}
                    aria-disabled={preparing}
                    aria-busy={preparing}
                  >
                    {preparing ? 'Preparing photo…' : 'Upload Photo'}
                  </button>
                  <button
                    type="button"
                    className={styles.cameraButton}
                    onClick={handleCamera}
                    aria-disabled={preparing}
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
            Unlock the value of your gemstones with our AI Gemstone Authenticity Check, which analyzes the unique characteristics of your gemstone to reveal insights about its quality, rarity, and potential market value.
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

export default GemstoneLanding;
