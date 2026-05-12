import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NumerologyForm from "../forms/NumerologyForm";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import styles from "./NumerologyCalc.module.scss";

const STORAGE_KEY = "numerology_report";

const initialFormState = {
  name: "",
  dob: "",
  type: "",
};

const NumerologyCalc = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useFormFromLocalStorage(
    STORAGE_KEY,
    initialFormState
  );

  const [errors, setErrors] = useState({});

  const handleChange = (key, value) => {
    setFormData((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });

    // clear error on change
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      ...formData,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    navigate("/numerology-calculator/report");
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Name Numerology Calculator</h1>
        <p>Accurate Name Number Calculator Online</p>
      </div>

      <div className={styles.infoCard}>
        <h3>What is Name Numerology?</h3>
        <p>
          Want to uncover the powerful secrets about your personality and life
          path? ALL FROM YOUR NAME? There's a way! A numerology calculator can
          reveal hidden insights or the true face of your destiny that was created
          at the moment you were named and no, it's not about embarrassing
          nicknames. Understand yourself deeper and make wiser life choices.
        </p>
      </div>

      <NumerologyForm
        submitText="Submit"
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

export default NumerologyCalc;
