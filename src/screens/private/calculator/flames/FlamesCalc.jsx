import { useState, useEffect } from "react";
import { trackEvent } from "../../../../utils/analytics";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import styles from "./FlamesCalc.module.scss";
import { ProfileManager } from "../../../../component/UI/Profile";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import BackButton from "../../../../component/UI/BackButton/BackButton";

const STORAGE_KEY = "flames_calculator";
const initialFormState = { name1: "", name2: "" };

const FlamesCalc = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useFormFromLocalStorage(STORAGE_KEY, initialFormState);
  const [errors, setErrors] = useState({});
  const [inputHints, setInputHints] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTarget, setProfileTarget] = useState(null);
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  useEffect(() => {
    if (selectedKundli) {
      handleChange("name1", selectedKundli.name || "");
    }
  }, [selectedKundli]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSelectProfileClick = (target) => {
    setProfileTarget(target);
    setShowProfileModal(true);
  };

  const handleProfileSelect = (profile) => {
    if (!profile) return;
    if (profileTarget === "person1") {
      handleChange("name1", profile.name || "");
      dispatch(setSelectedKundli(profile));
    } else if (profileTarget === "person2") {
      handleChange("name2", profile.name || "");
    }
    setShowProfileModal(false);
  };

  const onReset = () => {
    setFormData(initialFormState);
    setErrors({});
  };

  useEffect(() => {
    trackEvent("calculator_opened", { calculator_name: "Flames" });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    trackEvent("calculator_used", { calculator_name: "Flames" });
    const newErrors = {};
    if (!formData.name1) newErrors.name1 = "Your name is required";
    if (!formData.name2) newErrors.name2 = "Partner's name is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;
    dispatch(setCalculatorData({ key: STORAGE_KEY, data: formData }));
    navigate("/flames-calculator/report");
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
      <div className={styles.hero}>
        <h1>FLAMES Calculator</h1>
        <p>Discover the bond between you and your partner</p>
      </div>

      <div className={styles.infoCard}>
        <h3>What is FLAMES?</h3>
        <p>
          FLAMES stands for Friendship, Love, Affection, Marriage, Enemy, and Sisterhood.
          It's a fun way to explore the chemistry between two people using their names
          to reveal what kind of bond they might share.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <h3 className={styles.formTitle}>Enter Your Names</h3>

        <div className={styles.field}>
          <label>Your Name <span>*</span></label>
          <input placeholder="Enter your name" value={formData.name1} onChange={(e) => handleChange("name1", e.target.value.replace(/[^a-zA-Z\s]/g, ""))} />
          {errors.name1 && <p className={styles.err}>{errors.name1}</p>}
          <button type="button" className={styles.selectProfileBtn} onClick={() => handleSelectProfileClick("person1")}>
            Select Profile +
          </button>
        </div>

        <div className={styles.field}>
          <label>Partner's Name <span>*</span></label>
          <input placeholder="Enter partner's name" value={formData.name2} onChange={(e) => handleChange("name2", e.target.value.replace(/[^a-zA-Z\s]/g, ""))} />
          {errors.name2 && <p className={styles.err}>{errors.name2}</p>}
          <button type="button" className={styles.selectProfileBtn} onClick={() => handleSelectProfileClick("person2")}>
            Select Profile +
          </button>
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

export default FlamesCalc;
