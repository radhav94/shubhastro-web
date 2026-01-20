import { useState } from "react";
import PrimaryText from "../../../../component/PrimaryText";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import ShubhTalkLogo from "../../../../assets/icons/logo.png";
import { useNavigate } from "react-router-dom";
import NumerologyForm from "../forms/NumerologyForm";
import useFormFromLocalStorage from "../useFormFromLocalStorage";

const STORAGE_KEY = "destiny_calc";

const initialFormState = {
  name: "",
  dob: "",
};

const DestinyCalc = () => {
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
    navigate("/destiny-number-calculator/report");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  return (
    <div style={{ margin: "0 3rem" }}>
      <PrimaryText isCenter isSemiBold size_24>
        Destiny Number Calculator: Discover Your Life's Purpose
      </PrimaryText>
      <PrimaryText style={{ color: "gray", marginTop: "0.7rem" }} size_16>
        A <strong>destiny number calculator</strong> helps you find your true
        life purpose by using the numbers in your full birth name. It’s closely
        connected with other numerology numbers like your Soul Urge Number,
        Personality Number, and even your Name Number, which all reflect
        different layers of your spiritual identity.
      </PrimaryText>
      <PrimaryText style={{ color: "gray", marginTop: "1rem" }} size_16>
        It shows your natural talents, career direction, and spiritual path
        simply. This special tool can also uncover patterns that explain why
        certain things keep happening in your life. Understanding these patterns
        becomes even deeper when you look at bridge numbers and soul numbers,
        which fill the gap between your destiny and life paths.
      </PrimaryText>

      <div style={{ margin: "0 1rem" }}>
        <DividerWithImage imageSrc={ShubhTalkLogo} />
      </div>
      <NumerologyForm
        submitText="Submit"
        formData={formData}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        hideType={true}
      />
    </div>
  );
};

export default DestinyCalc;
