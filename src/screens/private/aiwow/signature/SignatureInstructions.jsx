import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './SignatureInstructions.module.scss';
import { getAIWowInstructionImage } from '../../../../utils/appImages';
import { setSignatureImage } from '../../../../redux/aiwow/aiwowSlice';
import Footer from '../../../../layouts/Footer';

const SignatureInstructions = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const handleCamera = () => {
    navigate('/aiwow/signature/camera');
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch(setSignatureImage(reader.result));
        navigate('/aiwow/signature/capture');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/aiwow/signature-analysis')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.headerTitle}>AI Signature Analysis</h1>
        </div>
      </header>
      <div className={styles.content}>
        <h2 className={styles.title}>Before you start</h2>

        <div className={styles.middleContent}>
          <div className={styles.imageWrapper}>
            <img 
              src={getAIWowInstructionImage('signature')} 
              alt="Signature example" 
              className={styles.signatureImage}
            />
            <div className={styles.frameCorner} style={{ top: 0, left: 0 }}></div>
            <div className={styles.frameCorner} style={{ top: 0, right: 0 }}></div>
            <div className={styles.frameCorner} style={{ bottom: 0, left: 0 }}></div>
            <div className={styles.frameCorner} style={{ bottom: 0, right: 0 }}></div>
          </div>

        <div>
          <div className={styles.checklistSection}>
            <div className={styles.checkItem}>
              <div className={styles.checkIcon}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className={styles.checkTitle}>Highlight Signature</h3>
                <p className={styles.checkDescription}>Emphasize the signature area to draw attention to authenticity.</p>
              </div>
            </div>

            <div className={styles.checkItem}>
              <div className={styles.checkIcon}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className={styles.checkTitle}>Adjust Contrast</h3>
                <p className={styles.checkDescription}>Enhance contrast to make the signature more legible against the background.</p>
              </div>
            </div>

            <div className={styles.checkItem}>
              <div className={styles.checkIcon}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className={styles.checkTitle}>Add Annotations</h3>
                <p className={styles.checkDescription}>Include notes or markers to indicate specific features of the signature.</p>
              </div>
            </div>
          </div>

          <div className={styles.disclaimer}>
            <h4 className={styles.disclaimerTitle}>Disclaimer</h4>
            <p className={styles.disclaimerText}>
              This signature analysis is for informational purposes only, not a substitute for professional authentication. Analysis is AI-driven.
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
    <Footer />
    </>
  );
};

export default SignatureInstructions;
