import { useState, useRef, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./DateTimePicker.module.scss";

/* ───── 12-hour helpers ───── */
const to12 = (h24) => {
  const period = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return { hour: h12, period };
};

const to24 = (h12, period) => {
  if (period === "AM") return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
};

const pad = (n) => String(n).padStart(2, "0");

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ["AM", "PM"];

/* ───── Custom 12-hour Time Picker ───── */
const TimePicker12 = ({ selected, onChange, disabled, placeholder }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const [manualInput, setManualInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Derive display values from selected Date
  const hour = selected ? to12(selected.getHours()).hour : null;
  const minute = selected ? selected.getMinutes() : null;
  const period = selected ? to12(selected.getHours()).period : null;

  const displayValue =
    hour != null ? `${pad(hour)}:${pad(minute)} ${period}` : "";

  // Scroll selected items into view when dropdown opens
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // Small delay so DOM is painted
    const t = setTimeout(() => {
      hourListRef.current
        ?.querySelector(`.${styles.activeItem}`)
        ?.scrollIntoView({ block: "nearest" });
      minuteListRef.current
        ?.querySelector(`.${styles.activeItem}`)
        ?.scrollIntoView({ block: "nearest" });
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Sync manualInput with displayValue when not typing
  useEffect(() => {
    if (!isTyping) {
      setManualInput(displayValue);
    }
  }, [displayValue, isTyping]);

  const buildDate = useCallback(
    (h12, m, p) => {
      const d = selected ? new Date(selected) : new Date();
      d.setHours(to24(h12, p), m, 0, 0);
      return d;
    },
    [selected]
  );

  const handleSelect = (type, value) => {
    const curH = hour ?? 12;
    const curM = minute ?? 0;
    const curP = period ?? "AM";

    let newH = curH,
      newM = curM,
      newP = curP;
    if (type === "hour") newH = value;
    else if (type === "minute") newM = value;
    else newP = value;

    setIsTyping(false);
    onChange(buildDate(newH, newM, newP));
  };

  // Parse manual time input like "02:30 AM" or "2:30 pm"
  const parseManualTime = (text) => {
    const cleaned = text.trim().toUpperCase();
    // Try HH:MM AM/PM format
    const match12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (match12) {
      const h = parseInt(match12[1], 10);
      const m = parseInt(match12[2], 10);
      const p = match12[3];
      if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
        return { hour: h, minute: m, period: p };
      }
    }
    return null;
  };

  // Auto-format time input: only digits allowed, auto-inserts ":" and " AM/PM"
  const handleManualChange = (e) => {
    setIsTyping(true);
    const raw = e.target.value;
    
    // Check if user is trying to type AM/PM part
    const upperRaw = raw.toUpperCase();
    if (upperRaw.match(/^\d{2}:\d{2}\s*[AP]$/)) {
      // User typed 'A' or 'P' after time digits
      setManualInput(raw.toUpperCase());
      return;
    }
    if (upperRaw.match(/^\d{2}:\d{2}\s*(AM|PM)$/)) {
      // User completed AM/PM
      setManualInput(upperRaw);
      const parsed = parseManualTime(upperRaw);
      if (parsed) {
        onChange(buildDate(parsed.hour, parsed.minute, parsed.period));
      }
      return;
    }
    
    // Extract only digits from input
    const digits = raw.replace(/[^0-9]/g, "");
    const prevDigits = manualInput.replace(/[^0-9]/g, "");
    
    // Detect if user is deleting
    const isDeleting = raw.length < manualInput.length;
    
    let limitedDigits;
    if (isDeleting) {
      // When deleting from a complete value (4 digits + AM/PM), remove last digit
      if (prevDigits.length === 4 && digits.length === 4) {
        limitedDigits = digits.slice(0, 3);
      } else {
        limitedDigits = digits.slice(0, 4);
      }
    } else {
      limitedDigits = digits.slice(0, 4);
    }
    
    // If clearing everything
    if (limitedDigits.length === 0) {
      setManualInput("");
      return;
    }
    
    // Validate hour and minute as user types (only when adding, not deleting)
    if (!isDeleting) {
      if (limitedDigits.length >= 1) {
        const firstDigit = parseInt(limitedDigits[0], 10);
        if (firstDigit > 1) return;
      }
      if (limitedDigits.length >= 2) {
        const h = parseInt(limitedDigits.slice(0, 2), 10);
        if (h < 1 || h > 12) return;
      }
      if (limitedDigits.length >= 3) {
        const thirdDigit = parseInt(limitedDigits[2], 10);
        if (thirdDigit > 5) return;
      }
      if (limitedDigits.length >= 4) {
        const m = parseInt(limitedDigits.slice(2, 4), 10);
        if (m > 59) return;
      }
    }
    
    // Build formatted string: HH:MM
    let formatted = "";
    for (let i = 0; i < limitedDigits.length; i++) {
      if (i === 2) formatted += ":";
      formatted += limitedDigits[i];
    }
    
    // Once 4 digits are entered (HH:MM), append a space to prompt AM/PM typing
    if (limitedDigits.length === 4) {
      formatted += " ";
    }
    
    setManualInput(formatted);
  };

  const handleManualBlur = () => {
    setIsTyping(false);
    if (!manualInput.trim()) {
      setManualInput(displayValue);
      return;
    }
    const parsed = parseManualTime(manualInput);
    if (parsed) {
      onChange(buildDate(parsed.hour, parsed.minute, parsed.period));
    } else {
      // Revert to current value if invalid
      setManualInput(displayValue);
    }
  };

  const handleManualKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
    // Allow toggling AM/PM with 'a' or 'p' key when time digits are entered
    const key = e.key.toLowerCase();
    if (key === "a" || key === "p") {
      const digits = manualInput.replace(/[^0-9]/g, "");
      if (digits.length === 4) {
        e.preventDefault();
        const newPeriod = key === "a" ? "AM" : "PM";
        const timeBase = manualInput.replace(/\s*(AM|PM|[AP])?$/, "");
        const newInput = `${timeBase} ${newPeriod}`;
        setManualInput(newInput);
        setIsTyping(false);
        const parsed = parseManualTime(newInput);
        if (parsed) {
          onChange(buildDate(parsed.hour, parsed.minute, parsed.period));
        }
      }
    }
  };

  return (
    <div className={styles.timePickerWrapper} ref={wrapperRef}>
      <div className={styles.dateInputRow}>
        <input
          type="text"
          value={isTyping ? manualInput : displayValue}
          onChange={handleManualChange}
          onBlur={handleManualBlur}
          onKeyDown={handleManualKeyDown}
          onFocus={() => setIsTyping(true)}
          placeholder={placeholder || "HH:MM AM/PM"}
          disabled={disabled}
          className={styles.input}
          autoComplete="off"
        />
        <button
          type="button"
          className={styles.calendarBtn}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          tabIndex={-1}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
      </div>
      {open && (
        <div className={styles.timeDropdown}>
          {/* Hours */}
          <div className={styles.timeColumn} ref={hourListRef}>
            {HOURS.map((h) => (
              <div
                key={h}
                className={`${styles.timeItem} ${h === hour ? styles.activeItem : ""}`}
                onClick={() => handleSelect("hour", h)}
              >
                {pad(h)}
              </div>
            ))}
          </div>

          {/* Minutes */}
          <div className={styles.timeColumn} ref={minuteListRef}>
            {MINUTES.map((m) => (
              <div
                key={m}
                className={`${styles.timeItem} ${m === minute ? styles.activeItem : ""}`}
                onClick={() => handleSelect("minute", m)}
              >
                {pad(m)}
              </div>
            ))}
          </div>

          {/* AM / PM */}
          <div className={styles.timeColumn}>
            {PERIODS.map((p) => (
              <div
                key={p}
                className={`${styles.timeItem} ${p === period ? styles.activeItem : ""}`}
                onClick={() => handleSelect("period", p)}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


/* ───── Main DateTimePicker ───── */

/**
 * DateTimePicker - Reusable, cross-browser date/time picker
 *
 * @param {string} label - Input label
 * @param {Date|null} selected - Currently selected date
 * @param {Function} onChange - Callback with selected Date object
 * @param {"date"|"time"|"datetime"} mode - Picker mode
 * @param {string} dateFormat - Display format (default: dd/MM/yyyy)
 * @param {string} placeholder - Placeholder text
 * @param {Date} minDate - Minimum selectable date
 * @param {Date} maxDate - Maximum selectable date
 * @param {boolean} disabled - Disable the input
 * @param {string} className - Additional wrapper class
 * @param {boolean} required - Show required indicator
 */
const DateTimePicker = ({
  label,
  selected,
  onChange,
  mode = "date",
  dateFormat,
  placeholder,
  minDate,
  maxDate,
  disabled = false,
  className = "",
  required = false,
  // Legacy prop support
  showTime,
}) => {
  // Resolve mode from legacy showTime prop
  const resolvedMode = showTime ? "datetime" : mode;

  const isTimeOnly = resolvedMode === "time";
  const isDateTime = resolvedMode === "datetime";

  // For time-only mode, use our custom 12-hour picker
  if (isTimeOnly) {
    return (
      <div className={`${styles.wrapper} ${className}`}>
        {label && (
          <label className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <TimePicker12
          selected={selected}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder || "Select time"}
        />
      </div>
    );
  }

  // ── Date / DateTime mode ──

  const resolvedFormat =
    dateFormat || (isDateTime ? "dd/MM/yyyy hh:mm aa" : "dd/MM/yyyy");

  const resolvedPlaceholder =
    placeholder || (isDateTime ? "Select date & time" : "dd/mm/yyyy");

  // Controlled text input for manual entry
  const formatDateDisplay = (d) => {
    if (!d) return "";
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const [inputText, setInputText] = useState(selected ? formatDateDisplay(selected) : "");
  const [dateError, setDateError] = useState("");

  // Sync inputText when selected prop changes (picker or parent update)
  useEffect(() => {
    setInputText(selected ? formatDateDisplay(selected) : "");
    setDateError("");
  }, [selected]);

  // Parse DD/MM/YYYY string to Date
  const parseManualDate = (text) => {
    const cleaned = text.replace(/[^0-9/]/g, "");
    const parts = cleaned.split("/");
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts;
    if (!dd || !mm || !yyyy || yyyy.length !== 4) return null;
    const d = parseInt(dd, 10);
    const m = parseInt(mm, 10);
    const y = parseInt(yyyy, 10);
    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900) return null;
    const date = new Date(y, m - 1, d);
    // Verify the date is valid (e.g., not Feb 30)
    if (date.getDate() !== d || date.getMonth() !== m - 1 || date.getFullYear() !== y) return null;
    // Check constraints
    if (minDate && date < minDate) return null;
    if (maxDate && date > maxDate) return null;
    return date;
  };

  const handleManualChange = (e) => {
    const val = e.target.value;
    // Auto-insert slashes for DD/MM/YYYY format
    const digits = val.replace(/[^0-9]/g, "");
    let formatted = "";
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 2 || i === 4) formatted += "/";
      formatted += digits[i];
    }
    setInputText(formatted);
    // Check validity once full date is entered (DD/MM/YYYY = 10 chars)
    if (formatted.length === 10) {
      const parsed = parseManualDate(formatted);
      if (parsed) {
        setDateError("");
        onChange(parsed);
      } else {
        setDateError("Invalid date");
      }
    } else {
      setDateError("");
    }
  };

  const handleManualBlur = () => {
    // On blur, if text doesn't parse to a valid date, show error or revert
    if (inputText.length === 0) {
      setDateError("");
      return;
    }
    const parsed = parseManualDate(inputText);
    if (!parsed) {
      setDateError("Invalid date");
    }
  };

  const handlePickerChange = (date) => {
    onChange(date);
    // inputText will sync via the useEffect above
  };

  // Ref for the DatePicker to open programmatically
  const datePickerRef = useRef(null);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.dateInputRow}>
        <input
          type="text"
          value={inputText}
          onChange={handleManualChange}
          onBlur={handleManualBlur}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          className={`${styles.input} ${dateError ? styles.inputError : ""}`}
          autoComplete="off"
        />
        {/* Invisible overlay covering right 1/3 of input to open calendar */}
        <div
          className={styles.calendarOverlay}
          onClick={() => !disabled && datePickerRef.current?.setOpen(true)}
        />
        <button
          type="button"
          className={styles.calendarBtn}
          disabled={disabled}
          onClick={() => datePickerRef.current?.setOpen(true)}
          tabIndex={-1}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>
      {dateError && <p className={styles.dateError}>{dateError}</p>}

      {/* Hidden DatePicker for calendar popup */}
      <div className={styles.hiddenPicker}>
        <DatePicker
          ref={datePickerRef}
          selected={selected}
          onChange={handlePickerChange}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          scrollableYearDropdown
          yearDropdownItemNumber={100}
          showTimeSelect={isDateTime}
          timeFormat="hh:mm aa"
          timeIntervals={15}
          dateFormat={resolvedFormat}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          popperPlacement="bottom-start"
          popperClassName={styles.popper}
          calendarClassName={styles.calendar}
        />
      </div>
    </div>
  );
};

export default DateTimePicker;
