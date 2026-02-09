import { useState } from "react";
import styles from "./Onboarding.module.scss";

const PersonalizeScreen = ({ onNext, onBack, onSkip, formData, updateFormData, currentStep = 0, totalSteps = 3, onStepChange }) => {
  const [localData, setLocalData] = useState({
    name: formData.name || "",
    identity: formData.identity || "Female",
  });

  const handleNext = () => {
    if (!localData.name.trim() || localData.name.trim().length < 3) return;
    updateFormData(localData);
    onNext();
  };

  return (
    <div className={styles.personalizeScreen}>
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
        {/* <button className={styles.skipBtn} onClick={onSkip}>
          Skip for Now
        </button> */}
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>Let's personalize your journey together.</h1>

        <div className={styles.formGroup}>
          <label>Name</label>
          <input
            type="text"
            value={localData.name}
            onChange={(e) => setLocalData({ ...localData, name: e.target.value })}
            className={styles.input}
            placeholder="Enter your name (min 3 characters)"
            minLength={3}
          />
          {localData.name.length > 0 && localData.name.trim().length < 3 && (
            <span className={styles.validationError}>Name must be at least 3 characters</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label>Your Identity</label>
          <div className={styles.identityButtons}>
            <button
              type="button"
              className={`${styles.identityBtn} ${
                localData.identity === "Male" ? styles.active : ""
              }`}
              style={{ backgroundColor: "#E8F4FF" }}
              onClick={() => setLocalData({ ...localData, identity: "Male" })}
            >
              <span className={styles.genderIcon}>♂</span>
              <span>Male</span>
            </button>
            <button
              type="button"
              className={`${styles.identityBtn} ${
                localData.identity === "Female" ? styles.active : ""
              }`}
              style={{ backgroundColor: "#FFE5F0" }}
              onClick={() => setLocalData({ ...localData, identity: "Female" })}
            >
              <span className={styles.genderIcon}>♀</span>
              <span>Female</span>
            </button>
            <button
              type="button"
              className={`${styles.identityBtn} ${
                localData.identity === "Others" ? styles.active : ""
              }`}
              style={{ backgroundColor: "#FFF4E0" }}
              onClick={() => setLocalData({ ...localData, identity: "Others" })}
            >
              <span className={styles.genderIcon}>⚥</span>
              <span>Others</span>
            </button>
          </div>
        </div>
      </div>

      <button
        className={styles.otpprimaryBtn}
        onClick={handleNext}
        disabled={!localData.name.trim() || localData.name.trim().length < 3}
      >
        Next
      </button>
    </div>
  );
};

export default PersonalizeScreen;
