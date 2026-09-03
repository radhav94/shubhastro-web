import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
// import { Link } from 'react-router-dom'; // re-add when "Ask Shubh AI" is restored
import { BsChatDots } from 'react-icons/bs';
import { MdOutlinePhoneInTalk } from 'react-icons/md';
import { Download, Share2 } from 'lucide-react'; // Sparkles removed with hidden "Ask Shubh AI" button
import styles from './GemstoneResult.module.scss';
import { Toast } from '../../../../component';
import { PATH } from '../../../../utils/routes/Paths';
import TTSButton from '../../../../component/UI/TTSButton';
import DownloadReportModal from '../components/DownloadReportModal';
import SubscriptionModal from '../../../../component/UI/modal/SubscriptionModal/SubscriptionModal';
import RecommendedAstrologersModal from '../../../../component/UI/modal/RecommendedAstrologersModal/RecommendedAstrologersModal';
import useRecommendationOffer from '../../../../utils/hooks/useRecommendationOffer';
import { useAIWowDownload } from '../hooks/useAIWowDownload';
import { useGetAiWowPageDataQuery } from '../../../../redux/api/aiwow/aiwowApi';

// Decorative corner flourishes — the same wave art used on the Rashi / Muhurat
// report cards (top-right and bottom-left corners).
import cardFlourish from '../../../../assets/images/rashi/decor/hero-flourish.png';
import cardFlourishLeft from '../../../../assets/images/rashi/decor/hero-flourish-left.png';

// Detail / astrological icons provided in src/assets/gemstone-details.
import detailIcon1 from '../../../../assets/gemstone-details/icon-1.png';
import detailIcon2 from '../../../../assets/gemstone-details/icon-2.png';
import detailIcon3 from '../../../../assets/gemstone-details/icon-3.png';
import detailIcon4 from '../../../../assets/gemstone-details/icon-4.png';
import detailIcon5 from '../../../../assets/gemstone-details/icon-5.png';
import detailIcon6 from '../../../../assets/gemstone-details/icon-6.png';
import detailIcon7 from '../../../../assets/gemstone-details/icon-7.png';
import detailIcon8 from '../../../../assets/gemstone-details/icon-8.png';
import detailIcon9 from '../../../../assets/gemstone-details/icon-9.png';
import detailIcon10 from '../../../../assets/gemstone-details/icon-10.png';
import detailIcon11 from '../../../../assets/gemstone-details/icon-11.png';
import detailsHeaderIcon from '../../../../assets/gemstone-details/icon-details-header.png';

const GemstoneResult = () => {
  const navigate = useNavigate();
  const [gemstones, setGemstones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGemstoneIndex, setSelectedGemstoneIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dropdown states for Suitability tab
  const [openSections, setOpenSections] = useState({});
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSection = (key) => {
    // Only toggle on mobile/tablet
    if (!isDesktop) {
      setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  // Same two-stage recommendation popup as the Rashi / Face / Muhurat reports.
  const recommendation = useRecommendationOffer();

  // The back button shows the discounted offer once as an exit-intent prompt;
  // after that (or once a connection is under way) Back leaves the report.
  const backOfferShownRef = useRef(false);
  const handleBack = () => {
    // Popup already open -> step back inside it (escalate plain -> offer, or
    // close the offer) instead of leaving the report.
    if (recommendation.isOpen) {
      recommendation.dismiss();
      return;
    }
    // First Back press -> show the discounted astrologers offer instead of
    // navigating away.
    if (!backOfferShownRef.current) {
      backOfferShownRef.current = true;
      recommendation.openOffer('chat');
      return;
    }
    // Offer already shown -> leave the report.
    navigate(PATH.privateRoutes.GEMSTONE_LANDING.path[0], { replace: true });
  };

  const reduxResult = useSelector((state) => state.aiwow.gemstone.result);
  const reduxImage = useSelector((state) => state.aiwow.gemstone.image);

  const { data: aiwowData } = useGetAiWowPageDataQuery();
  const featureTitle = aiwowData?.data?.list?.flatMap(s => s.content || [])?.find(f => f.slug === 'gemstone-authenticity')?.title || 'Gemstone Analysis';

  const downloadResultData = useMemo(() => {
    if (!reduxResult) return null;
    const { pdfPath, data, ...rest } = reduxResult;
    const cleanData = data ? (() => { const { pdfPath: _p, ...d } = data; return d; })() : undefined;
    const result = cleanData !== undefined ? { ...rest, data: cleanData } : rest;
    if (result.featureName) return result;
    return { ...result, featureName: 'Gemstone Scanner' };
  }, [reduxResult]);

  const {
    isDownloading, showDownloadModal, setShowDownloadModal,
    isAlreadyDownloaded, downloadPrice, walletBalance,
    handleDownloadClick, handleConfirmDownload,
    showSubscriptionModal, setShowSubscriptionModal, subscriptionModalVariant, extendedPlans,
  } = useAIWowDownload({ resultData: downloadResultData });

  useEffect(() => {
    if (reduxResult) {
      try {
        const apiData = reduxResult.data || reduxResult;
        const gemstonesArray = apiData.gemstones || [apiData];
        const processedGemstones = gemstonesArray.map((gemstone) => ({
          image: apiData.gemstoneImage || reduxImage,
          identification: gemstone.gemstoneIdentification || {},
          details: gemstone.gemstoneDetails || {},
          astrological: gemstone.astrologicalProperties || {},
          suitability: gemstone.suitabilityAnalysis || {},
          wearing: gemstone.wearingGuidelines || {},
          healing: gemstone.healingProperties || {},
          compatibility: gemstone.compatibility || {},
          market: gemstone.marketInfo || {},
          overall: gemstone.overallReading || {},
          personalized: gemstone.personalizedInsights || {},
          confidenceScore: gemstone.confidenceScore || 85,
        }));
        setGemstones(processedGemstones);
      } catch (error) {
        console.error('Error parsing result:', error);
        Toast.error('Failed to load analysis results');
        navigate('/ai-wow/gemstone-authenticity', { replace: true });
        return;
      }
    } else {
      Toast.error('No analysis results found');
      navigate('/ai-wow/gemstone-authenticity', { replace: true });
      return;
    }
    setLoading(false);
  }, [reduxResult, reduxImage, navigate]);

  // Share the report via the native share sheet, falling back to copying the URL.
  const handleShare = async () => {
    const shareData = {
      title: `${featureTitle} Report`,
      text: 'Check your Gemstone Authenticity report on ShubhAstro.',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      Toast.success('Link copied to clipboard');
    } catch {
      // User dismissed the share sheet, or the API is unavailable — ignore.
    }
  };

  // ─── Dropdown Arrow Component ───
  const Arrow = ({ isOpen }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // ─── OVERVIEW TAB ───
  const renderOverview = (d) => (
    <div className={styles.tabContent}>
      {/* Image + identification + overall summary now live in the top banner
          (see the render below); the Overview tab shows the personalized
          insights only. */}

      {/* Personalized Insights */}
      {d.personalized && Object.keys(d.personalized).length > 0 && (
        <div className={styles.personalizedSection}>
          <h3 className={styles.sectionTitle}>Personalized Insights</h3>
          <div className={styles.personalizedGrid}>
            {Object.entries(d.personalized).map(([key, value]) => {
              if (!value) return null;

              const title = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, s => s.toUpperCase())
                .trim();

              // Handle arrays
              if (Array.isArray(value)) {
                if (value.length === 0) return null;
                return (
                  <div className={styles.personalizedCard} key={key} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                      <TTSButton text={`${title}. ${value.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join('. ')}`} />
                    </span>
                    <h4 className={styles.boxTitle}>{title}</h4>
                    <ul className={styles.compactList}>
                      {value.map((item, i) => (
                        <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                      ))}
                    </ul>
                  </div>
                );
              }

              // Handle objects
              if (typeof value === 'object') {
                return (
                  <div className={styles.personalizedCard} key={key} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                      <TTSButton text={`${title}. ${Object.entries(value).filter(([, v]) => v).map(([k, v]) => {
                        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
                        if (Array.isArray(v)) return label + ': ' + v.join(', ');
                        return label + ': ' + String(v);
                      }).join('. ')}`} />
                    </span>
                    <h4 className={styles.boxTitle}>{title}</h4>
                    {Object.entries(value).map(([subKey, subVal]) => {
                      if (!subVal) return null;
                      if (Array.isArray(subVal)) {
                        return (
                          <div key={subKey}>
                            <InfoRow label={subKey.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()} value="" />
                            <ul className={styles.compactList}>
                              {subVal.map((item, i) => (
                                <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      return <InfoRow key={subKey} label={subKey.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()} value={String(subVal)} />;
                    })}
                  </div>
                );
              }

              // Handle strings/numbers
              return (
                <div className={styles.personalizedCard} key={key} style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                    <TTSButton text={`${title}. ${String(value)}`} />
                  </span>
                  <h4 className={styles.boxTitle}>{title}</h4>
                  <p className={styles.boxDesc}>{String(value)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // ─── DETAILS TAB ───
  const renderDetails = (d) => {
    // Build the "physical detail" items from whatever the API returned so each
    // renders as a colored-icon card with label:value rows.
    const detailItems = [];

    if (d.details.quality) {
      detailItems.push({
        key: 'quality', title: 'Quality', icon: detailIcon1,
        rows: [{ label: 'Grade', value: d.details.quality }],
      });
    }
    if (d.details.color && (d.details.color.primary || d.details.color.secondary)) {
      detailItems.push({
        key: 'color', title: 'Color', icon: detailIcon2,
        rows: [
          { label: 'Primary', value: d.details.color.primary },
          { label: 'Secondary', value: d.details.color.secondary },
        ],
      });
    }
    if (d.details.clarity && (d.details.clarity.grade || d.details.clarity.inclusions?.length)) {
      detailItems.push({
        key: 'clarity', title: 'Clarity', icon: detailIcon3,
        rows: [
          { label: 'Grade', value: d.details.clarity.grade },
          d.details.clarity.inclusions?.length > 0
            ? { label: 'Inclusions', value: d.details.clarity.inclusions.join(', ') }
            : null,
        ].filter(Boolean),
      });
    }
    if (d.details.cut && (d.details.cut.shape || d.details.cut.quality)) {
      detailItems.push({
        key: 'cut', title: 'Cut', icon: detailIcon4,
        rows: [
          { label: 'Shape', value: d.details.cut.shape },
          { label: 'Quality', value: d.details.cut.quality },
        ],
      });
    }
    if (d.details.estimatedCarat && (d.details.estimatedCarat.range || d.details.estimatedCarat.approximate)) {
      detailItems.push({
        key: 'carat', title: 'Carat Weight', icon: detailIcon5,
        rows: [
          { label: 'Range', value: d.details.estimatedCarat.range },
          d.details.estimatedCarat.approximate
            ? { label: 'Approx', value: `${d.details.estimatedCarat.approximate} ct` }
            : null,
        ].filter(Boolean),
      });
    }
    if (d.details.treatment) {
      detailItems.push({
        key: 'treatment', title: 'Treatment', icon: detailIcon6,
        rows: [{ label: 'Detected', value: d.details.treatment.isDetected ? 'Yes' : 'No' }],
        desc: d.details.treatment.description,
      });
    }

    const detailsTTS = detailItems
      .map((it) => `${it.title}. ${it.rows.map((r) => `${r.label}: ${r.value}`).join('. ')}${it.desc ? '. ' + it.desc : ''}`)
      .join('. ');

    // Astrological property rows: colored icon + title + tinted badge + description.
    const astroItems = [];
    if (d.astrological.rulingPlanet) {
      astroItems.push({
        key: 'planet', title: 'Ruling Planet', tint: '#f59e0b', icon: detailIcon7,
        badge: d.astrological.rulingPlanet.planet, desc: d.astrological.rulingPlanet.influence,
      });
    }
    if (d.astrological.zodiacSigns) {
      astroItems.push({
        key: 'zodiac', title: 'Zodiac Signs', tint: '#8b5cf6', icon: detailIcon8,
        badge: d.astrological.zodiacSigns.primary,
        desc: d.astrological.zodiacSigns.secondary?.length > 0
          ? `Also: ${d.astrological.zodiacSigns.secondary.join(', ')}` : '',
      });
    }
    if (d.astrological.chakra) {
      astroItems.push({
        key: 'chakra', title: 'Chakra', tint: '#22c55e', icon: detailIcon9,
        badge: d.astrological.chakra.name, desc: d.astrological.chakra.benefits,
      });
    }
    if (d.astrological.element) {
      astroItems.push({
        key: 'element', title: 'Element', tint: '#ef4444', icon: detailIcon10,
        badge: d.astrological.element, desc: '',
      });
    }
    if (d.astrological.numerology) {
      astroItems.push({
        key: 'numerology', title: 'Numerology', tint: '#0ea5e9', icon: detailIcon11,
        badge: String(d.astrological.numerology.number), desc: d.astrological.numerology.significance,
      });
    }

    const astroTTS = astroItems
      .map((it) => `${it.title}. ${it.badge}${it.desc ? '. ' + it.desc : ''}`)
      .join('. ');

    return (
      <div className={styles.tabContent}>
        {/* ── Details card ── */}
        {detailItems.length > 0 && (
          <div className={styles.detailCard}>
            <div className={styles.detailCardHead}>
              <h3 className={styles.detailCardTitle}>
                <span className={styles.detailCardIcon} aria-hidden="true">
                  <img src={detailsHeaderIcon} alt="" />
                </span>
                Details
              </h3>
              <TTSButton text={`Details. ${detailsTTS}`} />
            </div>

            <div className={styles.detailItemsGrid}>
              {detailItems.map((it) => (
                <div className={styles.detailItem} key={it.key}>
                  <div className={styles.detailItemHead}>
                    <span className={styles.detailItemIcon} aria-hidden="true">
                      <img src={it.icon} alt="" />
                    </span>
                    <span className={styles.detailItemTitle}>{it.title}</span>
                  </div>
                  <div className={styles.detailItemRows}>
                    {it.rows.map((r, i) => (
                      <div className={styles.detailItemRow} key={i}>
                        <span className={styles.detailItemLabel}>{r.label}</span>
                        <span className={styles.detailItemValue}>{r.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                  {it.desc && <p className={styles.detailItemDesc}>{it.desc}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Astrological Properties card ── */}
        {astroItems.length > 0 && (
          <div className={styles.detailCard}>
            <div className={styles.detailCardHead}>
              <h3 className={styles.detailCardTitle}>
                <span className={styles.detailCardIcon} aria-hidden="true">✨</span>
                Astrological Properties
              </h3>
              <TTSButton text={`Astrological Properties. ${astroTTS}`} />
            </div>

            <div className={styles.astroList}>
              {astroItems.map((it) => (
                <div className={styles.astroRow} key={it.key}>
                  <span className={styles.astroRowIcon} aria-hidden="true">
                    <img src={it.icon} alt="" />
                  </span>
                  <div className={styles.astroRowBody}>
                    <div className={styles.astroRowTop}>
                      <span className={styles.astroRowTitle}>{it.title}</span>
                      {it.badge && (
                        <span
                          className={styles.astroRowBadge}
                          style={{ color: it.tint, background: `${it.tint}1f` }}
                        >
                          {it.badge}
                        </span>
                      )}
                    </div>
                    {it.desc && <p className={styles.astroRowDesc}>{it.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── ASTROLOGICAL TAB ───
  const renderAstrological = (d) => (
    <div className={styles.tabContent}>
      <div className={styles.astroGrid}>
        {d.astrological.rulingPlanet && (
          <div className={styles.astroBox}>
            <h4 className={styles.boxTitle}>Ruling Planet</h4>
            <p className={styles.boxHighlight}>{d.astrological.rulingPlanet.planet}</p>
            <p className={styles.boxDesc}>{d.astrological.rulingPlanet.influence}</p>
          </div>
        )}

        {d.astrological.zodiacSigns && (
          <div className={styles.astroBox}>
            <h4 className={styles.boxTitle}>Zodiac Signs</h4>
            <p className={styles.boxHighlight}>{d.astrological.zodiacSigns.primary}</p>
            {d.astrological.zodiacSigns.secondary?.length > 0 && (
              <p className={styles.boxDesc}>Also: {d.astrological.zodiacSigns.secondary.join(', ')}</p>
            )}
          </div>
        )}

        {d.astrological.chakra && (
          <div className={styles.astroBox}>
            <h4 className={styles.boxTitle}>Chakra</h4>
            <p className={styles.boxHighlight}>{d.astrological.chakra.name}</p>
            <p className={styles.boxDesc}>{d.astrological.chakra.benefits}</p>
          </div>
        )}

        {d.astrological.element && (
          <div className={styles.astroBox}>
            <h4 className={styles.boxTitle}>Element</h4>
            <p className={styles.boxHighlight}>{d.astrological.element}</p>
          </div>
        )}

        {d.astrological.numerology && (
          <div className={styles.astroBox}>
            <h4 className={styles.boxTitle}>Numerology</h4>
            <p className={styles.boxHighlight}>{d.astrological.numerology.number}</p>
            <p className={styles.boxDesc}>{d.astrological.numerology.significance}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ─── SUITABILITY TAB (with dropdowns) ───
  const renderSuitability = (d) => (
    <div className={styles.tabContent}>
      {/* Suitability Analysis - Dropdown */}
      <div className={`${styles.dropdown} ${isDesktop ? styles.alwaysOpen : ''}`} style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', top: '8px', right: '40px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
          <TTSButton text={`Suitability Analysis. Score: ${d.suitability.score || ''} ${d.suitability.level || ''}${d.suitability.forDasha ? '. For Dasha: ' + d.suitability.forDasha : ''}${d.suitability.benefits?.length > 0 ? '. Benefits: ' + d.suitability.benefits.join(', ') : ''}${d.suitability.cautions?.length > 0 ? '. Cautions: ' + d.suitability.cautions.join(', ') : ''}`} />
        </span>
        <button className={styles.dropdownHeader} onClick={() => toggleSection('suitability')}>
          <div className={styles.dropdownTitleWrap}>
            <h3 className={styles.dropdownTitle}>Suitability Analysis</h3>
            {d.suitability.score && (
              <span className={styles.scoreBadge}>{d.suitability.score} - {d.suitability.level}</span>
            )}
          </div>
          {!isDesktop && <Arrow isOpen={openSections.suitability} />}
        </button>
        {(isDesktop || openSections.suitability) && (
          <div className={styles.dropdownBody}>
            <div className={styles.suitRow}>
              {d.suitability.forDasha && (
                <div className={styles.suitBox}>
                  <h4 className={styles.boxTitle}>For Dasha</h4>
                  <p className={styles.boxValue}>{d.suitability.forDasha}</p>
                </div>
              )}
              {d.suitability.benefits?.length > 0 && (
                <div className={styles.suitBox}>
                  <h4 className={styles.boxTitle}>Benefits</h4>
                  <ul className={styles.compactList}>
                    {d.suitability.benefits.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}
              {d.suitability.cautions?.length > 0 && (
                <div className={styles.suitBox}>
                  <h4 className={styles.boxTitle}>Cautions</h4>
                  <ul className={styles.compactList}>
                    {d.suitability.cautions.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Wearing Guidelines - Dropdown */}
      {d.wearing && (
        <div className={`${styles.dropdown} ${isDesktop ? styles.alwaysOpen : ''}`} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '8px', right: '40px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <TTSButton text={`Wearing Guidelines. Best Day: ${d.wearing.bestDay || ''}. Best Time: ${d.wearing.bestTime || ''}. Finger: ${d.wearing.finger || ''}. Hand: ${d.wearing.hand || ''}. Metal: ${d.wearing.metal || ''}. Weight: ${d.wearing.weight || ''}${d.wearing.mantra ? '. Mantra: ' + d.wearing.mantra : ''}${d.wearing.activationRitual ? '. Activation Ritual: ' + d.wearing.activationRitual : ''}`} />
          </span>
          <button className={styles.dropdownHeader} onClick={() => toggleSection('wearing')}>
            <h3 className={styles.dropdownTitle}>Wearing Guidelines</h3>
            {!isDesktop && <Arrow isOpen={openSections.wearing} />}
          </button>
          {(isDesktop || openSections.wearing) && (
            <div className={styles.dropdownBody}>
              <div className={styles.suitRow}>
                <div className={styles.suitBox}>
                  <h4 className={styles.boxTitle}>When to Wear</h4>
                  <InfoRow label="Best Day" value={d.wearing.bestDay} />
                  <InfoRow label="Best Time" value={d.wearing.bestTime} />
                </div>
                <div className={styles.suitBox}>
                  <h4 className={styles.boxTitle}>How to Wear</h4>
                  <InfoRow label="Finger" value={d.wearing.finger} />
                  <InfoRow label="Hand" value={d.wearing.hand} />
                  <InfoRow label="Metal" value={d.wearing.metal} />
                  <InfoRow label="Weight" value={d.wearing.weight} />
                </div>
                {(d.wearing.mantra || d.wearing.activationRitual) && (
                  <div className={styles.suitBox}>
                    <h4 className={styles.boxTitle}>Ritual</h4>
                    {d.wearing.mantra && <p className={styles.mantraText}>{d.wearing.mantra}</p>}
                    {d.wearing.activationRitual && <p className={styles.boxDesc}>{d.wearing.activationRitual}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ─── HEALING TAB (with dropdowns) ───
  const renderHealing = (d) => (
    <div className={styles.tabContent}>
      {/* Healing Properties - Dropdown */}
      <div className={`${styles.dropdown} ${isDesktop ? styles.alwaysOpen : ''}`} style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', top: '8px', right: '40px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
          <TTSButton text={`Healing Properties. ${d.healing.physical?.length > 0 ? 'Physical: ' + d.healing.physical.join(', ') + '. ' : ''}${d.healing.emotional?.length > 0 ? 'Emotional: ' + d.healing.emotional.join(', ') + '. ' : ''}${d.healing.spiritual?.length > 0 ? 'Spiritual: ' + d.healing.spiritual.join(', ') : ''}`} />
        </span>
        <button className={styles.dropdownHeader} onClick={() => toggleSection('healing')}>
          <h3 className={styles.dropdownTitle}>Healing Properties</h3>
          {!isDesktop && <Arrow isOpen={openSections.healing} />}
        </button>
        {(isDesktop || openSections.healing) && (
          <div className={styles.dropdownBody}>
            <div className={styles.suitRow}>
              {d.healing.physical?.length > 0 && (
                <div className={styles.suitBox}>
                  <h4 className={styles.boxTitle}>Physical</h4>
                  <ul className={styles.compactList}>
                    {d.healing.physical.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
              {d.healing.emotional?.length > 0 && (
                <div className={styles.suitBox}>
                  <h4 className={styles.boxTitle}>Emotional</h4>
                  <ul className={styles.compactList}>
                    {d.healing.emotional.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
              {d.healing.spiritual?.length > 0 && (
                <div className={styles.suitBox}>
                  <h4 className={styles.boxTitle}>Spiritual</h4>
                  <ul className={styles.compactList}>
                    {d.healing.spiritual.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Compatibility - Dropdown */}
      {d.compatibility && (
        <div className={`${styles.dropdown} ${isDesktop ? styles.alwaysOpen : ''}`} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '8px', right: '40px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <TTSButton text={`Gemstone Compatibility. ${d.compatibility.compatibleGemstones?.length > 0 ? 'Compatible: ' + d.compatibility.compatibleGemstones.join(', ') + '. ' : ''}${d.compatibility.incompatibleGemstones?.length > 0 ? 'Incompatible: ' + d.compatibility.incompatibleGemstones.join(', ') + '. ' : ''}${d.compatibility.stackingAdvice ? 'Stacking Advice: ' + d.compatibility.stackingAdvice : ''}`} />
          </span>
          <button className={styles.dropdownHeader} onClick={() => toggleSection('compatibility')}>
            <h3 className={styles.dropdownTitle}>Gemstone Compatibility</h3>
            {!isDesktop && <Arrow isOpen={openSections.compatibility} />}
          </button>
          {(isDesktop || openSections.compatibility) && (
            <div className={styles.dropdownBody}>
              <div className={styles.suitRow}>
                {d.compatibility.compatibleGemstones?.length > 0 && (
                  <div className={styles.suitBox}>
                    <h4 className={styles.boxTitle}>Compatible</h4>
                    <p className={styles.compatibleText}>{d.compatibility.compatibleGemstones.join(', ')}</p>
                  </div>
                )}
                {d.compatibility.incompatibleGemstones?.length > 0 && (
                  <div className={styles.suitBox}>
                    <h4 className={styles.boxTitle}>Incompatible</h4>
                    <p className={styles.incompatibleText}>{d.compatibility.incompatibleGemstones.join(', ')}</p>
                  </div>
                )}
                {d.compatibility.stackingAdvice && (
                  <div className={styles.suitBox}>
                    <h4 className={styles.boxTitle}>Stacking Advice</h4>
                    <p className={styles.boxDesc}>{d.compatibility.stackingAdvice}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Market Info - Dropdown */}
      {/* {d.market && (
        <div className={styles.dropdown}>
          <button className={styles.dropdownHeader} onClick={() => toggleSection('market')}>
            <h3 className={styles.dropdownTitle}>Market Information</h3>
            {!isDesktop && <Arrow isOpen={openSections.market} />}
          </button>
          {(isDesktop || openSections.market) && (
            <div className={styles.dropdownBody}>
              <div className={styles.suitRow}>
                {d.market.priceRange && (
                  <div className={styles.suitBox}>
                    <h4 className={styles.boxTitle}>Price Range</h4>
                    <p className={styles.boxHighlight}>
                      ₹{d.market.priceRange.low?.toLocaleString()} - ₹{d.market.priceRange.high?.toLocaleString()}
                    </p>
                  </div>
                )}
                {d.market.perCaratPrice && (
                  <div className={styles.suitBox}>
                    <h4 className={styles.boxTitle}>Per Carat</h4>
                    <p className={styles.boxHighlight}>{d.market.perCaratPrice}</p>
                  </div>
                )}
                {d.market.investmentGrade !== undefined && (
                  <div className={styles.suitBox}>
                    <h4 className={styles.boxTitle}>Investment Grade</h4>
                    <p className={styles.boxHighlight}>{d.market.investmentGrade ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )} */}
    </div>
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}><p>Loading results...</p></div>
      </div>
    );
  }

  if (!gemstones || gemstones.length === 0) return null;

  const currentGemstone = gemstones[selectedGemstoneIndex];

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
          <button className={styles.downloadButton} onClick={handleDownloadClick} disabled={isDownloading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 15V19A2 2 0 0119 21H5A2 2 0 013 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {isDownloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </header>

      
      
        {/* Duplicated Code  */}
      {/* <div className={styles.tabsWrap}>
        <div className={styles.tabs}>
            {['overview', 'details', 'astrological', 'suitability', 'healing'].map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
        </div>
      </div> */}

      <div className={styles.content}>
        {/* ── Banner ── */}
        <div className={styles.banner}>
          <div className={styles.bannerMain}>
            <div className={styles.bannerBadges}>
              <span className={styles.bannerBadge}>Gemstone Scan</span>
              <span className={styles.bannerBadge}>Authenticity Check</span>
              <span className={styles.bannerBadge}>Vedic Recommendation</span>
            </div>
            <h2 className={styles.bannerTitle}>Overall Summary</h2>
            {currentGemstone?.overall?.recommendation && (
              <p className={styles.bannerRecommendation}>
                {currentGemstone.overall.recommendation}
              </p>
            )}
            {currentGemstone?.overall?.summary && (
              <p className={styles.bannerSummary}>{currentGemstone.overall.summary}</p>
            )}

            <div className={styles.bannerFacts}>
              {currentGemstone?.identification?.name && (
                <div className={styles.bannerFact}>
                  <span className={styles.bannerFactHead}>
                    <span className={`${styles.bannerFactIcon} ${styles.factIconViolet}`} aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M6 3h12l4 6-10 12L2 9l4-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M2 9h20M8 3l-2 6 6 12 6-12-2-6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className={styles.bannerFactLabel}>Name</span>
                  </span>
                  <span className={styles.bannerFactValue}>{currentGemstone.identification.name}</span>
                </div>
              )}
              {currentGemstone?.identification?.hindiName && (
                <div className={styles.bannerFact}>
                  <span className={styles.bannerFactHead}>
                    <span className={`${styles.bannerFactIcon} ${styles.factIconOrange}`} aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M4 6h9M8.5 6c0 6-1 9-4 12M8 12c3 0 6 2 6 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 20l3.2-9 3.2 9M16 17.2h4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className={styles.bannerFactLabel}>Hindi Name</span>
                  </span>
                  <span className={styles.bannerFactValue}>{currentGemstone.identification.hindiName}</span>
                </div>
              )}
              {currentGemstone?.identification?.scientificName && (
                <div className={styles.bannerFact}>
                  <span className={styles.bannerFactHead}>
                    <span className={`${styles.bannerFactIcon} ${styles.factIconGold}`} aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M12 6l1 2 2 .3-1.5 1.5.4 2.2L12 11l-1.9 1 .4-2.2L9 8.3l2-.3 1-2z" fill="currentColor" />
                        <path d="M9 14l-1.5 7L12 19l4.5 2L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className={styles.bannerFactLabel}>Scientific</span>
                  </span>
                  <span className={styles.bannerFactValue}>{currentGemstone.identification.scientificName}</span>
                </div>
              )}
              <div className={styles.bannerFact}>
                <span className={styles.bannerFactHead}>
                  <span className={`${styles.bannerFactIcon} ${styles.factIconPink}`} aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </span>
                  <span className={styles.bannerFactLabel}>Natural</span>
                </span>
                <span className={styles.bannerFactValue}>
                  {currentGemstone?.identification?.isNatural ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {currentGemstone?.image && (
            <div className={styles.bannerVisual}>
              <div className={styles.bannerImageFrame}>
                {/* extra two corner brackets (top-right, bottom-left); the other
                    two come from the frame's ::before/::after */}
                <span className={styles.frameCornerTR} aria-hidden="true" />
                <span className={styles.frameCornerBL} aria-hidden="true" />
                <img
                  src={currentGemstone.image}
                  alt={currentGemstone?.identification?.name || 'Gemstone'}
                  className={styles.bannerImage}
                />
                <span className={styles.scanComplete}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Stone Scan Complete
                </span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.layout}>
          {/* Tabs live directly in the layout grid (not inside .main) so that on
              mobile they can order above the "Your Gemstone" sidebar card, with
              the tab content below both. */}
          {gemstones.length > 1 && (
            <div className={styles.gemstoneTabs}>
              {gemstones.map((gemstone, index) => (
                <button
                  key={index}
                  className={`${styles.gemstoneTab} ${selectedGemstoneIndex === index ? styles.active : ''}`}
                  onClick={() => { setSelectedGemstoneIndex(index); setActiveTab('overview'); }}
                >
                  {gemstone.identification.name || `Gemstone ${index + 1}`}
                </button>
              ))}
            </div>
          )}

          <div className={styles.tabs}>
            {[
              { id: 'overview', label: 'Personalized Insights' },
              { id: 'details', label: 'Details' },
              { id: 'suitability', label: 'Suitability' },
              { id: 'healing', label: 'Healing' },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.main}>
            {activeTab === 'overview' && renderOverview(currentGemstone)}
            {activeTab === 'details' && renderDetails(currentGemstone)}
            {/* {activeTab === 'astrological' && renderAstrological(currentGemstone)} */}
            {activeTab === 'suitability' && renderSuitability(currentGemstone)}
            {activeTab === 'healing' && renderHealing(currentGemstone)}
          </div>

          {/* Sticky recommendation sidebar — same Call/Chat/Ask Shubh AI popup
              flow as the Rashi / Face / Muhurat reports. On mobile it sits right
              below the tabs pill (above the tab content). */}
          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              {/* Decorative wave flourishes — top-right and bottom-left corners,
                  reusing the Rashi / Muhurat report art. Behind the content. */}
              <img src={cardFlourish} alt="" aria-hidden="true" className={styles.sideFlourish} />
              <img src={cardFlourishLeft} alt="" aria-hidden="true" className={styles.sideFlourishLeft} />

              {/* Download + share actions, top-right of the card. */}
              <div className={styles.sideCardActions}>
                <button
                  type="button"
                  className={styles.sideIconBtn}
                  onClick={handleDownloadClick}
                  disabled={isDownloading}
                  aria-label="Download report"
                  title="Download"
                >
                  <Download size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.sideIconBtn}
                  onClick={handleShare}
                  aria-label="Share report"
                  title="Share"
                >
                  <Share2 size={16} aria-hidden="true" />
                </button>
              </div>

              {/* Inner glass panel holding the summary + chips. */}
              <div className={styles.sidePanel}>
                <p className={styles.sideKicker}>Your Gemstone</p>
                <h3 className={styles.sideTitle}>
                  {currentGemstone?.overall?.title || currentGemstone?.identification?.name || 'Overall Summary'}
                </h3>
                {currentGemstone?.overall?.summary && (
                  <p className={styles.sideBody}>{currentGemstone.overall.summary}</p>
                )}

                {/* Identification chips (name / hindi / scientific / natural). */}
                {(() => {
                  const id = currentGemstone?.identification || {};
                  const chips = [
                    id.name && { label: id.name, tone: 'violet' },
                    id.hindiName && { label: id.hindiName, tone: 'orange' },
                    id.scientificName && { label: id.scientificName, tone: 'gold' },
                    { label: id.isNatural ? 'Natural' : 'Treated', tone: 'pink' },
                  ].filter(Boolean);
                  return chips.length > 0 ? (
                    <div className={styles.sideChips}>
                      {chips.map((chip, i) => (
                        <span
                          key={i}
                          className={`${styles.sideChip} ${styles[`chip${chip.tone.charAt(0).toUpperCase() + chip.tone.slice(1)}`]}`}
                        >
                          {chip.label}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>

              <div className={styles.actions}>
                {/* Real <a href> so middle-click / open-in-new-tab still reach
                    the listing; the click opens the matched popup first. */}
                <a
                  href={PATH.privateRoutes.ASTROLOGERS_LIST.path}
                  className={styles.actionPrimary}
                  onClick={(event) => { event.preventDefault(); recommendation.open('audio'); }}
                >
                  <MdOutlinePhoneInTalk size={15} aria-hidden="true" /> Call an astrologer
                </a>
                <a
                  href="/chat-with-astrologers"
                  className={styles.actionSecondary}
                  onClick={(event) => { event.preventDefault(); recommendation.open('chat'); }}
                >
                  <BsChatDots size={14} aria-hidden="true" /> Chat with astrologer
                </a>
                {/* Ask Shubh AI hidden for now
                <Link to="/ai-wow" className={styles.actionTertiary}>
                  <Sparkles size={14} aria-hidden="true" /> Ask Shubh AI · Free
                </Link>
                */}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <DownloadReportModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleConfirmDownload}
        featureName={`${featureTitle} Report`}
        downloadCost={downloadPrice}
        walletBalance={walletBalance ?? 0}
        isDownloading={isDownloading}
        showLanguageSelection={false}
      />
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        variant={subscriptionModalVariant}
        plans={subscriptionModalVariant === 'extended' ? extendedPlans : undefined}
      />

      <RecommendedAstrologersModal
        isOpen={recommendation.isOpen}
        variant={recommendation.stage === 'offer' ? 'offer' : 'plain'}
        type={recommendation.type || 'chat'}
        onDismiss={recommendation.dismiss}
        onFinish={recommendation.finish}
        onNothingToOffer={recommendation.finish}
      />

      {/* Mobile-only fixed action bar. The "Your Gemstone" card's Call/Chat
          buttons are hidden on mobile; these pinned buttons take their place,
          matching the Face / Rashi report pattern. */}
      <div className={styles.mobileActionBar}>
        <a
          href="/chat-with-astrologers"
          className={styles.mobileActionChat}
          onClick={(event) => { event.preventDefault(); recommendation.open('chat'); }}
        >
          <BsChatDots size={16} aria-hidden="true" /> Chat with astrologer
        </a>
        <a
          href={PATH.privateRoutes.ASTROLOGERS_LIST.path}
          className={styles.mobileActionCall}
          onClick={(event) => { event.preventDefault(); recommendation.open('audio'); }}
        >
          <MdOutlinePhoneInTalk size={16} aria-hidden="true" /> Call an astrologer
        </a>
      </div>
    </div>
    </>
  );
};

// ─── Reusable InfoRow ───
const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className={styles.infoRow}>
      <span className={styles.label}>{label}:</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
};

export default GemstoneResult;
