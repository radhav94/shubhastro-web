import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './AgenticCalendar.module.scss';
import { Toast } from '../../../../component';
import { analyzeCalendarEvents } from '../../../../services/appServices/aiWowService';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import PrimaryLoader from '../../../../component/UI/PrimaryLoader';
import { FiMapPin, FiCalendar, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { PATH } from '../../../../utils/routes/Paths';
import TTSButton from '../../../../component/UI/TTSButton';
import LocationSearch from '../../../../utils/location/locationSearchVedic';
import useUserLocation from '../../../../utils/hooks/useUserLocation';

const DEFAULT_OCCASIONS = [
  'Marriage',
  'Job Interview',
  'Business Launch',
  'House Purchase',
  'Travel',
  'Surgery',
  'Investment',
  'Education',
  'Moving House',
  'Important Meeting'
];

const AgenticCalendar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isLoading: profileLoading } = useSelectedKundliProfile({ required: false, showToast: false });
  const userLocation = useUserLocation();

  // State from MuhuratSection navigation
  const navState = location.state || {};

  const [selectedOccasions, setSelectedOccasions] = useState([]);
  const [customOccasions, setCustomOccasions] = useState([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customFromDate, setCustomFromDate] = useState(null);
  const [customToDate, setCustomToDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [expandedOccasion, setExpandedOccasion] = useState(null);
  const [locked, setLocked] = useState(false); // Lock selections after clicking Get Timing
  const resultsRef = useRef(null);
  const [locationValue, setLocationValue] = useState('');
  const [locationData, setLocationData] = useState(null);

  const [navStateConsumed, setNavStateConsumed] = useState(false);
  const [autoSubmitPending, setAutoSubmitPending] = useState(false);
  const pendingOccasionsRef = useRef(null);

  // Initialize from navigation state (once only)
  useEffect(() => {
    if (navState.occasions?.length) {
      const defaultSet = new Set(DEFAULT_OCCASIONS);
      const customs = navState.occasions.filter((o) => !defaultSet.has(o));
      if (customs.length) setCustomOccasions(customs);
      setSelectedOccasions(navState.occasions);
      pendingOccasionsRef.current = navState.occasions;
      setAutoSubmitPending(true);
    }
    if (navState.period) setSelectedPeriod(navState.period);
    if (navState.customDate) {
      const d = new Date(navState.customDate);
      setCustomFromDate(d);
      setCustomToDate(navState.customToDate ? new Date(navState.customToDate) : d);
      setSelectedPeriod(null);
    }
    if (navState.location) {
      setLocationValue(navState.location.address || '');
      setLocationData(navState.location);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill location from detected user location (same source as Today's Muhurat)
  useEffect(() => {
    if (!userLocation.isDefault && userLocation.loaded && userLocation.locationName && userLocation.locationName !== "Your Location") {
      // Only auto-fill if no location was provided via navigation state
      if (!locationValue && !locationData) {
        setLocationValue(userLocation.locationName);
        setLocationData({
          address: userLocation.locationName,
          lat: userLocation.lat,
          lng: userLocation.lon,
        });
      }
    }
  }, [userLocation.isDefault, userLocation.loaded, userLocation.locationName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit when redirected from home with pre-selected occasions
  useEffect(() => {
    if (autoSubmitPending && !profileLoading) {
      setAutoSubmitPending(false);
      // Clear nav state so a page refresh won't re-trigger auto-submit
      navigate(location.pathname, { replace: true, state: {} });
      setNavStateConsumed(true);
      handleGetTimings(pendingOccasionsRef.current);
      pendingOccasionsRef.current = null;
    }
  }, [autoSubmitPending, profileLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear nav state on first user interaction
  const clearNavState = () => {
    if (!navStateConsumed && (navState.occasions || navState.period || navState.customDate)) {
      navigate(location.pathname, { replace: true, state: {} });
      setNavStateConsumed(true);
    }
  };

  const allOccasions = [...DEFAULT_OCCASIONS, ...customOccasions];

  const toggleOccasion = (occasion) => {
    if (locked) return;
    clearNavState();
    setSelectedOccasions((prev) =>
      prev.includes(occasion) ? prev.filter((o) => o !== occasion) : [...prev, occasion]
    );
  };

  const handleRemoveChip = (occasion) => {
    if (locked) return;
    clearNavState();
    setSelectedOccasions((prev) => prev.filter((o) => o !== occasion));
    if (customOccasions.includes(occasion)) {
      setCustomOccasions((prev) => prev.filter((o) => o !== occasion));
    }
  };

  const handleAddCustom = () => {
    clearNavState();
    const trimmed = customInput.trim();
    if (trimmed && !allOccasions.includes(trimmed)) {
      setCustomOccasions((prev) => [...prev, trimmed]);
      setSelectedOccasions((prev) => [...prev, trimmed]);
      setCustomInput('');
      setShowCustomModal(false);
    }
  };

  const handleGetTimings = async (occasionsOverride) => {
    const occasions = occasionsOverride || selectedOccasions;
    if (occasions.length === 0) {
      Toast.error('Please select at least one occasion');
      return;
    }
    setLocked(true);
    try {
      setIsLoading(true);
      setAnalysis(null);
      setExpandedOccasion(null);

      const today = new Date();
      const formatDate = (d) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      let fromDate, toDate;

      if (customFromDate) {
        fromDate = formatDate(customFromDate);
        toDate = customToDate ? formatDate(customToDate) : fromDate;
      } else if (selectedPeriod === 'Today') {
        fromDate = formatDate(today);
        toDate = fromDate;
      } else if (selectedPeriod === 'Tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        fromDate = formatDate(tomorrow);
        toDate = fromDate;
      } else if (selectedPeriod === 'This Week') {
        fromDate = formatDate(today);
        // End of week (Sunday)
        const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
        toDate = formatDate(weekEnd);
      } else if (selectedPeriod === 'This Month') {
        fromDate = formatDate(today);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        toDate = formatDate(monthEnd);
      } else {
        // Fallback
        fromDate = formatDate(today);
        toDate = fromDate;
      }

      const result = await analyzeCalendarEvents(occasions, {
        fromDate,
        toDate,
        kundliId: profile?._id,
        lat: locationData?.lat,
        lng: locationData?.lng,
      });
      if (result.success) {
        setAnalysis(result.data);
        setExpandedOccasion(occasions[0]);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        Toast.error(result.error || 'Failed to analyze events');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse time string like "6:27 AM" or "02:08 PM" and return a Date for today
  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const cleaned = timeStr.trim();
    const match = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  // Check if a time range slot has passed, considering the event date
  const isSlotPassed = (timeRangeStr, eventDate) => {
    if (!timeRangeStr) return false;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Parse event date if provided
    let eventDateObj;
    if (eventDate) {
      // eventDate format: "2026-02-26" (ISO date string)
      eventDateObj = new Date(eventDate + 'T00:00:00');
    } else {
      eventDateObj = today;
    }
    
    // Compare dates (ignoring time)
    const eventDateOnly = new Date(eventDateObj.getFullYear(), eventDateObj.getMonth(), eventDateObj.getDate());
    
    // If event date is in the past, all slots are passed
    if (eventDateOnly < today) {
      return true;
    }
    
    // If event date is in the future, no slots are passed
    if (eventDateOnly > today) {
      return false;
    }
    
    // Event date is today - compare time
    // Split on any dash variant to get start time
    const parts = timeRangeStr.split(/\s*[-–—−]\s*/);
    if (parts.length < 1) return false;
    
    // Parse the start time
    const timeMatch = parts[0].trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return false;
    
    let h = parseInt(timeMatch[1], 10);
    const m = parseInt(timeMatch[2], 10);
    const meridiem = timeMatch[3].toUpperCase();
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    
    // Create the full datetime for today
    const slotDateTime = new Date();
    slotDateTime.setHours(h, m, 0, 0);
    
    return slotDateTime < now;
  };

  if (profileLoading) return <PrimaryLoader isLoading={true} />;

  return (
    <>
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>Muhurat Calendar</h1>
            {profile && <p className={styles.subtitle}>{profile.name}</p>}
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {/* Plan Your Events Banner */}
        <div className={styles.banner} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
            <TTSButton text="Plan Your Events. Get astrologically optimal timing recommendations for your important life events" />
          </span>
          <h2 className={styles.bannerTitle}>PLAN YOUR EVENTS</h2>
          <p className={styles.bannerSubtitle}>
            Get astrologically optimal timing recommendations for your important life events
          </p>
          {/* <div className={styles.bannerLocation}>
            <FiMapPin size={14} />
            <span>Based On: Mumbai</span>
          </div> */}
        </div>

        {/* Select Your Occasion */}
        <div className={styles.occasionCard}>
          <div className={styles.occasionHeader}>
            <h3 className={styles.occasionTitle}>SELECT YOUR OCCASION</h3>
            <p className={styles.hint}>Select one or more occasions to view Muhurat</p>
          </div>
          <div className={styles.chipsWrap}>
            {[...allOccasions]
              .sort((a, b) => {
                const aS = selectedOccasions.includes(a);
                const bS = selectedOccasions.includes(b);
                if (aS && !bS) return -1;
                if (!aS && bS) return 1;
                return 0;
              })
              .map((occasion) => {
                const isSelected = selectedOccasions.includes(occasion);
                const isCustom = customOccasions.includes(occasion);
                return (
                  <button
                    key={occasion}
                    className={`${styles.chip} ${isSelected ? styles.chipSelected : ''} ${locked ? styles.chipDisabled : ''}`}
                    onClick={() => !isSelected && !locked && toggleOccasion(occasion)}
                    disabled={locked}
                  >
                    {occasion}
                    {isSelected && isCustom && <span className={styles.customBadge}>Custom</span>}
                    {isSelected && !locked && (
                      <span
                        className={styles.chipClose}
                        onClick={(e) => { e.stopPropagation(); handleRemoveChip(occasion); }}
                        role="button"
                        aria-label={`Remove ${occasion}`}
                      >
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}
            <button className={`${styles.addCustomChip} ${locked ? styles.chipDisabled : ''}`} onClick={() => { if (!locked) setShowCustomModal(true); }} disabled={locked}>
              + Add Custom
            </button>
          </div>

          {/* Period Chips */}
          <div className={styles.periodDivider} />
          <div className={styles.periodWrap}>
            {['Today', 'Tomorrow', 'This Week', 'This Month'].map((p) => (
              <button
                key={p}
                className={`${styles.periodChip} ${selectedPeriod === p ? styles.periodActive : ''} ${locked ? styles.periodDisabled : ''}`}
                onClick={() => { if (locked) return; clearNavState(); setSelectedPeriod(p); setCustomFromDate(null); setCustomToDate(null); }}
                disabled={locked}
              >
                {p}
              </button>
            ))}
            <button
              className={`${styles.dateChip} ${customFromDate ? styles.periodActive : ''} ${locked ? styles.periodDisabled : ''}`}
              onClick={() => { if (locked) return; setShowDatePicker(true); }}
              disabled={locked}
            >
              <FiCalendar size={14} />
              {customFromDate
                ? customToDate && customToDate.getTime() !== customFromDate.getTime()
                  ? `${customFromDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${customToDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
                  : customFromDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                : 'Date'}
            </button>
          </div>

          {/* Location Field */}
          <div className={styles.locationWrap}>
            <label className={styles.locationLabel}>
              Location
            </label>
            <LocationSearch
              value={locationValue}
              placeholder="Enter your location"
              onChange={(e) => {
                setLocationValue(e.target.value);
                if (!e.target.value.trim()) setLocationData(null);
              }}
              onPlaceSelect={({ address, lat, lng }) => {
                setLocationValue(address);
                setLocationData({ address, lat, lng });
              }}
              disabled={locked}
            />
          </div>

          {/* Get Timing Button */}
          <button
            className={styles.getTimingsBtn}
            disabled={selectedOccasions.length === 0 || isLoading || !locationData}
            onClick={() => {
              if (locked) {
                setLocked(false);
                setAnalysis(null);
                setExpandedOccasion(null);
              } else {
                handleGetTimings();
              }
            }}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Analyzing...
              </>
            ) : locked ? (
              'Modify Selections'
            ) : (
              'Get Timing Recommendations'
            )}
          </button>

          {/* Results Grid (Desktop) / Accordion (Mobile) */}
          {analysis?.optimalTimings?.length > 0 && (
            <div className={`${styles.resultsWrap} ${analysis.optimalTimings.length === 2 ? styles.resultsTwo : ''}`} ref={resultsRef}>
              {(() => {
                // Group timings by eventName
                const sorted = [...analysis.optimalTimings].sort((a, b) => {
                  const dateA = a.bestDate || '';
                  const dateB = b.bestDate || '';
                  if (dateA !== dateB) return dateA.localeCompare(dateB);
                  const timeA = a.bestTimeRange || '';
                  const timeB = b.bestTimeRange || '';
                  return timeA.localeCompare(timeB);
                });

                const grouped = sorted.reduce((acc, item) => {
                  if (!acc[item.eventName]) acc[item.eventName] = [];
                  acc[item.eventName].push(item);
                  return acc;
                }, {});

                return Object.entries(grouped).map(([name, timings]) => {
                  const isExpanded = expandedOccasion === name;
                  const isCustom = customOccasions.includes(name);

                  return (
                    <div key={name} className={styles.resultCard}>
                      {/* Card header */}
                      <div
                        className={styles.resultCardHeader}
                        onClick={() => setExpandedOccasion(isExpanded ? null : name)}
                      >
                        <div className={styles.accordionTitle}>
                          <span>{name}</span>
                          {isCustom && <span className={styles.customTag}>Custom</span>}
                        </div>
                        <span className={styles.ttsWrap} onClick={(e) => e.stopPropagation()}>
                          <TTSButton text={`${name}. ${timings.map(t => {
                            let text = '';
                            if (t.bestDate) text += new Date(t.bestDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + '. ';
                            if (t.bestTimeRange) text += 'Best Time: ' + t.bestTimeRange + '. ';
                            if (t.alternateTimeRange) text += 'Alternate: ' + t.alternateTimeRange + '. ';
                            if (t.reason) text += t.reason;
                            return text;
                          }).join('. ')}`} />
                        </span>
                        <span className={styles.mobileChevron}>
                          {isExpanded ? <FiChevronUp size={20} color="#f75801" /> : <FiChevronDown size={20} color="#f75801" />}
                        </span>
                      </div>

                      {/* Card body - all entries for this event */}
                      <div className={`${styles.resultCardBody} ${isExpanded ? styles.resultCardBodyOpen : ''}`}>
                        {timings.map((timing, tIdx) => {
                          const slots = [];
                          if (timing.bestTimeRange) {
                            slots.push({ time: timing.bestTimeRange, best: true });
                          }
                          if (timing.alternateTimeRange) {
                            slots.push({ time: timing.alternateTimeRange, best: false });
                          }
                          if (timing.timeSlots?.length) {
                            timing.timeSlots.forEach((s) => slots.push(s));
                          }

                          const passed = slots.filter((s) => isSlotPassed(s.time, timing.bestDate));
                          const upcoming = slots.filter((s) => !isSlotPassed(s.time, timing.bestDate));

                          return (
                            <div key={tIdx}>
                              {timing.bestDate && (
                                <span className={styles.cardDate}>
                                  <FiCalendar size={12} />
                                  {new Date(timing.bestDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                              {passed.length > 0 && (
                                <>
                                  <h4 className={styles.slotGroupTitle}>Earlier Today</h4>
                                  {passed.map((s, i) => (
                                    <div key={i} className={styles.slotRow}>
                                      <span className={styles.slotTime}>{s.time}</span>
                                      <span className={styles.passedBadge}>Passed</span>
                                    </div>
                                  ))}
                                </>
                              )}
                              {upcoming.length > 0 && (
                                <>
                                  <h4 className={styles.slotGroupTitle}>Upcoming</h4>
                                  {upcoming.map((s, i) => (
                                    <div key={i} className={`${styles.slotRow} ${s.best ? styles.slotBest : styles.slotUpcoming}`}>
                                      <span className={styles.slotTime}>{s.time}</span>
                                      {s.best && <span className={styles.bestBadge}>Best Time</span>}
                                    </div>
                                  ))}
                                </>
                              )}
                              {passed.length === 0 && upcoming.length === 0 && timing.bestDate && (
                                <div className={styles.slotRow + ' ' + styles.slotBest}>
                                  <span className={styles.slotTime}>
                                    {timing.bestDate} {timing.bestTimeRange && `• ${timing.bestTimeRange}`}
                                  </span>
                                  <span className={styles.bestBadge}>Best Time</span>
                                </div>
                              )}
                              {timing.reason && <p className={styles.slotReason}>{timing.reason}</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {analysis?.optimalTimings?.length > 0 && (
            <button
              className={styles.consultButton}
              onClick={() => navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path)}
            >
              Consult With Expert Astrologer
            </button>
          )}
        </div>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className={styles.overlay} onClick={() => setShowDatePicker(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Select Date Range</h4>
              <button className={styles.modalClose} onClick={() => setShowDatePicker(false)} aria-label="Close">✕</button>
            </div>
            <p className={styles.dateRangeHint}>
              {!customFromDate || (customFromDate && customToDate)
                ? 'Tap to select start date'
                : `From: ${customFromDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} — Now select end date`}
            </p>
            <div className={styles.calendarNav}>
              <button className={styles.calNavBtn} 
                disabled={calendarYear === new Date().getFullYear() && calendarMonth === new Date().getMonth()}
                onClick={() => {
                  if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear((y) => y - 1); }
                  else setCalendarMonth((m) => m - 1);
                }}>
                <FiChevronLeft size={20} />
              </button>
              <span className={styles.calMonthLabel}>
                {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button className={styles.calNavBtn} onClick={() => {
                if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear((y) => y + 1); }
                else setCalendarMonth((m) => m + 1);
              }}>
                <FiChevronRight size={20} />
              </button>
            </div>
            <div className={styles.calGrid}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <span key={d} className={styles.calDayHeader}>{d}</span>
              ))}
              {(() => {
                const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                const offset = firstDay === 0 ? 6 : firstDay - 1;
                const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                const prevDays = new Date(calendarYear, calendarMonth, 0).getDate();
                const cells = [];
                for (let i = offset - 1; i >= 0; i--) {
                  cells.push(<span key={`p${i}`} className={`${styles.calDay} ${styles.calDayMuted}`}>{prevDays - i}</span>);
                }
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                for (let d = 1; d <= daysInMonth; d++) {
                  const thisDate = new Date(calendarYear, calendarMonth, d);
                  thisDate.setHours(0, 0, 0, 0);
                  const isPast = thisDate < today;
                  const isToday = d === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
                  const isFrom = customFromDate && thisDate.getTime() === new Date(customFromDate.getFullYear(), customFromDate.getMonth(), customFromDate.getDate()).getTime();
                  const isTo = customToDate && thisDate.getTime() === new Date(customToDate.getFullYear(), customToDate.getMonth(), customToDate.getDate()).getTime();
                  const isInRange = customFromDate && customToDate && thisDate > customFromDate && thisDate < customToDate;
                  cells.push(
                    <button key={d} className={`${styles.calDay} ${isFrom || isTo ? styles.calDaySelected : ''} ${isInRange ? styles.calDayInRange : ''} ${isToday && !isFrom && !isTo ? styles.calDayToday : ''} ${isPast ? styles.calDayDisabled : ''}`}
                      disabled={isPast}
                      onClick={() => {
                        if (isPast) return;
                        clearNavState();
                        if (!customFromDate || (customFromDate && customToDate)) {
                          // Start new range
                          setCustomFromDate(thisDate);
                          setCustomToDate(null);
                        } else {
                          // Set end date
                          if (thisDate < customFromDate) {
                            setCustomToDate(customFromDate);
                            setCustomFromDate(thisDate);
                          } else {
                            setCustomToDate(thisDate);
                          }
                          setSelectedPeriod(null);
                          setShowDatePicker(false);
                        }
                      }}>
                      {d}
                    </button>
                  );
                }
                const rem = 42 - cells.length;
                for (let i = 1; i <= rem; i++) {
                  cells.push(<span key={`n${i}`} className={`${styles.calDay} ${styles.calDayMuted}`}>{i}</span>);
                }
                return cells;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Occasion Modal */}
      {showCustomModal && (
        <div className={styles.overlay} onClick={() => setShowCustomModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Add Custom Occasion</h4>
              <button className={styles.modalClose} onClick={() => { setShowCustomModal(false); setCustomInput(''); }} aria-label="Close">✕</button>
            </div>
            <label className={styles.modalLabel}>Occasion Name</label>
            <input
              type="text"
              className={styles.modalInput}
              placeholder="e.g., House Warming"
              value={customInput}
              onChange={(e) => { if (e.target.value.length <= 30) setCustomInput(e.target.value); }}
              maxLength={30}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            />
            <span className={styles.modalCharCount}>{customInput.length}/30 characters</span>
            <button className={styles.modalAddBtn} onClick={handleAddCustom} disabled={!customInput.trim()}>Add</button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AgenticCalendar;
