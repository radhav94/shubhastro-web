import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./Onboarding.module.scss";
import LanguageSelector from "../../../component/LanguageSelector";
import { personNameRegex, PERSON_NAME_ERROR } from "../../../utils/regex";

// Validation schema
const validationSchema = Yup.object({
  name: Yup.string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must not exceed 50 characters")
    .matches(personNameRegex, PERSON_NAME_ERROR)
    .required("Name is required"),
  email: Yup.string()
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"),
  identity: Yup.string()
    .oneOf(["Male", "Female", "Others"], "Please select a valid identity")
    .required("Identity is required"),
});

const PersonalizeScreen = ({ onNext, onBack, onSkip, formData, updateFormData, currentStep = 0, totalSteps = 3, onStepChange }) => {
  const initialValues = {
    name: formData.name || "",
    email: formData.email || "",
    identity: formData.identity || "Male",
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
    >
      {({ values, setFieldValue, errors, touched, isValid }) => (
        <Form className={styles.personalizeScreen}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <button
                type="button"
                className={styles.backBtnInline}
                onClick={onBack}
                aria-label="Go back"
              >
                <ChevronLeft size={20} />
              </button>
              <div className={styles.progressDots}>
                {Array.from({ length: totalSteps }).map((_, index) => (
                  /* Current-step dot is an indicator, not a control: tapping it
                     re-set the step to the screen already showing. See
                     BirthDetailsScreen for the dead click this caused. */
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
            </div>

            {/* Language Translator */}
            {/* <LanguageSelector style={{ position: 'relative', top: 'auto', right: 'auto' }} /> */}
          </div>

          <div className={styles.content}>
            <h1 className={styles.title}>Let's personalize your journey together.</h1>

            <div className={styles.formGroup}>
              <label>Name</label>
              <Field
                type="text"
                name="name"
                className={styles.input}
                placeholder="Enter your name (min 3 characters)"
              />
              <ErrorMessage name="name">
                {(msg) => <span className={styles.validationError}>{msg}</span>}
              </ErrorMessage>
            </div>

            <div className={styles.formGroup}>
              <label>Email ID <span style={{ color: '#999', fontWeight: 'normal', fontSize: '12px' }}>(optional)</span></label>
              <Field
                type="email"
                name="email"
                className={styles.input}
                placeholder="Enter your email address"
              />
              <ErrorMessage name="email">
                {(msg) => <span className={styles.validationError}>{msg}</span>}
              </ErrorMessage>
            </div>

            <div className={styles.formGroup}>
              <label>Your Identity</label>
              <div className={styles.identityButtons}>
                <button
                  type="button"
                  className={`${styles.identityBtn} ${
                    values.identity === "Male" ? styles.active : ""
                  }`}
                  style={{ backgroundColor: "#E8F4FF" }}
                  onClick={() => setFieldValue("identity", "Male")}
                >
                  <span className={styles.genderIcon}>♂</span>
                  <span>Male</span>
                </button>
                <button
                  type="button"
                  className={`${styles.identityBtn} ${
                    values.identity === "Female" ? styles.active : ""
                  }`}
                  style={{ backgroundColor: "#FFE5F0" }}
                  onClick={() => setFieldValue("identity", "Female")}
                >
                  <span className={styles.genderIcon}>♀</span>
                  <span>Female</span>
                </button>
                <button
                  type="button"
                  className={`${styles.identityBtn} ${
                    values.identity === "Others" ? styles.active : ""
                  }`}
                  style={{ backgroundColor: "#FFF4E0" }}
                  onClick={() => setFieldValue("identity", "Others")}
                >
                  <span className={styles.genderIcon}>⚥</span>
                  <span>Others</span>
                </button>
              </div>
              <ErrorMessage name="identity">
                {(msg) => <span className={styles.validationError}>{msg}</span>}
              </ErrorMessage>
            </div>
          </div>

          {/*
            Never `disabled` for a validation reason — the rest of this flow
            (LoginScreen, OTPScreen, BirthDetailsScreen) was already converted
            for the same reason. A disabled button dispatches no click event, so
            the tap was swallowed and nothing explained why.
            `!isValid || !name.trim()` covers several distinct blockers (empty
            name, under 3 characters, digits or punctuation in the name, a
            malformed optional email) and the inline ErrorMessage only appears
            after the field has been touched — so a user who typed a two-letter
            name and went straight for Next saw no error and got no response.
            Stays live and names the specific blocker.
          */}
          <button
            type="submit"
            className={`${styles.otpprimaryBtnPer} ${
              !isValid || !values.name.trim() ? styles.otpprimaryBtnBlocked : ""
            }`.trim()}
            aria-disabled={!isValid || !values.name.trim()}
            onClick={(e) => {
              const name = values.name.trim();
              if (!name) {
                e.preventDefault();
                toast.error("Please enter your name.");
                return;
              }
              if (name.length < 3) {
                e.preventDefault();
                toast.error("Name must be at least 3 characters.");
                return;
              }
              if (name.length > 50) {
                e.preventDefault();
                toast.error("Name must not exceed 50 characters.");
                return;
              }
              if (!personNameRegex.test(name)) {
                e.preventDefault();
                toast.error(PERSON_NAME_ERROR);
                return;
              }
              if (
                values.email.trim() &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
              ) {
                e.preventDefault();
                toast.error("Please enter a valid email address, or leave it blank.");
                return;
              }
              // Falls through to Formik's submit.
            }}
          >
            Next
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default PersonalizeScreen;
