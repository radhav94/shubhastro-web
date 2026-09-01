import { useState, useEffect } from "react";
import { trackEvent } from "../../../../utils/analytics";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import LocationSearch from "../../../../utils/location/locationSearchVedic";
import {
  clearedPlaceCoords,
  validateBirthPlace,
} from "../../../../utils/helper/birthPlaceCoords";
import { TODAY } from "../../../../utils/dateFormat/date";
import { useGetAllKundlisQuery } from "../../../../services/appServices/kundliServicesNew";
import styles from "../mangaldosha/MangalDosha.module.scss";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";
import { ProfileManager } from "../../../../component/UI/Profile";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import BackButton from "../../../../component/UI/BackButton/BackButton";

const STORAGE_KEY = "birth_natal_calc";
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

const BirthCalc = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useFormFromLocalStorage(STORAGE_KEY, initialFormState);
  const [errors, setErrors] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  useEffect(() => {
    if (localStorage.getItem("shubhtalk_customer_token") && selectedKundli) {
      fillFromProfile(selectedKundli);
    }
  }, [selectedKundli]);

  const fillFromProfile = (profile) => {
    if (!profile) return;
    const dob = `${profile.year}-${String(profile.month).padStart(2, "0")}-${String(profile.day).padStart(2, "0")}`;
    const tob = `${String(profile.hour).padStart(2, "0")}:${String(profile.min).padStart(2, "0")}`;
    // `lon` is the saved-profile field name, `lng` is what LocationSearch emits;
    // profiles can arrive with either, and now that submit requires coordinates
    // reading only one of them would block a valid selected profile.
    setFormData({ name: profile.name || "", gender: (profile.gender || profile.identity || "").toLowerCase() || "", dob, tob, place: profile.place || "", lat: profile.lat || null, lng: profile.lon || profile.lng || null, isTimeUnknown: false });
    setErrors({});
  };

  const token = localStorage.getItem("shubhtalk_customer_token");
  const { data: kundliData } = useGetAllKundlisQuery(undefined, { skip: !token });
  const profiles = kundliData?.data || [];

  const handleProfileSelect = (profile) => {
    if (!profile) return;
    fillFromProfile(profile);
    dispatch(setSelectedKundli(profile));
    setShowProfileModal(false);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => {
      if (key === "isTimeUnknown" && value === true) return { ...prev, isTimeUnknown: true };
      return { ...prev, [key]: value };
    });
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  /*
    Typing clears the coordinates.

    Only onPlaceSelect sets lat/lng, so editing a picked place kept the old
    city's coordinates and the chart was cast for the wrong place under the
    right name. See birthPlaceCoords.js.
  */
  const handlePlaceChange = (value) => {
    setFormData((prev) => ({ ...prev, ...clearedPlaceCoords(value) }));
    setErrors((prev) => ({ ...prev, place: "" }));
  };

  const onReset = () => {
    setFormData(initialFormState);
    setErrors({});
  };

  useEffect(() => {
    trackEvent("calculator_opened", { calculator_name: "Birth Details" });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    trackEvent("calculator_used", { calculator_name: "Birth Details" });
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    // Checks the coordinates, not just the text: a hand-typed place that was
    // never picked from the dropdown used to submit with lat: null.
    const placeError = validateBirthPlace(formData.place, formData.lat, formData.lng);
    if (placeError) newErrors.place = placeError;
    if (!formData.isTimeUnknown && !formData.tob) newErrors.tob = "Time of birth is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    const payload = { ...formData, tob: formData.isTimeUnknown ? "12:00" : formData.tob };
    dispatch(setCalculatorData({ key: STORAGE_KEY, data: payload }));
    navigate("/birth-natal-chart-calculator/report");
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Birth / Natal Chart Calculator</h1>
        <p>Discover your life's path through the stars</p>
      </div>

      <div className={styles.infoCard}>
        <h3>What is a Birth Chart?</h3>
        <p>
          A birth chart is a snapshot of the sky at the exact moment you were born.
          It reveals your personality, strengths, challenges, and life purpose based
          on planetary positions. Unlock the deeper truth written in your stars.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Full Name <span>*</span></label>
            <input placeholder="Enter your name" value={formData.name} onChange={(e) => handleChange("name", e.target.value.replace(/[^a-zA-Z\s]/g, ""))} />
            {errors.name && <p className={styles.err}>{errors.name}</p>}
            <button type="button" className={styles.selectProfileBtnMobile} onClick={() => setShowProfileModal(true)}>
              Select Profile +
            </button>
            <button type="button" className={styles.selectProfileBtn} onClick={() => setShowProfileModal(true)}>
              Select Profile +
            </button>
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
              placeholder="DD/MM/YYYY"
            />
            {errors.dob && <p className={styles.err}>{errors.dob}</p>}
          </div>
          <div className={styles.field}>
            <label>Place of Birth <span>*</span></label>
            <LocationSearch value={formData.place} onChange={(e) => handlePlaceChange(e.target.value)} onPlaceSelect={(loc) => { handleChange("place", loc.address); handleChange("lat", loc.lat); handleChange("lng", loc.lng); }} />
            {errors.place && <p className={styles.err}>{errors.place}</p>}
          </div>
        </div>

        <div className={`${styles.field} ${styles.halfField}`}>
          <label>Birth Time <span>*</span></label>
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
          <label className={styles.checkLabel} style={{ marginTop: "8px" }}>
            <input type="checkbox" checked={formData.isTimeUnknown} onChange={(e) => handleChange("isTimeUnknown", e.target.checked)} />
            Don&apos;t know the exact time of birth
          </label>
        </div>

        <div className={styles.btnRow}>
          <button type="button" className={styles.resetBtn} onClick={onReset}>Reset</button>
          <button type="submit" className={styles.submitBtn}>Show Results</button>
        </div>
      </form>

      <ProfileManager
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileSelect={handleProfileSelect}
        title="Select Profile"
        enabledOperations={{ list: true, add: true, edit: true, delete: true }}
      />
    </div>
    </>
  );
};

export default BirthCalc;
