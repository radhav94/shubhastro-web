import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import styles from "./Onboarding.module.scss";

// Validation schema
const validationSchema = Yup.object({
  name: Yup.string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must not exceed 50 characters")
    .matches(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
    .required("Name is required"),
  identity: Yup.string()
    .oneOf(["Male", "Female", "Others"], "Please select a valid identity")
    .required("Identity is required"),
});

const PersonalizeScreen = ({ onNext, onBack, onSkip, formData, updateFormData, currentStep = 0, totalSteps = 3, onStepChange }) => {
  const initialValues = {
    name: formData.name || "",
    identity: formData.identity || "Female",
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

          <button
            type="submit"
            className={styles.otpprimaryBtn}
            disabled={!isValid || !values.name.trim()}
          >
            Next
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default PersonalizeScreen;
