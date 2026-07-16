import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './GemstoneInstructions.module.scss';
import { getAIWowInstructionImage } from '../../../../utils/appImages';
import { setGemstoneImage } from '../../../../redux/aiwow/aiwowSlice';
import TTSButton from '../../../../component/UI/TTSButton';
import { compressImage } from '../../../../utils/helper/compressImage';
import { trackEvent } from '../../../../utils/analytics';
import { useGetAiWowPageDataQuery } from '../../../../redux/api/aiwow/aiwowApi';

const GemstoneInstructions = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { data: aiwowData } = useGetAiWowPageDataQuery();
  const featureTitle = aiwowData?.data?.list?.flatMap(s => s.content || [])?.find(f => f.slug === 'gemstone-authenticity')?.title || 'Gemstone Authenticity';

  const handleCamera = () => {
    navigate('/ai-wow/gemstone-authenticity/camera');
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      trackEvent("shubh_ai_input_provided", { feature_name: "gemstone-authenticity", input_type: "image" });
      compressImage(file).then((dataUrl) => {
        dispatch(setGemstoneImage(dataUrl));
        navigate('/ai-wow/gemstone-authenticity/capture');
      });
    }
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
              src={getAIWowInstructionImage('gemstone')} 
              alt="Gemstone example" 
              className={styles.gemstoneImage}
            />
            <div className={styles.frameCorner} style={{ top: 0, left: 0 }}></div>
            <div className={styles.frameCorner} style={{ top: 0, right: 0 }}></div>
            <div className={styles.frameCorner} style={{ bottom: 0, left: 0 }}></div>
            <div className={styles.frameCorner} style={{ bottom: 0, right: 0 }}></div>
          </div>

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
    </>
  );
};

export default GemstoneInstructions;
