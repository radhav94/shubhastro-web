import { useState, useEffect, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  IoPersonOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoSparkles,
  IoShieldCheckmarkOutline,
  IoPeople,
  IoClose,
} from "react-icons/io5";
import { FaMars, FaVenus, FaTransgenderAlt } from "react-icons/fa";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import styles from "./AddProfileModal.module.scss";
import { Toast } from "../../index";
import ProfileListingModal from "./ProfileListingModal";
import { relationOption } from "../../../utils/constanats/appData";
import DateTimePicker from "../dateTimePicker/DateTimePicker";
import { personNameRegex, PERSON_NAME_ERROR } from "../../../utils/regex";
import giftImg from "../../../assets/images/welcome-bonus-icon.webp";

// Visual top-to-bottom order of every field the schema can reject. Yup returns
// a plain object and its key order is not the page order, so picking
// Object.keys(errors)[0] could scroll past a problem higher up.
const FIELD_ORDER = [
  "name",
  "mobileNumber",
  "relation",
  "birthDate",
  "birthTime",
  "birthPlace",
];

/**
 * Auto-scrolls to the first field with a validation error after form submission.
 * Prevents rage clicks caused by users not seeing error messages below the fold.
 *
 * Three of the six fields — birthDate, birthTime and birthPlace — are rendered
 * by DateTimePicker and LocationSearch, neither of which emits a `name`
 * attribute, so the original `[name="..."]` lookup silently found nothing for
 * exactly the fields most likely to fail (a typed-but-unselected birth place is
 * the single most common one). Those wrappers now carry `data-field`, which
 * this selector has always accepted.
 */
/**
 * Scrolls to and focuses the first invalid field. Shared by the submit-driven
 * effect below and the CTA's own explicit validation pass.
 *
 * Deliberately silent: every field renders its own <ErrorMessage>, so a toast
 * saying "Name is required" on top of the "Name is required" already sitting
 * under the input is the same message twice, and the toast is the copy that
 * covers the form and then disappears. Bringing the field into view is what the
 * user actually needs; the text is already there when they arrive.
 *
 * Returns true when it found something to report, so callers can tell "blocked"
 * apart from "nothing wrong here".
 */
const reportFirstError = (errors) => {
  if (!errors) return false;

  const firstInvalid = FIELD_ORDER.find((key) => errors[key]);
  if (!firstInvalid) return false;

  const target = document.querySelector(
    `[name="${firstInvalid}"], [data-field="${firstInvalid}"]`
  );

  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    // A data-field wrapper isn't focusable itself, so reach for the control
    // inside it; preventScroll keeps the smooth scroll above from being cut off.
    const focusTarget = target.matches("input, select, textarea, button")
      ? target
      : target.querySelector("input, select, textarea, button");
    focusTarget?.focus({ preventScroll: true });
  }

  return true;
};

const ScrollToError = ({ errors, submitCount, isValidating, reportedSubmitRef }) => {
  // Formik hands back a fresh `errors` object on every validation pass, and
  // validateOnBlur is on — so keying the effect on `errors` alone would re-run it
  // (and re-scroll) each time a field is blurred.
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  /*
    `isValidating` is in the dependency list, and that is the whole fix.

    Formik increments `submitCount` and *then* runs validation. With
    `validateOnChange` off, a form whose fields have never been validated has
    `errors === {}` at the moment submitCount changes — so keying this effect on
    submitCount alone meant the very first blocked tap found nothing to report and
    returned in total silence. Only the second tap worked, because by then the
    first pass had populated `errors`.

    Clarity caught exactly that: a visitor tapped "Continue & Get ₹250 Bonus" at
    01:23, got nothing, tapped again at 01:38, and left at 02:06.

    Re-running when `isValidating` flips back to false means we look at `errors`
    after the pass has finished. `reportedSubmitRef` keeps it to one report per
    submit attempt, since the CTA below may already have reported.
  */
  useEffect(() => {
    if (submitCount === 0) return;
    if (isValidating) return;
    if (reportedSubmitRef.current === submitCount) return;

    if (reportFirstError(errorsRef.current)) {
      reportedSubmitRef.current = submitCount;
    }
  }, [submitCount, isValidating, reportedSubmitRef]);

  return null;
};

const AddProfileModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  title = "Add Profile",
  // Profile listing props
  showProfileListing = false,
  profiles = [],
  selectedProfileId = null,
  onSelectProfile = null,
  onDeleteProfile = null,
  savedKundlis = [],
  // Matchmaking mode - hides "Others" gender and Relation field
  matchmakingMode = false,
  // Guest/AIWow mode - shows an extra mobile-number field + the bonus design
  showMobileField = false,
  // Custom submit button label (e.g. "Continue")
  submitButtonText = null,
  // When false, clicking the overlay/outside does not close the modal
  closeOnOverlayClick = true,
  // Hides the relation dropdown (relation is assumed "self")
  hideRelation = false,
  // When true, the form renders inline (as a normal block/message) instead of
  // a fixed full-screen overlay — used to embed it inside the Pandit AI chat.
  inline = false,
}) => {
  const [showListing, setShowListing] = useState(false);

  /*
    Dismissal plumbing for the overlay dead clicks.

    This sheet auto-opens over /kundli for guests (Kundali.jsx opens it on
    arrival so a visitor has a form to fill instead of an empty page), and
    GuestKundliAuthModal hardcodes `closeOnOverlayClick={false}`. The result was
    an interstitial the visitor never asked for whose only exit was a 32px round
    ✕ — clicking the dimmed area around it did literally nothing. A Clarity
    session shows exactly that: three clicks on the overlay at 00:02, 00:05 and
    00:09, then the visitor left for the homepage at 00:11.

    Two things below fix it without reintroducing the accidental-dismissal
    problem `closeOnOverlayClick={false}` exists to prevent:

    - `hasUserInputRef` records whether any of the costly fields has been filled
      in. An untouched form has nothing to lose, so an outside click closes it.
      Once there is content, the sheet stays put.
    - `nudgeClose` gives the blocked case a *visible* response (a brief pulse on
      the ✕) rather than silence. A toast alone would not do: toasts are not
      visible to Clarity, so the click would still be recorded as dead.
  */
  const hasUserInputRef = useRef(false);
  const closeBtnRef = useRef(null);
  const [nudgeClose, setNudgeClose] = useState(false);

  // Which submit attempt has already had its first error reported. Shared by the
  // CTA's own validation pass and ScrollToError so a blocked tap produces one
  // message, not two. A ref rather than state: it must not trigger a re-render.
  const reportedSubmitRef = useRef(0);

  const [formData, setFormData] = useState({
    name: "",
    identity: "Male",
    relation: "",
    mobileNumber: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    unknownBirthTime: false,
    latitude: null,
    longitude: null,
    timezone: 5.5,
  });

  // Guest mode uses the "Add Kundli Details" bonus design.
  const isGuest = showMobileField;

  // Open the DateTimePicker's calendar via its (hidden) internal button so the
  // left calendar icon opens the picker while typing stays enabled.
  const openPickerFromIcon = (e) => {
    e.currentTarget.parentElement?.querySelector('button[tabindex="-1"]')?.click();
  };

  // Lock background page scroll while the modal is open (mobile-safe: pin the
  // body in place and restore the scroll position on close).
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const { body } = document;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      document.documentElement.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Check if a "Self" profile already exists
  const hasSelfProfile = savedKundlis.some(
    (profile) => profile.relation?.toLowerCase() === "self"
  );

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required("Name is required")
      .matches(personNameRegex, PERSON_NAME_ERROR),
    relation: (matchmakingMode || hideRelation)
      ? Yup.string().notRequired()
      : Yup.string()
        .required("Relation is required")
        .test(
          "unique-self",
          "A Self profile already exists. Please select a different relation.",
          function(value) {
            if (value?.toLowerCase() === "self" && hasSelfProfile) {
              return false;
            }
            return true;
          }
        ),
    mobileNumber: showMobileField
      ? Yup.string()
        .required("Mobile number is required")
        .matches(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
      : Yup.string().notRequired(),
    birthDate: Yup.string().required("Birth date is required"),
    birthTime: Yup.string().when("unknownBirthTime", {
      is: false,
      then: (schema) => schema.required("Birth time is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    /*
      "Typed but never picked from the dropdown" used to live only in
      handleSubmit as a toast, so — unlike every other rule here — it produced no
      red text under the field it was talking about. Expressing it as a schema
      test puts it inline with the rest, the same way the calculator forms show
      every problem next to its own field. handleSubmit keeps its guard as a
      backstop for anything that reaches it with no coordinates.
    */
    birthPlace: Yup.string()
      .required("Place of birth is required")
      .test(
        "has-coordinates",
        "Please select a valid location from the dropdown",
        function (value) {
          if (!value) return true; // `required` already reports this case.
          const { latitude, longitude } = this.parent;
          return Boolean(latitude && longitude);
        }
      ),
  });

  const handleSubmit = async (values, { setFieldError, setFieldTouched }) => {
    /*
      Backstops for the two rules the schema also covers. They report through
      setFieldError rather than a toast so the message lands under the field it
      is about, like every other error on this form.
    */

    // A place typed by hand and never picked from the dropdown: non-empty string,
    // no coordinates.
    if (!values.latitude || !values.longitude) {
      setFieldTouched("birthPlace", true, false);
      setFieldError("birthPlace", "Please select a valid location from the dropdown");
      const placeField = document.querySelector('[data-field="birthPlace"]');
      if (placeField) {
        placeField.scrollIntoView({ behavior: "smooth", block: "center" });
        placeField.querySelector("input")?.focus({ preventScroll: true });
      }
      return;
    }

    // Prevent creating a second "Self" profile.
    if (values.relation?.toLowerCase() === "self" && hasSelfProfile) {
      setFieldTouched("relation", true, false);
      setFieldError(
        "relation",
        "A Self profile already exists. Please select a different relation."
      );
      return;
    }

    try {
      await onSubmit(values);
    } catch (err) {
      // Error handling is done in parent
    }
  };

  const handleClose = () => {
    hasUserInputRef.current = false;
    setNudgeClose(false);
    setFormData({
      name: "",
      identity: "Male",
      relation: "",
      mobileNumber: "",
      birthDate: "",
      birthTime: "",
      birthPlace: "",
      unknownBirthTime: false,
      latitude: null,
      longitude: null,
      timezone: 5.5,
    });
    onClose();
  };

  /*
    A click on the dim area outside the sheet. See hasUserInputRef above for why
    this is not simply `closeOnOverlayClick ? handleClose : undefined`.

    The target check matters: the sheet stops propagation, but DateTimePicker and
    LocationSearch render poppers, and a click that starts inside one of those
    and bubbles up here should not be read as "clicked outside".
  */
  const handleOverlayClick = (e) => {
    if (inline) return;
    if (e.target !== e.currentTarget) return;

    if (closeOnOverlayClick || !hasUserInputRef.current) {
      handleClose();
      return;
    }

    // Something has been typed, so keep the form. Point at the way out instead
    // of swallowing the click.
    closeBtnRef.current?.focus();
    setNudgeClose(true);
    Toast.info("Tap ✕ to close without saving.");
  };

  // Escape closes the sheet even when overlay dismissal is off. Escape is a
  // deliberate keypress rather than a stray click, so it is safe here and is
  // what a keyboard user expects from a dialog — this component had no key
  // handling at all before.
  useEffect(() => {
    if (!isOpen || inline) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, inline]);

  // Clear the ✕ pulse after it has played once.
  useEffect(() => {
    if (!nudgeClose) return undefined;
    const id = setTimeout(() => setNudgeClose(false), 1200);
    return () => clearTimeout(id);
  }, [nudgeClose]);

  const handleCloseListing = () => {
    setShowListing(false);
  };

  const handleSelectFromListing = (profile) => {
    if (onSelectProfile) {
      onSelectProfile(profile);
    }
    setShowListing(false);
    onClose();
  };

  const handleDeleteFromListing = (profileId) => {
    if (onDeleteProfile) {
      onDeleteProfile(profileId);
    }
  };

  if (!isOpen) return null;

  // Show profile listing modal if requested
  if (showListing && showProfileListing) {
    return (
      <ProfileListingModal
        isOpen={showListing}
        onClose={handleCloseListing}
        profiles={profiles}
        selectedProfileId={selectedProfileId}
        onSelectProfile={handleSelectFromListing}
        onDeleteProfile={handleDeleteFromListing}
        onAddProfile={() => setShowListing(false)}
        title="Select Profile"
        showAddButton={true}
        showDeleteButton={true}
      />
    );
  }

  const GENDERS = [
    { value: "Male", label: "Male", Icon: FaMars },
    { value: "Female", label: "Female", Icon: FaVenus },
    ...(matchmakingMode ? [] : [{ value: "Others", label: "Others", Icon: FaTransgenderAlt }]),
  ];

  return (
    <div
      className={`${styles.modalOverlay} ${inline ? styles.inline : ""}`}
      onClick={handleOverlayClick}
    >
      <div className={styles.sideSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHeader}>
          {/* The grabber bar was a bare <div>: it is the universal "drag or tap
              me to dismiss" affordance on a bottom sheet, and it did nothing.
              Same defect, same fix as the zodiac sheet on the horoscope screens —
              make it a real close control with a 44px tap target. */}
          <button
            type="button"
            className={styles.sheetHandle}
            onClick={handleClose}
            aria-label="Close"
          >
            <span className={styles.sheetHandleBar} />
          </button>
          <button
            ref={closeBtnRef}
            className={`${styles.closeBtn} ${nudgeClose ? styles.closeBtnNudge : ""}`}
            onClick={handleClose}
            aria-label="Close"
          >
            <IoClose />
          </button>

          {isGuest ? (
            <div className={styles.guestHeader}>
              <span className={styles.onlineBadge}>
                <IoPeople className={styles.badgeIcon} />
                <b>10K+</b> Astrologers Online
              </span>
              <div className={styles.headerRow}>
                <div className={styles.headerText}>
                  <h2 className={styles.sheetTitle}>{title}</h2>
                  <p className={styles.headerSub}>
                    Few details to unlock your personalized astrology experience
                  </p>
                </div>
                <img src={giftImg} className={styles.giftImg} alt="" aria-hidden="true" />
              </div>
            </div>
          ) : (
            <h2 className={styles.sheetTitle}>{title}</h2>
          )}
        </div>

        <div className={styles.sheetContent}>
          <Formik
            initialValues={formData}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
            validateOnBlur={true}
            validateOnChange={false}
          >
            {({
              values,
              setFieldValue,
              setTouched,
              errors,
              submitCount,
              isValidating,
              validateForm,
            }) => {
              /*
                Mirror "has this form got anything worth keeping?" out to the
                overlay handler, which lives outside Formik. Read from `values`
                rather than DOM events, because DateTimePicker and LocationSearch
                set their fields through setFieldValue — a keystroke listener
                would not see a picked date or a selected birth place and would
                happily throw them away on a stray outside click.

                Gender is excluded on purpose: it is pre-set to "Male", and a
                single pill tap is not worth blocking dismissal over. Assigning a
                ref during render matches what ScrollToError above already does.
              */
              hasUserInputRef.current = Boolean(
                values.name ||
                  values.mobileNumber ||
                  values.relation ||
                  values.birthDate ||
                  values.birthTime ||
                  values.birthPlace
              );

              return (
              <Form className={styles.profileForm}>
                {/* Scroll to first error on failed submit */}
                <ScrollToError
                  errors={errors}
                  submitCount={submitCount}
                  isValidating={isValidating}
                  reportedSubmitRef={reportedSubmitRef}
                />
                <div className={styles.formGroup}>
                  <label>Name <span className={styles.required}>*</span></label>
                  <div className={styles.iconField}>
                    <IoPersonOutline className={styles.leftIcon} />
                    <Field type="text" name="name" placeholder="Enter your name" />
                  </div>
                  <ErrorMessage name="name" component="div" className={styles.errorText} />
                </div>

                {/* Mobile number */}
                {showMobileField && (
                  <div className={styles.formGroup}>
                    <label>Mobile Number <span className={styles.required}>*</span></label>
                    <div className={styles.mobileWrap}>
                      {/*
                        The country code is fixed at +91: validation is
                        /^[6-9]\d{9}$/ and the backend prefixes "91" on submit.
                        This used to render a chevron-down next to it, which
                        promises a picker that does not exist — non-Indian users
                        tapped it repeatedly and left. No chevron now, and a tap
                        gets an answer instead of silence.
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
                      <Field
                        type="tel"
                        name="mobileNumber"
                        placeholder="Enter 10-digit mobile number"
                        maxLength={10}
                        inputMode="numeric"
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        }}
                      />
                    </div>
                    <ErrorMessage name="mobileNumber" component="div" className={styles.errorText} />
                  </div>
                )}

                {/* Identity */}
                <div className={styles.formGroup}>
                  <label>Identity <span className={styles.required}>*</span></label>
                  <div className={styles.identityButtons}>
                    {GENDERS.map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        className={values.identity === value ? styles.active : ""}
                        onClick={() => setFieldValue("identity", value)}
                      >
                        <Icon className={styles.identityIcon} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Relation (non-guest) */}
                {!matchmakingMode && !hideRelation && (
                  <div className={styles.formGroup}>
                    <label>Relation <span className={styles.required}>*</span></label>
                    <Field as="select" name="relation">
                      <option value="">Select relation</option>
                      {relationOption.map((option) => (
                        <option key={option.id} value={option.value}>{option.title}</option>
                      ))}
                    </Field>
                    <ErrorMessage name="relation" component="div" className={styles.errorText} />
                  </div>
                )}

                {/* Birth date + time */}
                <div className={styles.row2}>
                  <div className={styles.formGroup} data-field="birthDate">
                    <label>Birth Date <span className={styles.required}>*</span></label>
                    <div className={styles.iconField}>
                      <button type="button" className={styles.leftIconBtn} onClick={openPickerFromIcon} aria-label="Open calendar">
                        <IoCalendarOutline />
                      </button>
                      <DateTimePicker
                        mode="date"
                        portal
                        selected={values.birthDate ? new Date(values.birthDate) : null}
                        onChange={(date) => {
                          if (date) {
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(2, "0");
                            const dd = String(date.getDate()).padStart(2, "0");
                            setFieldValue("birthDate", `${yyyy}-${mm}-${dd}`);
                          } else {
                            setFieldValue("birthDate", "");
                          }
                        }}
                        maxDate={new Date()}
                        placeholder="DD/MM/YYYY"
                      />
                    </div>
                    <ErrorMessage name="birthDate" component="div" className={styles.errorText} />
                  </div>

                  <div className={styles.formGroup} data-field="birthTime">
                    <label>Birth Time <span className={styles.required}>*</span></label>
                    <div className={styles.iconField}>
                      <button type="button" className={styles.leftIconBtn} onClick={openPickerFromIcon} aria-label="Open time picker">
                        <IoTimeOutline />
                      </button>
                      <DateTimePicker
                        mode="time"
                        dropUp
                        selected={values.birthTime ? (() => { const [h, m] = values.birthTime.split(":"); const d = new Date(); d.setHours(h, m, 0, 0); return d; })() : null}
                        onChange={(date) => {
                          if (date) {
                            const hh = String(date.getHours()).padStart(2, "0");
                            const mm = String(date.getMinutes()).padStart(2, "0");
                            setFieldValue("birthTime", `${hh}:${mm}`);
                          } else {
                            setFieldValue("birthTime", "");
                          }
                        }}
                        placeholder="HH:MM AM/PM"
                        disabled={values.unknownBirthTime}
                        disabledReason="Uncheck “Don’t know the exact time of birth” to pick a time"
                      />
                    </div>
                    <ErrorMessage name="birthTime" component="div" className={styles.errorText} />
                  </div>
                </div>

                {/*
                  A real <label htmlFor>, not a div. The wrapper used to be a
                  <div> and the SCSS put `pointer-events: none` on the text, so
                  clicking the words did nothing at all — no toggle, no focus,
                  not even a text selection. Only the 18px box responded, and
                  this checkbox is what unlocks the required Birth Time field, so
                  missing it leaves the form unsubmittable.
                */}
                <label className={styles.checkboxLabel} htmlFor="unknownBirthTime">
                  <Field type="checkbox" name="unknownBirthTime" id="unknownBirthTime" />
                  <span>Don&apos;t know the exact time of birth</span>
                </label>

                {/* Place of birth */}
                <div className={styles.formGroup} data-field="birthPlace">
                  <label>Place of Birth <span className={styles.required}>*</span></label>
                  <div className={styles.iconField}>
                    <IoLocationOutline className={styles.leftIcon} />
                    <LocationSearch
                      dropUp
                      value={values.birthPlace}
                      /*
                        Typing clears the coordinates.

                        Only onPlaceSelect sets lat/lng, but nothing used to
                        unset them — so picking "Mumbai", then editing the text
                        to "Pune" and submitting sent the name Pune with
                        Mumbai's coordinates. The chart is computed from the
                        coordinates, so that produced a confidently wrong result
                        with no error anywhere. Clearing them means the guard in
                        handleSubmit catches it and asks for a fresh pick.
                      */
                      onChange={(e) => {
                        setFieldValue("birthPlace", e.target.value);
                        setFieldValue("latitude", null);
                        setFieldValue("longitude", null);
                      }}
                      onPlaceSelect={(place) => {
                        setFieldValue("birthPlace", place.address);
                        setFieldValue("latitude", place.lat);
                        setFieldValue("longitude", place.lng);
                        setFieldValue("timezone", place.timezone ?? 5.5);
                      }}
                    />
                  </div>
                  <ErrorMessage name="birthPlace" component="div" className={styles.errorText} />
                </div>

                {/*
                  aria-disabled rather than `disabled`, so a tap while the
                  request is in flight is acknowledged instead of swallowed.
                  The click handler blocks the duplicate submit.
                */}
                <button
                  type="submit"
                  className={styles.submitBtn}
                  aria-disabled={isLoading}
                  aria-busy={isLoading}
                  onClick={async (e) => {
                    if (isLoading) {
                      e.preventDefault();
                      Toast.error("Saving your details — one moment.");
                      return;
                    }

                    /*
                      Validate here as well, rather than relying on Formik's
                      submit sequence. ScrollToError now waits for `isValidating`
                      so it reports correctly on its own, but this makes the CTA
                      independent of that ordering entirely: on the very first tap
                      we run the pass ourselves and name the blocker immediately.

                      Not preventDefault'd on success — the native submit still
                      runs and Formik calls handleSubmit as usual. reportedSubmitRef
                      stops ScrollToError repeating what we just said.
                    */
                    const validationErrors = await validateForm();
                    if (validationErrors && Object.keys(validationErrors).length > 0) {
                      e.preventDefault();

                      /*
                        Mark every invalid field touched.

                        Formik's <ErrorMessage> only renders once a field is
                        touched, and the pass that marks all of them touched is
                        part of Formik's own submit sequence — which the
                        preventDefault above skips. So a blocked tap used to show
                        a single toast and not one line of red text, while the
                        calculator forms (Atmakaraka & co.) list every problem
                        under its own field. Same behaviour here now: inline
                        errors on every invalid field, and the first one is
                        scrolled into view.

                        `false` skips a re-validate; we already have the errors.
                      */
                      setTouched(
                        Object.keys(validationErrors).reduce(
                          (acc, field) => ({ ...acc, [field]: true }),
                          {}
                        ),
                        false
                      );

                      if (reportFirstError(validationErrors)) {
                        // submitCount is about to become submitCount + 1.
                        reportedSubmitRef.current = submitCount + 1;
                      }
                    }
                  }}
                >
                  {isGuest && <IoSparkles size={18} />}
                  {isLoading
                    ? "Please wait..."
                    : isGuest
                    ? "Continue & Get ₹250 Bonus"
                    : submitButtonText || "Add Profile"}
                </button>

                {isGuest && (
                  <div className={styles.secureRow}>
                    <IoShieldCheckmarkOutline size={14} />
                    100% Secure&nbsp;&nbsp;|&nbsp;&nbsp;Your data is safe with us
                  </div>
                )}
              </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default AddProfileModal;
