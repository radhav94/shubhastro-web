import { useRef, useState } from "react";
import {
  IoPersonOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoSparkles,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { FaMars, FaVenus, FaTransgenderAlt } from "react-icons/fa";
import DateTimePicker from "../dateTimePicker/DateTimePicker";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import Toast from "../../toast";
import { trackEvent } from "../../../utils/analytics";
import { personNameRegex, PERSON_NAME_ERROR } from "../../../utils/regex";
import styles from "./GuestDetailsForm.module.scss";

/**
 * Compact guest-details form styled like the guest-chat form-in-bubble.
 *
 * Presentational only: it collects birth details + a mobile number, validates
 * them, and calls `onSubmit(details)` with a shape ready for the guest OTP /
 * kundli-creation flow. Used inline inside the Pandit AI chat.
 *
 * @param {(details: object) => void} onSubmit
 * @param {boolean} [submitting]
 * @param {string} [submitText]
 */
const INITIAL_FORM = {
  name: "",
  identity: "",
  dob: null,
  time: null,
  unknownBirthTime: false,
  birthPlace: "",
  latitude: null,
  longitude: null,
  timezone: 5.5,
  mobileNumber: "",
};

const toYMD = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const pad = (n) => String(n).padStart(2, "0");

const GENDERS = [
  { value: "Male", label: "Male", Icon: FaMars },
  { value: "Female", label: "Female", Icon: FaVenus },
  { value: "Others", label: "Others", Icon: FaTransgenderAlt },
];

// Visual top-to-bottom order of the fields. `validate()` builds a plain object,
// and object key order is not something to reason about for "which problem is
// highest up the page", so the order lives here explicitly.
const FIELD_ORDER = ["name", "mobileNumber", "identity", "dob", "time", "birthPlace"];

const GuestDetailsForm = ({
  onSubmit,
  submitting = false,
  submitText = "Continue & Get ₹250 Bonus",
}) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  // Field wrappers, so a failed submit can bring the offending one into view.
  const fieldRefs = useRef({});

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // Open the DateTimePicker's calendar via its (hidden) internal button so the
  // left icon opens the picker while typing stays enabled.
  const openPickerFromIcon = (e) => {
    e.currentTarget.parentElement?.querySelector('button[tabindex="-1"]')?.click();
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    else if (!personNameRegex.test(form.name.trim()))
      e.name = PERSON_NAME_ERROR;
    if (!/^[6-9]\d{9}$/.test(form.mobileNumber || ""))
      e.mobileNumber = "Enter a valid 10-digit mobile number";
    if (!form.identity) e.identity = "Please select your gender";
    if (!form.dob) e.dob = "Please select your date of birth";
    if (!form.unknownBirthTime && !form.time) e.time = "Please select your birth time";
    if (!form.birthPlace.trim()) e.birthPlace = "Please select your place of birth";
    else if (!form.latitude || !form.longitude)
      e.birthPlace = "Please pick a location from the dropdown";
    return e;
  };

  const handleSubmit = () => {
    if (submitting) {
      Toast.error("Sending your OTP — one moment.");
      return;
    }

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      /*
       * Six required fields stacked above the button make this form taller than
       * a phone viewport, so the field that failed is usually scrolled off the
       * top while the user is looking at the button. The inline <span> errors
       * do render, just nowhere the user is looking — so "Continue & Get ₹250
       * Bonus" reads as a broken button and gets tapped again and again. Bring
       * the first problem into view instead; no toast, because the same words
       * are already printed under the field we are scrolling to.
       */
      const firstInvalid = FIELD_ORDER.find((key) => e[key]);
      const node = firstInvalid && fieldRefs.current[firstInvalid];
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        node.querySelector("input, button")?.focus({ preventScroll: true });
      }

      // Lets analytics separate repeat taps caused by validation from ones
      // caused by a failing OTP send, and shows which field trips people up.
      trackEvent("guest_details_signup_blocked", {
        blocker: "validation",
        field: firstInvalid,
        error_reason: firstInvalid ? e[firstInvalid] : "unknown",
        invalid_field_count: Object.keys(e).length,
      });
      return;
    }

    onSubmit?.({
      name: form.name.trim(),
      identity: form.identity,
      birthDate: toYMD(form.dob),
      birthTime: form.unknownBirthTime
        ? ""
        : `${pad(form.time.getHours())}:${pad(form.time.getMinutes())}`,
      unknownBirthTime: form.unknownBirthTime,
      birthPlace: form.birthPlace,
      latitude: form.latitude,
      longitude: form.longitude,
      timezone: form.timezone,
      mobileNumber: form.mobileNumber,
    });
  };

  return (
    <div className={styles.formCard}>
      {/* Name */}
      <div className={styles.field} ref={(el) => (fieldRefs.current.name = el)}>
        <label className={styles.label}>
          Name <span className={styles.req}>*</span>
        </label>
        <div className={styles.iconField}>
          <IoPersonOutline className={styles.leftIcon} />
          <input
            className={styles.input}
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        {errors.name && <span className={styles.err}>{errors.name}</span>}
      </div>

      {/* Mobile number */}
      <div className={styles.field} ref={(el) => (fieldRefs.current.mobileNumber = el)}>
        <label className={styles.label}>
          Mobile Number <span className={styles.req}>*</span>
        </label>
        <div className={styles.mobileWrap}>
          {/*
            Fixed +91. No chevron: it advertised a country picker that does not
            exist, which non-Indian users tapped repeatedly before giving up.
          */}
          <button
            type="button"
            className={styles.flagBox}
            onClick={() => Toast.info("We currently support Indian (+91) mobile numbers only.")}
            title="Indian (+91) numbers only"
          >
            <span className={styles.flag}>🇮🇳</span>
            +91
          </button>
          <input
            className={styles.input}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.mobileNumber}
            onChange={(e) =>
              setField("mobileNumber", e.target.value.replace(/[^0-9]/g, "").slice(0, 10))
            }
            placeholder="Enter mobile number"
          />
        </div>
        {errors.mobileNumber && <span className={styles.err}>{errors.mobileNumber}</span>}
      </div>

      {/* Identity */}
      <div className={styles.field} ref={(el) => (fieldRefs.current.identity = el)}>
        <label className={styles.label}>
          Identity <span className={styles.req}>*</span>
        </label>
        <div className={styles.genderRow}>
          {GENDERS.map((gender) => {
            const Icon = gender.Icon;
            return (
              <button
                key={gender.value}
                type="button"
                className={`${styles.genderCard} ${form.identity === gender.value ? styles.genderActive : ""}`}
                onClick={() => setField("identity", gender.value)}
              >
                <Icon className={styles.genderIcon} />
                <span>{gender.label}</span>
              </button>
            );
          })}
        </div>
        {errors.identity && <span className={styles.err}>{errors.identity}</span>}
      </div>

      {/* Birth date + time on one row */}
      <div className={styles.row2}>
        <div className={styles.field} ref={(el) => (fieldRefs.current.dob = el)}>
          <label className={styles.label}>
            Birth Date <span className={styles.req}>*</span>
          </label>
          <div className={styles.iconField}>
            <button
              type="button"
              className={styles.leftIconBtn}
              onClick={openPickerFromIcon}
              aria-label="Open calendar"
            >
              <IoCalendarOutline />
            </button>
            <DateTimePicker
              mode="date"
              portal
              selected={form.dob}
              onChange={(d) => setField("dob", d)}
              maxDate={new Date()}
              placeholder="DD/MM/YYYY"
            />
          </div>
          {errors.dob && <span className={styles.err}>{errors.dob}</span>}
        </div>

        <div className={styles.field} ref={(el) => (fieldRefs.current.time = el)}>
          <label className={styles.label}>
            Birth Time <span className={styles.req}>*</span>
          </label>
          <div className={styles.iconField}>
            <button
              type="button"
              className={styles.leftIconBtn}
              onClick={openPickerFromIcon}
              aria-label="Open time picker"
            >
              <IoTimeOutline />
            </button>
            <DateTimePicker
              mode="time"
              dropUp
              disabled={form.unknownBirthTime}
              disabledReason="Uncheck “Don’t know the exact time of birth” to pick a time"
              selected={form.time}
              onChange={(d) => setField("time", d)}
              placeholder="HH:MM AM/PM"
            />
          </div>
          {errors.time && <span className={styles.err}>{errors.time}</span>}
        </div>
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={form.unknownBirthTime}
          onChange={(e) => setField("unknownBirthTime", e.target.checked)}
        />
        Don&apos;t know the exact time of birth
      </label>

      {/* Place of birth */}
      <div className={styles.field} ref={(el) => (fieldRefs.current.birthPlace = el)}>
        <label className={styles.label}>
          Place of Birth <span className={styles.req}>*</span>
        </label>
        <div className={styles.iconField}>
          <IoLocationOutline className={styles.leftIcon} />
          <LocationSearch
            dropUp
            value={form.birthPlace}
            onChange={(e) => setField("birthPlace", e.target.value)}
            onPlaceSelect={(place) =>
              setForm((f) => ({
                ...f,
                birthPlace: place.address,
                latitude: place.lat,
                longitude: place.lng,
                timezone: place.timezone ?? 5.5,
              }))
            }
          />
        </div>
        {errors.birthPlace && <span className={styles.err}>{errors.birthPlace}</span>}
      </div>

      {/*
        aria-disabled rather than `disabled`: a disabled button fires no click,
        so a tap during the OTP send produced no acknowledgement at all. The
        handler still refuses to submit twice, it just says so now.
      */}
      <button
        type="button"
        className={styles.submitBtn}
        onClick={handleSubmit}
        aria-disabled={submitting}
        aria-busy={submitting}
      >
        <IoSparkles size={18} />
        {submitting ? "Sending OTP..." : submitText}
      </button>

      <div className={styles.secureRow}>
        <IoShieldCheckmarkOutline size={14} />
        100% Secure&nbsp;&nbsp;|&nbsp;&nbsp;Your data is safe with us
      </div>
    </div>
  );
};

export default GuestDetailsForm;
