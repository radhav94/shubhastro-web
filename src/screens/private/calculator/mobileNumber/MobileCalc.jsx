import { useState } from "react";
import { trackEvent } from "../../../../utils/analytics";
import { useDispatch } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { useNavigate } from "react-router-dom";
import DateWithSingleInputForm from "../forms/DateWithSingleInputForm";
import styles from "./MobileCalc.module.scss";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import BackButton from "../../../../component/UI/BackButton/BackButton";

const STORAGE_KEY = "mobile_calculator";

const initialFormState = {
  dob: "",
  mobile: "",
};

const MobileCalc = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useFormFromLocalStorage(
    STORAGE_KEY,
    initialFormState
  );

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateMobileInput = ({ dob, mobile }) => {
    const errors = {};

    if (!dob) {
      errors.dob = "Date of birth is required";
    }

    if (!mobile) {
      errors.mobile = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(mobile)) {
      errors.mobile = "Mobile number must be 10 digits";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    trackEvent("calculator_used", { calculator_name: "Mobile Number" });

    const payload = {
      dob: formData.dob,
      mobile: formData.mobile,
    };

    const validationErrors = validateMobileInput(payload);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) return;

    dispatch(setCalculatorData({ key: STORAGE_KEY, data: payload }));
    navigate("/mobile-number-numerology-calculator/report");
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Lucky Mobile Number Calculator</h1>
        <p>Discover How Your Number Aligns with Your Energy</p>
      </div>

      <div className={styles.infoCard}>
        <h3>What is Lucky Mobile Number?</h3>
        <p>
          Your mobile number carries vibrations that influence your life. Discover
          how your date of birth aligns with your mobile number and what kind of
          energy it brings into your daily routine.
        </p>
      </div>

      <DateWithSingleInputForm
        title="Calculate your Lucky Mobile Number here"
        submitText="Show Results"
        inputLabel="Mobile Number"
        inputPlaceholder="ENTER FULL MOBILE NUMBER (10 DIGITS)"
        inputName="mobile"
        inputType="number"
        formData={formData}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onReset={() => {
          setFormData(initialFormState);
          setErrors({});
        }}
      />
    </div>
    </>
  );
};

export default MobileCalc;
