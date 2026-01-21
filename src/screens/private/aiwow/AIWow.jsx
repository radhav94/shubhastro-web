import React, { useState } from 'react';
import styles from './AIWow.module.scss';
import { useNavigate } from 'react-router-dom';
import FeatureCard from './components/FeatureCard';
import ComingSoonCard from './components/ComingSoonCard';
import PalmFaceSection from './components/PalmFaceSection';
import KundliProfileModal from './components/KundliProfileModal';
import MobileAppModal from './components/MobileAppModal';

const AIWow = () => {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMobileAppModal, setShowMobileAppModal] = useState(false);
  const [targetRoute, setTargetRoute] = useState('');

  const handleARVastuClick = () => {
    setShowMobileAppModal(true);
  };

  const handleFeatureClick = (route) => {
    setTargetRoute(route);
    setShowProfileModal(true);
  };

  const handleProfileSelect = (profile) => {
    console.log('Selected profile:', profile);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>AI WOW</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.heroSection}>
          <h2 className={styles.heroTitle}>
            Future of Astrology <span className={styles.sparkle}>✨</span>
          </h2>
          <p className={styles.heroSubtitle}>
            Explore the future of astrology with our cutting-edge AI-powered tools and experiences
          </p>
        </div>

        {/* AR Vastu Scanner */}
        <FeatureCard
          badge="New"
          badgeType="new"
          title="AR Vastu Scanner"
          description="Explore your surroundings through augmented reality for an exciting Vastu analysis experience!"
          icon="vastu"
          largeIcon={true}
          onStartNow={handleARVastuClick}
        />

        {/* Palm and Face Reading Section */}
        <PalmFaceSection onFeatureClick={handleFeatureClick} />

        {/* Gemstone Authenticity */}
        <FeatureCard
          badge="Popular"
          badgeType="popular"
          title="Gemstone Authenticity"
          description="Upload your gemstone image for AI-powered analysis and recommendations"
          icon="gemstone"
          onStartNow={() => handleFeatureClick('/aiwow/gemstone')}
        />

        {/* Signature Analysis */}
        <FeatureCard
          badge="Popular"
          badgeType="popular"
          title="Signature Analysis"
          description="Upload a photo of your signature for in-depth analysis and personalized insights"
          icon="signature"
          onStartNow={() => handleFeatureClick('/aiwow/signature')}
        />

        {/* Cloth Color Analysis */}
        <FeatureCard
          badge="New"
          badgeType="new"
          title="Clothes Colour Analysis"
          description="Discover your auspicious colours based on your astrological influences"
          icon="clothes"
          onStartNow={() => handleFeatureClick('/aiwow/cloth-color')}
        />

        {/* Coming Soon Section */}
        <div className={styles.comingSoonSection}>
          <h3 className={styles.sectionTitle}>Coming Soon</h3>
          <div className={styles.comingSoonGrid}>
            <ComingSoonCard
              title="Aura Analysis"
              description="AI-powered aura reading analyzing your energy field and spiritual presence"
              icon="aura"
            />
          </div>
        </div>
      </div>

      {/* Kundli Profile Modal */}
      <KundliProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSelectProfile={handleProfileSelect}
        targetRoute={targetRoute}
      />

      {/* Mobile App Download Modal */}
      <MobileAppModal
        isOpen={showMobileAppModal}
        onClose={() => setShowMobileAppModal(false)}
      />
    </div>
  );
};

export default AIWow;
