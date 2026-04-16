import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoveMatchForm from "../forms/LoveMatchForm";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import styles from "./LoveCalc.module.scss";

const STORAGE_KEY = "love_calculator";

const initialFormState = {
  name1: "",
  gender1: "",
  name2: "",
  gender2: "",
};

const LoveCalc = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useFormFromLocalStorage(
    STORAGE_KEY,
    initialFormState
  );

  const [errors, setErrors] = useState({});
  const [infoOpen, setInfoOpen] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setErrors({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.name1) newErrors.name1 = "Name is required";
    if (!formData.gender1) newErrors.gender1 = "Gender is required";
    if (!formData.name2) newErrors.name2 = "Partner name is required";
    if (!formData.gender2) newErrors.gender2 = "Gender is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    navigate("/love-calculator/report");
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Love Calculator</h1>
        <div className={styles.headingUnderline}>
          <div className={styles.dividerLine}>
            <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
              <line y1="0.5" x2="93" y2="0.5" stroke="#030303" />
            </svg>
          </div>
          <span className={styles.dividerMoon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
              <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
            </svg>
          </span>
          <div className={styles.dividerLine}>
            <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
              <line y1="0.5" x2="93" y2="0.5" stroke="#030303" />
            </svg>
          </div>
        </div>
        <p>Find Your Perfect Match and Discover True Love</p>
      </div>

      <div className={styles.infoCard}>
        <button
          type="button"
          className={styles.accordionHeader}
          onClick={() => setInfoOpen((prev) => !prev)}
          aria-expanded={infoOpen}
        >
          <span>What is Love Calculator ?</span>
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

        <div
          className={`${styles.accordionBody} ${infoOpen ? styles.accordionBodyOpen : ""}`}
        >
          <p>
            Have you ever thought if you and your crush are a perfect match? A love
            calculator is a fun and simple tool that tells you your love percentage
            and how well you both connect. Just enter names, birth dates, or even
            zodiac signs, and see the result! Finding love isn't always easy, but
            tools like the love calculator make it exciting. They help you understand
            your feelings and check your romantic compatibility. Many people use it
            for fun and to explore their bond before starting a relationship. Try it
            and see what your stars say!
          </p>
        </div>
      </div>

      <LoveMatchForm
        submitText="Calculate Love %"
        formData={formData}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />
    </div>
  );
};

export default LoveCalc;
