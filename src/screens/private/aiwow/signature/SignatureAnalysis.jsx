import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SignatureAnalysis.module.scss';
import { Toast } from '../../../../component';
import { analyzeSignature } from '../../../../services/appServices/aiWowService';

const SignatureAnalysis = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [signatureImage, setSignatureImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    // Get the captured/uploaded image from localStorage
    const storedImage = localStorage.getItem('signatureImage');
    if (storedImage) {
      setSignatureImage(storedImage);
      performAnalysis(storedImage);
    } else {
      // If no image, redirect back to instructions
      Toast.error('No image found. Please capture or upload an image.');
      navigate('/aiwow/signature/instructions');
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
      const result = await analyzeSignature(imageData);

      clearInterval(progressInterval);

      if (result.success) {
        // Store the analysis result
        localStorage.setItem('signatureResult', JSON.stringify(result.data));
        
        // Complete progress
        setProgress(100);
        setAnalysisComplete(true);
        
        // Navigate to results after a short delay
        setTimeout(() => {
          navigate('/aiwow/signature/result');
        }, 1000);
      } else {
        // Handle error - extract detailed error message
        setProgress(0);
        
        let errorMessage = 'Analysis failed. Please try again.';
        
        if (result.error) {
          if (typeof result.error === 'string') {
            errorMessage = result.error;
          } else if (result.error.message) {
            errorMessage = result.error.message;
            
            // Add details if available
            if (result.error.details?.detectedIssue) {
              errorMessage += `\n\n${result.error.details.detectedIssue}`;
            }
            if (result.error.details?.expected) {
              errorMessage += `\n\nExpected: ${result.error.details.expected}`;
            }
          }
        }
        
        Toast.error(errorMessage);
        
        setTimeout(() => {
          navigate('/aiwow/signature/instructions');
        }, 3000);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Toast.error('An unexpected error occurred. Please try again.');
      
      setTimeout(() => {
        navigate('/aiwow/signature/instructions');
      }, 2000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShowResult = () => {
    if (analysisComplete) {
      navigate('/aiwow/signature/result');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>Analysing Signature</h2>

        <div className={styles.imageWrapper}>
          {signatureImage ? (
            <img 
              src={signatureImage} 
              alt="Signature being analyzed" 
              className={styles.signatureImage}
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
        </div>

        <div className={styles.messageSection}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={styles.sparkleIcon}>
            <path d="M20 5L22.5 15L30 17.5L22.5 20L20 30L17.5 20L10 17.5L17.5 15L20 5Z" fill="#1f2937"/>
          </svg>
          <h3 className={styles.message}>Hold tight as we are analysing your Signature</h3>
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

export default SignatureAnalysis;
