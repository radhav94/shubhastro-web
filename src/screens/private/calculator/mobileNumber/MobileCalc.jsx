import PrimaryText from "../../../../component/PrimaryText";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import ShubhTalkLogo from "../../../../assets/icons/logo.png";
import { useState } from "react";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { useNavigate } from "react-router-dom";
import DateWithSingleInputForm from "../forms/DateWithSingleInputForm";

const STORAGE_KEY = "mobile_calculator";

const initialFormState = {
  dob: "",
  mobile: "",
};

const MobileCalc = () => {
  const navigate = useNavigate();
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

    const payload = {
      dob: formData.dob,
      mobile: formData.mobile,
    };

    const validationErrors = validateMobileInput(payload);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    navigate("/mobile-number-numerology-calculator/report");
  };

  return (
    <div style={{ margin: "0 3rem" }}>
      <PrimaryText isCenter isSemiBold size_24>
        Lucky Mobile Number Calculator
      </PrimaryText>

      <PrimaryText style={{ color: "gray", marginTop: "0.5rem" }} size_16>
        Your mobile number carries vibrations that influence your life. Discover
        how your date of birth aligns with your mobile number.
      </PrimaryText>

      <div style={{ margin: "0 1rem" }}>
        <DividerWithImage imageSrc={ShubhTalkLogo} />
      </div>

      <DateWithSingleInputForm
        title="Calculate your Lucky Mobile Number here"
        submitText="Calculate my Lucky Mobile Number"
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
          localStorage.removeItem(STORAGE_KEY);
        }}
      />
    </div>
  );
};

export default MobileCalc;
