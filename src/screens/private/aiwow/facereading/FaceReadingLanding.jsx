import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styles from './FaceReadingLanding.module.scss';
import SmileIcon from '../../../../assets/icons/Smile.png';
import CakeIcon from '../../../../assets/icons/Cake.png';
import FlowerIcon from '../../../../assets/icons/Flower.png';
import ContactsIcon from '../../../../assets/icons/Contacts.png';
import TTSButton from '../../../../component/UI/TTSButton';
import { getAIWowInstructionImage } from '../../../../utils/appImages';
import { setFaceReadingImage } from '../../../../redux/aiwow/aiwowSlice';
import { compressImage } from '../../../../utils/helper/compressImage';
import { trackEvent } from '../../../../utils/analytics';
import { useGetAiWowPageDataQuery } from '../../../../redux/api/aiwow/aiwowApi';
import { GuestKundliAuthModal } from '../../../../component/UI/Profile';
import toast from '../../../../component/toast';
import { preloadChunk } from '../../../../utils/helper/lazyWithRetry';

const FaceReadingLanding = () => {
  const navigate = useNavigate();

  /*
    Warm the face-detection payload while the visitor reads this screen.

    This screen navigates straight to /camera, and that route needs a lot
    before it can do anything, all of it discovered in series:

      useFaceDetection chunk       234 -> 510ms   140 KB
      model manifests              776 -> 933ms
      tiny_face_detector shard     935 -> 1496ms  189 KB
      face_landmark_68 shard       936 -> 1329ms  348 KB

    Measured against production. The model fetches cannot even begin until the
    chunk has landed and run loadFromUri, so 561 KB of weights start arriving
    three hops deep. Clarity reports 4.088s LCP for /camera and 5.192s for this
    landing on real devices.

    Both models are load-bearing — the landmark set is used for the face extent,
    the in-circle test and the mesh overlay — so this is about when they arrive,
    not whether they are needed.

    Deliberately at idle and with rel=prefetch, the lowest priority the browser
    has: this screen has its own LCP to make first, and warming must never
    compete with it. By the time the visitor has read the instructions and
    tapped through, the camera route finds all of it in cache.
  */
  useEffect(() => {
    const MODEL_FILES = [
      '/models/tiny_face_detector_model-weights_manifest.json',
      '/models/tiny_face_detector_model-shard1',
      '/models/face_landmark_68_model-weights_manifest.json',
      '/models/face_landmark_68_model-shard1',
    ];

    let links = [];
    const warm = () => {
      preloadChunk(() => import('../../../../utils/hooks/useFaceDetection'));
      try {
        links = MODEL_FILES.map((href) => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'fetch';
          link.href = href;
          /*
            No crossOrigin. These are same-origin files under /models, and
            face-api's loadFromUri fetches them in same-origin mode. Setting
            crossOrigin='anonymous' here makes the prefetch a CORS-mode request,
            which lands in the cache under a key the later fetch does not match
            — observed as 8 requests for 4 files, i.e. the warm downloaded 561 KB
            and then the camera downloaded it all again.
          */
          document.head.appendChild(link);
          return link;
        });
      } catch {
        /* best effort — the camera route still fetches these itself */
      }
    };

    /*
      Wait for `load` before even scheduling the idle callback.

      Measured without it: warming began at 459ms while this screen's own LCP
      landed at 476ms — idle fires very early on a fast connection, so the warm
      was starting just ahead of the paint it must never delay. rel=prefetch is
      the lowest priority the browser has and would probably not have cost
      anything measurable, but being strict here is free. Same ordering as
      __deferTagScript__ in index.html: load, then idle, with a ceiling.
    */
    let idleId = null;
    let timer = null;

    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(warm, { timeout: 2500 });
      } else {
        timer = setTimeout(warm, 1500);
      }
    };

    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
    }

    return () => {
      window.removeEventListener('load', schedule);
      if (idleId !== null) window.cancelIdleCallback?.(idleId);
      if (timer) clearTimeout(timer);
      links.forEach((l) => l.remove());
    };
  }, []);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  // True while the picked photo is being decoded/re-encoded, so the button can
  // show progress instead of looking idle.
  const [isPreparing, setIsPreparing] = useState(false);
  const pendingActionRef = useRef(null);
  const selectedProfile = useSelector((state) => state.aiwow.selectedKundliProfile);
  const gender = selectedProfile?.identity?.toLowerCase() || selectedProfile?.gender?.toLowerCase() || 'male';

  const { data: aiwowData } = useGetAiWowPageDataQuery();
  const featureTitle = aiwowData?.data?.list?.flatMap(s => s.content || [])?.find(f => f.slug === 'astro-face-reading')?.title || 'AI Powered Face Reading';

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

  const handleBack = () => {
    navigate(-1);
  };

  const handleCamera = () => {
    navigate('/ai-wow/astro-face-reading/camera', { replace: true });
  };

  const handleUpload = () => {
    if (isPreparing) {
      toast.info('Still preparing your photo — one moment.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const input = event.target;
    const file = input.files?.[0];

    // Clear the input straight away. Without this, picking the SAME photo again
    // fires no `change` event, so if the first attempt went nowhere the user's
    // retry did nothing at all — a dead end that looks exactly like a dead click.
    input.value = '';

    if (!file) return;

    trackEvent("shubh_ai_input_provided", { feature_name: "astro-face-reading", input_type: "image" });

    // compressImage re-encodes via canvas and waits up to 8s for a decode before
    // falling back. On a slow in-app WebView with a large iPhone HEIC that is a
    // long, completely unlit wait, which is what drives repeat taps.
    setIsPreparing(true);
    compressImage(file)
      .then((dataUrl) => {
        // Guests must authenticate at the moment the photo is submitted.
        runOrAuth(() => {
          dispatch(setFaceReadingImage(dataUrl));
          navigate('/ai-wow/astro-face-reading/capture', { replace: true });
        });
      })
      .catch((err) => {
        console.error('[FaceReading] Could not prepare the uploaded photo:', err);
        toast.error("Couldn't read that photo. Please try a different one.");
      })
      .finally(() => setIsPreparing(false));
  };

  const features = [
    {
      icon: SmileIcon,
      title: 'Emotion Recognition',
      description: 'Identify and interpret human emotions through facial expressions in real-time',
    },
    {
      icon: CakeIcon,
      title: 'Facial features',
      description: 'Analyze facial features to uncover personality traits, emotional patterns, and insights about an individuals character.'
    },
    {
      icon: FlowerIcon,
      title: 'Aura Reading',
      description: 'Analyze auras to reveal insights about your personality, emotional state, and spiritual well-being.',
    },
    {
      icon: ContactsIcon,
      title: 'Character Insights',
      description: 'Gain deep insights into your character, strengths and potential areas for personal growth through detailed face analysis.',
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
            {/* Tappable, because the corner brackets around it are viewfinder
                framing and it was being tapped as the capture control — see the
                note on .imageWrapper in the SCSS (Clarity 15hum1k). Same action
                as the "Use Camera" CTA below; handleCamera holds the guards.
                The corners are <span aria-hidden> so this is valid button
                content and they stay out of the accessibility tree. */}
            <button
              type="button"
              className={styles.imageWrapper}
              onClick={handleCamera}
              aria-label="Use camera to take your photo"
            >
              <img 
                src={getAIWowInstructionImage('faceReading', gender)} 
                alt="Face example" 
                className={styles.faceImage}
              />
              <span className={styles.frameCorner} style={{ top: 0, left: 0 }} aria-hidden="true" />
              <span className={styles.frameCorner} style={{ top: 0, right: 0 }} aria-hidden="true" />
              <span className={styles.frameCorner} style={{ bottom: 0, left: 0 }} aria-hidden="true" />
              <span className={styles.frameCorner} style={{ bottom: 0, right: 0 }} aria-hidden="true" />
            </button>

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

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    className={styles.uploadButton}
                    onClick={handleUpload}
                    aria-busy={isPreparing}
                  >
                    {isPreparing ? 'Preparing photo…' : 'Upload Photo'}
                  </button>
                  <button 
                    className={styles.cameraButton}
                    onClick={handleCamera}
                  >
                    Use Camera
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Section - Below */}
        <div className={styles.featuresWrapper}>
          <h2 className={styles.featuresTitle}>What you'll discover</h2>
          <p className={styles.featuresDescription}>
            Use AI Face Reading to reveal hidden aspects of yourself. Get personalized insights into your personality and potential through facial analysis.
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

export default FaceReadingLanding;
