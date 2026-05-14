import styles from "./LoveMatchForm.module.scss";

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

  return (
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
          </div>

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
          </div>

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
  );
};

export default LoveMatchForm;
