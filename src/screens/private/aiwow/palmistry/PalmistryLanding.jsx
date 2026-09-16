import React, { useRef, useState } from 'react';
// Toast import kept for the image-read failure path below; the blocked-tap
// "choose a hand first" path is now an inline notice, not a toast — see
// handHint/requireHand.
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from './PalmistryLanding.module.scss';
import PalmLineIcon from '../../../../assets/icons/palmline.png';
import PalmMountIcon from '../../../../assets/icons/palmmount.png';
import CakeIcon from '../../../../assets/icons/Cake.png';
import LoveIcon from '../../../../assets/icons/loveIcon.png';
import { useGetAiWowPageDataQuery } from '../../../../redux/api/aiwow/aiwowApi';
import {
  setPalmistryImage,
  setPalmistrySelectedHand,
} from '../../../../redux/aiwow/aiwowSlice';
import { Toast } from '../../../../component';
import TTSButton from '../../../../component/UI/TTSButton';
import { getAIWowInstructionImage } from '../../../../utils/appImages';
import { compressImage } from '../../../../utils/helper/compressImage';
import { trackEvent } from '../../../../utils/analytics';
import { GuestKundliAuthModal } from '../../../../component/UI/Profile';

const TTS_SCRIPT =
  'Clear Background. Use a neutral background to avoid distractions in the photo. ' +
  'Focus on Your Palm. Make sure your palm is centered and clearly visible in the frame. ' +
  'Steady Hands. Keep your hands steady to avoid blurriness for better detail. ' +
  'Disclaimer. This palm reading is for informational purposes only and not a substitute ' +
  'for professional advice. Analysis is based on AI interpretation.';

const CHECKLIST = [
  {
    title: 'Clear Background',
    description: 'Use a neutral background to avoid distractions in the photo',
  },
  {
    title: 'Focus on Your Palm',
    description: 'Make sure your palm is centered and clearly visible in the frame',
  },
  {
    title: 'Steady Hands',
    description: 'Keep your hands steady to avoid blurriness for better detail',
  },
];

/**
 * Palmistry entry screen.
 *
 * The "Before you start" instructions used to live on a separate
 * /ai-palmistry-scanner/instructions step, so picking a hand and reading the
 * shot guidelines were two screens apart. Both are on this one screen now:
 * instructions first, then the hand choice, then Upload / Use Camera — which
 * only act once a hand is chosen, since the analysis needs it.
 */
const PalmistryLanding = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const pendingActionRef = useRef(null);
  const { data: aiwowData } = useGetAiWowPageDataQuery();
  const featureTitle = aiwowData?.data?.list?.flatMap(s => s.content || [])?.find(f => f.slug === 'ai-palmistry-scanner')?.title || 'AI Palmistry Scanner';

  const [selectedHand, setSelectedHand] = useState(null);
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);

  /*
    Inline answer for a blocked "Use Camera" / "Upload Photo" tap.

    These buttons stay tappable before a hand is chosen (a hard `disabled`
    swallows the tap with no explanation). Previously requireHand() answered the
    blocked tap with Toast.info(...), but the toaster is mounted
    position="top-right" (main.jsx) while these CTAs sit near the bottom of a
    long mobile page — so on a phone the only thing that changed was off-screen,
    and Clarity does not record toasts at all. That is the dead click in Clarity
    session mkkdqi: "Use Camera" tapped at 00:43 before a hand was picked, then
    "Right Hand" at 00:47 once the user worked out the missing step on their own.

    Seq-keyed so tapping a blocked button twice still repaints the node (session
    replay can see it) and screen readers re-announce even when the text repeats.
  */
  const [handNotice, setHandNotice] = useState(null);
  const noticeSeqRef = useRef(0);

  const announceHandNotice = (text) => {
    noticeSeqRef.current += 1;
    setHandNotice({ seq: noticeSeqRef.current, text });
  };

  const handleHandSelect = (hand) => {
    setSelectedHand(hand);
    setHandNotice(null); // the missing step is now satisfied; clear the prompt
    // Keep the store in step with the UI so the camera/analysis screens always
    // read the hand that is actually highlighted here.
    dispatch(setPalmistrySelectedHand(hand));
  };

  // Guests must add a kundli + verify OTP before a photo is submitted.
  const runOrAuth = (action) => {
    const token = localStorage.getItem('shubhtalk_customer_token');
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

  /**
   * Upload and Use Camera stay tappable while no hand is picked (a hard
   * `disabled` gave a dead tap with no explanation) — they just name the missing
   * step instead.
   */
  const requireHand = () => {
    if (!selectedHand) {
      // Inline, not a toast — see announceHandNotice above.
      announceHandNotice('Choose your left or right hand first, then tap Use Camera or Upload Photo.');
      return false;
    }
    return true;
  };

  const handleCamera = () => {
    if (!requireHand()) return;
    navigate('/ai-wow/ai-palmistry-scanner/camera', { replace: true });
  };

  const handleUpload = () => {
    if (!requireHand()) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      trackEvent('shubh_ai_input_provided', { feature_name: 'ai-palmistry-scanner', input_type: 'image' });
      compressImage(file)
        .then((dataUrl) => {
          runOrAuth(() => {
            // New image → allow a fresh analysis (clear the reload guard from a
            // previous attempt).
            sessionStorage.removeItem('palmistryAnalysisStarted');
            dispatch(setPalmistryImage(dataUrl));
            navigate('/ai-wow/ai-palmistry-scanner/capture', { replace: true });
          });
        })
        .catch((err) => {
          console.error('Failed to process selected image:', err);
          Toast.error('Could not read that image. Please try a different photo.');
        });
    }
    // Reset so re-picking the same file still fires onChange.
    event.target.value = '';
  };

  const features = [
    {
      icon: PalmLineIcon,
      title: 'Palm Line Analysis',
      description: 'Examine the major lines on the palm to determine aspects of personality and destiny.',
    },
    {
      icon: PalmMountIcon,
      title: 'Mount Identification',
      description: 'Identify the mounts on the palm that indicate strengths and challenges in various life areas.',
    },
    {
      icon: CakeIcon,
      title: 'Career and Life',
      description: 'Gain insights into your career path and life journey based on key personal and astrological indicators.',
    },
    {
      icon: LoveIcon,
      title: 'Relationship',
      description: 'Evaluate relationship compatibility by analysing the palm prints of two individuals.',
    },
  ];

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
          <h1 className={styles.title}>{featureTitle}</h1>
        </div>
      </header>

      <div className={styles.content}>
        {/* Instructions — above the hand choice, so the shot guidelines are read
            before a photo is taken. */}
        <h2 className={styles.sectionTitle}>Before you start</h2>

        <div className={styles.instructionsCard}>
          {/* Tappable — viewfinder framing that was collecting dead clicks.
              See the note on .imageWrapper in the SCSS (Clarity 15hum1k). Same
              action as the "Use Camera" CTA below; requireHand() inside
              handleCamera still blocks it until a hand is chosen. */}
          <button
            type="button"
            className={styles.imageWrapper}
            onClick={handleCamera}
            aria-label="Use camera to take your photo"
          >
            <img
              src={getAIWowInstructionImage('palmistry')}
              alt="Palm example"
              className={styles.palmImage}
            />
            <span className={styles.frameCorner} style={{ top: 0, left: 0 }} aria-hidden="true" />
            <span className={styles.frameCorner} style={{ top: 0, right: 0 }} aria-hidden="true" />
            <span className={styles.frameCorner} style={{ bottom: 0, left: 0 }} aria-hidden="true" />
            <span className={styles.frameCorner} style={{ bottom: 0, right: 0 }} aria-hidden="true" />
          </button>

          <div className={styles.instructionsBody}>
            <span className={styles.ttsButton}>
              <TTSButton text={TTS_SCRIPT} />
            </span>

            <div className={styles.checklistSection}>
              {CHECKLIST.map((item) => (
                <div key={item.title} className={styles.checkItem}>
                  <div className={styles.checkIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.checkTitle}>{item.title}</h3>
                    <p className={styles.checkDescription}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.disclaimer}>
              <h4 className={styles.disclaimerTitle}>Disclaimer</h4>
              <p className={styles.disclaimerText}>
                This palm reading is for informational purposes only and not a substitute for professional advice. Analysis is based on AI interpretation.
              </p>
            </div>
          </div>
        </div>

        {/* Hand Selection + capture actions */}
        <div className={styles.handSelectionWrapper}>
          <div className={styles.handSelectionHeader}>
            <h2 className={styles.handSelectionTitle}>Which hand would you like to scan?</h2>
            <p className={styles.handSelectionDescription}>
              The dominant hand shows your present and future, while the non-dominant hand reveals your past and potential.
            </p>
          </div>

          <div className={styles.handOptions}>
            <button
              className={`${styles.handCard} ${selectedHand === 'left' ? styles.selected : ''}`}
              onClick={() => handleHandSelect('left')}
              aria-pressed={selectedHand === 'left'}
            >
              <div className={styles.handIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none">
                  <g clipPath="url(#clip0_9475_7868)">
                    <path d="M13 24C9.73998 24 6.80998 22.01 5.59998 18.98L2.56998 11.37C2.25998 10.58 2.99998 9.79 3.80998 10.05L4.59998 10.31C5.15998 10.49 5.61998 10.92 5.83998 11.47L7.24998 15H7.99998V3.25C7.99998 2.56 8.55998 2 9.24998 2C9.93998 2 10.5 2.56 10.5 3.25V12H11.5V1.25C11.5 0.56 12.06 0 12.75 0C13.44 0 14 0.56 14 1.25V12H15V2.75C15 2.06 15.56 1.5 16.25 1.5C16.94 1.5 17.5 2.06 17.5 2.75V12H18.5V5.75C18.5 5.06 19.06 4.5 19.75 4.5C20.44 4.5 21 5.06 21 5.75V16C21 20.42 17.42 24 13 24Z" fill="url(#paint0_linear_9475_7868)"/>
                  </g>
                  <defs>
                    <linearGradient id="paint0_linear_9475_7868" x1="2.4978" y1="12" x2="21" y2="12" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F75801"/>
                      <stop offset="1" stopColor="#D43400"/>
                    </linearGradient>
                    <clipPath id="clip0_9475_7868">
                      <rect width="24" height="24" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h3 className={styles.handLabel}>Left Hand</h3>
              <p className={styles.handDescription}>Non-dominant hand<br/>Reveals your past and potential.</p>
              {selectedHand === 'left' && (
                <div className={styles.checkmark}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#F75801"/>
                    <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>

            <button
              className={`${styles.handCard} ${selectedHand === 'right' ? styles.selected : ''}`}
              onClick={() => handleHandSelect('right')}
              aria-pressed={selectedHand === 'right'}
            >
              <div className={styles.handIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none">
                  <g clipPath="url(#clip0_9475_7871)">
                    <path d="M11 24C14.26 24 17.19 22.01 18.4 18.98L21.43 11.37C21.74 10.58 21 9.79 20.19 10.05L19.4 10.31C18.84 10.49 18.38 10.92 18.16 11.47L16.75 15H16V3.25C16 2.56 15.44 2 14.75 2C14.06 2 13.5 2.56 13.5 3.25V12H12.5V1.25C12.5 0.56 11.94 0 11.25 0C10.56 0 10 0.56 10 1.25V12H9.00002V2.75C9.00002 2.06 8.44002 1.5 7.75002 1.5C7.06002 1.5 6.50002 2.06 6.50002 2.75V12H5.50002V5.75C5.50002 5.06 4.94002 4.5 4.25002 4.5C3.56002 4.5 3.00002 5.06 3.00002 5.75V16C3.00002 20.42 6.58002 24 11 24Z" fill="url(#paint0_linear_9475_7871)"/>
                  </g>
                  <defs>
                    <linearGradient id="paint0_linear_9475_7871" x1="21.5022" y1="12" x2="3.00002" y2="12" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F75801"/>
                      <stop offset="1" stopColor="#D43400"/>
                    </linearGradient>
                    <clipPath id="clip0_9475_7871">
                      <rect width="24" height="24" fill="white" transform="matrix(-1 0 0 1 24 0)"/>
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h3 className={styles.handLabel}>Right Hand</h3>
              <p className={styles.handDescription}>Dominant hand<br/>Shows your present and future.</p>
              {selectedHand === 'right' && (
                <div className={styles.checkmark}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#F75801"/>
                    <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          </div>

          {!selectedHand && (
            <p className={styles.handHint}>Select a hand to enable upload or camera.</p>
          )}

          {/* Answer for a blocked Use Camera / Upload Photo tap, rendered right
              above the buttons that were tapped rather than in the top-right
              toaster the phone user never sees. Keyed on seq so a repeated
              blocked tap replays and re-announces. */}
          {handNotice && (
            <p
              key={handNotice.seq}
              className={styles.handNotice}
              role="status"
              aria-live="polite"
            >
              {handNotice.text}
            </p>
          )}

          <div className={styles.buttonGroup}>
            <button
              className={`${styles.uploadButton} ${!selectedHand ? styles.inactive : ''}`}
              onClick={handleUpload}
              aria-disabled={!selectedHand}
            >
              Upload Photo
            </button>
            <button
              className={`${styles.cameraButton} ${!selectedHand ? styles.inactive : ''}`}
              onClick={handleCamera}
              aria-disabled={!selectedHand}
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

        {/* Feature Cards Section - Below */}
        <div className={styles.featuresWrapper}>
          <h2 className={styles.featuresTitle}>Explore your destiny</h2>
          <p className={styles.featuresDescription}>
            Explore your destiny with our Palmistry Scanner, which analyzes the lines and shapes of your hands to provide guidance on your life path and relationships.
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

        <p className={styles.privacyText}>
          ✓ Your data is 100% secure and private. We respect your privacy.
        </p>
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

export default PalmistryLanding;
