import { useState } from "react";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { useNavigate } from "react-router-dom";
import DateWithSingleInputForm from "../forms/DateWithSingleInputForm";
import styles from "./AgeCalc.module.scss";

const STORAGE_KEY = "age_calculator";

const initialFormState = {
  dob: "",
  asOf: "",
};

const AgeCalc = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useFormFromLocalStorage(
    STORAGE_KEY,
    initialFormState
  );

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateAgeInput = ({ dob, asOf }) => {
    const errors = {};

    if (!dob) errors.dob = "Date of birth is required";
    if (!asOf) errors.asOf = "As of date is required";

    if (dob && asOf) {
      const dobDate = new Date(dob);
      const asOfDate = new Date(asOf);

      if (dobDate > asOfDate) {
        errors.asOf = "As of date must be after date of birth";
      }

      if (dobDate > new Date()) {
        errors.dob = "Date of birth cannot be in the future";
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      dob: formData.dob,
      asOf: formData.asOf,
    };

    const validationErrors = validateAgeInput(payload);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    navigate("/age-calculator/report");
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Age Calculator</h1>
        <p>Decode Your Life's Journey with Cosmic Insight</p>
      </div>

      <div className={styles.infoCard}>
        <h3>What is Age Calculator?</h3>
        <p>
          Have you ever paused for a moment and thought exactly how many days you
          have lived? Or maybe you're trying to figure out the exact age gap
          between you and your partner? From your exact age in years, months, and
          days, this simple tool can reveal more than you think.
        </p>
      </div>

      <DateWithSingleInputForm
        title="Calculate your Age here"
        submitText="Calculate my Age"
        inputLabel="Age As Of Date"
        inputPlaceholder=""
        inputName="asOf"
        inputType="date"
        formData={formData}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onReset={() => {
          setFormData(initialFormState);
          setErrors({});
          localStorage.removeItem(STORAGE_KEY);
        }}
      />
    </div>
  );
};

export default AgeCalc;
