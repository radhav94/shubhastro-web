import { useState } from "react";
import { trackEvent } from "../../../../utils/analytics";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import LoveMatchForm from "../forms/LoveMatchForm";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import styles from "./LoveCalc.module.scss";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import BackButton from "../../../../component/UI/BackButton/BackButton";

const STORAGE_KEY = "love_calculator";

const initialFormState = {
  name1: "",
  gender1: "",
  name2: "",
  gender2: "",
};

const LoveCalc = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useFormFromLocalStorage(
    STORAGE_KEY,
    initialFormState
  );

  const [errors, setErrors] = useState({});
  const [infoOpen, setInfoOpen] = useState(true);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    trackEvent("calculator_used", { calculator_name: "Love Compatibility" });

    const newErrors = {};
    if (!formData.name1) newErrors.name1 = "Name is required";
    if (!formData.gender1) newErrors.gender1 = "Gender is required";
    if (!formData.name2) newErrors.name2 = "Partner name is required";
    if (!formData.gender2) newErrors.gender2 = "Gender is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    dispatch(setCalculatorData({ key: STORAGE_KEY, data: formData }));
    navigate("/love-calculator/report");
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Love Calculator</h1>
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
            and how well you both connect. Just enter names, birth dates and see the result! Finding love isn't always easy, but
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
    </>
  );
};

export default LoveCalc;
