import PrimaryText from "../../../../component/PrimaryText";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import ShubhTalkLogo from "../../../../assets/icons/logo.png";
import { useState } from "react";
import LoveMatchForm from "../forms/LoveMatchForm";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "love_calculator";

const initialFormState = {
  name1: "",
  gender1: "",
  name2: "",
  gender2: "",
};

const LoveCalc = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useFormFromLocalStorage(
    STORAGE_KEY,
    initialFormState
  );

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setErrors({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.name1) newErrors.name1 = "Name is required";
    if (!formData.gender1) newErrors.gender1 = "Gender is required";
    if (!formData.name2) newErrors.name2 = "Partner name is required";
    if (!formData.gender2) newErrors.gender2 = "Gender is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    navigate("/love-calculator/report");
  };
  return (
    <div style={{ margin: "0 3rem" }}>
      <PrimaryText isCenter isSemiBold size_24>
        Love Calculator: Find Your Perfect Match and Discover True Love
      </PrimaryText>
      <div style={{ margin: "0 1rem" }}>
        <DividerWithImage imageSrc={ShubhTalkLogo} />
      </div>
      <PrimaryText style={{ color: "gray", marginTop: "0.5rem" }} size_16>
        Have you ever thought if you and your crush are a perfect match? A love
        calculator is a fun and simple tool that tells you your love percentage
        and how well you both connect. Just enter names, birth dates, or even
        zodiac signs, and see the result!
      </PrimaryText>
      <PrimaryText style={{ margin: "1rem 0rem", color: "gray" }} size_16>
        Finding love isn’t always easy, but tools like the love calculator make
        it exciting. They help you understand your feelings and check your
        romantic compatibility. Many people use it for fun and to explore their
        bond before starting a relationship. Try it and see what your stars say!
      </PrimaryText>
      <LoveMatchForm
        title="Find Love (Percentage)% Between"
        submitText="Calculate Love %"
        formData={formData}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />
    </div>
  );
};

export default LoveCalc;
