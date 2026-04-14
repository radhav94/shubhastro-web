import { TODAY } from "../../../../utils/dateFormat/date";
import LocationSearch from "../../../../utils/location/locationSearchVedic";
import styles from "./AstroBirthForm.module.scss";

const AstroBirthForm = ({
  title,
  submitText,
  formData,
  errors,
  onChange,
  onSubmit,
  onReset,
}) => {
  const { name, gender, dob, tob, place, isTimeUnknown } = formData;

  return (
    <form className={styles.astroForm} onSubmit={onSubmit}>
      {onReset && (
        <div className={styles.resetRow}>
          <button type="button" className={styles.resetBtn} onClick={onReset}>
            Reset
          </button>
        </div>
      )}
      <h3 className={styles.formTitle}>{title}</h3>

      {/* Name */}
      <div className={styles.formGroup}>
        <label>
          Name <span className={styles.required}>*</span>
        </label>
        <input
          name="name"
          value={name}
          onChange={(e) => onChange("name", e.target.value)}
        />
        {errors?.name && <p className={styles.error}>{errors.name}</p>}
      </div>

      {/* Gender */}
      <div className={styles.formGroup}>
        <label>
          Gender <span className={styles.required}>*</span>
        </label>
        <select
          value={gender}
          onChange={(e) => onChange("gender", e.target.value)}
        >
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        {errors?.gender && <p className={styles.error}>{errors.gender}</p>}
      </div>

      {/* DOB */}
      <div className={styles.formGroup}>
        <label>
          Date of Birth <span className={styles.required}>*</span>
        </label>
        <input
          type="date"
          value={dob}
          onChange={(e) => onChange("dob", e.target.value)}
          max={TODAY}
          onClick={(e) => e.target.showPicker?.()}
        />
        {errors?.dob && <p className={styles.error}>{errors.dob}</p>}
      </div>

      {/* TOB */}

      <div className={styles.formGroup}>
        <label>
          Time of Birth <span className={styles.required}>*</span>
        </label>
        {/* Time checkbox */}
        <div className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={isTimeUnknown}
            onChange={(e) => onChange("isTimeUnknown", e.target.checked)}
          />
          <span>I don’t know my time of birth</span>
        </div>
        {!isTimeUnknown && (
          <input
            type="time"
            value={tob}
            onChange={(e) => onChange("tob", e.target.value)}
            onClick={(e) => e.target.showPicker?.()}
          />
        )}
        {errors?.tob && <p className={styles.error}>{errors.tob}</p>}
      </div>

      {/* Place */}
      <div className={styles.formGroup}>
        <label>
          Place of Birth <span className={styles.required}>*</span>
        </label>
        <LocationSearch
          value={place}
          onChange={(e) => onChange("place", e.target.value)}
          onPlaceSelect={(location) => {
            onChange("place", location.address);
            onChange("lat", location.lat);
            onChange("lng", location.lng);
          }}
        />
        {errors?.place && <p className={styles.error}>{errors.place}</p>}
      </div>

      <button type="submit" className={styles.submitBtn}>
        {submitText}
      </button>
    </form>
  );
};

export default AstroBirthForm;
