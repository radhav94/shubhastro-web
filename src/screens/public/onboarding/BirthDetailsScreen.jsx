import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import styles from "./Onboarding.module.scss";
import { Calendar, Clock, MapPin } from "lucide-react";
import LocationSearch from "../../../utils/location/locationSearchVedic";

// Validation schema
const validationSchema = Yup.object({
  birthDate: Yup.string()
    .required("Birth date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  birthTime: Yup.string()
    .when("unknownBirthTime", {
      is: false,
      then: (schema) => schema.matches(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
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
}) => {
  const initialValues = {
    birthDate: formData.birthDate || "",
    birthTime: formData.birthTime || "",
    birthPlace: formData.birthPlace || "",
    unknownBirthTime: formData.unknownBirthTime || false,
    latitude: formData.latitude || null,
    longitude: formData.longitude || null,
  };

  const handleSubmit = (values) => {
    updateFormData(values);
    onNext();
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
      {({ values, setFieldValue, setFieldTouched, errors, touched, isValid, validateForm }) => (
        <Form className={styles.birthDetailsScreen}>
          <div className={styles.header}>
            <div className={styles.progressDots}>
              {Array.from({ length: totalSteps }).map((_, index) => (
                <span
                  key={index}
                  className={
                    index === currentStep ? styles.dotActive : styles.dotInactive
                  }
                  onClick={() => onStepChange && onStepChange(index)}
                  style={{ cursor: onStepChange ? 'pointer' : 'default' }}
                ></span>
              ))}
            </div>
          </div>

          <div className={styles.content}>
            <h1 className={styles.title}>
              Share the moment the stars welcomed you
            </h1>

            <div className={styles.formGroup}>
              <label>Birth Date<span className={styles.required}>*</span></label>
              <div className={`${styles.inputWrapper} ${touched.birthDate && errors.birthDate ? styles.error : ""}`}>
                <Field
                  type="date"
                  name="birthDate"
                  className={styles.input}
                  placeholder="DD/MM/YYYY"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <ErrorMessage name="birthDate">
                {(msg) => <span className={styles.errorText}>{msg}</span>}
              </ErrorMessage>
            </div>

            <div className={styles.formGroup}>
              <label>Birth Time</label>
              <div className={styles.inputWrapper}>
                <Field
                  type="time"
                  name="birthTime"
                  onClick={(e) => e.target.showPicker?.()}
                  className={styles.input}
                  placeholder="Select here"
                  disabled={values.unknownBirthTime}
                />
                {/* <Clock className={styles.inputIcon} size={20} /> */}
              </div>
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
                    // Reset coordinates when user types manually
                    if (e.target.value !== values.birthPlace) {
                      setFieldValue("latitude", null);
                      setFieldValue("longitude", null);
                    }
                  }}
                  onPlaceSelect={(place) => {
                    setFieldValue("birthPlace", place.address);
                    setFieldValue("latitude", place.lat);
                    setFieldValue("longitude", place.lng);
                    setFieldTouched("birthPlace", true);
                    // Trigger validation after setting all values
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

          <button 
            type="submit" 
            className={styles.otpprimaryBtn}
            disabled={!values.birthDate || !values.birthPlace || !values.latitude || Object.keys(errors).length > 0}
          >
            Next
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default BirthDetailsScreen;
