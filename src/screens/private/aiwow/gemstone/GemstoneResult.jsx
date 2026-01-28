import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GemstoneResult.module.scss';
import { Toast } from '../../../../component';

const GemstoneResult = () => {
  const navigate = useNavigate();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const storedResult = localStorage.getItem('gemstoneResult');
    const storedImage = localStorage.getItem('gemstoneImage');
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        const apiData = parsedResult.data || parsedResult;
        
        setResultData({
          image: apiData.gemstoneImage || storedImage,
          identification: apiData.gemstoneIdentification || {},
          details: apiData.gemstoneDetails || {},
          astrological: apiData.astrologicalProperties || {},
          suitability: apiData.suitabilityAnalysis || {},
          wearing: apiData.wearingGuidelines || {},
          healing: apiData.healingProperties || {},
          compatibility: apiData.compatibility || {},
          market: apiData.marketInfo || {},
          overall: apiData.overallReading || {},
          confidenceScore: apiData.confidenceScore || 85,
        });
      } catch (error) {
        console.error('Error parsing result:', error);
        Toast.error('Failed to load analysis results');
        navigate('/aiwow/gemstone/instructions');
        return;
      }
    } else {
      Toast.error('No analysis results found');
      navigate('/aiwow/gemstone/instructions');
      return;
    }
    
    setLoading(false);
  }, [navigate]);

  const renderOverview = () => (
    <div className={styles.tabContent}>
      <div className={styles.gemstoneImageWrapper}>
        <img src={resultData.image} alt="Gemstone" className={styles.gemstoneImage} />
      </div>

      <div className={styles.identificationCard}>
        <h3 className={styles.cardTitle}>Gemstone Identification</h3>
        <div className={styles.infoRow}>
          <span className={styles.label}>Name:</span>
          <span className={styles.value}>{resultData.identification.name}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Hindi Name:</span>
          <span className={styles.value}>{resultData.identification.hindiName}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Scientific Name:</span>
          <span className={styles.value}>{resultData.identification.scientificName}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Natural:</span>
          <span className={styles.value}>{resultData.identification.isNatural ? 'Yes' : 'No'}</span>
        </div>
      </div>

      <div className={styles.summaryCard}>
        <h3 className={styles.cardTitle}>Overall Summary</h3>
        <p className={styles.summaryText}>{resultData.overall.summary}</p>
        <p className={styles.recommendationText}>{resultData.overall.recommendation}</p>
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className={styles.tabContent}>
      <div className={styles.detailsCard}>
        <h3 className={styles.cardTitle}>Quality & Characteristics</h3>
        <div className={styles.infoRow}>
          <span className={styles.label}>Quality:</span>
          <span className={styles.value}>{resultData.details.quality}</span>
        </div>
        
        {resultData.details.color && (
          <>
            <h4 className={styles.subTitle}>Color</h4>
            <div className={styles.infoRow}>
              <span className={styles.label}>Primary:</span>
              <span className={styles.value}>{resultData.details.color.primary}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Secondary:</span>
              <span className={styles.value}>{resultData.details.color.secondary}</span>
            </div>
          </>
        )}

        {resultData.details.clarity && (
          <>
            <h4 className={styles.subTitle}>Clarity</h4>
            <div className={styles.infoRow}>
              <span className={styles.label}>Grade:</span>
              <span className={styles.value}>{resultData.details.clarity.grade}</span>
            </div>
            {resultData.details.clarity.inclusions && resultData.details.clarity.inclusions.length > 0 && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Inclusions:</span>
                <span className={styles.value}>{resultData.details.clarity.inclusions.join(', ')}</span>
              </div>
            )}
          </>
        )}

        {resultData.details.cut && (
          <>
            <h4 className={styles.subTitle}>Cut</h4>
            <div className={styles.infoRow}>
              <span className={styles.label}>Shape:</span>
              <span className={styles.value}>{resultData.details.cut.shape}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Quality:</span>
              <span className={styles.value}>{resultData.details.cut.quality}</span>
            </div>
          </>
        )}

        {resultData.details.estimatedCarat && (
          <>
            <h4 className={styles.subTitle}>Carat Weight</h4>
            <div className={styles.infoRow}>
              <span className={styles.label}>Range:</span>
              <span className={styles.value}>{resultData.details.estimatedCarat.range}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Approximate:</span>
              <span className={styles.value}>{resultData.details.estimatedCarat.approximate} carats</span>
            </div>
          </>
        )}

        {resultData.details.treatment && (
          <>
            <h4 className={styles.subTitle}>Treatment</h4>
            <div className={styles.infoRow}>
              <span className={styles.label}>Detected:</span>
              <span className={styles.value}>{resultData.details.treatment.isDetected ? 'Yes' : 'No'}</span>
            </div>
            <p className={styles.treatmentDesc}>{resultData.details.treatment.description}</p>
          </>
        )}
      </div>
    </div>
  );

  const renderAstrological = () => (
    <div className={styles.tabContent}>
      <div className={styles.astroCard}>
        <h3 className={styles.cardTitle}>Astrological Properties</h3>
        
        {resultData.astrological.rulingPlanet && (
          <>
            <h4 className={styles.subTitle}>Ruling Planet</h4>
            <div className={styles.infoRow}>
              <span className={styles.label}>Planet:</span>
              <span className={styles.value}>{resultData.astrological.rulingPlanet.planet}</span>
            </div>
            <p className={styles.influenceText}>{resultData.astrological.rulingPlanet.influence}</p>
          </>
        )}

        {resultData.astrological.zodiacSigns && (
          <>
            <h4 className={styles.subTitle}>Zodiac Signs</h4>
            <div className={styles.infoRow}>
              <span className={styles.label}>Primary:</span>
              <span className={styles.value}>{resultData.astrological.zodiacSigns.primary}</span>
            </div>
            {resultData.astrological.zodiacSigns.secondary && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Secondary:</span>
                <span className={styles.value}>{resultData.astrological.zodiacSigns.secondary.join(', ')}</span>
              </div>
            )}
          </>
        )}

        {resultData.astrological.chakra && (
          <>
            <h4 className={styles.subTitle}>Chakra</h4>
            <div className={styles.infoRow}>
              <span className={styles.label}>Name:</span>
              <span className={styles.value}>{resultData.astrological.chakra.name}</span>
            </div>
            <p className={styles.benefitsText}>{resultData.astrological.chakra.benefits}</p>
          </>
        )}

        {resultData.astrological.element && (
          <div className={styles.infoRow}>
            <span className={styles.label}>Element:</span>
            <span className={styles.value}>{resultData.astrological.element}</span>
          </div>
        )}

        {resultData.astrological.numerology && (
          <>
            <h4 className={styles.subTitle}>Numerology</h4>
            <div className={styles.infoRow}>
              <span className={styles.label}>Number:</span>
              <span className={styles.value}>{resultData.astrological.numerology.number}</span>
            </div>
            <p className={styles.significanceText}>{resultData.astrological.numerology.significance}</p>
          </>
        )}
      </div>
    </div>
  );

  const renderSuitability = () => (
    <div className={styles.tabContent}>
      <div className={styles.suitabilityCard}>
        <div className={styles.scoreHeader}>
          <h3 className={styles.cardTitle}>Suitability Analysis</h3>
          <div className={styles.suitabilityScore}>
            <span className={styles.scoreValue}>{resultData.suitability.score}</span>
            <span className={styles.scoreLabel}>{resultData.suitability.level}</span>
          </div>
        </div>

        {resultData.suitability.forDasha && (
          <div className={styles.infoRow}>
            <span className={styles.label}>For Dasha:</span>
            <span className={styles.value}>{resultData.suitability.forDasha}</span>
          </div>
        )}

        {resultData.suitability.benefits && resultData.suitability.benefits.length > 0 && (
          <>
            <h4 className={styles.subTitle}>Benefits</h4>
            <ul className={styles.benefitsList}>
              {resultData.suitability.benefits.map((benefit, index) => (
                <li key={index} className={styles.benefitItem}>{benefit}</li>
              ))}
            </ul>
          </>
        )}

        {resultData.suitability.cautions && resultData.suitability.cautions.length > 0 && (
          <>
            <h4 className={styles.subTitle}>Cautions</h4>
            <ul className={styles.cautionsList}>
              {resultData.suitability.cautions.map((caution, index) => (
                <li key={index} className={styles.cautionItem}>{caution}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {resultData.wearing && (
        <div className={styles.wearingCard}>
          <h3 className={styles.cardTitle}>Wearing Guidelines</h3>
          <div className={styles.infoRow}>
            <span className={styles.label}>Best Day:</span>
            <span className={styles.value}>{resultData.wearing.bestDay}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Best Time:</span>
            <span className={styles.value}>{resultData.wearing.bestTime}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Finger:</span>
            <span className={styles.value}>{resultData.wearing.finger}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Hand:</span>
            <span className={styles.value}>{resultData.wearing.hand}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Metal:</span>
            <span className={styles.value}>{resultData.wearing.metal}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Weight:</span>
            <span className={styles.value}>{resultData.wearing.weight}</span>
          </div>
          {resultData.wearing.mantra && (
            <>
              <h4 className={styles.subTitle}>Mantra</h4>
              <p className={styles.mantraText}>{resultData.wearing.mantra}</p>
            </>
          )}
          {resultData.wearing.activationRitual && (
            <>
              <h4 className={styles.subTitle}>Activation Ritual</h4>
              <p className={styles.ritualText}>{resultData.wearing.activationRitual}</p>
            </>
          )}
        </div>
      )}
    </div>
  );

  const renderHealing = () => (
    <div className={styles.tabContent}>
      <div className={styles.healingCard}>
        <h3 className={styles.cardTitle}>Healing Properties</h3>
        
        {resultData.healing.physical && resultData.healing.physical.length > 0 && (
          <>
            <h4 className={styles.subTitle}>Physical Benefits</h4>
            <ul className={styles.healingList}>
              {resultData.healing.physical.map((item, index) => (
                <li key={index} className={styles.healingItem}>{item}</li>
              ))}
            </ul>
          </>
        )}

        {resultData.healing.emotional && resultData.healing.emotional.length > 0 && (
          <>
            <h4 className={styles.subTitle}>Emotional Benefits</h4>
            <ul className={styles.healingList}>
              {resultData.healing.emotional.map((item, index) => (
                <li key={index} className={styles.healingItem}>{item}</li>
              ))}
            </ul>
          </>
        )}

        {resultData.healing.spiritual && resultData.healing.spiritual.length > 0 && (
          <>
            <h4 className={styles.subTitle}>Spiritual Benefits</h4>
            <ul className={styles.healingList}>
              {resultData.healing.spiritual.map((item, index) => (
                <li key={index} className={styles.healingItem}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {resultData.compatibility && (
        <div className={styles.compatibilityCard}>
          <h3 className={styles.cardTitle}>Gemstone Compatibility</h3>
          
          {resultData.compatibility.compatibleGemstones && resultData.compatibility.compatibleGemstones.length > 0 && (
            <>
              <h4 className={styles.subTitle}>Compatible Gemstones</h4>
              <p className={styles.compatibleText}>{resultData.compatibility.compatibleGemstones.join(', ')}</p>
            </>
          )}

          {resultData.compatibility.incompatibleGemstones && resultData.compatibility.incompatibleGemstones.length > 0 && (
            <>
              <h4 className={styles.subTitle}>Incompatible Gemstones</h4>
              <p className={styles.incompatibleText}>{resultData.compatibility.incompatibleGemstones.join(', ')}</p>
            </>
          )}

          {resultData.compatibility.stackingAdvice && (
            <>
              <h4 className={styles.subTitle}>Stacking Advice</h4>
              <p className={styles.adviceText}>{resultData.compatibility.stackingAdvice}</p>
            </>
          )}
        </div>
      )}

      {resultData.market && (
        <div className={styles.marketCard}>
          <h3 className={styles.cardTitle}>Market Information</h3>
          {resultData.market.priceRange && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Price Range:</span>
              <span className={styles.value}>
                ₹{resultData.market.priceRange.low.toLocaleString()} - ₹{resultData.market.priceRange.high.toLocaleString()}
              </span>
            </div>
          )}
          {resultData.market.perCaratPrice && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Per Carat:</span>
              <span className={styles.value}>{resultData.market.perCaratPrice}</span>
            </div>
          )}
          {resultData.market.investmentGrade !== undefined && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Investment Grade:</span>
              <span className={styles.value}>{resultData.market.investmentGrade ? 'Yes' : 'No'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (!resultData) {
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/aiwow')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>Gemstone Analysis</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'details' ? styles.active : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'astrological' ? styles.active : ''}`}
            onClick={() => setActiveTab('astrological')}
          >
            Astrological
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'suitability' ? styles.active : ''}`}
            onClick={() => setActiveTab('suitability')}
          >
            Suitability
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'healing' ? styles.active : ''}`}
            onClick={() => setActiveTab('healing')}
          >
            Healing
          </button>
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'details' && renderDetails()}
        {activeTab === 'astrological' && renderAstrological()}
        {activeTab === 'suitability' && renderSuitability()}
        {activeTab === 'healing' && renderHealing()}

        <button className={styles.doneButton} onClick={() => navigate('/aiwow')}>
          Done
        </button>
      </div>
    </div>
  );
};

export default GemstoneResult;
