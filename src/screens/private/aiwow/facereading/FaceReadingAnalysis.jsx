import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FaceReadingAnalysis.module.scss';
import { analyzeFace } from '../../../../services/appServices/aiWowService';
import { Toast } from '../../../../component';

const FaceReadingAnalysis = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [faceImage, setFaceImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    // Get the captured/uploaded image from localStorage
    const storedImage = localStorage.getItem('faceReadingImage');
    if (storedImage) {
      setFaceImage(storedImage);
      performAnalysis(storedImage);
    } else {
      // If no image, silently redirect back to instructions
      navigate('/aiwow/face-reading/instructions');
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
      const result = await analyzeFace(imageData);

      clearInterval(progressInterval);

      if (result.success) {
        // Store the analysis result
        localStorage.setItem('faceReadingResult', JSON.stringify(result.data));
        
        // Complete progress
        setProgress(100);
        setAnalysisComplete(true);
        
        // Navigate to results after a short delay
        setTimeout(() => {
          navigate('/aiwow/face-reading/result');
        }, 1000);
      } else {
        // Handle error - interceptor already showed toast
        setProgress(0);
        
        setTimeout(() => {
          navigate('/aiwow/face-reading/instructions');
        }, 2000);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      // Interceptor already showed toast
      
      setTimeout(() => {
        navigate('/aiwow/face-reading/instructions');
      }, 2000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShowResult = () => {
    if (analysisComplete) {
      navigate('/aiwow/face-reading/result');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>Analysing facial features</h2>

        <div className={styles.imageWrapper}>
          {faceImage ? (
            <img 
              src={faceImage} 
              alt="Face being analyzed" 
              className={styles.faceImage}
            />
          ) : (
            <div className={styles.imagePlaceholder}>Loading image...</div>
          )}
          <div className={styles.frameCorner} style={{ top: 0, left: 0 }}></div>
          <div className={styles.frameCorner} style={{ top: 0, right: 0 }}></div>
          <div className={styles.frameCorner} style={{ bottom: 0, left: 0 }}></div>
          <div className={styles.frameCorner} style={{ bottom: 0, right: 0 }}></div>
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

export default FaceReadingAnalysis;
