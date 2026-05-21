import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiChevronRight, FiCalendar, FiChevronLeft } from "react-icons/fi";

const OCCASIONS = [
  'Marriage', 'Job Interview', 'Business Launch', 'House Purchase',
  'Travel', 'Surgery', 'Investment', 'Education', 'Moving House', 'Important Meeting'
];

const AgenticCalendarV2 = ({ styles }) => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

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

  const allOccasions = [...OCCASIONS, ...customOccasions];

  const toggleOccasion = (occasion) => {
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

  const handleGetMuhurat = () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    navigate("/aiwow/agentic-calendar", {
      state: {
        occasions: selectedOccasions,
        period: selectedPeriod,
        customDate: customFromDate ? customFromDate.toISOString() : null,
        customToDate: customToDate ? customToDate.toISOString() : null,
      },
    });
  };

  return (
    <>
      {/* Header */}
      <div className={styles.calHead}>
        <div className={`${styles.titleWithBottomDevider} ${styles.tWBmarginBottomZero}`}>
          <h4 className={styles.wowTitle}>MUHARAT CALENDAR</h4>
          <div className={styles.BottomDevider}>
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
              <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
            </svg>
          </div>
        </div>
        <button className={styles.viewAllBtn} style={{ color: '#f75801' }} onClick={() => navigate('/aiwow/agentic-calendar')}>
          View All <FiChevronRight size={14} />
        </button>
      </div>

      {/* Body */}
      <div className={styles.calBody}>

        {/* Select Occasions */}
        <div className={styles.calOccasions}>
          <p className={styles.calLabel}>Select Occasions</p>
          <div className={styles.calChips}>
            {[...allOccasions]
              .sort((a, b) => {
                const aS = selectedOccasions.includes(a);
                const bS = selectedOccasions.includes(b);
                return aS === bS ? 0 : aS ? -1 : 1;
              })
              .map(occasion => {
                const isSelected = selectedOccasions.includes(occasion);
                return (
                  <button
                    key={occasion}
                    className={isSelected ? styles.calChipActive : styles.calChip}
                    onClick={() => !isSelected && toggleOccasion(occasion)}
                  >
                    {occasion}
                    {isSelected && (
                      <span
                        className={styles.calChipX}
                        onClick={e => { e.stopPropagation(); handleRemoveChip(occasion); }}
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

        {/* CTA */}
        <button
          className={styles.calCta}
          disabled={selectedOccasions.length === 0}
          onClick={handleGetMuhurat}
        >
          View Muhuratas
        </button>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && createPortal(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
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
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
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
    </>
  );
};

export default AgenticCalendarV2;
