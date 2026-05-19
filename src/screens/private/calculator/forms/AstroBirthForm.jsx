import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { TODAY } from "../../../../utils/dateFormat/date";
import LocationSearch from "../../../../utils/location/locationSearchVedic";
import styles from "./AstroBirthForm.module.scss";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";
import { ProfileManager } from "../../../../component/UI/Profile";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";

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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dispatch = useDispatch();
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  // Pre-fill from Redux selectedKundli on mount or when it changes
  useEffect(() => {
    if (selectedKundli) {
      fillFromProfile(selectedKundli);
    }
  }, [selectedKundli]);

  const fillFromProfile = (profile) => {
    if (!profile) return;
    onChange("name", profile.name || "");
    const g = (profile.gender || profile.identity || "").toLowerCase();
    if (g === "male" || g === "female") onChange("gender", g);
    if (profile.year && profile.month && profile.day) {
      onChange("dob", `${profile.year}-${String(profile.month).padStart(2, "0")}-${String(profile.day).padStart(2, "0")}`);
    }
    if (profile.hour != null && profile.min != null) {
      onChange("tob", `${String(profile.hour).padStart(2, "0")}:${String(profile.min).padStart(2, "0")}`);
      onChange("isTimeUnknown", false);
    }
    if (profile.place) onChange("place", profile.place);
    if (profile.lat) onChange("lat", profile.lat);
    if (profile.lon || profile.lng) onChange("lng", profile.lon || profile.lng);
  };

  const handleProfileSelect = (profile) => {
    if (!profile) return;
    fillFromProfile(profile);
    dispatch(setSelectedKundli(profile));
    setShowProfileModal(false);
  };

  return (
    <>
      <form className={styles.astroForm} onSubmit={onSubmit}>
        {onReset && (
          <div className={styles.resetRow}>
            <button type="button" className={styles.resetBtn} onClick={onReset}>
              Reset
            </button>
          </div>
        )}
        <h3 className={styles.formTitle}>{title}</h3>

        <div className={styles.formGrid}>
          {/* Name */}
          <div className={styles.formGroup}>
            <label>
              Your Name <span className={styles.required}>*</span>
            </label>
            <input
              name="name"
              value={name}
              placeholder="E.g. John Doe"
              onChange={(e) => onChange("name", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
            />
            {errors?.name && <p className={styles.error}>{errors.name}</p>}

            {/* Mobile only: Select Profile below name */}
            <button
              type="button"
              className={styles.selectProfileBtnMobile}
              onClick={() => setShowProfileModal(true)}
            >
              Select Profile +
            </button>
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
              <option value="">--Select--</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors?.gender && <p className={styles.error}>{errors.gender}</p>}
          </div>
        </div>

        {/* Desktop only: Select Profile in original position */}
        <button
          type="button"
          className={styles.selectProfileBtn}
          onClick={() => setShowProfileModal(true)}
        >
          Select Profile +
        </button>

        <div className={styles.formGrid}>
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
            />
            {errors?.dob && <p className={styles.error}>{errors.dob}</p>}
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
        </div>

        {/* TOB */}
        <div className={styles.formGroup}>
          <label>
            Birth Time <span className={styles.required}>*</span>
          </label>
          {!isTimeUnknown && (
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
          )}
          {errors?.tob && <p className={styles.error}>{errors.tob}</p>}
        </div>

        <div className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={isTimeUnknown}
            onChange={(e) => onChange("isTimeUnknown", e.target.checked)}
          />
          <span>Don&apos;t know the exact time of birth</span>
        </div>

        <button type="submit" className={styles.submitBtn}>
          {submitText}
        </button>
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

export default AstroBirthForm;
