import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import styles from "./LoveMatchForm.module.scss";
import { ProfileManager } from "../../../../component/UI/Profile";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";

const LoveMatchForm = ({
  title,
  submitText,
  formData,
  errors,
  onChange,
  onSubmit,
  onReset,
}) => {
  const { name1, gender1, name2, gender2 } = formData;
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTarget, setProfileTarget] = useState(null);
  const dispatch = useDispatch();
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  // Pre-fill person1 from Redux selectedKundli on mount
  useEffect(() => {
    if (selectedKundli) {
      const g = (selectedKundli.gender || selectedKundli.identity || "").toLowerCase();
      onChange("name1", selectedKundli.name || "");
      if (g === "male" || g === "female") onChange("gender1", g);
    }
  }, [selectedKundli]); // "person1" or "person2"

  const handleSelectProfileClick = (target) => {
    setProfileTarget(target);
    setShowProfileModal(true);
  };

  const handleProfileSelect = (profile) => {
    if (!profile) return;
    const name = profile.name || "";
    const gender = (profile.gender || profile.identity || "").toLowerCase();
    const mappedGender = gender === "female" ? "female" : gender === "male" ? "male" : "";

    if (profileTarget === "person1") {
      onChange("name1", name);
      if (mappedGender) onChange("gender1", mappedGender);
      dispatch(setSelectedKundli(profile));
    } else if (profileTarget === "person2") {
      onChange("name2", name);
      if (mappedGender) onChange("gender2", mappedGender);
    }
    setShowProfileModal(false);
  };

  return (
    <>
      <form className={styles.loveForm} onSubmit={onSubmit}>
        {onReset && (
          <div className={styles.resetRow}>
            <button type="button" className={styles.resetTopBtn} onClick={onReset}>
              Reset
            </button>
          </div>
        )}
        {title && <h3 className={styles.formTitle}>{title}</h3>}

        <div className={styles.grid}>
          {/* LEFT PERSON */}
          <div>
            <div className={styles.formGroup}>
              <label>
                Your Name <span className={styles.required}>*</span>
              </label>
              <input
                value={name1}
                name="name1"
                placeholder="E.g. John Doe"
                onChange={(e) => onChange("name1", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
              />
              {errors?.name1 && <p className={styles.error}>{errors.name1}</p>}
              <button
                type="button"
                className={styles.selectProfileBtnMobile}
                onClick={() => handleSelectProfileClick("person1")}
              >
                Select Profile +
              </button>
            </div>
            <button
              type="button"
              className={styles.selectProfileBtn}
              onClick={() => handleSelectProfileClick("person1")}
            >
              Select Profile +
            </button>

            <div className={styles.formGroup}>
              <label>
                Gender <span className={styles.required}>*</span>
              </label>
              <select
                value={gender1}
                onChange={(e) => onChange("gender1", e.target.value)}
              >
                <option value="">--Select--</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors?.gender1 && (
                <p className={styles.error}>{errors.gender1}</p>
              )}
            </div>
          </div>

          {/* HEART */}
          <div className={styles.heart}>❤</div>

          {/* RIGHT PERSON */}
          <div>
            <div className={styles.formGroup}>
              <label>
                Partner's Name <span className={styles.required}>*</span>
              </label>
              <input
                name="name2"
                value={name2}
                placeholder="E.g. Jane Doe"
                onChange={(e) => onChange("name2", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
              />
              {errors?.name2 && <p className={styles.error}>{errors.name2}</p>}
              <button
                type="button"
                className={styles.selectProfileBtnMobile}
                onClick={() => handleSelectProfileClick("person2")}
              >
                Select Profile +
              </button>
            </div>
            <button
              type="button"
              className={styles.selectProfileBtn}
              onClick={() => handleSelectProfileClick("person2")}
            >
              Select Profile +
            </button>

            <div className={styles.formGroup}>
              <label>
                Gender <span className={styles.required}>*</span>
              </label>
              <select
                value={gender2}
                onChange={(e) => onChange("gender2", e.target.value)}
              >
                <option value="">--Select--</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors?.gender2 && (
                <p className={styles.error}>{errors.gender2}</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.btnRow}>
          <button type="submit" className={styles.submitBtn}>
            {submitText}
          </button>
        </div>
      </form>

      <ProfileManager
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileSelect={handleProfileSelect}
        title="Select Profile"
        enabledOperations={{ list: true, add: true, edit: true, delete: true }}
      />
    </>
  );
};

export default LoveMatchForm;
