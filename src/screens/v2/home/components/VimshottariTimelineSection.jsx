import { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useGetCurrentMahadashaFullQuery } from "../../../../redux/api/kundli/dashaApi";
import { useGetAllKundlisQuery } from "../../../../services/appServices/kundliServicesNew";
import styles from "../Home.module.scss";

const VimshottariTimelineSection = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const cardsContainerRef = useRef(null);
  const navigate = useNavigate();
  
  // Check if user is logged in
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const selectedKundli = useSelector((state) => state.kundli.selectedKundli);

  // Get user's kundli profiles
  const { data: profilesData, isLoading: profilesLoading } = useGetAllKundlisQuery(undefined, {
    skip: !isLoggedIn,
  });
  const profiles = profilesData?.data || [];

  // Priority: selected Kundli from Redux → first profile
  const fallbackProfile = profiles.length > 0 ? profiles[0] : null;
  const defaultProfile = selectedKundli?._id
    ? profiles.find((p) => p._id === selectedKundli._id) || fallbackProfile
    : fallbackProfile;

  // Only prepare API parameters if we have a valid profile
  const apiParams = defaultProfile ? {
    dob: `${String(defaultProfile.day).padStart(2, '0')}/${String(defaultProfile.month).padStart(2, '0')}/${defaultProfile.year}`,
    tob: `${String(defaultProfile.hour).padStart(2, '0')}:${String(defaultProfile.min).padStart(2, '0')}`,
    lat: defaultProfile.lat,
    lon: defaultProfile.lon,
    tz: defaultProfile.tzone,
    lang: "en",
  } : null;

  // Fetch dasha data from API only if we have valid params
  const { data: apiData, isLoading: dashaLoading, isError } = useGetCurrentMahadashaFullQuery(apiParams, {
    skip: !apiParams || !isLoggedIn,
  });

  // Log API response for debugging
  console.log("🔮 Dasha API Response:", apiData);
  console.log("🔮 Full Response Object:", JSON.stringify(apiData, null, 2));

  // Helper functions
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const diffTime = Math.abs(end - start);
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));

    if (diffYears > 0) {
      return `${diffYears} Year${diffYears > 1 ? 's' : ''}, ${diffMonths} Month${diffMonths > 1 ? 's' : ''}`;
    }
    return `${diffMonths} Month${diffMonths > 1 ? 's' : ''}`;
  };

  const calculateProgress = (startDate, endDate) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();

    if (now >= end) return 100;
    if (now <= start) return 0;

    const total = end - start;
    const elapsed = now - start;
    const pct = parseFloat(((elapsed / total) * 100).toFixed(1));
    // Cap at 99.9 so an active period never shows 100% prematurely
    return Math.min(pct, 99.9);
  };

  const getPlanetShort = (name) => {
    const shortNames = {
      "Sun": "Su", "Moon": "Mo", "Mars": "Ma", "Mercury": "Me",
      "Jupiter": "Ju", "Venus": "Ve", "Saturn": "Sa", "Rahu": "Ra", "Ketu": "Ke"
    };
    return shortNames[name] || name.substring(0, 2);
  };

  const findCurrentPeriod = (periods) => {
    const now = new Date().getTime();
    for (let i = 0; i < periods.length; i++) {
      const start = new Date(periods[i].start).getTime();
      const end = new Date(periods[i].end).getTime();

      if (now >= start && now <= end) return i;
    }
    return -1;
  };

  // Transform API data - Show only first 3 dasha levels (hide Sookshmadasha and Pranadasha)
  const transformDashaData = (response) => {
    if (!response) return null;

    const allDashaCards = [];
    // Only show first 3 levels: Mahadasha, Antardasha, Pratyantardasha
    const dashaLevels = ["mahadasha", "antardasha", "paryantardasha"];

    dashaLevels.forEach((levelName) => {
      const periods = response[levelName] || [];
      console.log(`🔮 ${levelName} periods:`, periods);

      if (periods.length === 0) return;

      const currentIdx = findCurrentPeriod(periods);

      // Only add the current period card for this level
      if (currentIdx >= 0) {
        const period = periods[currentIdx];
        const periodEnd = period.end;

        // Calculate progress within the current segment
        const segmentStart = new Date(period.start).getTime();
        const segmentEnd = new Date(periodEnd).getTime();
        const now = new Date().getTime();
        const segmentProgress = ((now - segmentStart) / (segmentEnd - segmentStart)) * 100;

        allDashaCards.push({
          id: `${levelName}-${currentIdx}`,
          type: levelName.toUpperCase(),
          planet: period.name,
          startDate: formatDate(period.start),
          endDate: formatDate(periodEnd),
          progress: calculateProgress(period.start, periodEnd),
          segmentProgress: Math.min(Math.max(segmentProgress, 0), 100),
          isCurrent: true,
          duration: calculateDuration(period.start, periodEnd),
          subPeriods: periods.map((p, i) => ({
            name: getPlanetShort(p.name),
            planet: p.name,
            active: i === currentIdx,
            startDate: p.start,
            endDate: p.end,
          })),
        });
      }
    });

    return allDashaCards;
  };

  const dashaData = apiData?.response ? transformDashaData(apiData.response) : [];
  const currentPeriods = dashaData.filter(d => d.isCurrent);

  console.log("🔮 Current Periods:", currentPeriods);

  // Slider functions
  const handleScrollLeft = () => {
    if (cardsContainerRef.current) {
      cardsContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (cardsContainerRef.current) {
      cardsContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // Navigate to Kundali page with first profile and activate Dasha tab
  const handleSeeFullDasha = () => {
    if (defaultProfile && defaultProfile._id) {
      // Navigate to /kundli/:kundliId?tab=dasha to open Dasha tab (index 5)
      navigate(`/kundli/${defaultProfile._id}?tab=dasha`);
    } else {
      // If no profile, navigate to kundli page to create one
      navigate('/kundli');
    }
  };

  const isLoading = profilesLoading || dashaLoading;

  // Don't render the section if user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  // Don't render if user has no kundli profile
  if (!defaultProfile) {
    return null;
  }

  if (isLoading) {
    return (
      <section className={styles.vimshottariSection}>
        <div className={styles.vimshottariHeader}>
          <h2 className={styles.vimshottariTitle}>
            YOUR DASHA TIMELINE
            <div className={styles.titleUnderline}></div>
          </h2>
        </div>
        <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
          Loading your dasha timeline...
        </div>
      </section>
    );
  }

  if (isError || !dashaData || dashaData.length === 0) {
    return null;
  }

  return (
    <section className={styles.vimshottariSection}>
      <div className={styles.vimshottariHeader}>
        <h2 className={styles.vimshottariTitle}>
          YOUR DASHA TIMELINE
          <div className={styles.titleDivider}>
            <div className={styles.dividerLine}>
              <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
                <path d="M92.803 0.406393C92.803 0.630933 90.7481 0.812789 88.2131 0.812789C85.6781 0.812789 0 0.630933 0 0.406393C0 0.181853 85.6786 0 88.2131 0C90.7481 0 92.803 0.181853 92.803 0.406393Z" fill="#030303" />
              </svg>
            </div>
            <span className={styles.dividerMoon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
            </span>
            <div className={styles.dividerLine}>
              <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
                <path d="M-4.06066e-06 0.406393C-4.06066e-06 0.630933 2.05498 0.812789 4.58996 0.812789C7.12494 0.812789 92.803 0.630933 92.803 0.406393C92.803 0.181853 7.12439 0 4.58996 0C2.05498 0 -4.06066e-06 0.181853 -4.06066e-06 0.406393Z" fill="#030303" />
              </svg>
            </div>
          </div>
        </h2>
        <button className={styles.seeFullDashaBtn} onClick={handleSeeFullDasha}>
          See Full Dasha <ChevronRight size={18} />
        </button>
      </div>

      {/* Dasha Cards - Always show in slider */}
      <div className={styles.dashaSliderWrapper}>
        {/* <button className={styles.sliderBtn} onClick={handleScrollLeft}>
          <ChevronLeft size={24} />
        </button> */}

        <div className={styles.dashaCardsSlider} ref={cardsContainerRef}>
          {dashaData.map((dasha) => (
            <div
              key={dasha.id}
              className={`${styles.dashaCard} ${dasha.isCurrent ? styles.currentDashaCard : ''}`}
            >
              <div className={styles.dashaCardHeader}>
                <span className={styles.dashaType}>{dasha.type}</span>
              </div>
              <h3 className={styles.dashaPlanet}>{dasha.planet}</h3>
              <div className={styles.dashaDateRow}>
                <span className={styles.dashaDateItem}>
                  <span className={styles.dateArrowGreen}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="10" viewBox="0 0 17 10" fill="none">
                      <path d="M11.075 9.40833C11.4 9.73333 11.925 9.73333 12.25 9.40833L16.075 5.58333C16.4 5.25833 16.4 4.73333 16.075 4.40833L12.25 0.583333C11.925 0.258333 11.4 0.258333 11.075 0.583333C10.7583 0.908333 10.75 1.44167 11.075 1.76667L13.475 4.16667H4.16667C3.70833 4.16667 3.33333 4.54167 3.33333 5C3.33333 5.45833 3.70833 5.83333 4.16667 5.83333H13.475L11.075 8.23333C10.75 8.55833 10.75 9.08333 11.075 9.40833ZM0.833333 10C1.29167 10 1.66667 9.625 1.66667 9.16667V0.833333C1.66667 0.375 1.29167 0 0.833333 0C0.375 0 0 0.375 0 0.833333V9.16667C0 9.625 0.375 10 0.833333 10Z" fill="#4BA01D"/>
                    </svg>
                  </span> {dasha.startDate}
                </span>
                <span className={styles.dashaDateItem}>
                  <span className={styles.dateArrowRed}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="10" viewBox="0 0 17 10" fill="none">
                    <path d="M5.24385 9.40833C4.91885 9.73333 4.39385 9.73333 4.06885 9.40833L0.243847 5.58333C-0.081152 5.25833 -0.081152 4.73333 0.243847 4.40833L4.06885 0.583333C4.39385 0.258333 4.91885 0.258333 5.24385 0.583333C5.56051 0.908333 5.56885 1.44167 5.24385 1.76667L2.84385 4.16667H12.1522C12.6105 4.16667 12.9855 4.54167 12.9855 5C12.9855 5.45833 12.6105 5.83333 12.1522 5.83333H2.84385L5.24385 8.23333C5.56885 8.55833 5.56885 9.08333 5.24385 9.40833ZM15.4855 10C15.0272 10 14.6522 9.625 14.6522 9.16667V0.833333C14.6522 0.375 15.0272 0 15.4855 0C15.9438 0 16.3188 0.375 16.3188 0.833333V9.16667C16.3188 9.625 15.9438 10 15.4855 10Z" fill="#E4342F"/>
                    </svg>
                    </span> {dasha.endDate}
                </span>
              </div>
              <div className={styles.dashaDivider}></div>
              <div className={styles.dashaProgress}>
                <div className={styles.progressInfo}>
                  <span className={styles.progressValue}>{dasha.progress}%</span>
                  <span className={styles.progressLabel}>Completed</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${dasha.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* <button className={styles.sliderBtn} onClick={handleScrollRight}>
          <ChevronRight size={24} />
        </button> */}
      </div>

      {/* Timeline Bars - Show only current periods */}
      {currentPeriods.length > 0 && (
        <div className={styles.timelineContainer}>
          {currentPeriods.map((dasha) => {
            // Find the active segment index
            const activeSegmentIndex = dasha.subPeriods.findIndex(p => p.active);
            const totalSegments = dasha.subPeriods.length;

            // Calculate position within the active segment
            const segmentWidth = 100 / totalSegments;
            const segmentStartPosition = activeSegmentIndex * segmentWidth;

            // Position within the active segment based on segmentProgress (0-100)
            const linePosition = segmentStartPosition + (segmentWidth * dasha.segmentProgress / 100);

            console.log(`📍 ${dasha.type} Progress Line Position:`, {
              activeSegmentIndex,
              totalSegments,
              segmentWidth: `${segmentWidth.toFixed(2)}%`,
              segmentStartPosition: `${segmentStartPosition.toFixed(2)}%`,
              segmentProgress: `${dasha.segmentProgress.toFixed(2)}%`,
              finalLinePosition: `${linePosition.toFixed(2)}%`
            });

            return (
              <div key={dasha.id} className={styles.timelineRow}>
                <h4 className={styles.timelineTitle}>
                  {dasha.type}({dasha.planet})
                </h4>
                <div className={styles.timelineBarWrapper}>
                  <div className={styles.timelineBar}>
                    {dasha.subPeriods.map((period, idx) => (
                      <div
                        key={idx}
                        className={`${styles.timelineSegment} ${period.active ? styles.activeSegment : ""
                          }`}
                        title={period.planet}
                      >
                        <span className={styles.segmentLabel}>{period.name}</span>
                        {period.active && <div className={styles.activeIndicator}></div>}

                        {/* Hover Popup for Active Segment */}
                        {period.active && period.endDate && (
                          <div className={styles.segmentPopup}>
                            <div className={styles.popupHeader}>
                              <span className={styles.popupTitle}>{period.planet} Period</span>
                              <span className={styles.currentBadgePopup}>● Current</span>
                            </div>
                            <div className={styles.popupContent}>
                              <div className={styles.popupRow}>
                                <span className={styles.popupLabel}>Start:</span>
                                <span className={styles.popupValue}>{formatDate(period.startDate)}</span>
                              </div>
                              <div className={styles.popupRow}>
                                <span className={styles.popupLabel}>End:</span>
                                <span className={styles.popupValue}>{formatDate(period.endDate)}</span>
                              </div>
                              <div className={styles.popupDivider}></div>
                              <div className={styles.popupRow}>
                                <span className={styles.popupLabel}>Duration:</span>
                                <span className={styles.popupValue}>{calculateDuration(period.startDate, period.endDate)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Vertical progress line - positioned within active segment */}
                    <div
                      className={styles.progressLine}
                      style={{ left: `${linePosition}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Text */}
      {currentPeriods.length > 0 && (
        <div className={styles.dashaSummary}>
          <p className={styles.summaryText}>
            You are currently experiencing the{' '}
            {currentPeriods.map((period, idx) => {
              const isLast = idx === currentPeriods.length - 1;
              const isSecondLast = idx === currentPeriods.length - 2;
              return (
                <span key={period.id}>
                  {period.planet} {period.type.toLowerCase()}
                  {isLast ? '.' : isSecondLast ? ' and ' : ', '}
                </span>
              );
            })}
          </p>
        </div>
      )}
    </section>
  );
};

export default VimshottariTimelineSection;
