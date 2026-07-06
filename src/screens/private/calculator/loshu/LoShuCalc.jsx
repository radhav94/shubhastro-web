import { useState, useEffect } from "react";
import { trackEvent } from "../../../../utils/analytics";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import styles from "./LoShuCalc.module.scss";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";
import { ProfileManager } from "../../../../component/UI/Profile";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import BackButton from "../../../../component/UI/BackButton/BackButton";

const STORAGE_KEY = "loshu_grid_calc";
const initialFormState = { dob: "" };

const LoShuCalc = () => {
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
      setFormData({ dob });
    }
  }, [selectedKundli]);

  const handleProfileSelect = (profile) => {
    if (!profile) return;
    const dob = `${profile.year}-${String(profile.month).padStart(2, "0")}-${String(profile.day).padStart(2, "0")}`;
    setFormData({ dob });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    trackEvent("calculator_used", { calculator_name: "Lo Shu Grid" });
    const newErrors = {};
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    dispatch(setCalculatorData({ key: STORAGE_KEY, data: formData }));
    navigate("/lo-shu-grid-calculator/report");
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
        <div className={styles.hero}>
          <h1>Lo Shu Grid Calculator</h1>
          <p>Unlock the ancient magic square from your date of birth</p>
        </div>

        <div className={styles.infoCard}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() => setInfoOpen((prev) => !prev)}
            aria-expanded={infoOpen}
          >
            <span>What is Lo Shu Grid?</span>
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
              Have you ever felt like you&apos;re doing everything right, yet life just isn&apos;t going your way? Like someone else seems to have all the luck, while you&apos;re stuck hustling with half the results? That&apos;s exactly where a Lo Shu Grid Calculator can help. It&apos;s not just some ancient theory, it&apos;s a practical tool that decodes your birth date to reveal hidden patterns affecting your personality, career, and life path.
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
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
            <button type="button" className={styles.selectProfileBtn} onClick={() => setShowProfileModal(true)}>
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

export default LoShuCalc;
