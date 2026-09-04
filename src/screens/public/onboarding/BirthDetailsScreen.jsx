import { useState } from "react";
import { useDispatch } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import styles from "./Onboarding.module.scss";
import { Calendar, Clock, MapPin } from "lucide-react";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import DateTimePicker from "../../../component/UI/dateTimePicker/DateTimePicker";
import LanguageSelector from "../../../component/LanguageSelector";
import { registerUser } from "../../../services/appServices/authService";
import { useCreateKundliMutation } from "../../../services/appServices/kundliServicesNew";
import { trackEvent } from "../../../utils/analytics";
import { BranchEvents } from "../../../utils/branchEvents";
import { setEmail, logout } from "../../../redux/auth/authSlice";

// Validation schema
const validationSchema = Yup.object({
  birthDate: Yup.string()
    .required("Birth date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  /*
    Birth time, when "Don't know" is unticked.

    `matches` alone used to guard this. Yup's `matches` skips undefined but NOT
    the empty string (`excludeEmptyString` defaults to false), so a blank time
    field failed with "Invalid time format" — a message about a format for a
    value the visitor had never entered. Nothing on screen said the field was
    required, the CTA's blocked styling did not cover it, and `birthTime` is
    never registered through Formik's <Field>, so `touched.birthTime` stays
    false forever and its <ErrorMessage> could not render either. The only
    output was a toast reading "Invalid time format".

    Clarity session wji3wo (10:35 AM Sep 1, mobile, 17:44, 50 clicks) is that
    dead end: repeated birth-detail entry, time-selection attempts including the
    "Don't know" option, a failed attempt to proceed at 10:01, a refresh at
    12:15, one more go at the date/time pickers at 17:20, and no profile at the
    end.

    `required` now reports the actual problem and points at the escape hatch;
    `excludeEmptyString` keeps the format message for genuinely malformed input
    instead of doubling up on the blank case.
  */
  birthTime: Yup.string()
    .when("unknownBirthTime", {
      is: false,
      then: (schema) =>
        schema
          .required(
            "Select your birth time, or tick “Don’t know the exact time of birth”."
          )
          // Yup's `matches` takes (regex, options) — the message has to go
          // inside the options object, otherwise `excludeEmptyString` lands in
          // an ignored third argument and the blank case reports twice.
          .matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
            message: "Invalid time format",
            excludeEmptyString: true,
          }),
      otherwise: (schema) => schema.notRequired(),
    }),
  birthPlace: Yup.string()
    .required("Place of birth is required")
    .min(2, "Place name must be at least 2 characters"),
  unknownBirthTime: Yup.boolean(),
  latitude: Yup.number()
    .nullable()
    .when("birthPlace", {
      is: (val) => val && val.length > 0,
      then: (schema) => schema.required("Please select a location from the dropdown"),
    }),
  longitude: Yup.number()
    .nullable()
    .when("birthPlace", {
      is: (val) => val && val.length > 0,
      then: (schema) => schema.required("Please select a location from the dropdown"),
    }),
});

const BirthDetailsScreen = ({
  onNext,
  onBack,
  onSkip,
  formData,
  updateFormData,
  currentStep = 1,
  totalSteps = 3,
  onStepChange,
  skipGuidance = false,
}) => {
  const dispatch = useDispatch();
  const [registering, setRegistering] = useState(false);
  const [createKundli] = useCreateKundliMutation();

  /*
    Every blocked tap on the CTA used to answer with `toast.error` only. A toast
    sits away from the form, disappears on its own, and — because the tap calls
    preventDefault — leaves the page byte-for-byte identical, so a visitor who
    scrolled up to re-read the fields had nothing to go back to and the tap
    registers as a dead click.

    Same inline-hint mechanism LoginScreen uses (see showFormHint there): keyed
    on an incrementing `seq` so tapping a second time replays the message rather
    than resolving to an unchanged render. Formik's own `submitCount` is no use
    here because preventDefault stops the submit, so it never increments.
  */
  const [hint, setHint] = useState(null);
  const showFormHint = (text) =>
    setHint((prev) => ({ text, seq: (prev?.seq || 0) + 1 }));

  const initialValues = {
    birthDate: formData.birthDate || "",
    birthTime: formData.birthTime || "",
    birthPlace: formData.birthPlace || "",
    unknownBirthTime: formData.unknownBirthTime || false,
    latitude: formData.latitude || null,
    longitude: formData.longitude || null,
  };

  const handleRegistration = async (mergedFormData) => {
    setRegistering(true);

    try {
      const fullName = mergedFormData.name || "";
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ");

      let phoneNumber = mergedFormData.phoneNumber || "";
      phoneNumber = phoneNumber.replace(/^\+?91/, "");
      phoneNumber = `91${phoneNumber}`;

      const payload = {
        firstName,
        lastName,
        dateOfBirth: mergedFormData.birthDate || "",
        place: mergedFormData.birthPlace || "",
        phoneNumber,
        password: "TempPass@123",
        gender: mergedFormData.identity
          ? mergedFormData.identity.toLowerCase() === "others"
            ? "other"
            : mergedFormData.identity.toLowerCase()
          : "female",
        languagePreferences: ["en"],
        role: "CUSTOMER",
        lat: mergedFormData.latitude || 0,
        lon: mergedFormData.longitude || 0,
        ...(mergedFormData.email && { email: mergedFormData.email }),
      };

      const response = await registerUser(payload, { skipToast: true });

      if (response?.data?.statusCode === 201 || response?.data?.success) {
        toast.dismiss();
        toast.success(response?.data?.message || "Registration successful!");
        
        // Track Profile Completed event
        const userId = localStorage.getItem("shubhtalk_customer_id");
        BranchEvents.trackProfileCompleted({
          page_name: "Birth Details",
          route_name: "birth-details",
          route_path: window.location.pathname,
          user_type: "logged_in",
          user_id: userId,
          profile_completion_status: "completed",
          birth_date_provided: !!mergedFormData.birthDate,
          location_provided: !!mergedFormData.birthPlace,
        });
        
        trackEvent("profile_created", { user_id: userId });
        localStorage.setItem("shubhtalk_show_welcome_bonus", "true");

        const currentUserData = localStorage.getItem("userData");
        const parsedUserData = currentUserData ? JSON.parse(currentUserData) : {};

        const updatedUserData = {
          ...parsedUserData,
          isRegister: true,
          firstName,
          lastName,
          place: mergedFormData.birthPlace,
          dateOfBirth: mergedFormData.birthDate,
          gender: mergedFormData.identity,
        };
        localStorage.setItem("userData", JSON.stringify(updatedUserData));

        const currentUser = localStorage.getItem("shubhtalk_user");
        const parsedUser = currentUser ? JSON.parse(currentUser) : {};

        const updatedUser = {
          ...parsedUser,
          firstName,
          lastName,
          place: mergedFormData.birthPlace,
        };
        localStorage.setItem("shubhtalk_user", JSON.stringify(updatedUser));

        if (mergedFormData.email) {
          dispatch(setEmail(mergedFormData.email));
        }

        window.dispatchEvent(new Event("auth-change"));

        // Create Kundali profile if birth details are provided
        if (mergedFormData.birthDate && mergedFormData.birthPlace && mergedFormData.latitude && mergedFormData.longitude) {
          try {
            const dateObj = new Date(mergedFormData.birthDate);
            const timeObj = mergedFormData.birthTime ? mergedFormData.birthTime.split(":") : ["0", "0"];

            const kundliPayload = {
              name: fullName || firstName,
              gender: mergedFormData.identity ? mergedFormData.identity.toLowerCase() : "female",
              relation: "Self",
              day: dateObj.getDate(),
              month: dateObj.getMonth() + 1,
              year: dateObj.getFullYear(),
              hour: mergedFormData.unknownBirthTime ? "00" : String(parseInt(timeObj[0])).padStart(2, "0"),
              min: mergedFormData.unknownBirthTime ? "00" : String(parseInt(timeObj[1])).padStart(2, "0"),
              second: "00",
              place: mergedFormData.birthPlace,
              lat: mergedFormData.latitude,
              lon: mergedFormData.longitude,
              tzone: mergedFormData.timezone ?? 5.5,
            };

            const kundliResponse = await createKundli(kundliPayload).unwrap();
            toast.success("Birth chart created successfully!");
          } catch (kundliError) {
            toast.error("Birth chart creation failed, but you can add it later from your profile");
          }
        }

        onNext();
      } else {
        const failMessage = response?.data?.message || "Registration failed";
        toast.error(failMessage);

        // "User already registered" → the account exists, so send the user to
        // the login screen instead of leaving them stuck on the form.
        if (failMessage.toLowerCase().includes("already registered")) {
          dispatch(logout());
          try {
            localStorage.clear();
            window.dispatchEvent(new Event("auth-change"));
          } catch {
            /* ignore */
          }
          // Small delay so the user can read the message before the redirect.
          setTimeout(() => {
            window.location.replace("/login?skip=welcome");
          }, 1500);
        }
      }
    } catch (error) {
      // The API is the source of truth for the session/account. Both an
      // invalid session (401) and an "already registered" account (400) mean
      // the user should be sent to the login screen rather than being left
      // stranded on the form.
      const status = error.response?.status;
      const message = error.response?.data?.message || "";
      const isAuthError =
        status === 401 ||
        message.includes("Authorization") ||
        message.includes("Invalid access token");
      const isAlreadyRegistered = message.toLowerCase().includes("already registered");

      if (isAuthError || isAlreadyRegistered) {
        toast.error(isAuthError ? "Session expired. Please login again." : message);
        dispatch(logout());
        try {
          localStorage.clear();
          window.dispatchEvent(new Event("auth-change"));
        } catch {
          /* ignore */
        }
        // Small delay so the user can read the message before the hard redirect
        // (which reloads the page and would otherwise clear the toast).
        setTimeout(() => {
          window.location.replace("/login?skip=welcome");
        }, 1500);
      } else {
        toast.error(error.response?.data?.message || "Failed to register. Please try again.");
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleSubmit = (values) => {
    updateFormData(values);

    if (skipGuidance) {
      const mergedFormData = { ...formData, ...values };
      handleRegistration(mergedFormData);
    } else {
      onNext();
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      validateOnChange={true}
      validateOnBlur={true}
      enableReinitialize={false}
    >
      {({ values, setFieldValue, setFieldTouched, errors, touched, isValid, validateForm }) => {
        // Blank time with "Don't know" unticked. The schema rejects this; the
        // CTA needs the same answer so its blocked styling matches reality.
        const needsBirthTime = !values.unknownBirthTime && !values.birthTime;

        return (
        <Form className={styles.birthDetailsScreen}>
          <div className={styles.header}>
            <div className={styles.progressDots}>
              {Array.from({ length: totalSteps }).map((_, index) => (
                /*
                  The dot for the step you are already on used to call
                  onStepChange(currentStep), which set the step to the screen
                  already showing — a tap on the widest, most button-like element
                  in the header that did nothing at all. It is a position
                  indicator, not a control, so it is disabled.

                  type="button" is required: these sit inside a Formik <Form>,
                  and a default-type button would submit it.
                */
                <button
                  key={index}
                  type="button"
                  className={
                    index === currentStep ? styles.dotActive : styles.dotInactive
                  }
                  disabled={!onStepChange || index === currentStep}
                  aria-current={index === currentStep ? "step" : undefined}
                  aria-label={`Step ${index + 1} of ${totalSteps}`}
                  onClick={() => onStepChange?.(index)}
                />
              ))}
            </div>

            {/* Language Translator */}
            {/* <LanguageSelector style={{ position: 'relative', top: 'auto', right: 'auto' }} /> */}
          </div>

          <div className={styles.content}>
            <h1 className={styles.title}>
              Share the moment the stars welcomed you
            </h1>

            <div className={styles.formGroup}>
              <label>Birth Date<span className={styles.required}>*</span></label>
              <DateTimePicker
                mode="date"
                selected={values.birthDate ? new Date(values.birthDate) : null}
                onChange={(date) => {
                  if (date) {
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, "0");
                    const dd = String(date.getDate()).padStart(2, "0");
                    trackEvent("profile_field_completed", { field_name: "birth_date" });
                    setFieldValue("birthDate", `${yyyy}-${mm}-${dd}`).then(() => {
                      setFieldTouched("birthDate", true, true);
                    });
                  } else {
                    setFieldValue("birthDate", "").then(() => {
                      setFieldTouched("birthDate", true, true);
                    });
                  }
                }}
                placeholder="DD/MM/YYYY"
              />
              <ErrorMessage name="birthDate">
                {(msg) => <span className={styles.errorText}>{msg}</span>}
              </ErrorMessage>
            </div>

            <div className={styles.formGroup}>
              {/*
                Marked required only while "Don't know" is unticked, which is
                exactly when the schema demands it. Unmarked, the field read as
                optional while still blocking the CTA.
              */}
              <label>
                Birth Time
                {!values.unknownBirthTime && (
                  <span className={styles.required}>*</span>
                )}
              </label>
              <DateTimePicker
                mode="time"
                selected={values.birthTime ? (() => { const [h, m] = values.birthTime.split(":"); const d = new Date(); d.setHours(h, m, 0, 0); return d; })() : null}
                onChange={(date) => {
                  if (date) {
                    const hh = String(date.getHours()).padStart(2, "0");
                    const mm = String(date.getMinutes()).padStart(2, "0");
                    setFieldValue("birthTime", `${hh}:${mm}`);
                    setHint(null);
                  } else {
                    setFieldValue("birthTime", "");
                  }
                }}
                placeholder="Select time"
                disabled={values.unknownBirthTime}
                disabledReason="Uncheck “Don’t know the exact time of birth” to pick a time"
              />
              <div className={styles.checkboxContainer}>
                <label className={styles.checkboxLabel}>
                  <Field
                    type="checkbox"
                    name="unknownBirthTime"
                    onChange={(e) => {
                      setFieldValue("unknownBirthTime", e.target.checked);
                      if (e.target.checked) {
                        setFieldValue("birthTime", "");
                      }
                      // Ticking this resolves the time blocker, so retire the
                      // hint that asked for it.
                      setHint(null);
                    }}
                  />
                  <span>Don't know the exact time of birth</span>
                </label>
              </div>
              <ErrorMessage name="birthTime">
                {(msg) => <span className={styles.errorText}>{msg}</span>}
              </ErrorMessage>
            </div>

            <div className={styles.formGroup}>
              <label>Place of Birth<span className={styles.required}>*</span></label>
              <div className={`${styles.inputWrapper} ${touched.birthPlace && errors.birthPlace ? styles.error : ""}`}>
                <LocationSearch
                  value={values.birthPlace}
                  onChange={(e) => {
                    setFieldValue("birthPlace", e.target.value);
                    setFieldTouched("birthPlace", true);
                    if (e.target.value !== values.birthPlace) {
                      setFieldValue("latitude", null);
                      setFieldValue("longitude", null);
                    }
                  }}
                  onPlaceSelect={(place) => {
                    trackEvent("profile_field_completed", { field_name: "birth_place" });
                    setFieldValue("birthPlace", place.address);
                    setFieldValue("latitude", place.lat);
                    setFieldValue("longitude", place.lng);
                    setFieldTouched("birthPlace", true);
                    setTimeout(() => validateForm(), 0);
                  }}
                  placeholder="Select here"
                />
                <MapPin className={styles.inputIcon} size={20} />
              </div>
              <ErrorMessage name="birthPlace">
                {(msg) => <span className={styles.errorText}>{msg}</span>}
              </ErrorMessage>
              {touched.birthPlace && !values.latitude && values.birthPlace && (
                <span className={styles.errorText}>Please select a location from the dropdown</span>
              )}
            </div>
          </div>

          {/*
            role="status" so the reason is announced without moving focus.
            Keyed on `seq` so a repeated tap remounts the line — an identical
            re-render is the one answer a dead-click metric cannot see.
          */}
          {hint && (
            <p key={hint.seq} className={styles.loginInlineHint} role="status">
              {hint.text}
            </p>
          )}

          {/*
            Never `disabled` for a validation reason. This is the last gate before
            a profile exists, and the most common blocker is a birth place typed
            without picking a suggestion (so `latitude` is null) — which is easy
            to miss further up a scrolled mobile form. A disabled button absorbs
            the tap and explains nothing; this one stays live and names the
            blocker. `registering` is handled inside the handler instead.
          */}
          <button
            type="submit"
            className={`${styles.otpprimaryBtn} ${
              !values.birthDate ||
              !values.birthPlace ||
              !values.latitude ||
              needsBirthTime
                ? styles.otpprimaryBtnBlocked
                : ""
            }`.trim()}
            aria-disabled={
              !values.birthDate ||
              !values.birthPlace ||
              !values.latitude ||
              needsBirthTime
            }
            aria-busy={registering}
            onClick={(e) => {
              if (registering) {
                e.preventDefault();
                // A silent return here is the exact path a repeat tap takes.
                // The label already reads "Saving...", but say so at the hint
                // line too, since that is where the previous taps were answered.
                showFormHint("Saving your details — one moment.");
                return;
              }
              if (!values.birthDate) {
                e.preventDefault();
                showFormHint("Please select your date of birth.");
                return;
              }
              if (needsBirthTime) {
                /*
                  Reported here as well as by the schema. The time field is not
                  wired through Formik's <Field>, so `touched.birthTime` is never
                  set and its <ErrorMessage> cannot appear — without this the
                  blocked tap had no visible answer anywhere on the page.
                */
                e.preventDefault();
                showFormHint(
                  "Select your birth time, or tick “Don’t know the exact time of birth”."
                );
                return;
              }
              if (!values.birthPlace) {
                e.preventDefault();
                showFormHint("Please enter your place of birth.");
                return;
              }
              if (!values.latitude) {
                e.preventDefault();
                setFieldTouched("birthPlace", true, true);
                showFormHint(
                  "Tap your city from the suggestions so we can use the right timezone."
                );
                return;
              }
              // Any remaining schema error would make Formik refuse to submit
              // without a word. Say it out loud instead.
              const remaining = Object.keys(errors);
              if (remaining.length > 0) {
                e.preventDefault();
                showFormHint(
                  errors[remaining[0]] || "Please check the details above."
                );
              }
            }}
          >
            {registering ? "Saving..." : "Next"}
          </button>
        </Form>
        );
      }}
    </Formik>
  );
};

export default BirthDetailsScreen;
