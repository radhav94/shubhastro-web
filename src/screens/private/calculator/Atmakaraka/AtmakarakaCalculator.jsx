import { useState } from "react";
import AstroBirthForm from "../forms/AstroBirthForm";
import { useNavigate } from "react-router-dom";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import styles from "./AtmakarakaCalculator.module.scss";

const STORAGE_KEY = "atmakaraka-and-darakaraka";

const initialFormState = {
  name: "",
  gender: "",
  dob: "",
  tob: "",
  place: "",
  lat: null,
  lng: null,
  isTimeUnknown: false,
};

const AtmakarakaCalculator = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useFormFromLocalStorage(
    STORAGE_KEY,
    initialFormState
  );

  const [errors, setErrors] = useState({});

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (!formData.place) newErrors.place = "Place of birth is required";

    if (!formData.isTimeUnknown && !formData.tob) {
      newErrors.tob = "Time of birth is required or select unknown";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      ...formData,
      tob: formData.isTimeUnknown ? "12:00" : formData.tob,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    navigate("/atmakaraka-and-darakaraka-calculator/report");
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Atmakaraka and Darakaraka Calculator</h1>
        <p>Guide to Your Soul and Life Partner</p>
      </div>

      <div className={styles.infoCard}>
        <h3>What is Atmakaraka and Darakaraka?</h3>
        <p>
          Discover your soul planet (Atmakaraka) and life partner indicator
          (Darakaraka) using Vedic astrology.
        </p>
      </div>

      <AstroBirthForm
        title="Calculate your Atmakaraka & Darakaraka here"
        submitText="Calculate my Atmakaraka and Darakaraka"
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

export default AtmakarakaCalculator;
