import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import styles from "./FlamesCalc.module.scss";

const STORAGE_KEY = "flames_calculator";
const initialFormState = { name1: "", name2: "" };

const FlamesCalc = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useFormFromLocalStorage(STORAGE_KEY, initialFormState);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name1) newErrors.name1 = "Your name is required";
    if (!formData.name2) newErrors.name2 = "Partner's name is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    navigate("/flames-calculator/report");
  };

  return (
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
          <input placeholder="Enter your name" value={formData.name1} onChange={(e) => handleChange("name1", e.target.value)} />
          {errors.name1 && <p className={styles.err}>{errors.name1}</p>}
        </div>

        <div className={styles.field}>
          <label>Partner's Name <span>*</span></label>
          <input placeholder="Enter partner's name" value={formData.name2} onChange={(e) => handleChange("name2", e.target.value)} />
          {errors.name2 && <p className={styles.err}>{errors.name2}</p>}
        </div>

        <button type="submit" className={styles.submitBtn}>Check FLAMES</button>
      </form>
    </div>
  );
};

export default FlamesCalc;
