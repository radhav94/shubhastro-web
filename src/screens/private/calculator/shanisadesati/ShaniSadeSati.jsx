import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import LocationSearch from "../../../../utils/location/locationSearchVedic";
import { TODAY } from "../../../../utils/dateFormat/date";
import { useGetAllKundlisQuery } from "../../../../services/appServices/kundliServicesNew";
import styles from "../mangaldosha/MangalDosha.module.scss";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";

const STORAGE_KEY = "shani_sade_sati";
const initialFormState = {
  name: "",
  gender: "",
  dob: "",
  tob: "",
  place: "",
  lat: null,
  lng: null,
  isTimeUnknown: false,
};

const ShaniSadeSati = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useFormFromLocalStorage(STORAGE_KEY, initialFormState);
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem("shubhtalk_customer_token");
  const { data: kundliData } = useGetAllKundlisQuery(undefined, { skip: !token });
  const profiles = kundliData?.data || [];

  const handleProfileSelect = (profileId) => {
    const profile = profiles.find((p) => p._id === profileId);
    if (!profile) return;
    const dob = `${profile.year}-${String(profile.month).padStart(2, "0")}-${String(profile.day).padStart(2, "0")}`;
    const tob = `${String(profile.hour).padStart(2, "0")}:${String(profile.min).padStart(2, "0")}`;
    setFormData({
      name: profile.name || "",
      gender: profile.gender || "",
      dob, tob,
      place: profile.place || "",
      lat: profile.lat || null,
      lng: profile.lon || null,
      isTimeUnknown: false,
    });
    setErrors({});
  };

  const handleChange = (key, value) => {
    setFormData((prev) => {
      if (key === "isTimeUnknown" && value === true) return { ...prev, isTimeUnknown: true };
      return { ...prev, [key]: value };
    });
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const onReset = () => {
    setFormData(initialFormState);
    setErrors({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (!formData.place) newErrors.place = "Place of birth is required";
    if (!formData.isTimeUnknown && !formData.tob) newErrors.tob = "Time of birth is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    const payload = { ...formData, tob: formData.isTimeUnknown ? "12:00" : formData.tob };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    navigate("/shani-sade-sati-calculator/report");
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Shani Sade Sati Calculator</h1>
        <p>Saturn's 7.5 year influence on your life</p>
      </div>

      <div className={styles.infoCard}>
        <h3>What is Shani Sade Sati?</h3>
        <p>
          Sade Sati is a 7.5-year period where Saturn transits through your moon sign
          and its neighboring signs. It can bring deep lessons, delays, and emotional
          growth. Check your exact dates to navigate this period with clarity.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.resetRow}>
          <button type="button" className={styles.resetBtn} onClick={onReset}>Reset</button>
        </div>
        {/* <h3 className={styles.formTitle}>Enter Your Birth Details</h3>

        {profiles.length > 0 && (
          <div className={styles.profileSelector}>
            <label>Quick Fill from Profile</label>
            <div className={styles.profileChips}>
              {profiles.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  className={`${styles.profileChip} ${formData.name === p.name ? styles.activeChip : ""}`}
                  onClick={() => handleProfileSelect(p._id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )} */}

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Full Name <span>*</span></label>
            <input placeholder="Enter your name" value={formData.name} onChange={(e) => handleChange("name", e.target.value.replace(/[^a-zA-Z\s]/g, ""))} />
            {errors.name && <p className={styles.err}>{errors.name}</p>}
          </div>
          <div className={styles.field}>
            <label>Gender <span>*</span></label>
            <select value={formData.gender} onChange={(e) => handleChange("gender", e.target.value)}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.gender && <p className={styles.err}>{errors.gender}</p>}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Date of Birth <span>*</span></label>
            {/* <input type="date" value={formData.dob} max={TODAY} onChange={(e) => handleChange("dob", e.target.value)} onClick={(e) => e.target.showPicker?.()} /> */}
            <DateTimePicker
              mode="date"
              selected={formData.dob ? new Date(formData.dob) : null}
              onChange={(date) => {
                if (date) {
                  const yyyy = date.getFullYear();
                  const mm = String(date.getMonth() + 1).padStart(2, "0");
                  const dd = String(date.getDate()).padStart(2, "0");
                  handleChange("dob", `${yyyy}-${mm}-${dd}`);
                } else {
                  handleChange("dob", "");
                }
              }}
              maxDate={new Date()}
              placeholder="DD/MM/YYYY"
            />
            {errors.dob && <p className={styles.err}>{errors.dob}</p>}
          </div>
          <div className={styles.field}>
            <div className={styles.tobLabelRow}>
              <label>Time of Birth <span>*</span></label>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={formData.isTimeUnknown} onChange={(e) => handleChange("isTimeUnknown", e.target.checked)} />
                I don't know
              </label>
            </div>
            {/* <input type="time" value={formData.isTimeUnknown ? "" : formData.tob} onChange={(e) => handleChange("tob", e.target.value)} onClick={(e) => e.target.showPicker?.()} disabled={formData.isTimeUnknown} style={formData.isTimeUnknown ? { opacity: 0.4, cursor: "not-allowed" } : {}} /> */}
            <DateTimePicker
              mode="time"
              selected={!formData.isTimeUnknown && formData.tob ? (() => { const [h, m] = formData.tob.split(":"); const d = new Date(); d.setHours(h, m, 0, 0); return d; })() : null}
              onChange={(date) => {
                if (date) {
                  const hh = String(date.getHours()).padStart(2, "0");
                  const mm = String(date.getMinutes()).padStart(2, "0");
                  handleChange("tob", `${hh}:${mm}`);
                } else {
                  handleChange("tob", "");
                }
              }}
              placeholder="Select time"
              disabled={formData.isTimeUnknown}
            />
            {errors.tob && <p className={styles.err}>{errors.tob}</p>}
          </div>
        </div>

        <div className={styles.field}>
          <label>Place of Birth <span>*</span></label>
          <LocationSearch
            value={formData.place}
            onChange={(e) => handleChange("place", e.target.value)}
            onPlaceSelect={(loc) => { handleChange("place", loc.address); handleChange("lat", loc.lat); handleChange("lng", loc.lng); }}
          />
          {errors.place && <p className={styles.err}>{errors.place}</p>}
        </div>

        <button type="submit" className={styles.submitBtn}>
          Check Shani Sade Sati
        </button>
      </form>
    </div>
  );
};

export default ShaniSadeSati;
