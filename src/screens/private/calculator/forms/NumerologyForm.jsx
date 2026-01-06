import LocationSearch from "../../../../utils/location/locationSearchVedic";
import styles from "./NumerologyForm.module.scss";

const NumerologyForm = ({
  title,
  submitText,
  formData,
  errors,
  onChange,
  onSubmit,
  hideType = false,
}) => {
  const { name, type, dob } = formData;

  return (
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
          onChange={(e) => onChange("name", e.target.value)}
        />
        {errors?.name && <p className={styles.error}>{errors.name}</p>}
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
          onClick={(e) => e.target.showPicker?.()}
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

      <button type="submit" className={styles.submitBtn}>
        {submitText}
      </button>
    </form>
  );
};

export default NumerologyForm;
