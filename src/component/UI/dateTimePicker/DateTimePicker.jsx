import { forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./DateTimePicker.module.scss";

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

  // Resolve format based on mode
  const resolvedFormat = dateFormat || (
    isTimeOnly ? "HH:mm" : isDateTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy"
  );

  const resolvedPlaceholder = placeholder || (
    isTimeOnly ? "Select time" : isDateTime ? "Select date & time" : "Select date"
  );

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
        showTimeSelect={isTimeOnly || isDateTime}
        showTimeSelectOnly={isTimeOnly}
        timeFormat="HH:mm"
        timeIntervals={15}
        // Format
        dateFormat={resolvedFormat}
        // Constraints
        minDate={!isTimeOnly ? minDate : undefined}
        maxDate={!isTimeOnly ? maxDate : undefined}
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
