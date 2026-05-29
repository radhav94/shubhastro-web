import { useState } from "react";
import AstroBirthForm from "../forms/AstroBirthForm";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import styles from "./RisingSign.module.scss";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import BackButton from "../../../../component/UI/BackButton/BackButton";

const STORAGE_KEY = "rising_sign";
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

const RisingSign = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
    navigate("/rising-ascendant-sign-calculator/report");
    dispatch(setCalculatorData({ key: STORAGE_KEY, data: payload }));
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
      <div className={styles.hero}>
        <h1>The Complete Rising Sign Calculator</h1>
        <p>Discover Your True Self</p>
      </div>

      <div className={styles.infoCard}>
        <h3>What is Rising Sign?</h3>
        <p>
          Have you ever felt like people see a version of you that doesn't quite
          match how you see yourself? This rising sign calculator explains the
          reason for that! Your rising/ascendant sign is the zodiac sign that
          was rising on the eastern horizon at the time you were born.
        </p>
      </div>

      <AstroBirthForm
        title="Calculate your Rising/Ascendant Sign here"
        submitText="Show Results"
        formData={formData}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onReset={() => {
          setFormData(initialFormState);
          setErrors({});
          dispatch(setCalculatorData({ key: STORAGE_KEY, data: null }));
        }}
      />
    </div>
    </>
  );
};

export default RisingSign;
