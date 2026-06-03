import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { TODAY } from "../../../../utils/dateFormat/date";
import LocationSearch from "../../../../utils/location/locationSearchVedic";
import styles from "./NumerologyForm.module.scss";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";
import { ProfileManager } from "../../../../component/UI/Profile";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";

const NumerologyForm = ({
  title,
  submitText,
  formData,
  errors,
  onChange,
  onSubmit,
  onReset,
  hideType = true,
}) => {
  const { name, type, dob } = formData;
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dispatch = useDispatch();
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  useEffect(() => {
    if (selectedKundli) {
      onChange("name", selectedKundli.name || "");
      if (selectedKundli.year && selectedKundli.month && selectedKundli.day) {
        onChange("dob", `${selectedKundli.year}-${String(selectedKundli.month).padStart(2, "0")}-${String(selectedKundli.day).padStart(2, "0")}`);
      }
    }
  }, [selectedKundli]);

  const handleProfileSelect = (profile) => {
    if (!profile) return;
    onChange("name", profile.name || "");
    if (profile.year && profile.month && profile.day) {
      onChange("dob", `${profile.year}-${String(profile.month).padStart(2, "0")}-${String(profile.day).padStart(2, "0")}`);
    }
    dispatch(setSelectedKundli(profile));
    setShowProfileModal(false);
  };

  return (
    <>
      <form className={styles.astroForm} onSubmit={onSubmit}>
        <h3 className={styles.formTitle}>{title}</h3>

        {/* Name */}
        <div className={styles.formGroup}>
          <label>
            Name <span className={styles.required}>*</span>
          </label>
          <input
            name="name"
            value={name}
            placeholder="Enter your name"
            onChange={(e) => onChange("name", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
          />
          {errors?.name && <p className={styles.error}>{errors.name}</p>}
          <button
            type="button"
            className={styles.selectProfileBtnMobile}
            onClick={() => setShowProfileModal(true)}
          >
            Select Profile +
          </button>
        </div>
        <button
          type="button"
          className={styles.selectProfileBtn}
          onClick={() => setShowProfileModal(true)}
        >
          Select Profile +
        </button>

        {/* DOB */}
        <div className={styles.formGroup}>
          <label>
            Date of Birth <span className={styles.required}>*</span>
          </label>
          <DateTimePicker
            mode="date"
            selected={dob ? new Date(dob) : null}
            onChange={(date) => {
              if (date) {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const dd = String(date.getDate()).padStart(2, "0");
                onChange("dob", `${yyyy}-${mm}-${dd}`);
              } else {
                onChange("dob", "");
              }
            }}
            placeholder="DD/MM/YYYY"
          />
          {errors?.dob && <p className={styles.error}>{errors.dob}</p>}
        </div>

        {/* Type */}
        {!hideType && (
          <div className={styles.formGroup}>
            <label>
              Type <span className={styles.required}>*</span>
            </label>
            <select
              value={type}
              onChange={(e) => onChange("type", e.target.value)}
            >
              <option value="Cheiro/Chaldien">Cheiro / Chaldien</option>
              <option value="ythagorean">Pythagorean</option>
              <option value="sepharial">Sepharial</option>
              <option value="modern">Modern</option>
            </select>
            {errors?.type && <p className={styles.error}>{errors.type}</p>}
          </div>
        )}

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

export default NumerologyForm;
