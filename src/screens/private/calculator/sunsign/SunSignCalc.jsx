import { useState } from "react";
import AstroBirthForm from "../forms/AstroBirthForm";
import { useNavigate } from "react-router-dom";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import styles from "./SunSignCalc.module.scss";

const STORAGE_KEY = "sun_sign";

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

const SunSignCalc = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useFormFromLocalStorage(
    STORAGE_KEY,
    initialFormState
  );

  const [errors, setErrors] = useState({});

  const handleChange = (key, value) => {
    setFormData((prev) => {
      if (key === "isTimeUnknown" && value === true) {
        return {
          ...prev,
          isTimeUnknown: true,
        };
      }

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
    navigate("/sun-sign-calculator/report");
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Sun Sign Calculator</h1>
        <p>Find Your Zodiac Sign by Date of Birth</p>
      </div>

      <div className={styles.infoCard}>
        <h3>What is Sun Sign?</h3>
        <p>
          Your date of birth isn't just a day for celebrations; it holds more
          meaning than you can even think of! Want to know which zodiac sign truly
          represents you? Our Sun Sign Calculator makes it easy—just enter your
          birth date, and you'll instantly discover your sun sign. Whether you're
          a fiery Aries or a grounded Taurus, this tool gives you accurate results
          based on your unique birthday.
        </p>
      </div>

      <AstroBirthForm
        title="Find Your Sun Sign"
        submitText="Find your sun sign"
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

export default SunSignCalc;
