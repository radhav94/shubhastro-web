import { useState, useEffect } from "react";
import { trackEvent } from "../../../../utils/analytics";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { validatePersonName } from "../../../../utils/regex";
import { TODAY } from "../../../../utils/dateFormat/date";
import { useGetAllKundlisQuery } from "../../../../services/appServices/kundliServicesNew";
import styles from "../flames/FlamesCalc.module.scss";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";
import { ProfileManager } from "../../../../component/UI/Profile";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import BackButton from "../../../../component/UI/BackButton/BackButton";

const STORAGE_KEY = "destiny_calc";
const initialFormState = { name: "", dob: "" };

const DestinyCalc = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useFormFromLocalStorage(STORAGE_KEY, initialFormState);
  const [errors, setErrors] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  useEffect(() => {
    if (selectedKundli) {
      const dob = `${selectedKundli.year}-${String(selectedKundli.month).padStart(2, "0")}-${String(selectedKundli.day).padStart(2, "0")}`;
      setFormData({ name: selectedKundli.name || "", dob });
    }
  }, [selectedKundli]);

  const token = localStorage.getItem("shubhtalk_customer_token");
  const { data: kundliData } = useGetAllKundlisQuery(undefined, { skip: !token });
  const profiles = kundliData?.data || [];

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
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  useEffect(() => {
    trackEvent("calculator_opened", { calculator_name: "Destiny Number" });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    trackEvent("calculator_used", { calculator_name: "Destiny Number" });
    const newErrors = {};
    const nameErr = validatePersonName(formData.name);
    if (nameErr) newErrors.name = nameErr;
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    dispatch(setCalculatorData({ key: STORAGE_KEY, data: formData }));
    navigate("/destiny-number-calculator/report");
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Destiny Number Calculator</h1>
        <p>Discover your life's purpose through numerology</p>
      </div>

      <div className={styles.infoCard}>
        <h3>What is a Destiny Number?</h3>
        <p>
          Your destiny number reveals your life purpose, natural talents, and spiritual path.
          It's calculated from your full birth name and shows patterns that explain why
          certain things keep happening in your life.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label>Full Name <span>*</span></label>
          <input placeholder="Enter your full name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} />
          {errors.name && <p className={styles.err}>{errors.name}</p>}
          <button type="button" className={styles.selectProfileBtn} onClick={() => setShowProfileModal(true)}>
            Select Profile +
          </button>
        </div>

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

export default DestinyCalc;
