import { useState, useEffect } from "react";
import { trackEvent } from "../../../../utils/analytics";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import LoveMatchForm from "../forms/LoveMatchForm";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { validatePersonName } from "../../../../utils/regex";
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
    setErrors((prev) => {
      if (!prev[field] && !prev.form) return prev;
      const updated = { ...prev };
      delete updated[field];
      // The pair error belongs to gender1 and gender2 together, so changing
      // either one has to clear it — keyed on a single field it would stay on
      // screen after the user had already fixed it.
      if (field === "gender1" || field === "gender2") delete updated.form;
      return updated;
    });
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setErrors({});
  };

  useEffect(() => {
    trackEvent("calculator_opened", { calculator_name: "Love Compatibility" });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    trackEvent("calculator_used", { calculator_name: "Love Compatibility" });

    const newErrors = {};
    const name1Err = validatePersonName(formData.name1);
    if (name1Err) newErrors.name1 = name1Err;
    if (!formData.gender1) newErrors.gender1 = "Gender is required";
    const name2Err = validatePersonName(formData.name2, { requiredError: "Partner name is required" });
    if (name2Err) newErrors.name2 = name2Err;
    if (!formData.gender2) newErrors.gender2 = "Gender is required";

    // The backend rejects a same-gender pair outright with a 400, so there is
    // no report to render. Navigating anyway landed the user on the report
    // route's bare "No data found" — a dead end, several seconds after the
    // mistake, with nothing to go back and fix. Same rule and same wording,
    // enforced here before we leave the form.
    if (
      formData.gender1 &&
      formData.gender2 &&
      formData.gender1 === formData.gender2
    ) {
      newErrors.form =
        "Please select one male and one female partner to calculate love compatibility.";
    }

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
