import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styles from './FaceReadingInstructions.module.scss';
import { getAIWowInstructionImage } from '../../../../utils/appImages';
import { setFaceReadingImage } from '../../../../redux/aiwow/aiwowSlice';
import Footer from '../../../../layouts/Footer';
import TTSButton from '../../../../component/UI/TTSButton';

const FaceReadingInstructions = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const selectedProfile = useSelector((state) => state.aiwow.selectedKundliProfile);
  const gender = selectedProfile?.identity?.toLowerCase() || selectedProfile?.gender?.toLowerCase() || 'male';

  const handleCamera = () => {
    navigate('/aiwow/face-reading/camera');
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch(setFaceReadingImage(reader.result));
        navigate('/aiwow/face-reading/capture');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/aiwow')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.headerTitle}>AI Powered Face Reading</h1>
        </div>
      </header>
      <div className={styles.content}>
        <h2 className={styles.title}>Before you start</h2>

      <div className={styles.middleContent}>
        <div className={styles.imageWrapper}>
          <img 
            src={getAIWowInstructionImage('faceReading', gender)} 
            alt="Face example" 
            className={styles.faceImage}
          />
          <div className={styles.frameCorner} style={{ top: 0, left: 0 }}></div>
          <div className={styles.frameCorner} style={{ top: 0, right: 0 }}></div>
          <div className={styles.frameCorner} style={{ bottom: 0, left: 0 }}></div>
          <div className={styles.frameCorner} style={{ bottom: 0, right: 0 }}></div>
        </div>
      

      <div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '0', right: '0', display: 'flex' }}>
            <TTSButton text={`Good Lighting. Ensure your room is well-lit for accurate analysis. Stable Position. Hold your device steady during capture. Camera Permission. Allow camera access when prompted. Disclaimer. This face analysis is for informational purposes only and should not be considered a substitute for professional medical or psychological advice. The analysis is based on AI interpretation of facial features. Consult with healthcare professionals for any health concerns.`} />
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
              <p className={styles.checkDescription}>Ensure your room is well-lit for accurate analysis</p>
            </div>
          </div>

          <div className={styles.checkItem}>
            <div className={styles.checkIcon}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className={styles.checkTitle}>Stable Position</h3>
              <p className={styles.checkDescription}>Hold your device steady during capture</p>
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
            This face analysis is for informational purposes only and should not be considered a substitute for professional medical or psychological advice. The analysis is based on AI interpretation of facial features. Consult with healthcare professionals for any health concerns.
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
    <Footer />
    </>
  );
};

export default FaceReadingInstructions;
