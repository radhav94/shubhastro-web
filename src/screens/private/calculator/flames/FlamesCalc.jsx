import PrimaryText from "../../../../component/PrimaryText";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import ShubhTalkLogo from "../../../../assets/icons/logo.png";
import { useState } from "react";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { useNavigate } from "react-router-dom";
import FlamesForm from "../forms/FlamesForm";

const STORAGE_KEY = "flames_calculator";

const initialFormState = {
  name1: "",
  name2: "",
};

const FlamesCalc = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useFormFromLocalStorage(
    STORAGE_KEY,
    initialFormState
  );

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.name1) newErrors.name1 = "Name is required";
    if (!formData.name2) newErrors.name2 = "Partner name is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    navigate("/flames-calculator/report");
  };
  return (
    <div style={{ margin: "0 3rem" }}>
      <PrimaryText isCenter isSemiBold size_24>
        Flames Calculator: Understanding Love Compatibility
      </PrimaryText>
      <PrimaryText style={{ color: "gray", marginTop: "0.5rem" }} size_16>
        Ever found yourself scribbling names in a notebook, wondering if you and
        your crush were meant to be?
        <strong>
          {" "}
          The FLAMES calculator taps into that same fun, nostalgic feeling but
          with a little more structure. It's a playful way to explore the
          chemistry between two people by using their names to reveal what kind
          of bond they might share: Friendship, Love, Affection, Marriage,
          Enemy, or Sisterhood.
        </strong>
      </PrimaryText>
      <div style={{ margin: "0 1rem" }}>
        <DividerWithImage imageSrc={ShubhTalkLogo} />
      </div>
      <FlamesForm
        title="Calculate your FLAMES here"
        submitText="Calculate our Flames"
        formData={formData}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
      ;
    </div>
  );
};

export default FlamesCalc;
