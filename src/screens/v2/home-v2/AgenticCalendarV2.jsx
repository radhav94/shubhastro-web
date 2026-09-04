import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiChevronRight, FiCalendar, FiChevronLeft } from "react-icons/fi";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import useUserLocation from "../../../utils/hooks/useUserLocation";
import { GuestKundliAuthModal } from "../../../component/UI/Profile";

const OCCASIONS = [
  'Marriage', 'Job Interview', 'Business Launch', 'House Purchase',
  'Travel', 'Surgery', 'Investment', 'Education', 'Moving House', 'Important Meeting'
];

const AgenticCalendarV2 = ({ styles }) => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userLocation = useUserLocation();

  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const pendingActionRef = useRef(null);

  // Guests open the add-kundli flow; the pending navigation runs after login.
  const openGuestAuth = (action) => {
    pendingActionRef.current = action;
    setShowGuestAuthModal(true);
  };
  const handleGuestAuthSuccess = () => {
    setShowGuestAuthModal(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) action();
  };

  const [selectedOccasions, setSelectedOccasions] = useState([]);
  const [customOccasions, setCustomOccasions] = useState([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("Today");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customFromDate, setCustomFromDate] = useState(null);
  const [customToDate, setCustomToDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [locationValue, setLocationValue] = useState('');
  const [locationData, setLocationData] = useState(null);

  /*
    Inline, in-region answer for a "View Muhurat" tap that cannot proceed.

    Both blockers here used to answer with `toast.error(...)`. That reads like
    feedback but it is invisible to the dead-click metric and, more importantly,
    often invisible to the user: the toaster is mounted `position="top-right"`
    (main.jsx), while this CTA sits at the bottom of a tall widget partway down
    the homepage — so on desktop the only thing that changed was off-screen,
    nowhere near the cursor. It also mutates nothing inside the clicked region,
    which is exactly what Clarity records as a dead click.

    Same treatment LoginScreen already uses for its blocked taps: a real element
    rendered next to the control that was clicked, plus a highlight on whichever
    field is actually missing. `seq` increments on every call and keys the
    element, so tapping the CTA a second time remounts the paragraph and replays
    its animation — without that, a repeat tap would set an identical string,
    React would render nothing, and it would be a dead click again.
  */
  const [hint, setHint] = useState(null);
  const locationInputRef = useRef(null);
  const occasionsRef = useRef(null);

  const showHint = (text, target) => {
    setHint((prev) => ({ text, target, seq: (prev?.seq || 0) + 1 }));
  };

  // Auto-fill location from detected user location (same source as Today's Muhurat)
  useEffect(() => {
    if (!userLocation.isDefault && userLocation.loaded && userLocation.locationName && userLocation.locationName !== "Your Location") {
      // Only auto-fill if user hasn't manually entered a location
      if (!locationValue) {
        setLocationValue(userLocation.locationName);
        setLocationData({
          address: userLocation.locationName,
          lat: userLocation.lat,
          lng: userLocation.lon,
        });
      }
    }
  }, [userLocation.isDefault, userLocation.loaded, userLocation.locationName]);

  const allOccasions = [...OCCASIONS, ...customOccasions];

  const toggleOccasion = (occasion) => {
    // Picking an occasion is the response the hint asked for, so drop stale
    // advice rather than leaving it under a form that has moved on.
    if (hint?.target === 'occasions') setHint(null);
    setSelectedOccasions(prev =>
      prev.includes(occasion) ? prev.filter(o => o !== occasion) : [...prev, occasion]
    );
  };

  const handleRemoveChip = (occasion) => {
    setSelectedOccasions(prev => prev.filter(o => o !== occasion));
    if (customOccasions.includes(occasion)) {
      setCustomOccasions(prev => prev.filter(o => o !== occasion));
    }
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !allOccasions.includes(trimmed)) {
      setCustomOccasions(prev => [...prev, trimmed]);
      setSelectedOccasions(prev => [...prev, trimmed]);
      setCustomInput("");
      setShowCustomModal(false);
    }
  };

  // `locationData` is only populated by picking a Google Places suggestion, so a
  // user who typed a city and never tapped the dropdown has a filled-looking
  // field but no coordinates. Fall back to the detected location instead of
  // silently blocking them.
  const effectiveLocation =
    locationData ||
    (userLocation.loaded && !userLocation.isDefault
      ? { address: userLocation.locationName, lat: userLocation.lat, lng: userLocation.lon }
      : null);

  const isCtaIncomplete = selectedOccasions.length === 0 || !effectiveLocation;

  const handleGetMuhurat = () => {
    if (selectedOccasions.length === 0) {
      showHint("Pick at least one occasion above to see its Muhurat.", 'occasions');
      // The chips row scrolls horizontally and sits above the CTA, so make sure
      // the thing the message points at is actually on screen.
      occasionsRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    if (!effectiveLocation) {
      showHint("Add your city and tap it in the suggestions — Muhurat timings depend on it.", 'location');
      locationInputRef.current?.focus();
      return;
    }
    setHint(null);
    const state = {
      occasions: selectedOccasions,
      period: selectedPeriod,
      customDate: customFromDate ? customFromDate.toISOString() : null,
      customToDate: customToDate ? customToDate.toISOString() : null,
      location: effectiveLocation,
    };
    const go = () => navigate("/ai-wow/muhurat-calendar", { state });
    if (!isLoggedIn) { openGuestAuth(go); return; }
    go();
  };

  return (
    <>
      {/* Header */}
      <div className={styles.calHead}>
        <div className={`${styles.titleWithBottomDevider} ${styles.tWBmarginBottomZero}`}>
          {/* h2: same rank as every other section title on the homepage. As an
              <h4> it skipped a level in the outline. Size comes from .wowTitle. */}
          <h2 className={styles.wowTitle}>MUHURAT CALENDAR</h2>
        </div>
        <button className={styles.viewAllBtn} style={{ color: '#f75801' }} onClick={() => { const go = () => navigate('/ai-wow/muhurat-calendar'); if (!isLoggedIn) { openGuestAuth(go); return; } go(); }}>
          View All <FiChevronRight size={14} />
        </button>
      </div>

      {/* Body */}
      <div className={styles.calBody}>

        {/* Select Occasions */}
        <div className={styles.calOccasions} ref={occasionsRef}>
          <p className={`${styles.calLabel} ${hint?.target === 'occasions' ? styles.calLabelBlocked : ''}`.trim()}>
            Select Occasions
          </p>
          <div className={styles.calChips}>
            {/* Render order is deliberately stable. This list used to be sorted
                with the selected occasions first, so tapping a chip made it jump
                to the front and shifted every other chip under the user's
                cursor — the next tap then landed on the wrong chip or on dead
                space. That reads as rage clicking in Clarity. Selection is
                already obvious from .calChipActive; it does not need reordering. */}
            {allOccasions.map(occasion => {
              const isSelected = selectedOccasions.includes(occasion);
              return (
                <button
                  key={occasion}
                  className={isSelected ? styles.calChipActive : styles.calChip}
                  // Tapping a selected chip must also deselect it. Previously the
                  // handler was `!isSelected && toggleOccasion(...)`, so a second
                  // tap did nothing at all and only the small ✕ worked.
                  onClick={() => toggleOccasion(occasion)}
                  aria-pressed={isSelected}
                >
                  {occasion}
                  {isSelected && (
                    <span
                      className={styles.calChipX}
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove ${occasion}`}
                      onClick={e => { e.stopPropagation(); handleRemoveChip(occasion); }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveChip(occasion);
                        }
                      }}
                    >✕</span>
                  )}
                </button>
              );
            })}
            <button className={styles.calChipAdd} onClick={() => setShowCustomModal(true)}>
              + Add Custom
            </button>
          </div>
          <p className={styles.calHint}>Select one or more occasions to view Muhurat</p>
        </div>

        {/* Divider */}
        <div className={styles.calDivider} />

        {/* Date filter */}
        <div className={styles.calDateRow}>
          {["Today", "Tomorrow", "This Week", "This Month"].map(period => (
            <button
              key={period}
              className={selectedPeriod === period && !customFromDate ? styles.calDateActive : styles.calDateChip}
              onClick={() => { setSelectedPeriod(period); setCustomFromDate(null); setCustomToDate(null); }}
            >
              {period}
            </button>
          ))}
          <button
            className={`${styles.calChipAdd} ${customFromDate ? styles.calDateActive : ''}`}
            onClick={() => setShowDatePicker(true)}
          >
            <FiCalendar size={14} />
            {customFromDate
              ? customToDate && customToDate.getTime() !== customFromDate.getTime()
                ? `${customFromDate.toLocaleDateString("en-US", { day: "numeric", month: "short" })} - ${customToDate.toLocaleDateString("en-US", { day: "numeric", month: "short" })}`
                : customFromDate.toLocaleDateString("en-US", { day: "numeric", month: "short" })
              : "Date"}
          </button>
        </div>

        {/* Location */}
        <div className={styles.calendarLocationField}>
          <label style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', display: 'block', marginBottom: 6 }}>
            Location
          </label>
          <div className={`${styles.agenticCalLocation} ${hint?.target === 'location' ? styles.calLocationBlocked : ''}`.trim()}>
            <LocationSearch
              inputRef={locationInputRef}
              value={locationValue}
              placeholder="Enter your location"
              /*
                Editing away from the picked place drops its coordinates.

                Clearing only on an empty field left a stale `locationData`
                behind: pick Mumbai, edit the text to Pune, and the field read
                Pune while the request still carried Mumbai's coordinates.
              */
              onChange={(e) => {
                const typed = e.target.value;
                setLocationValue(typed);
                setLocationData((prev) =>
                  prev && prev.address === typed ? prev : null
                );
              }}
              onPlaceSelect={({ address, lat, lng }) => {
                setLocationValue(address);
                setLocationData({ address, lat, lng });
                if (hint?.target === 'location') setHint(null);
              }}
            />
            {/* CTA */}
          {/* Intentionally not `disabled`. A disabled button swallows the tap, so
              a user who has picked occasions but whose location never resolved
              got no feedback whatsoever. The tap now says what is missing. */}
          <button
            className={`${styles.calCta} ${isCtaIncomplete ? styles.calCtaIncomplete : ''}`}
            onClick={handleGetMuhurat}
          >
            View Muhurat
          </button>
          </div>

          {/*
            role="status" so the message is announced rather than only seen, and
            without stealing focus from the field we just moved the cursor into.
            Keyed on `seq` — see the showHint comment for why.
          */}
          {hint && (
            <p key={hint.seq} className={styles.calInlineHint} role="status">
              {hint.text}
            </p>
          )}
        </div>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && createPortal(
        <div className="app-portal" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={() => setShowDatePicker(false)}>
          <div style={{ background:'#fff', borderRadius:16, padding:24, width:340, maxWidth:'90vw' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h4 style={{ margin:0, fontSize:16, fontWeight:700 }}>Select Date Range</h4>
              <button onClick={() => setShowDatePicker(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer' }}>✕</button>
            </div>
            <p style={{ fontSize:13, color:'#6b7280', marginBottom:12 }}>
              {!customFromDate || (customFromDate && customToDate)
                ? "Tap to select start date"
                : `From: ${customFromDate.toLocaleDateString("en-US", { day:"numeric", month:"short", year:"numeric" })} — Now select end date`}
            </p>
            {/* Calendar Nav */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <button onClick={() => { if(calendarMonth===0){setCalendarMonth(11);setCalendarYear(y=>y-1);}else{setCalendarMonth(m=>m-1);} }}
                style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                <FiChevronLeft size={20} />
              </button>
              <span style={{ fontWeight:600, fontSize:14 }}>
                {new Date(calendarYear, calendarMonth).toLocaleDateString("en-US", { month:"long", year:"numeric" })}
              </span>
              <button onClick={() => { if(calendarMonth===11){setCalendarMonth(0);setCalendarYear(y=>y+1);}else{setCalendarMonth(m=>m+1);} }}
                style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                <FiChevronRight size={20} />
              </button>
            </div>
            {/* Grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, textAlign:'center' }}>
              {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
                <span key={d} style={{ fontSize:11, color:'#9ca3af', fontWeight:600, padding:'4px 0' }}>{d}</span>
              ))}
              {(() => {
                const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                const offset = firstDay === 0 ? 6 : firstDay - 1;
                const daysInMonth = new Date(calendarYear, calendarMonth+1, 0).getDate();
                const today = new Date(); today.setHours(0,0,0,0);
                const cells = [];
                for(let i=0;i<offset;i++) cells.push(<span key={`e${i}`} />);
                for(let d=1;d<=daysInMonth;d++){
                  const thisDate = new Date(calendarYear, calendarMonth, d);
                  thisDate.setHours(0,0,0,0);
                  const isPast = thisDate < today;
                  const isFrom = customFromDate && thisDate.getTime() === new Date(customFromDate.getFullYear(), customFromDate.getMonth(), customFromDate.getDate()).getTime();
                  const isTo = customToDate && thisDate.getTime() === new Date(customToDate.getFullYear(), customToDate.getMonth(), customToDate.getDate()).getTime();
                  const isInRange = customFromDate && customToDate && thisDate > customFromDate && thisDate < customToDate;
                  cells.push(
                    <button key={d} disabled={isPast}
                      style={{ border:'none', borderRadius:6, padding:'6px 0', fontSize:13, cursor:isPast?'not-allowed':'pointer',
                        background: isFrom||isTo ? '#f75801' : isInRange ? '#fff3ee' : 'transparent',
                        color: isFrom||isTo ? '#fff' : isPast ? '#d1d5db' : '#1a1a1a',
                        fontWeight: isFrom||isTo ? 700 : 400 }}
                      onClick={() => {
                        if(isPast) return;
                        if(!customFromDate||(customFromDate&&customToDate)){
                          setCustomFromDate(thisDate); setCustomToDate(null);
                        } else {
                          if(thisDate < customFromDate){ setCustomToDate(customFromDate); setCustomFromDate(thisDate); }
                          else { setCustomToDate(thisDate); }
                          setSelectedPeriod(null); setShowDatePicker(false);
                        }
                      }}>{d}</button>
                  );
                }
                return cells;
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Custom Modal */}
      {showCustomModal && createPortal(
        <div className="app-portal" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={() => setShowCustomModal(false)}>
          <div style={{ background:'#fff', borderRadius:16, padding:24, width:320, maxWidth:'90vw' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h4 style={{ margin:0, fontSize:16, fontWeight:700 }}>Add Custom Occasion</h4>
              <button onClick={() => { setShowCustomModal(false); setCustomInput(""); }}
                style={{ background:'none', border:'none', fontSize:18, cursor:'pointer' }}>✕</button>
            </div>
            <label style={{ fontSize:13, color:'#6b7280', display:'block', marginBottom:8 }}>Occasion Name</label>
            <input
              type="text"
              placeholder="e.g., House Warming"
              value={customInput}
              onChange={e => { if(e.target.value.length<=30) setCustomInput(e.target.value); }}
              maxLength={30}
              autoFocus
              onKeyDown={e => e.key==="Enter" && handleAddCustom()}
              style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'10px 12px', fontSize:14, outline:'none', boxSizing:'border-box' }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, marginBottom:16 }}>
              <span style={{ fontSize:12, color:'#9ca3af' }}>{customInput.length}/30</span>
            </div>
            <button
              onClick={handleAddCustom}
              disabled={!customInput.trim()}
              style={{ width:'100%', height:44, background:'#f75801', border:'none', borderRadius:999, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', opacity: customInput.trim() ? 1 : 0.5 }}
            >Add</button>
          </div>
        </div>,
        document.body
      )}

      {showGuestAuthModal && createPortal(
        <GuestKundliAuthModal
          isOpen
          onClose={() => { setShowGuestAuthModal(false); pendingActionRef.current = null; }}
          onSuccess={handleGuestAuthSuccess}
        />,
        document.body
      )}
    </>
  );
};

export default AgenticCalendarV2;
