import { useState, useEffect } from "react";
import { trackEvent } from "../../../../utils/analytics";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { validatePersonName } from "../../../../utils/regex";
import styles from "./LuckyNameCalc.module.scss";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";
import { ProfileManager } from "../../../../component/UI/Profile";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import BackButton from "../../../../component/UI/BackButton/BackButton";

const STORAGE_KEY = "lucky_name_calc";
const initialFormState = { name: "", dob: "", system: "chaldean" };

const SYSTEMS = [
  { value: "chaldean", label: "Chaldean" },
  { value: "pythagorean", label: "Pythagorean" },
  { value: "cheiro", label: "Cheiro" },
];

const LuckyNameCalc = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useFormFromLocalStorage(STORAGE_KEY, initialFormState);
  const [errors, setErrors] = useState({});
  const [infoOpen, setInfoOpen] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  useEffect(() => {
    if (selectedKundli) {
      const dob = `${selectedKundli.year}-${String(selectedKundli.month).padStart(2, "0")}-${String(selectedKundli.day).padStart(2, "0")}`;
      setFormData((prev) => ({ ...prev, name: selectedKundli.name || "", dob }));
    }
  }, [selectedKundli]);

  const handleProfileSelect = (profile) => {
    if (!profile) return;
    const dob = `${profile.year}-${String(profile.month).padStart(2, "0")}-${String(profile.day).padStart(2, "0")}`;
    setFormData((prev) => ({ ...prev, name: profile.name || "", dob }));
    setErrors({});
    dispatch(setSelectedKundli(profile));
    setShowProfileModal(false);
  };

  const onReset = () => {
    setFormData(initialFormState);
    setErrors({});
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  useEffect(() => {
    trackEvent("calculator_opened", { calculator_name: "Lucky Name" });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    trackEvent("calculator_used", { calculator_name: "Lucky Name" });
    const newErrors = {};
    const nameErr = validatePersonName(formData.name);
    if (nameErr) newErrors.name = nameErr;
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (!formData.system) newErrors.system = "Please select a system";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    dispatch(setCalculatorData({ key: STORAGE_KEY, data: formData }));
    navigate("/lucky-name-numerology-calculator/report");
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
        <div className={styles.hero}>
          <h1>Lucky Name Numerology</h1>
          <p>Check how your name harmonizes with your birth numbers</p>
        </div>

        <div className={styles.infoCard}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() => setInfoOpen((prev) => !prev)}
            aria-expanded={infoOpen}
          >
            <span>What is Lucky Name Numerology?</span>
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
              A lucky name numerology calculator helps you find the best name for a happy, successful, and peaceful life. Many use a lucky number calculator or name number reading alongside a numerology calculator for a complete numerology system check. It works by checking the numbers linked to your name to see if they match your destiny. When your name has the right number vibration, it can bring more luck, better job chances, stronger relationships, and an overall better life.
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Full Name <span>*</span></label>
            <input
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
            />
            {errors.name && <p className={styles.err}>{errors.name}</p>}
            <button type="button" className={styles.selectProfileBtn} onClick={() => setShowProfileModal(true)}>
              Select Profile +
            </button>
          </div>

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
            <label>Numerology System <span>*</span></label>
            <select
              value={formData.system}
              onChange={(e) => handleChange("system", e.target.value)}
            >
              {SYSTEMS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {errors.system && <p className={styles.err}>{errors.system}</p>}
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

export default LuckyNameCalc;
