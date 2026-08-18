import { forwardRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/**
 * The react-datepicker calendar popup, split out so it is not part of the entry
 * bundle.
 *
 * react-datepicker + its date-fns dependency measured ~157 kB raw — around 15%
 * of the entry chunk — and it was in the entry chunk on *every* route because
 * DateTimePicker is reachable from unconditionally-mounted modals (ProfileModals
 * on the homepage, GuestKundliAuthModal, AddProfileModal). So a visitor reading
 * the Kundli charts downloaded a date-picker library they never opened.
 *
 * Splitting it costs nothing visually: DateTimePicker's own field — the text
 * input, the calendar-icon button and the tap overlay — is hand-rolled markup
 * with no react-datepicker in it. This component is only the hidden popup that
 * appears after the user taps to open the calendar, which is exactly when it is
 * worth paying for.
 *
 * `onReady` fires once the picker has mounted, so the parent can honour a tap
 * that arrived *before* the chunk finished loading (see openCalendar in
 * DateTimePicker.jsx) instead of swallowing it.
 */
const LazyCalendar = forwardRef(function LazyCalendar(
  {
    selected,
    onChange,
    isDateTime,
    dateFormat,
    minDate,
    maxDate,
    disabled,
    dropUp,
    portal,
    popperClassName,
    calendarClassName,
    onReady,
  },
  ref
) {
  useEffect(() => {
    onReady?.();
    // Mount-only: the parent just needs to know the picker now exists.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DatePicker
      ref={ref}
      selected={selected}
      onChange={onChange}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      scrollableYearDropdown
      yearDropdownItemNumber={100}
      showTimeSelect={isDateTime}
      timeFormat="hh:mm aa"
      timeIntervals={15}
      dateFormat={dateFormat}
      minDate={minDate}
      maxDate={maxDate}
      disabled={disabled}
      popperPlacement={dropUp ? "top-start" : "bottom-start"}
      popperClassName={popperClassName}
      calendarClassName={calendarClassName}
      {...(portal ? { portalId: "rdp-portal" } : {})}
    />
  );
});

export default LazyCalendar;
