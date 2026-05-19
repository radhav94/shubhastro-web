import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import styles from "./FlamesForm.module.scss";
import { ProfileManager } from "../../../../component/UI/Profile";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";

const FlamesForm = ({
  title,
  submitText,
  formData,
  errors,
  onChange,
  onSubmit,
  onReset,
  name2Label = "Your Partner's Name",
  name2Placeholder = "Enter your partner's name",
}) => {
  const { name1, name2 } = formData;
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTarget, setProfileTarget] = useState(null);
  const dispatch = useDispatch();
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  // Pre-fill person1 from Redux selectedKundli on mount
  useEffect(() => {
    if (selectedKundli) {
      onChange("name1", selectedKundli.name || "");
    }
  }, [selectedKundli]);

  const handleSelectProfileClick = (target) => {
    setProfileTarget(target);
    setShowProfileModal(true);
  };

  const handleProfileSelect = (profile) => {
    if (!profile) return;
    const name = profile.name || "";
    if (profileTarget === "person1") {
      onChange("name1", name);
      dispatch(setSelectedKundli(profile));
    } else if (profileTarget === "person2") {
      onChange("name2", name);
    }
    setShowProfileModal(false);
  };

  return (
    <>
      <form className={styles.flamesForm} onSubmit={onSubmit}>
        <h3 className={styles.formTitle}>
           {title}
        </h3>

        {/* Your Name */}
        <div className={styles.formGroup}>
          <label>
            Your Name <span className={styles.required}>*</span>
          </label>
          <input
            placeholder="Enter your name"
            value={name1}
            onChange={(e) => onChange("name1", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
          />
          {errors?.name1 && <p className={styles.error}>{errors.name1}</p>}
          <button
            type="button"
            className={styles.selectProfileBtn}
            onClick={() => handleSelectProfileClick("person1")}
          >
            Select Profile +
          </button>
        </div>

        {/* Partner/Friend Name */}
        <div className={styles.formGroup}>
          <label>
            {name2Label} <span className={styles.required}>*</span>
          </label>
          <input
            placeholder={name2Placeholder}
            value={name2}
            onChange={(e) => onChange("name2", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
          />
          {errors?.name2 && <p className={styles.error}>{errors.name2}</p>}
          <button
            type="button"
            className={styles.selectProfileBtn}
            onClick={() => handleSelectProfileClick("person2")}
          >
            Select Profile +
          </button>
        </div>

        <div className={styles.btnRow}>
          {onReset && (
            <button type="button" className={styles.resetBtn} onClick={onReset}>
              Reset
            </button>
          )}
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

export default FlamesForm;
