import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import LocationSearch from "../../../../utils/location/locationSearchVedic";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";
import styles from "./AtmakarakaCalculator.module.scss";
import { ProfileManager } from "../../../../component/UI/Profile";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import BackButton from "../../../../component/UI/BackButton/BackButton";

const STORAGE_KEY = "atmakaraka-and-darakaraka";

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

const AtmakarakaCalculator = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useFormFromLocalStorage(
    STORAGE_KEY,
    initialFormState
  );

  const [errors, setErrors] = useState({});
  const [infoOpen, setInfoOpen] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dispatch = useDispatch();
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const fillFromProfile = (profile) => {
    if (!profile) return;
    handleChange("name", profile.name || "");
    const g = (profile.gender || profile.identity || "").toLowerCase();
    if (g === "male" || g === "female") handleChange("gender", g);
    if (profile.year && profile.month && profile.day) {
      handleChange("dob", `${profile.year}-${String(profile.month).padStart(2, "0")}-${String(profile.day).padStart(2, "0")}`);
    }
    if (profile.hour != null && profile.min != null) {
      handleChange("tob", `${String(profile.hour).padStart(2, "0")}:${String(profile.min).padStart(2, "0")}`);
      handleChange("isTimeUnknown", false);
    }
    if (profile.place) handleChange("place", profile.place);
    if (profile.lat) handleChange("lat", profile.lat);
    if (profile.lon || profile.lng) handleChange("lng", profile.lon || profile.lng);
  };

  useEffect(() => {
    if (selectedKundli) {
      fillFromProfile(selectedKundli);
    }
  }, [selectedKundli]);

  const handleProfileSelect = (profile) => {
    if (!profile) return;
    fillFromProfile(profile);
    dispatch(setSelectedKundli(profile));
    setShowProfileModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (!formData.place) newErrors.place = "Place of birth is required";

    if (!formData.isTimeUnknown && !formData.tob) {
      newErrors.tob = "Time of birth is required or select unknown";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      ...formData,
      tob: formData.isTimeUnknown ? "12:00" : formData.tob,
    };

    dispatch(setCalculatorData({ key: STORAGE_KEY, data: payload }));
    navigate("/atmakaraka-and-darakaraka-calculator/report");
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <h1>ATMAKARAKA AND DARAKARAKA CALCULATOR</h1>
        <p>Guide to Your Soul and Life Partner</p>
      </div>

      {/* Info Accordion */}
      <div className={styles.infoCard}>
        <button
          type="button"
          className={styles.accordionHeader}
          onClick={() => setInfoOpen((prev) => !prev)}
          aria-expanded={infoOpen}
        >
          <span>What is Atmakaraka and Darakaraka?</span>
          <svg
            className={`${styles.chevron} ${infoOpen ? styles.chevronOpen : ""}`}
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#e84d00"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div className={`${styles.accordionBody} ${infoOpen ? styles.accordionBodyOpen : ""}`}>
          <p>
            Discover your soul planet (Atmakaraka) and life partner indicator
            (Darakaraka) using Vedic astrology. Atmakaraka is the planet with the
            highest degree in your birth chart, representing your soul&apos;s desire.
            Darakaraka is the planet with the lowest degree, indicating the nature
            of your life partner.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form className={styles.formCard} onSubmit={handleSubmit}>
        <h3 className={styles.formTitle}>Fill the form to calculate</h3>

        <div className={styles.formGrid}>
          {/* Row 1: Name + Gender */}
          <div className={styles.formGroup}>
            <label>
              Your Name <span className={styles.required}>*</span>
            </label>
            <input
              name="name"
              value={formData.name}
              placeholder="E.g. John Doe"
              onChange={(e) => handleChange("name", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
            />
            {errors?.name && <p className={styles.error}>{errors.name}</p>}
            <button type="button" className={styles.selectProfileBtnMobile} onClick={() => setShowProfileModal(true)}>
              Select Profile +
            </button>
            <button type="button" className={styles.selectProfileBtn} onClick={() => setShowProfileModal(true)}>
              Select Profile +
            </button>
          </div>

          <div className={styles.formGroup}>
            <label>
              Gender <span className={styles.required}>*</span>
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
            >
              <option value="">--Select--</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors?.gender && <p className={styles.error}>{errors.gender}</p>}
          </div>
        </div>

        <div className={styles.formGrid}>
          {/* Row 2: Date of Birth + Place of birth */}
          <div className={styles.formGroup}>
            <label>
              Date of Birth <span className={styles.required}>*</span>
            </label>
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
            {errors?.dob && <p className={styles.error}>{errors.dob}</p>}
          </div>

          <div className={styles.formGroup}>
            <label>
              Place of birth <span className={styles.required}>*</span>
            </label>
            <LocationSearch
              value={formData.place}
              onChange={(e) => handleChange("place", e.target.value)}
              onPlaceSelect={(location) => {
                handleChange("place", location.address);
                handleChange("lat", location.lat);
                handleChange("lng", location.lng);
              }}
            />
            {errors?.place && <p className={styles.error}>{errors.place}</p>}
          </div>

          {/* Row 3: Birth Time */}
          <div className={styles.formGroup}>
            <label>
              Birth Time <span className={styles.required}>*</span>
            </label>
            {!formData.isTimeUnknown && (
              <DateTimePicker
                mode="time"
                selected={
                  formData.tob
                    ? (() => {
                        const [h, m] = formData.tob.split(":");
                        const d = new Date();
                        d.setHours(h, m, 0, 0);
                        return d;
                      })()
                    : null
                }
                onChange={(date) => {
                  if (date) {
                    const hh = String(date.getHours()).padStart(2, "0");
                    const mm = String(date.getMinutes()).padStart(2, "0");
                    handleChange("tob", `${hh}:${mm}`);
                  } else {
                    handleChange("tob", "");
                  }
                }}
                placeholder="12:00 AM"
              />
            )}
            {errors?.tob && <p className={styles.error}>{errors.tob}</p>}
          </div>
        </div>

        {/* Checkbox below grid */}
        <div className={styles.checkboxRow}>
          <input
            type="checkbox"
            id="timeUnknown"
            checked={formData.isTimeUnknown}
            onChange={(e) => handleChange("isTimeUnknown", e.target.checked)}
          />
          <label htmlFor="timeUnknown">
            Don&apos;t know the exact time of birth
          </label>
        </div>

        <div className={styles.btnRow}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => {
              setFormData(initialFormState);
              setErrors({});
            }}
          >
            Reset
          </button>
          <button type="submit" className={styles.submitBtn}>
            Show Results
          </button>
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

export default AtmakarakaCalculator;
