import { TODAY } from "../../../../utils/dateFormat/date";
import LocationSearch from "../../../../utils/location/locationSearchVedic";
import styles from "./AstroBirthForm.module.scss";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";

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
          placeholder="Enter your name"
          onChange={(e) => onChange("name", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
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
        {/* <input type="date" value={dob} onChange={(e) => onChange("dob", e.target.value)} max={TODAY} onClick={(e) => e.target.showPicker?.()} /> */}
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
          <>
            {/* <input type="time" value={tob} onChange={(e) => onChange("tob", e.target.value)} onClick={(e) => e.target.showPicker?.()} /> */}
            <DateTimePicker
              mode="time"
              selected={tob ? (() => { const [h, m] = tob.split(":"); const d = new Date(); d.setHours(h, m, 0, 0); return d; })() : null}
              onChange={(date) => {
                if (date) {
                  const hh = String(date.getHours()).padStart(2, "0");
                  const mm = String(date.getMinutes()).padStart(2, "0");
                  onChange("tob", `${hh}:${mm}`);
                } else {
                  onChange("tob", "");
                }
              }}
              placeholder="Select time"
            />
          </>
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
