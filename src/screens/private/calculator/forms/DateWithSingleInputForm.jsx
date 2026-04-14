import { TODAY } from "../../../../utils/dateFormat/date";
import styles from "./DateWithSingleInputForm.module.scss";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";

const DateWithSingleInputForm = ({
  title,
  submitText,
  formData,
  errors,
  onChange,
  onSubmit,
  inputLabel,
  inputPlaceholder,
  inputName,
  inputType = "text",
  hideSubmit = false,
  readOnly = false,
}) => {
  const { dob, [inputName]: extraValue } = formData;

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <h3 className={styles.formTitle}>{title}</h3>

      {/* DOB */}
      <div className={styles.formGroup}>
        <label>
          Date of Birth <span className={styles.required}>*</span>
        </label>
        {/* <input type="date" value={dob} disabled={readOnly} max={TODAY} onChange={(e) => onChange("dob", e.target.value)} onClick={(e) => e.target.showPicker?.()} /> */}
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
      </div>

      {/* SINGLE EXTRA INPUT */}
      <div className={styles.formGroup}>
        <label>
          {inputLabel} <span className={styles.required}>*</span>
        </label>
        <input
          type={inputType}
          placeholder={inputPlaceholder}
          value={extraValue}
          disabled={readOnly}
          onChange={(e) => onChange(inputName, e.target.value)}
          onClick={(e) => e.target.showPicker?.()}
        />
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
  );
};

export default DateWithSingleInputForm;
