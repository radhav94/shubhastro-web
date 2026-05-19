import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { TODAY } from "../../../../utils/dateFormat/date";
import { useGetAllKundlisQuery } from "../../../../services/appServices/kundliServicesNew";
import styles from "../flames/FlamesCalc.module.scss";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";
import { ProfileManager } from "../../../../component/UI/Profile";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";

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
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    navigate("/destiny-number-calculator/report");
  };

  return (
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
        <div className={styles.resetRow}>
          <button type="button" className={styles.resetBtn} onClick={onReset}>Reset</button>
        </div>
        {/* <h3 className={styles.formTitle}>Enter Your Details</h3>

        {profiles.length > 0 && (
          <div className={styles.profileSelector}>
            <label>Quick Fill from Profile</label>
            <div className={styles.profileChips}>
              {profiles.map((p) => (
                <button key={p._id} type="button" className={`${styles.profileChip} ${formData.name === p.name ? styles.activeChip : ""}`} onClick={() => handleProfileSelect(p._id)}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )} */}

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
            maxDate={new Date()}
            placeholder="DD/MM/YYYY"
          />
          {errors.dob && <p className={styles.err}>{errors.dob}</p>}
        </div>

        <button type="submit" className={styles.submitBtn}>Calculate Destiny Number</button>
      </form>

      <ProfileManager
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileSelect={handleProfileSelect}
        title="Select Profile"
        enabledOperations={{ list: true, add: true, edit: true, delete: true }}
      />
    </div>
  );
};

export default DestinyCalc;
