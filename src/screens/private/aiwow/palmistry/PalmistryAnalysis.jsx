import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PalmistryAnalysis.module.scss';
import { Toast } from '../../../../component';
import { analyzePalm } from '../../../../services/appServices/aiWowService';

const PalmistryAnalysis = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [palmImage, setPalmImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    // Get the captured/uploaded image from localStorage
    const storedImage = localStorage.getItem('palmistryImage');
    if (storedImage) {
      setPalmImage(storedImage);
      performAnalysis(storedImage);
    } else {
      // If no image, redirect back to instructions
      Toast.error('No image found. Please capture or upload an image.');
      navigate('/aiwow/palmistry/instructions');
      return;
    }
  }, [navigate]);

  const performAnalysis = async (imageData) => {
    setIsAnalyzing(true);
    
    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90; // Stop at 90% until API responds
          }
          return prev + 5;
        });
      }, 200);

      // Call the API
      const result = await analyzePalm(imageData);

      clearInterval(progressInterval);

      if (result.success) {
        // Store the analysis result
        localStorage.setItem('palmistryResult', JSON.stringify(result.data));
        
        // Complete progress
        setProgress(100);
        setAnalysisComplete(true);
        
        // Navigate to results after a short delay
        setTimeout(() => {
          navigate('/aiwow/palmistry/result');
        }, 1000);
      } else {
        // Handle error
        setProgress(0);
        Toast.error(result.error || 'Analysis failed. Please try again.');
        
        setTimeout(() => {
          navigate('/aiwow/palmistry/instructions');
        }, 2000);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Toast.error('An unexpected error occurred. Please try again.');
      
      setTimeout(() => {
        navigate('/aiwow/palmistry/instructions');
      }, 2000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShowResult = () => {
    if (analysisComplete) {
      navigate('/aiwow/palmistry/result');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.topBar}></div>

        <h2 className={styles.title}>Analysing Palm</h2>

        <div className={styles.imagesWrapper}>
          <div className={styles.imageWrapper}>
            {palmImage ? (
              <img 
                src={palmImage} 
                alt="Palm being analyzed" 
                className={styles.palmImage}
              />
            ) : (
              <div className={styles.imagePlaceholder}>Loading image...</div>
            )}
            <div className={styles.frameCorner} style={{ top: 0, left: 0 }}></div>
            <div className={styles.frameCorner} style={{ top: 0, right: 0 }}></div>
            <div className={styles.frameCorner} style={{ bottom: 0, left: 0 }}></div>
            <div className={styles.frameCorner} style={{ bottom: 0, right: 0 }}></div>
          </div>

          <div className={styles.imageWrapper}>
            {palmImage ? (
              <img 
                src={palmImage} 
                alt="Palm being analyzed" 
                className={styles.palmImage}
              />
            ) : (
              <div className={styles.imagePlaceholder}>Loading image...</div>
            )}
            <div className={styles.frameCorner} style={{ top: 0, left: 0 }}></div>
            <div className={styles.frameCorner} style={{ top: 0, right: 0 }}></div>
            <div className={styles.frameCorner} style={{ bottom: 0, left: 0 }}></div>
            <div className={styles.frameCorner} style={{ bottom: 0, right: 0 }}></div>
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${Math.max(0, progress - 20)}%` }}
            ></div>
          </div>
        </div>

        <div className={styles.messageSection}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={styles.sparkleIcon}>
            <path d="M20 5L22.5 15L30 17.5L22.5 20L20 30L17.5 20L10 17.5L17.5 15L20 5Z" fill="#1f2937"/>
          </svg>
          <h3 className={styles.message}>Hold tight as we are analysing your face</h3>
        </div>

        <button 
          className={styles.resultButton}
          onClick={handleShowResult}
          disabled={!analysisComplete}
          style={{ opacity: analysisComplete ? 1 : 0.6 }}
        >
          {isAnalyzing ? 'Analyzing...' : 'Show Result'}
        </button>
      </div>
    </div>
  );
};

export default PalmistryAnalysis;
