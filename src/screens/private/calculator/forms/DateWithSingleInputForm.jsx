import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { TODAY } from "../../../../utils/dateFormat/date";
import styles from "./DateWithSingleInputForm.module.scss";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";
import { ProfileManager } from "../../../../component/UI/Profile";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";

const DateWithSingleInputForm = ({
  title,
  submitText,
  formData,
  errors,
  onChange,
  onSubmit,
  onReset,
  inputLabel,
  inputPlaceholder,
  inputName,
  inputType = "text",
  hideSubmit = false,
  readOnly = false,
}) => {
  const { dob, [inputName]: extraValue } = formData;
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dispatch = useDispatch();
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  useEffect(() => {
    if (selectedKundli && selectedKundli.year && selectedKundli.month && selectedKundli.day) {
      onChange("dob", `${selectedKundli.year}-${String(selectedKundli.month).padStart(2, "0")}-${String(selectedKundli.day).padStart(2, "0")}`);
    }
  }, [selectedKundli]);

  const handleProfileSelect = (profile) => {
    if (!profile) return;
    if (profile.year && profile.month && profile.day) {
      onChange("dob", `${profile.year}-${String(profile.month).padStart(2, "0")}-${String(profile.day).padStart(2, "0")}`);
    }
    dispatch(setSelectedKundli(profile));
    setShowProfileModal(false);
  };

  return (
    <>
      <form className={styles.form} onSubmit={onSubmit}>
        {onReset && (
          <div className={styles.resetRow}>
            <button type="button" className={styles.resetBtn} onClick={onReset}>
              Reset
            </button>
          </div>
        )}
        <h3 className={styles.formTitle}>{title}</h3>

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
            maxDate={new Date()}
            placeholder="DD/MM/YYYY"
            disabled={readOnly}
          />
          {errors?.dob && <p className={styles.error}>{errors.dob}</p>}
          <button
            type="button"
            className={styles.selectProfileBtn}
            onClick={() => setShowProfileModal(true)}
          >
            Select Profile +
          </button>
        </div>

        {/* SINGLE EXTRA INPUT */}
        <div className={styles.formGroup}>
          <label>
            {inputLabel} <span className={styles.required}>*</span>
          </label>
          {inputType === "date" ? (
            <DateTimePicker
              mode="date"
              selected={extraValue ? new Date(extraValue) : null}
              onChange={(date) => {
                if (date) {
                  const yyyy = date.getFullYear();
                  const mm = String(date.getMonth() + 1).padStart(2, "0");
                  const dd = String(date.getDate()).padStart(2, "0");
                  onChange(inputName, `${yyyy}-${mm}-${dd}`);
                } else {
                  onChange(inputName, "");
                }
              }}
              placeholder={inputPlaceholder || "DD/MM/YYYY"}
              disabled={readOnly}
            />
          ) : (
            <input
              type={inputType}
              placeholder={inputPlaceholder}
              value={extraValue}
              disabled={readOnly}
              onChange={(e) => onChange(inputName, e.target.value)}
            />
          )}
          {errors?.[inputName] && (
            <p className={styles.error}>{errors[inputName]}</p>
          )}
        </div>

        {!hideSubmit && (
          <button type="submit" className={styles.submitBtn}>
            {submitText}
          </button>
        )}
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

export default DateWithSingleInputForm;
