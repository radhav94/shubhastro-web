import { useState } from "react";
import AstroBirthForm from "../forms/AstroBirthForm";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import styles from "./DashaCalc.module.scss";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import BackButton from "../../../../component/UI/BackButton/BackButton";

const STORAGE_KEY = "dasha_calc";
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
const DashaCalc = () => {
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
    dispatch(setCalculatorData({ key: STORAGE_KEY, data: payload }));
    navigate("/dasha-calculator/report");
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Dasha Calculator</h1>
        <p>Making Sense of Your Life's Path</p>
      </div>

      <div className={styles.infoCard}>
        <h3>What is Dasha?</h3>
        <p>
          Ever had a phase in life where everything just clicked—a dream job, a
          happy relationship, maybe even unexpected success? And then suddenly,
          things slow down, plans stall, and you're left wondering, "What
          changed?" It's your Dasha period at work. A Dasha calculator will help
          you decode these shifts by revealing which planets are influencing your
          life at any given time.
        </p>
      </div>

      <AstroBirthForm
        title="Calculate Your Dasha here"
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

export default DashaCalc;
