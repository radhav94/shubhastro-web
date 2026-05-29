import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiChevronRight, FiMapPin, FiCalendar, FiChevronLeft } from "react-icons/fi";
import styles from "../Home.module.scss";

const OCCASIONS = [
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

const PlanEventsBanner = () => {
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
    setSelectedOccasions((prev) =>
      prev.includes(occasion)
        ? prev.filter((o) => o !== occasion)
        : [...prev, occasion]
    );
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !allOccasions.includes(trimmed)) {
      setCustomOccasions((prev) => [...prev, trimmed]);
      setSelectedOccasions((prev) => [...prev, trimmed]);
      setCustomInput("");
      setShowCustomModal(false);
    }
  };

  const handleRemoveChip = (occasion) => {
    setSelectedOccasions((prev) => prev.filter((o) => o !== occasion));
    // If it's a custom occasion, also remove it from the list entirely
    if (customOccasions.includes(occasion)) {
      setCustomOccasions((prev) => prev.filter((o) => o !== occasion));
    }
  };

  const handleGetMuhurat = () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      // Redirect to login page
      navigate("/login");
      return;
    }

    // If logged in, navigate to agentic calendar with state
    navigate("/aiwow/muhurat-calendar", {
      state: {
        occasions: selectedOccasions,
        period: selectedPeriod,
        customDate: customFromDate ? customFromDate.toISOString() : null,
        customToDate: customToDate ? customToDate.toISOString() : null,
      },
    });
  };

  const handlePlanEventsBannerClick = () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      // Redirect to login page
      navigate("/login");
      return;
    }

    // If logged in, navigate to agentic calendar
    navigate("/aiwow/muhurat-calendar");
  };

  return (
    <section className={styles.agenticCalendarSection}>
      {/* Section Header */}
      <div className={styles.sessionsHeader}>
        <div className={styles.sessionsHeaderLeft}>
          <h2 className={styles.sessionsTitle}>MUHURAT CALENDAR</h2>
          <div className={styles.agenticTitleDivider}>
            <div className={styles.agenticDividerLine} />
            <span className={styles.dividerMoon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
                <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
              </svg>
            </span>
            <div className={styles.agenticDividerLine} />
          </div>
        </div>
      </div>

      {/* Plan Your Events Banner */}
      <div className={styles.planEventsBanner} onClick={handlePlanEventsBannerClick}>
        <div className={styles.planEventsContent}>
          <h3 className={styles.planEventsTitle}>Plan Your Events</h3>
          <p className={styles.planEventsSubtitle}>
            Astrologically optimal timings
            <br />
            for your key life events.
          </p>
          {/* <div className={styles.planEventsLocation}>
            <FiMapPin size={16} />
            <span>Based On: Mumbai</span>
          </div> */}
        </div>
        <div className={styles.planEventsArrow}>
          <FiChevronRight size={22} />
        </div>
      </div>

      {/* Select Occasions */}
      <div className={styles.occasionsWrapper}>
        <h4 className={styles.occasionsTitle}>Select Occasions</h4>
        <div className={styles.occasionsScroll}>
          {[...allOccasions]
            .sort((a, b) => {
              const aSelected = selectedOccasions.includes(a);
              const bSelected = selectedOccasions.includes(b);
              if (aSelected && !bSelected) return -1;
              if (!aSelected && bSelected) return 1;
              return 0;
            })
            .map((occasion) => {
              const isSelected = selectedOccasions.includes(occasion);
              return (
                <button
                  key={occasion}
                  className={`${styles.occasionChip} ${isSelected ? styles.selected : ""}`}
                  onClick={() => !isSelected && toggleOccasion(occasion)}
                >
                  {occasion}
                  {isSelected && (
                    <span
                      className={styles.chipClose}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveChip(occasion);
                      }}
                      role="button"
                      aria-label={`Remove ${occasion}`}
                    >
                      ✕
                    </span>
                  )}
                </button>
              );
            })}
          <button
            className={styles.addCustomChip}
            onClick={() => setShowCustomModal(true)}
          >
            + Add Custom
          </button>
        </div>
        <p className={styles.occasionsHint}>
          Select one or more occasions to view Muhurat
        </p>

        {/* Time Period Chips */}
        <div className={styles.periodDivider} />
        <div className={styles.periodScroll}>
          {["Today", "Tomorrow", "This Week", "This Month"].map((period) => (
            <button
              key={period}
              className={`${styles.periodChip} ${selectedPeriod === period ? styles.periodSelected : ""
                }`}
              onClick={() => { setSelectedPeriod(period); setCustomFromDate(null); setCustomToDate(null); }}
            >
              {period}
            </button>
          ))}
          <button
            className={`${styles.dateChip} ${customFromDate ? styles.periodSelected : ""}`}
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

        {/* Get Muhurat Button */}
        <button
          className={styles.getMuhuratBtn}
          disabled={selectedOccasions.length === 0}
          onClick={handleGetMuhurat}
        >
          Get Muhurat
        </button>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className={styles.customModalOverlay} onClick={() => setShowDatePicker(false)}>
          <div className={styles.customModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.customModalHeader}>
              <h4 className={styles.customModalTitle}>Select Date Range</h4>
              <button
                className={styles.customModalClose}
                onClick={() => setShowDatePicker(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className={styles.dateRangeHint}>
              {!customFromDate || (customFromDate && customToDate)
                ? "Tap to select start date"
                : `From: ${customFromDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} — Now select end date`}
            </p>

            {/* Calendar Header */}
            <div className={styles.calendarNav}>
              <button
                className={styles.calendarNavBtn}
                disabled={calendarYear === new Date().getFullYear() && calendarMonth === new Date().getMonth()}
                onClick={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear((y) => y - 1);
                  } else {
                    setCalendarMonth((m) => m - 1);
                  }
                }}
              >
                <FiChevronLeft size={20} />
              </button>
              <span className={styles.calendarMonthLabel}>
                {new Date(calendarYear, calendarMonth).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                className={styles.calendarNavBtn}
                onClick={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear((y) => y + 1);
                  } else {
                    setCalendarMonth((m) => m + 1);
                  }
                }}
              >
                <FiChevronRight size={20} />
              </button>
            </div>

            {/* Day Headers */}
            <div className={styles.calendarGrid}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <span key={d} className={styles.calendarDayHeader}>{d}</span>
              ))}

              {/* Calendar Days */}
              {(() => {
                const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                const offset = firstDay === 0 ? 6 : firstDay - 1;
                const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();
                const cells = [];

                // Previous month trailing days
                for (let i = offset - 1; i >= 0; i--) {
                  cells.push(
                    <span key={`prev-${i}`} className={`${styles.calendarDay} ${styles.calendarDayMuted}`}>
                      {prevMonthDays - i}
                    </span>
                  );
                }

                // Current month days
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
                    <button
                      key={d}
                      className={`${styles.calendarDay} ${isFrom || isTo ? styles.calendarDaySelected : ""} ${isInRange ? styles.calendarDayInRange : ""} ${isToday && !isFrom && !isTo ? styles.calendarDayToday : ""} ${isPast ? styles.calendarDayDisabled : ""}`}
                      disabled={isPast}
                      onClick={() => {
                        if (isPast) return;
                        if (!customFromDate || (customFromDate && customToDate)) {
                          setCustomFromDate(thisDate);
                          setCustomToDate(null);
                        } else {
                          if (thisDate < customFromDate) {
                            setCustomToDate(customFromDate);
                            setCustomFromDate(thisDate);
                          } else {
                            setCustomToDate(thisDate);
                          }
                          setSelectedPeriod(null);
                          setShowDatePicker(false);
                        }
                      }}
                    >
                      {d}
                    </button>
                  );
                }

                // Next month leading days
                const remaining = 42 - cells.length;
                for (let i = 1; i <= remaining; i++) {
                  cells.push(
                    <span key={`next-${i}`} className={`${styles.calendarDay} ${styles.calendarDayMuted}`}>
                      {i}
                    </span>
                  );
                }

                return cells;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Occasion Modal */}
      {showCustomModal && (
        <div className={styles.customModalOverlay} onClick={() => setShowCustomModal(false)}>
          <div className={styles.customModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.customModalHeader}>
              <h4 className={styles.customModalTitle}>Add Custom Occasion</h4>
              <button
                className={styles.customModalClose}
                onClick={() => { setShowCustomModal(false); setCustomInput(""); }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <label className={styles.customModalLabel}>Occasion Name</label>
            <input
              type="text"
              className={styles.customModalInput}
              placeholder="e.g., House Warming"
              value={customInput}
              onChange={(e) => {
                if (e.target.value.length <= 30) setCustomInput(e.target.value);
              }}
              maxLength={30}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
            />
            <span className={styles.customModalCharCount}>
              {customInput.length}/30 characters
            </span>
            <button
              className={styles.customModalAddBtn}
              onClick={handleAddCustom}
              disabled={!customInput.trim()}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default PlanEventsBanner;
