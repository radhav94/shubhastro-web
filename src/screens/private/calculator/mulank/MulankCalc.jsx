import { useState, useEffect } from "react";
import { trackEvent } from "../../../../utils/analytics";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import styles from "./MulankCalc.module.scss";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";
import { ProfileManager } from "../../../../component/UI/Profile";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import BackButton from "../../../../component/UI/BackButton/BackButton";

const STORAGE_KEY = "mulank_calc";
const initialFormState = { name: "", dob: "" };

const MulankCalc = () => {
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
      setFormData({ name: selectedKundli.name || "", dob });
    }
  }, [selectedKundli]);

  const handleProfileSelect = (profile) => {
    if (!profile) return;
    const dob = `${profile.year}-${String(profile.month).padStart(2, "0")}-${String(profile.day).padStart(2, "0")}`;
    setFormData({ name: profile.name || "", dob });
    setErrors({});
    dispatch(setSelectedKundli(profile));
    setShowProfileModal(false);
  };

  const onReset = () => {
    setFormData(initialFormState);
    setErrors({});
    dispatch(setCalculatorData({ key: STORAGE_KEY, data: null }));
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    trackEvent("calculator_used", { calculator_name: "Mulank" });
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    dispatch(setCalculatorData({ key: STORAGE_KEY, data: formData }));
    navigate("/mulank-calculator/report");
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
        <div className={styles.hero}>
          <h1>Mulank Calculator</h1>
          <p>Discover your root number and its cosmic significance</p>
        </div>

        <div className={styles.infoCard}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() => setInfoOpen((prev) => !prev)}
            aria-expanded={infoOpen}
          >
            <span>What is Mulank?</span>
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
              A Mulank calculator is a simple tool that finds your personal life number using your birth date. This number comes from ancient numerology and helps explain your nature, career path, and how you connect with people. It&apos;s closely tied to your Numerology number, which forms the root of many systems like the Life Path Number and Personality Number. Many people use a Mulank calculator to understand patterns in their lives.
            </p>
            <p>
              Your Mulank number is like a personal helper — it shows your strengths and areas where you may face challenges. Knowing this number helps you make smarter life choices. Thanks to this easy tool, anyone can explore the secrets of numerology and learn more about themselves in a fun and helpful way.
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

export default MulankCalc;
