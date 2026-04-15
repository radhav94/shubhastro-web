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

  // Resolve format based on mode
  const resolvedFormat =
    dateFormat || (isDateTime ? "dd/MM/yyyy hh:mm aa" : "dd/MM/yyyy");

  const resolvedPlaceholder =
    placeholder ||
    (isDateTime ? "Select date & time" : "Select date");

  // Custom input for consistent cross-browser rendering
  const CustomInput = forwardRef(({ value, onClick, onChange: onInputChange }, ref) => (
    <input
      ref={ref}
      type="text"
      value={value}
      onClick={onClick}
      onChange={onInputChange}
      placeholder={resolvedPlaceholder}
      disabled={disabled}
      className={styles.input}
      readOnly={false}
      autoComplete="off"
    />
  ));
  CustomInput.displayName = "CustomInput";

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <DatePicker
        selected={selected}
        onChange={onChange}
        // Date options
        {...(!isTimeOnly && {
          showMonthDropdown: true,
          showYearDropdown: true,
          dropdownMode: "select",
          scrollableYearDropdown: true,
          yearDropdownItemNumber: 100,
        })}
        // Time options
        showTimeSelect={isDateTime}
        showTimeSelectOnly={false}
        timeFormat="hh:mm aa"
        timeIntervals={15}
        // Format
        dateFormat={resolvedFormat}
        // Constraints
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        // Custom input for Safari compatibility
        customInput={<CustomInput />}
        // Positioning
        popperPlacement="bottom-start"
        popperClassName={styles.popper}
        calendarClassName={styles.calendar}
        // Accessibility
        autoComplete="off"
      />
    </div>
  );
};

export default DateTimePicker;
