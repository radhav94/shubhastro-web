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
const ScrollToError = ({ errors, submitCount }) => {
  // Formik hands back a fresh `errors` object on every validation pass, and
  // validateOnBlur is on — so keying the effect on `errors` would re-run it
  // (and re-toast) each time a field is blurred. Only a new submit attempt
  // should trigger this, so submitCount is the sole dependency and the latest
  // errors are read through a ref.
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  useEffect(() => {
    if (submitCount === 0) return;

    const currentErrors = errorsRef.current;
    const firstInvalid = FIELD_ORDER.find((key) => currentErrors[key]);
    if (!firstInvalid) return;

    const target = document.querySelector(
      `[name="${firstInvalid}"], [data-field="${firstInvalid}"]`
    );
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    // A data-field wrapper isn't focusable itself, so reach for the control
    // inside it; preventScroll keeps the smooth scroll above from being cut off.
    const focusTarget = target.matches("input, select, textarea, button")
      ? target
      : target.querySelector("input, select, textarea, button");
    focusTarget?.focus({ preventScroll: true });

    Toast.error(currentErrors[firstInvalid]);
  }, [submitCount]);

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
      .matches(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces"),
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
    birthPlace: Yup.string().required("Place of birth is required"),
  });

  const handleSubmit = async (values) => {
    // Passes Yup (birthPlace is a non-empty string) but has no coordinates, i.e.
    // the user typed a place and never picked a suggestion. Yup can't see this,
    // so there is no ErrorMessage for it — the toast is the only feedback, and
    // the field it refers to is usually off-screen by the time the button is
    // tapped. Point at it as well as naming it.
    if (!values.latitude || !values.longitude) {
      Toast.error("Please select a valid location from the dropdown");
      const placeField = document.querySelector('[data-field="birthPlace"]');
      if (placeField) {
        placeField.scrollIntoView({ behavior: "smooth", block: "center" });
        placeField.querySelector("input")?.focus({ preventScroll: true });
      }
      return;
    }

    // Validate: Prevent creating a "Self" profile if one already exists
    if (values.relation?.toLowerCase() === "self" && hasSelfProfile) {
      Toast.error("A Self profile already exists. Please select a different relation.");
      return;
    }

    try {
      await onSubmit(values);
    } catch (err) {
      // Error handling is done in parent
    }
  };

  const handleClose = () => {
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
      onClick={closeOnOverlayClick && !inline ? handleClose : undefined}
    >
      <div className={styles.sideSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHeader}>
          <div className={styles.sheetHandle}></div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
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
            {({ values, setFieldValue, errors, submitCount }) => (
              <Form className={styles.profileForm}>
                {/* Scroll to first error on failed submit */}
                <ScrollToError errors={errors} submitCount={submitCount} />
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

                <div className={styles.checkboxLabel}>
                  <Field type="checkbox" name="unknownBirthTime" id="unknownBirthTime" />
                  <span>Don't know the exact time of birth</span>
                </div>

                {/* Place of birth */}
                <div className={styles.formGroup} data-field="birthPlace">
                  <label>Place of Birth <span className={styles.required}>*</span></label>
                  <div className={styles.iconField}>
                    <IoLocationOutline className={styles.leftIcon} />
                    <LocationSearch
                      dropUp
                      value={values.birthPlace}
                      onChange={(e) => setFieldValue("birthPlace", e.target.value)}
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
                  onClick={(e) => {
                    if (isLoading) {
                      e.preventDefault();
                      Toast.error("Saving your details — one moment.");
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
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default AddProfileModal;
