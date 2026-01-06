import PrimaryText from "../../../../component/PrimaryText";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import ShubhTalkLogo from "../../../../assets/icons/logo.png";
import { useState } from "react";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { useNavigate } from "react-router-dom";
import FlamesForm from "../forms/FlamesForm";

const STORAGE_KEY = "friendship_calculator";

const initialFormState = {
  name1: "",
  name2: "",
};

const Friendship = () => {
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
    navigate("/friendship-calculator/report");
  };
  return (
    <div style={{ margin: "0 3rem" }}>
      <PrimaryText isCenter isSemiBold size_24>
        Friendship Compatibility Calculator: Understanding True Bonds
      </PrimaryText>
      <PrimaryText style={{ color: "gray", marginTop: "0.5rem" }} size_16>
        Ever wondered if your bond with someone is built to last? Whether it’s
        that childhood bestie, your college roommate, or a new connection, a
        <strong>Friendship Compatibility Calculator</strong>
        can give you surprising clarity.
      </PrimaryText>
      <div style={{ margin: "0 1rem" }}>
        <DividerWithImage imageSrc={ShubhTalkLogo} />
      </div>
      <FlamesForm
        title="Calculate your Friendship Compatibility here"
        submitText="Calculate our Friendship"
        formData={formData}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
      ;
    </div>
  );
};

export default Friendship;
