import { useState } from "react";
import styles from "./Onboarding.module.scss";

const PersonalizeScreen = ({ onNext, onBack, onSkip, formData, updateFormData }) => {
  const [localData, setLocalData] = useState({
    firstName: formData.firstName || "",
    lastName: formData.lastName || "",
    identity: formData.identity || "Female",
  });

  const handleNext = () => {
    if (!localData.firstName.trim() || !localData.lastName.trim()) return;
    updateFormData(localData);
    onNext();
  };

  return (
    <div className={styles.personalizeScreen}>
      <div className={styles.header}>
        <div className={styles.progressDots}>
          <span className={styles.dotActive}></span>
          <span className={styles.dotInactive}></span>
          <span className={styles.dotInactive}></span>
        </div>
        <button className={styles.skipBtn} onClick={onSkip}>
          Skip for Now
        </button>
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>Let's personalize your journey together.</h1>

        <div className={styles.formGroup}>
          <label>First Name</label>
          <input
            type="text"
            value={localData.firstName}
            onChange={(e) => setLocalData({ ...localData, firstName: e.target.value })}
            className={styles.input}
            placeholder="first name"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Last Name</label>
          <input
            type="text"
            value={localData.lastName}
            onChange={(e) => setLocalData({ ...localData, lastName: e.target.value })}
            className={styles.input}
            placeholder="last name"
          />
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
        disabled={!localData.firstName.trim() || !localData.lastName.trim()}
      >
        Next
      </button>
    </div>
  );
};

export default PersonalizeScreen;
