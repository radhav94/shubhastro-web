import { useState } from "react";
import AstroBirthForm from "../forms/AstroBirthForm";
import PrimaryText from "../../../../component/PrimaryText";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import ShubhTalkLogo from "../../../../assets/icons/logo.png";
import { useNavigate } from "react-router-dom";
import useFormFromLocalStorage from "../useFormFromLocalStorage";

const STORAGE_KEY = "birth_natal_calc";

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

const BirthCalc = () => {
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
    navigate("/birth-natal-chart-calculator/report");
  };

  return (
    <div style={{ margin: "0 3rem" }}>
      <PrimaryText isCenter isSemiBold size_24>
        Birth/Natal Chart Calculator: Discover Your Life's Path
      </PrimaryText>

      <PrimaryText style={{ color: "gray" }} size_16>
        Ever felt like there’s a version of you that no one really sees, not
        even you sometimes? That feeling of being slightly off-track isn’t
        random, it’s your soul nudging you to look deeper. A Birth/Natal Chart
        Calculator comes in right here and it’s not just another astrology tool,
        but a mirror to your inner world. The deeper truth you’re seeking? It’s
        already written in your birth chart, waiting to be unlocked.
      </PrimaryText>

      <div style={{ margin: "0 1rem" }}>
        <DividerWithImage imageSrc={ShubhTalkLogo} />
      </div>

      <AstroBirthForm
        title="Calculate Your Birth Chart here"
        submitText="Calculate Birth"
        formData={formData}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default BirthCalc;
