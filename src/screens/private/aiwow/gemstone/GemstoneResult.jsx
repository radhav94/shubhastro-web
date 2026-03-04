import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from './GemstoneResult.module.scss';
import { Toast } from '../../../../component';
import { PATH } from '../../../../utils/routes/Paths';

const GemstoneResult = () => {
  const navigate = useNavigate();
  const [gemstones, setGemstones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGemstoneIndex, setSelectedGemstoneIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dropdown states for Suitability tab
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const reduxResult = useSelector((state) => state.aiwow.gemstone.result);
  const reduxImage = useSelector((state) => state.aiwow.gemstone.image);

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
        navigate(PATH.privateRoutes.GEMSTONE_INSTRUCTIONS.path, { replace: true });
        return;
      }
    } else {
      Toast.error('No analysis results found');
      navigate(PATH.privateRoutes.GEMSTONE_INSTRUCTIONS.path, { replace: true });
      return;
    }
    setLoading(false);
  }, [reduxResult, reduxImage, navigate]);

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
      <div className={styles.overviewRow}>
        <div className={styles.gemstoneImageWrapper}>
          <img src={d.image} alt="Gemstone" className={styles.gemstoneImage} />
        </div>
        <div className={styles.identificationCard}>
          <h3 className={styles.cardTitle}>Gemstone Identification</h3>
          <InfoRow label="Name" value={d.identification.name} />
          <InfoRow label="Hindi Name" value={d.identification.hindiName} />
          <InfoRow label="Scientific" value={d.identification.scientificName} />
          <InfoRow label="Natural" value={d.identification.isNatural ? 'Yes' : 'No'} />
        </div>
        <div className={styles.summaryCard}>
          <h3 className={styles.cardTitle}>Overall Summary</h3>
          <p className={styles.summaryText}>{d.overall.summary}</p>
          <p className={styles.recommendationText}>{d.overall.recommendation}</p>
        </div>
      </div>
    </div>
  );

  // ─── DETAILS TAB ───
  const renderDetails = (d) => (
    <div className={styles.tabContent}>
      <div className={styles.detailsGrid}>
        {/* Quality */}
        <div className={styles.detailBox}>
          <h4 className={styles.boxTitle}>Quality</h4>
          <p className={styles.boxValue}>{d.details.quality || '—'}</p>
        </div>

        {/* Color */}
        {d.details.color && (
          <div className={styles.detailBox}>
            <h4 className={styles.boxTitle}>Color</h4>
            <InfoRow label="Primary" value={d.details.color.primary} />
            <InfoRow label="Secondary" value={d.details.color.secondary} />
          </div>
        )}

        {/* Clarity */}
        {d.details.clarity && (
          <div className={styles.detailBox}>
            <h4 className={styles.boxTitle}>Clarity</h4>
            <InfoRow label="Grade" value={d.details.clarity.grade} />
            {d.details.clarity.inclusions?.length > 0 && (
              <InfoRow label="Inclusions" value={d.details.clarity.inclusions.join(', ')} />
            )}
          </div>
        )}

        {/* Cut */}
        {d.details.cut && (
          <div className={styles.detailBox}>
            <h4 className={styles.boxTitle}>Cut</h4>
            <InfoRow label="Shape" value={d.details.cut.shape} />
            <InfoRow label="Quality" value={d.details.cut.quality} />
          </div>
        )}

        {/* Carat */}
        {d.details.estimatedCarat && (
          <div className={styles.detailBox}>
            <h4 className={styles.boxTitle}>Carat Weight</h4>
            <InfoRow label="Range" value={d.details.estimatedCarat.range} />
            <InfoRow label="Approx" value={`${d.details.estimatedCarat.approximate} ct`} />
          </div>
        )}

        {/* Treatment */}
        {d.details.treatment && (
          <div className={styles.detailBox}>
            <h4 className={styles.boxTitle}>Treatment</h4>
            <InfoRow label="Detected" value={d.details.treatment.isDetected ? 'Yes' : 'No'} />
            {d.details.treatment.description && (
              <p className={styles.boxDesc}>{d.details.treatment.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

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
      <div className={styles.dropdown}>
        <button className={styles.dropdownHeader} onClick={() => toggleSection('suitability')}>
          <div className={styles.dropdownTitleWrap}>
            <h3 className={styles.dropdownTitle}>Suitability Analysis</h3>
            {d.suitability.score && (
              <span className={styles.scoreBadge}>{d.suitability.score} - {d.suitability.level}</span>
            )}
          </div>
          <Arrow isOpen={openSections.suitability} />
        </button>
        {openSections.suitability && (
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
        <div className={styles.dropdown}>
          <button className={styles.dropdownHeader} onClick={() => toggleSection('wearing')}>
            <h3 className={styles.dropdownTitle}>Wearing Guidelines</h3>
            <Arrow isOpen={openSections.wearing} />
          </button>
          {openSections.wearing && (
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
      <div className={styles.dropdown}>
        <button className={styles.dropdownHeader} onClick={() => toggleSection('healing')}>
          <h3 className={styles.dropdownTitle}>Healing Properties</h3>
          <Arrow isOpen={openSections.healing} />
        </button>
        {openSections.healing && (
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
        <div className={styles.dropdown}>
          <button className={styles.dropdownHeader} onClick={() => toggleSection('compatibility')}>
            <h3 className={styles.dropdownTitle}>Gemstone Compatibility</h3>
            <Arrow isOpen={openSections.compatibility} />
          </button>
          {openSections.compatibility && (
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
      {d.market && (
        <div className={styles.dropdown}>
          <button className={styles.dropdownHeader} onClick={() => toggleSection('market')}>
            <h3 className={styles.dropdownTitle}>Market Information</h3>
            <Arrow isOpen={openSections.market} />
          </button>
          {openSections.market && (
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
      )}
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
    <div className={styles.container}>
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate("/aiwow/gemstone-authenticity")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.title}>Gemstone Analysis</h1>
        </div>
      </header>

      <div className={styles.tabsWrap}>
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
      </div>

      <div className={styles.content}>
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

        

        {activeTab === 'overview' && renderOverview(currentGemstone)}
        {activeTab === 'details' && renderDetails(currentGemstone)}
        {activeTab === 'astrological' && renderAstrological(currentGemstone)}
        {activeTab === 'suitability' && renderSuitability(currentGemstone)}
        {activeTab === 'healing' && renderHealing(currentGemstone)}

        <button 
          className={styles.consultButton}
          onClick={() => navigate(PATH.privateRoutes.TALK_TO_ASTROLOGER.path)}
        >
          Consult with Expert Astrologer
        </button>
      </div>
    </div>
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
