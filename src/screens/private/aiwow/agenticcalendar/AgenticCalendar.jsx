import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './AgenticCalendar.module.scss';
import { Toast } from '../../../../component';
import { analyzeCalendarEvents } from '../../../../services/appServices/aiWowService';
import useSelectedKundliProfile from '../../../../utils/hooks/useSelectedKundliProfile';
import PrimaryLoader from '../../../../component/UI/PrimaryLoader';
import { FiMapPin, FiCalendar, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import Footer from '../../../../layouts/Footer';
import { PATH } from '../../../../utils/routes/Paths';

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

  // State from MuhuratSection navigation
  const navState = location.state || {};

  const [selectedOccasions, setSelectedOccasions] = useState([]);
  const [customOccasions, setCustomOccasions] = useState([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [expandedOccasion, setExpandedOccasion] = useState(null);
  const [locked, setLocked] = useState(false); // Lock selections after clicking Get Timing
  const resultsRef = useRef(null);

  const [navStateConsumed, setNavStateConsumed] = useState(false);
  const [autoSubmitPending, setAutoSubmitPending] = useState(false);

  // Initialize from navigation state (once only)
  useEffect(() => {
    if (navState.occasions?.length) {
      const defaultSet = new Set(DEFAULT_OCCASIONS);
      const customs = navState.occasions.filter((o) => !defaultSet.has(o));
      if (customs.length) setCustomOccasions(customs);
      setSelectedOccasions(navState.occasions);
      setAutoSubmitPending(true);
    }
    if (navState.period) setSelectedPeriod(navState.period);
    if (navState.customDate) {
      setCustomDate(new Date(navState.customDate));
      setSelectedPeriod(null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit when redirected from home with pre-selected occasions
  useEffect(() => {
    if (autoSubmitPending && !profileLoading) {
      setAutoSubmitPending(false);
      // Clear nav state so a page refresh won't re-trigger auto-submit
      navigate(location.pathname, { replace: true, state: {} });
      setNavStateConsumed(true);
      handleGetTimings();
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

  const handleGetTimings = async () => {
    if (selectedOccasions.length === 0) {
      Toast.error('Please select at least one occasion');
      return;
    }
    setLocked(true);
    try {
      setIsLoading(true);
      setAnalysis(null);
      setExpandedOccasion(null);
      const dateObj = customDate || new Date();
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');

      const result = await analyzeCalendarEvents(selectedOccasions, {
        date: `${yyyy}-${mm}-${dd}`,
        kundliId: profile?._id,
      });
      if (result.success) {
        setAnalysis(result.data);
        setExpandedOccasion(selectedOccasions[0]);
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
            <h1 className={styles.title}>Agentic Calendar</h1>
            {profile && <p className={styles.subtitle}>{profile.name}</p>}
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {/* Plan Your Events Banner */}
        <div className={styles.banner}>
          <h2 className={styles.bannerTitle}>PLAN YOUR EVENTS</h2>
          <p className={styles.bannerSubtitle}>
            Get astrologically optimal timing recommendations for your important life events
          </p>
          <div className={styles.bannerLocation}>
            <FiMapPin size={14} />
            <span>Based On: Mumbai</span>
          </div>
        </div>

        {/* Select Your Occasion */}
        <div className={styles.occasionCard}>
          <h3 className={styles.occasionTitle}>SELECT YOUR OCCASION</h3>
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
          <p className={styles.hint}>Select one or more occasions to view Muhurat</p>

          {/* Period Chips */}
          <div className={styles.periodDivider} />
          <div className={styles.periodWrap}>
            {['Today', 'Tomorrow', 'This Week', 'This Month'].map((p) => (
              <button
                key={p}
                className={`${styles.periodChip} ${selectedPeriod === p ? styles.periodActive : ''} ${locked ? styles.periodDisabled : ''}`}
                onClick={() => { if (locked) return; clearNavState(); setSelectedPeriod(p); setCustomDate(null); }}
                disabled={locked}
              >
                {p}
              </button>
            ))}
            <button
              className={`${styles.dateChip} ${customDate ? styles.periodActive : ''} ${locked ? styles.periodDisabled : ''}`}
              onClick={() => { if (locked) return; setShowDatePicker(true); }}
              disabled={locked}
            >
              <FiCalendar size={14} />
              {customDate
                ? customDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                : 'Date'}
            </button>
          </div>

          {/* Get Timing Button */}
          <button
            className={styles.getTimingsBtn}
            disabled={selectedOccasions.length === 0 || isLoading}
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
              {analysis.optimalTimings.map((timing) => {
                const name = timing.eventName;
                const isExpanded = expandedOccasion === name;
                const isCustom = customOccasions.includes(name);

                // Build time slots from API data
                const slots = [];
                if (timing.bestTimeRange) {
                  slots.push({ time: timing.bestTimeRange, best: true });
                }
                if (timing.alternateTimeRange) {
                  slots.push({ time: timing.alternateTimeRange, best: false });
                }
                // If API returns timeSlots array
                if (timing.timeSlots?.length) {
                  timing.timeSlots.forEach((s) => slots.push(s));
                }

                // Split into passed and upcoming
                const passed = slots.filter((s) => isSlotPassed(s.time, timing.bestDate));
                const upcoming = slots.filter((s) => !isSlotPassed(s.time, timing.bestDate));

                return (
                  <div key={name} className={styles.resultCard}>
                    {/* Card header - clickable only on mobile */}
                    <div
                      className={styles.resultCardHeader}
                      onClick={() => setExpandedOccasion(isExpanded ? null : name)}
                    >
                      <div className={styles.accordionTitle}>
                        <span>{name}</span>
                        {isCustom && <span className={styles.customTag}>Custom</span>}
                      </div>
                      <span className={styles.mobileChevron}>
                        {isExpanded ? <FiChevronUp size={20} color="#f75801" /> : <FiChevronDown size={20} color="#f75801" />}
                      </span>
                    </div>

                    {/* Card body - always visible on desktop, toggle on mobile */}
                    <div className={`${styles.resultCardBody} ${isExpanded ? styles.resultCardBodyOpen : ''}`}>
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
                  </div>
                );
              })}
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
              <h4 className={styles.modalTitle}>Select Custom Date</h4>
              <button className={styles.modalClose} onClick={() => setShowDatePicker(false)} aria-label="Close">✕</button>
            </div>
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
                  const isPast = thisDate < today;
                  const isToday = d === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
                  const isSel = customDate && d === customDate.getDate() && calendarMonth === customDate.getMonth() && calendarYear === customDate.getFullYear();
                  cells.push(
                    <button key={d} className={`${styles.calDay} ${isSel ? styles.calDaySelected : ''} ${isToday && !isSel ? styles.calDayToday : ''} ${isPast ? styles.calDayDisabled : ''}`}
                      disabled={isPast}
                      onClick={() => { if (isPast) return; clearNavState(); setCustomDate(thisDate); setSelectedPeriod(null); setShowDatePicker(false); }}>
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
    <Footer />
    </>
  );
};

export default AgenticCalendar;
