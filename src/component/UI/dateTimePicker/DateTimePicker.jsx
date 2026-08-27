import { useState, useRef, useEffect, useLayoutEffect, useCallback, lazy, Suspense } from "react";
import styles from "./DateTimePicker.module.scss";
import Toast from "../../toast";

// react-datepicker (+ date-fns) is ~157 kB raw and was sitting in the entry
// chunk on every route. It only backs the hidden calendar popup, so it loads on
// first tap instead. See LazyCalendar.jsx.
const LazyCalendar = lazy(() => import("./LazyCalendar"));

/*
 * A natively `disabled` input fires no events at all, so tapping one does
 * literally nothing — no focus, no message, no cursor hint on touch. Clarity
 * records those taps as dead clicks, and the user is left guessing why the
 * field won't open (most often: "Don't know the exact time of birth" is ticked).
 *
 * When a caller supplies `disabledReason`, the field stays tappable and
 * read-only, is marked `aria-disabled` for assistive tech, and explains itself
 * on tap. Same rule the astrologer Chat/Call buttons follow. Without a reason
 * the old native-disabled behaviour is kept, so existing callers are unchanged.
 */
const blockedTap = (disabled, disabledReason) => {
  const blocked = disabled && !!disabledReason;
  return {
    blocked,
    // Only hand the native attribute to the DOM when there's nothing to explain.
    nativeDisabled: disabled && !disabledReason,
    explain: () => Toast.info(disabledReason),
  };
};

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
const TimePicker12 = ({ selected, onChange, disabled, disabledReason, placeholder, dropUp = false, openOnClick = false }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);
  const [manualInput, setManualInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // Actual placement decided from available space. `dropUp` is only the initial
  // hint; we always prefer opening below and flip up only when there isn't
  // enough room below but there is above (mirrors the date picker's popper).
  const [placeUp, setPlaceUp] = useState(dropUp);

  // Decide placement once the dropdown is rendered (before paint, so no flash).
  useLayoutEffect(() => {
    if (!open) return;
    const wrapper = wrapperRef.current;
    const dropdown = dropdownRef.current;
    if (!wrapper || !dropdown) return;
    // The dropdown is absolutely positioned, so the wrapper rect equals the
    // input row's box.
    const rect = wrapper.getBoundingClientRect();
    const dropdownHeight = dropdown.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setPlaceUp(spaceBelow < dropdownHeight + 8 && spaceAbove > spaceBelow);
  }, [open]);

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

  /*
   * Close on outside interaction.
   *
   * This listened for `mousedown` only. mousedown is a compatibility event that
   * touch browsers synthesise late, and iOS Safari does not fire it at all for
   * taps it interprets itself — so on a phone the dropdown could stay stuck open
   * over the rest of the form, and taps aimed at the fields underneath hit it
   * instead. LocationSearch, which sits in the same guest-details form, already
   * listens for touchstart and Escape; this is the same fix so the two behave
   * alike.
   */
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("keydown", handleKeyDown);
    };
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

  /*
    Set when the typed hour was recognised as 24-hour (00, or 13-23) so the
    period appended further down reflects the entry rather than defaulting to AM.
    A ref, not state: it is produced and consumed inside a single keystroke.
  */
  const forcedPeriodRef = useRef(null);

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
      // Deleting a character while all 4 time digits are still present means the
      // user is removing the trailing period/space (e.g. "02:30 AM" -> "02:30 A"
      // -> "02:30 " -> "02:30"), not a time digit. Preserve what remains without
      // stripping a digit or re-appending AM/PM.
      if (prevDigits.length === 4 && digits.length === 4) {
        setManualInput(raw.toUpperCase());
        return;
      }
      limitedDigits = digits.slice(0, 4);
    } else {
      limitedDigits = digits.slice(0, 4);
    }
    
    // If clearing everything
    if (limitedDigits.length === 0) {
      setManualInput("");
      return;
    }
    
    /*
      Normalise the digits as the user types instead of rejecting them.

      This used to `return` on anything out of range, which made the field look
      frozen for the most ordinary input there is: a first digit of 2-9. Typing
      "9" for 9 AM was silently discarded, so the only way to reach 9:30 was to
      know to type "0930". Same for the minutes' tens digit — "9" for :09 was
      dropped. Nothing appeared on screen and nothing explained why, which is
      exactly the shape of a form people rage-click and abandon.

      A leading digit that can't start a valid hour or minute is now treated as
      the ones place and zero-padded (9 -> 09), which is how every other time
      mask behaves. Genuinely impossible pairs still can't be built, because the
      pad makes them valid before they're used.
    */
    if (!isDeleting) {
      // First digit 2-9 can only mean 02-09, so pad it.
      if (limitedDigits.length === 1 && parseInt(limitedDigits[0], 10) > 1) {
        limitedDigits = `0${limitedDigits}`;
      }

      /*
        A two-digit hour of 00 or 13-23 is someone entering a 24-hour time, which
        is how birth times are written on most certificates. That used to be
        treated as a typo and salvaged down to its last digit: "1830" became
        08:30 AM — ten hours off, with nothing on screen to say so. A birth time
        that wrong invalidates the entire chart, and it was the silent kind of
        wrong, so it shipped straight into the kundli.

        Convert instead, and carry the implied period across so the auto-appended
        AM/PM below doesn't stamp "AM" over a PM time.
      */
      if (limitedDigits.length >= 2) {
        const h = parseInt(limitedDigits.slice(0, 2), 10);
        if (h === 0 || (h >= 13 && h <= 23)) {
          forcedPeriodRef.current = h >= 12 ? "PM" : "AM";
          const h12 = h % 12 === 0 ? 12 : h % 12;
          limitedDigits = `${String(h12).padStart(2, "0")}${limitedDigits.slice(2)}`;
        } else if (h < 1 || h > 12) {
          // 24-99: a genuine mistake. Keep the digit typed last, padded, so the
          // user can carry on rather than hitting a wall.
          const lastDigit = limitedDigits[1];
          limitedDigits = parseInt(lastDigit, 10) > 0
            ? `0${lastDigit}${limitedDigits.slice(2)}`
            : limitedDigits.slice(0, 1);
        }
      }

      // Minutes: a tens digit above 5 can only mean 0x.
      if (limitedDigits.length === 3 && parseInt(limitedDigits[2], 10) > 5) {
        limitedDigits = `${limitedDigits.slice(0, 2)}0${limitedDigits[2]}`;
      }

      limitedDigits = limitedDigits.slice(0, 4);
    }
    
    // Build formatted string: HH:MM
    let formatted = "";
    for (let i = 0; i < limitedDigits.length; i++) {
      if (i === 2) formatted += ":";
      formatted += limitedDigits[i];
    }
    
    // Once 4 digits are entered (HH:MM), auto-append a period so AM/PM is
    // always visible instead of waiting for the user to type A/P. Preserve the
    // currently selected period when editing, otherwise default to AM. The
    // user can still toggle it via the 'a'/'p' keys or the dropdown.
    if (limitedDigits.length === 4) {
      // A 24-hour entry decided the period itself; otherwise keep whatever is
      // already selected, defaulting to AM.
      const p = forcedPeriodRef.current || period || "AM";
      forcedPeriodRef.current = null;
      formatted += ` ${p}`;
      setManualInput(formatted);
      const parsed = parseManualTime(formatted);
      if (parsed) {
        onChange(buildDate(parsed.hour, parsed.minute, parsed.period));
      }
      return;
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

  const timeBlock = blockedTap(disabled, disabledReason);

  return (
    <div className={styles.timePickerWrapper} ref={wrapperRef}>
      <div className={styles.dateInputRow}>
        <input
          type="text"
          /*
            The same fix the date input below already carries, which this field
            was missing.

            handleManualChange keeps digits only (`raw.replace(/[^0-9]/g, "")`)
            and inserts the ":" and the AM/PM itself. As plain type="text" a
            phone offered the alphabetic keyboard, so every key within reach was
            stripped by the mask and the field sat there unchanged — no value, no
            error, nothing to explain it. Birth Time is required, so the form
            then refused to submit and the only way through was to notice the
            "123" key, tick "Don't know the exact time of birth", or give up.

            type stays "text" so the mask and the inserted separators keep
            working. AM/PM is still reachable: 4 digits auto-append a period, a
            24-hour entry (e.g. 1830) sets PM on its own, and the 44px clock
            button opens the dropdown's AM/PM column.
          */
          inputMode="numeric"
          value={isTyping ? manualInput : displayValue}
          onChange={handleManualChange}
          onBlur={handleManualBlur}
          onKeyDown={handleManualKeyDown}
          onFocus={() => setIsTyping(true)}
          onClick={() => {
            if (timeBlock.blocked) return timeBlock.explain();
            if (!disabled && openOnClick) setOpen(true);
          }}
          placeholder={placeholder || "HH:MM AM/PM"}
          disabled={timeBlock.nativeDisabled}
          aria-disabled={disabled || undefined}
          readOnly={openOnClick || timeBlock.blocked}
          className={styles.input}
          autoComplete="off"
        />
        <button
          type="button"
          className={styles.calendarBtn}
          disabled={timeBlock.nativeDisabled}
          aria-disabled={disabled || undefined}
          onClick={() => {
            if (timeBlock.blocked) return timeBlock.explain();
            if (!disabled) setOpen((o) => !o);
          }}
          tabIndex={-1}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
      </div>
      {open && (
        <div
          ref={dropdownRef}
          className={styles.timeDropdown}
          style={placeUp ? { top: "auto", bottom: "calc(100% + 4px)" } : undefined}
        >
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
 * @param {string} disabledReason - Why the field is disabled. When given, the
 *   field stays tappable and shows this message instead of silently swallowing
 *   the tap (a natively disabled input fires no events, which reads as broken).
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
  disabledReason,
  className = "",
  required = false,
  // When true, dropdowns/calendar open upward (useful at the bottom of a screen)
  dropUp = false,
  // When true, clicking the input opens the picker and disables manual typing
  openOnClick = false,
  // When true, the calendar renders in a body-level portal (avoids clipping
  // inside scrollable/overflow-hidden containers like modals)
  portal = false,
  // Legacy prop support
  showTime,
  // Callback fired when the raw input text changes (including invalid values)
  onRawChange,
  // Callback fired with error string (or empty string when valid)
  onError,
}) => {
  // Resolve mode from legacy showTime prop
  const resolvedMode = showTime ? "datetime" : mode;

  const isTimeOnly = resolvedMode === "time";
  const isDateTime = resolvedMode === "datetime";

  // Declared above the `isTimeOnly` early return on purpose. Every date-mode
  // hook below that return is already a conditional-hook violation (this
  // component calls a different number of hooks depending on `mode`); these two
  // sit up here so the lazy-calendar change doesn't add to it.
  //
  // The calendar chunk is only mounted once the user asks for it, so the picker
  // library isn't downloaded by visitors who never open a date field.
  const [calendarMounted, setCalendarMounted] = useState(false);
  // A tap can land before the chunk resolves. Remember it and open on arrival
  // rather than dropping it — a swallowed tap here would read as a dead click.
  const pendingOpenRef = useRef(false);

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
          disabledReason={disabledReason}
          placeholder={placeholder || "Select time"}
          dropUp={dropUp}
          openOnClick={openOnClick}
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
  // Track whether user is manually editing to prevent useEffect from overwriting
  const [isManuallyEditing, setIsManuallyEditing] = useState(false);

  // Sync inputText when selected prop changes (picker or parent update)
  // Only sync if the user is NOT currently manually editing
  useEffect(() => {
    if (!isManuallyEditing) {
      setInputText(selected ? formatDateDisplay(selected) : "");
      setDateError("");
    }
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

  /* A typed entry is complete once it has three parts and a four-digit year.
     Deliberately not "the text is 10 characters long": that assumed a
     zero-padded DD/MM/YYYY and so treated 5/8/1990 as still being typed. */
  const looksComplete = (text) => {
    const parts = String(text).split("/");
    return parts.length === 3 && parts[0] && parts[1] && parts[2]?.length === 4;
  };

  const handleManualChange = (e) => {
    const val = e.target.value;
    setIsManuallyEditing(true);

    /*
      The old formatter threw the user's own separators away and re-inserted its
      own after positions 2 and 4, so it only worked for people who zero-pad.
      Typing the perfectly ordinary "5/8/1990" produced "58/19/90" — a box that
      looks filled, a date that can never parse, and therefore a "Birth date is
      required" error on submit with a visibly non-empty field.

      Now: if the user types separators, they are respected and each segment is
      capped (2/2/4). If they type straight digits, the positional auto-insert
      still applies, so "05081990" keeps working.
    */
    /*
      Whether this keystroke removed characters. The trailing separator below
      must not be re-added while deleting: backspacing "12/" would erase the
      slash, the formatter would immediately put it back, and the caret could
      never get past it.
    */
    const isDeleting = val.length < inputText.length;

    /*
      One mask for both ways of typing, rather than a branch per style.

      Split on whatever separators the user typed, then fill day/month/year to
      their widths (2/2/4), carrying anything that overflows a segment into the
      next one. That is what makes both routes work with the same code:

        "12121990"  -> one part, carried across   -> 12/12/1990
        "5/8/1990"  -> three short parts, kept    -> 5/8/1990

      The carry is the part that was missing: capping each segment without it
      silently *dropped* the digits that did not fit, so once the box read
      "12/12" every further keystroke disappeared.
    */
    const SEGMENT_WIDTHS = [2, 2, 4];
    const rawParts = val.replace(/[^0-9/]/g, "").split("/");
    const segments = [];
    let carry = "";
    for (let i = 0; i < 3; i++) {
      const merged = (carry + (rawParts[i] ?? "")).replace(/\D/g, "");
      segments.push(merged.slice(0, SEGMENT_WIDTHS[i]));
      carry = merged.slice(SEGMENT_WIDTHS[i]);
    }
    // Trailing empties would render as "12//" while the year is still being typed.
    while (segments.length > 1 && segments[segments.length - 1] === "") segments.pop();

    let formatted = segments.join("/");

    /*
      Close the segment as soon as it is full, so the field reads "12/" and
      "12/12/" instead of sitting on "12" and "12/12" until the next digit
      arrives — the separator used to appear one keystroke late, which looks like
      the mask stopped working right after the month.

      `endsWithSeparator` keeps a slash the user typed themselves, so "5/" does
      not collapse back to "5" and turn the next keystroke into "58".
    */
    const last = segments.length - 1;
    const endsWithSeparator = /\/$/.test(val);
    if (
      !isDeleting &&
      segments.length < 3 &&
      (endsWithSeparator || segments[last].length === SEGMENT_WIDTHS[last])
    ) {
      formatted += "/";
    }

    setInputText(formatted);
    onRawChange?.(formatted);

    if (looksComplete(formatted)) {
      const parsed = parseManualDate(formatted);
      if (parsed) {
        setDateError("");
        onError?.("");
        onChange(parsed);
        // Valid date submitted — allow future syncs from selected prop
        setIsManuallyEditing(false);
      } else {
        setDateError("Invalid date");
        onError?.("Invalid date");
      }
    } else if (formatted.length > 0) {
      // Partial input — show error for incomplete dates
      setDateError("Invalid date");
      onError?.("Invalid date");
    } else {
      setDateError("");
      onError?.("");
    }
  };

  const handleManualBlur = () => {
    // On blur, if text doesn't parse to a valid date, show error but keep user's input
    if (inputText.length === 0) {
      setDateError("");
      onError?.("");
      // Do NOT reset isManuallyEditing here — let the parent decide via prop changes
      // This prevents the useEffect from restoring the old date when user clears the field
      return;
    }
    const parsed = parseManualDate(inputText);
    if (parsed) {
      setIsManuallyEditing(false);
      /*
        Tidy the display to DD/MM/YYYY now that focus has left. Done on blur
        rather than while typing, because padding mid-entry fights the person
        still typing ("5" would become "05" before they reach the month).
        onChange already fired with the parsed date, so this is display only.
      */
      const pad = (n) => String(n).padStart(2, "0");
      const tidy = `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
      if (tidy !== inputText) {
        setInputText(tidy);
        onRawChange?.(tidy);
      }
    } else {
      setDateError("Invalid date");
      onError?.("Invalid date");
      // Keep isManuallyEditing true so the useEffect doesn't overwrite
    }
  };

  const handlePickerChange = (date) => {
    setIsManuallyEditing(false);
    onChange(date);
    onError?.("");
    // inputText will sync via the useEffect above
  };

  // Ref for the DatePicker to open programmatically
  const datePickerRef = useRef(null);

  const dateBlock = blockedTap(disabled, disabledReason);

  const openCalendar = () => {
    if (dateBlock.blocked) return dateBlock.explain();
    if (disabled) return;
    if (datePickerRef.current) {
      datePickerRef.current.setOpen(true);
      return;
    }
    pendingOpenRef.current = true;
    setCalendarMounted(true);
  };

  const handleCalendarReady = () => {
    if (!pendingOpenRef.current) return;
    pendingOpenRef.current = false;
    datePickerRef.current?.setOpen(true);
  };

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
          // The mask takes digits only and inserts the slashes itself, so a phone
          // should offer the number pad. As plain type="text" iOS opened the
          // QWERTY keyboard and the user had to find the "123" key before they
          // could type a single character of their birth date. type stays "text"
          // rather than "number" so the slashes and the mask still work.
          inputMode="numeric"
          value={inputText}
          onChange={handleManualChange}
          onBlur={handleManualBlur}
          onClick={() => {
            if (dateBlock.blocked) return dateBlock.explain();
            if (openOnClick) openCalendar();
          }}
          placeholder={resolvedPlaceholder}
          disabled={dateBlock.nativeDisabled}
          aria-disabled={disabled || undefined}
          readOnly={openOnClick || dateBlock.blocked}
          className={`${styles.input} ${dateError ? styles.inputError : ""}`}
          autoComplete="off"
        />
        {/* Invisible hit area over the right 1/3 of the input, so clicking near
            the calendar icon opens the picker even while typing stays enabled.
            A button rather than a div: same reason as everywhere else, though it
            stays out of the tab order and hidden from assistive tech because the
            real calendar button next to it does the same job. */}
        <button
          type="button"
          className={styles.calendarOverlay}
          onClick={openCalendar}
          tabIndex={-1}
          aria-hidden="true"
        />
        <button
          type="button"
          className={styles.calendarBtn}
          disabled={dateBlock.nativeDisabled}
          aria-disabled={disabled || undefined}
          onClick={openCalendar}
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
      {dateError && !onError && <p className={styles.dateError}>{dateError}</p>}

      {/* Hidden DatePicker for the calendar popup — mounted on first request so
          react-datepicker stays out of the entry bundle. fallback={null} because
          this subtree is visually hidden anyway; the field above is already
          rendered, so there is nothing to hold space for and no layout shift. */}
      <div className={styles.hiddenPicker}>
        {calendarMounted && (
          <Suspense fallback={null}>
            <LazyCalendar
              ref={datePickerRef}
              selected={selected}
              onChange={handlePickerChange}
              isDateTime={isDateTime}
              dateFormat={resolvedFormat}
              minDate={minDate}
              maxDate={maxDate}
              disabled={disabled}
              dropUp={dropUp}
              portal={portal}
              popperClassName={styles.popper}
              calendarClassName={styles.calendar}
              onReady={handleCalendarReady}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default DateTimePicker;
