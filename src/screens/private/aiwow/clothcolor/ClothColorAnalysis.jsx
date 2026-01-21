import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ClothColorAnalysis.module.scss';
import { analyzeClothColor } from '../../../../services/appServices/aiWowService';
import { Toast } from '../../../../component';

const ClothColorAnalysis = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [clothImage, setClothImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    const storedImage = localStorage.getItem('clothColorImage');
    if (storedImage) {
      setClothImage(storedImage);
      performAnalysis(storedImage);
    } else {
      Toast.error('No image found. Please capture or upload an image.');
      navigate('/aiwow/cloth-color/instructions');
      return;
    }
  }, [navigate]);

  const performAnalysis = async (imageData) => {
    setIsAnalyzing(true);
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 200);

      // Get form data from localStorage
      const storedFormData = localStorage.getItem('clothColorFormData');
      const birthData = storedFormData ? JSON.parse(storedFormData) : null;

      const result = await analyzeClothColor(imageData, birthData);

      clearInterval(progressInterval);

      if (result.success) {
        localStorage.setItem('clothColorResult', JSON.stringify(result.data));
        
        setProgress(100);
        setAnalysisComplete(true);
        
        setTimeout(() => {
          navigate('/aiwow/cloth-color/result');
        }, 1000);
      } else {
        setProgress(0);
        Toast.error(result.error || 'Analysis failed. Please try again.');
        
        setTimeout(() => {
          navigate('/aiwow/cloth-color/instructions');
        }, 2000);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Toast.error('An unexpected error occurred. Please try again.');
      
      setTimeout(() => {
        navigate('/aiwow/cloth-color/instructions');
      }, 2000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShowResult = () => {
    if (analysisComplete) {
      navigate('/aiwow/cloth-color/result');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.topBar}></div>

        <h2 className={styles.title}>Analysing Clothes</h2>

        <div className={styles.imageWrapper}>
          {clothImage ? (
            <img 
              src={clothImage} 
              alt="Clothes being analyzed" 
              className={styles.clothImage}
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
          <h3 className={styles.message}>Hold tight as we are analysing your clothes</h3>
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

export default ClothColorAnalysis;
