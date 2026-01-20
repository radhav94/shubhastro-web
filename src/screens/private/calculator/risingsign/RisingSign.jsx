import { useState } from "react";
import AstroBirthForm from "../forms/AstroBirthForm";
import PrimaryText from "../../../../component/PrimaryText";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import ShubhTalkLogo from "../../../../assets/icons/logo.png";
import { useNavigate } from "react-router-dom";
import useFormFromLocalStorage from "../useFormFromLocalStorage";

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  return (
    <div style={{ margin: "0 3rem" }}>
      <PrimaryText isCenter isSemiBold size_24>
        The Complete Rising Sign Calculator: Discover Your True Self
      </PrimaryText>
      <PrimaryText style={{ color: "gray" }} margin="" size_16>
        Have you ever felt like people see a version of you that doesn’t quite
        match how you see yourself? This rising sign calculator explains the
        reason for that! Your rising/ ascendant sign, is that zodiac sign that
        was rising on the eastern horizon at the time you were born.
      </PrimaryText>
      <div style={{ margin: "0 1rem" }}>
        <DividerWithImage imageSrc={ShubhTalkLogo} />
      </div>
      <AstroBirthForm
        title="Calculate your Rising/Ascendant Sign here"
        submitText="Calculate my Rising Sign"
        formData={formData}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default RisingSign;
