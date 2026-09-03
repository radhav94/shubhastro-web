import { useState, useEffect } from "react";
import { trackEvent } from "../../../../utils/analytics";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { validatePersonName } from "../../../../utils/regex";
import styles from "./NameCompatibilityCalc.module.scss";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";
import { ProfileManager } from "../../../../component/UI/Profile";
import BackButton from "../../../../component/UI/BackButton/BackButton";

const STORAGE_KEY = "name_compatibility_calc";

const initialFormState = {
  name1: "",
  name2: "",
};

const NameCompatibilityCalc = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useFormFromLocalStorage(STORAGE_KEY, initialFormState);
  const [errors, setErrors] = useState({});
  const [infoOpen, setInfoOpen] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setErrors({});
  };

  const handleProfileSelect = (profile) => {
    if (!profile) return;
    handleChange("name1", profile.name || "");
    dispatch(setSelectedKundli(profile));
    setShowProfileModal(false);
  };

  useEffect(() => {
    trackEvent("calculator_opened", { calculator_name: "Name Compatibility" });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    trackEvent("calculator_used", { calculator_name: "Name Compatibility" });
    const newErrors = {};
    const name1Err = validatePersonName(formData.name1, { requiredError: "Your name is required" });
    if (name1Err) newErrors.name1 = name1Err;
    const name2Err = validatePersonName(formData.name2, { requiredError: "Partner name is required" });
    if (name2Err) newErrors.name2 = name2Err;
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    dispatch(setCalculatorData({ key: STORAGE_KEY, data: formData }));
    navigate("/name-compatibility-calculator/report");
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
        <div className={styles.hero}>
          <h1>Compatibility Calculator</h1>
          <p>Discover how well your names align through Chaldean numerology</p>
        </div>

        <div className={styles.infoCard}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() => setInfoOpen((prev) => !prev)}
            aria-expanded={infoOpen}
          >
            <span>What is Name Compatibility?</span>
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
              Ever wondered why some couples just click, while others, no matter how hard they try, keep missing the mark? That’s where a Name Compatibility Calculator comes in. It’s not just some digital gimmick; it taps into the ancient science of numerology to decode the energy behind your name and your partner’s. Think of it as a guide to understanding the deeper currents in your relationship, what clicks, what clashes, and where you both can grow together.
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Your Name <span>*</span></label>
            <input
              placeholder="Enter your name"
              value={formData.name1}
              onChange={(e) => handleChange("name1", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
            />
            {errors.name1 && <p className={styles.err}>{errors.name1}</p>}
            <button type="button" className={styles.selectProfileBtn} onClick={() => setShowProfileModal(true)}>
              Select Profile +
            </button>
          </div>

          <div className={styles.field}>
            <label>Partner&apos;s Name <span>*</span></label>
            <input
              placeholder="Enter partner's name"
              value={formData.name2}
              onChange={(e) => handleChange("name2", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
            />
            {errors.name2 && <p className={styles.err}>{errors.name2}</p>}
          </div>

          <div className={styles.btnRow}>
            <button type="button" className={styles.resetBtn} onClick={handleReset}>Reset</button>
            <button type="submit" className={styles.submitBtn}>Check Compatibility</button>
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

export default NameCompatibilityCalc;
