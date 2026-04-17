import { forwardRef, useState, useRef, useEffect, useCallback } from "react";
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

    onChange(buildDate(newH, newM, newP));
  };

  return (
    <div className={styles.timePickerWrapper} ref={wrapperRef}>
      <input
        type="text"
        readOnly
        value={displayValue}
        placeholder={placeholder || "Select time"}
        disabled={disabled}
        className={styles.input}
        onClick={() => !disabled && setOpen((o) => !o)}
        autoComplete="off"
      />

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

  // Sync inputText when selected prop changes (picker or parent update)
  useEffect(() => {
    setInputText(selected ? formatDateDisplay(selected) : "");
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
    setInputText(val);
    // Try to parse as user types — only call onChange when fully valid
    const parsed = parseManualDate(val);
    if (parsed) {
      onChange(parsed);
    }
  };

  const handleManualBlur = () => {
    // On blur, if text doesn't parse to a valid date, revert to selected
    const parsed = parseManualDate(inputText);
    if (!parsed && inputText.length > 0) {
      // Revert to last valid selection
      setInputText(selected ? formatDateDisplay(selected) : "");
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
          className={styles.input}
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
