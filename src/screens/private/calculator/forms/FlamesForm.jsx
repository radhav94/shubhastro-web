import styles from "./FlamesForm.module.scss";

const FlamesForm = ({
  title,
  submitText,
  formData,
  errors,
  onChange,
  onSubmit,
  onReset,
}) => {
  const { name1, name2 } = formData;

  return (
    <form className={styles.flamesForm} onSubmit={onSubmit}>
      {onReset && (
        <div className={styles.resetRow}>
          <button type="button" className={styles.resetBtn} onClick={onReset}>
            Reset
          </button>
        </div>
      )}
      <h3 className={styles.formTitle}>
        <span className={styles.dot}>●</span> {title}{" "}
        <span className={styles.moon}>☾</span>
      </h3>

      {/* Your Name */}
      <div className={styles.formGroup}>
        <label>
          Your Name <span className={styles.required}>*</span>
        </label>
        <input
          placeholder="Enter your name"
          value={name1}
          onChange={(e) => onChange("name1", e.target.value)}
        />
        {errors?.name1 && <p className={styles.error}>{errors.name1}</p>}
      </div>

      {/* Partner Name */}
      <div className={styles.formGroup}>
        <label>
          Your Partner's Name <span className={styles.required}>*</span>
        </label>
        <input
          placeholder="Enter your partner's name"
          value={name2}
          onChange={(e) => onChange("name2", e.target.value)}
        />
        {errors?.name2 && <p className={styles.error}>{errors.name2}</p>}
      </div>

      <button type="submit" className={styles.submitBtn}>
        ✦ {submitText} ✦
      </button>
    </form>
  );
};

export default FlamesForm;
