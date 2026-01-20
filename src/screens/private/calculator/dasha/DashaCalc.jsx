import { useState } from "react";
import AstroBirthForm from "../forms/AstroBirthForm";
import PrimaryText from "../../../../component/PrimaryText";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import ShubhTalkLogo from "../../../../assets/icons/logo.png";
import { useNavigate } from "react-router-dom";
import useFormFromLocalStorage from "../useFormFromLocalStorage";

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
    navigate("/dasha-calculator/report");
  };

  return (
    <div style={{ margin: "0 3rem" }}>
      <PrimaryText isCenter isSemiBold size_24>
        Dasha Calculator: Making Sense of Your Life's Path
      </PrimaryText>
      <PrimaryText style={{ color: "gray" }} margin="" size_16>
        Ever had a phase in life where everything just clicked a dream job, a
        happy relationship, maybe even unexpected success? And then suddenly,
        things slow down, plans stall, and you’re left wondering, “What
        changed?” It’s your <strong>Dasha period</strong> at work. A
        <strong> Dasha calculator</strong> will help you decode these shifts by
        revealing which planets are influencing your life at any given time
      </PrimaryText>
      <div style={{ margin: "0 1rem" }}>
        <DividerWithImage imageSrc={ShubhTalkLogo} />
      </div>
      <AstroBirthForm
        title="Calculate Your Dasha here"
        submitText="Calculate my Dasha"
        formData={formData}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default DashaCalc;
