import { useState } from "react";
import { trackEvent } from "../../../../utils/analytics";
import { useDispatch } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { useNavigate } from "react-router-dom";
import FlamesForm from "../forms/FlamesForm";
import styles from "./Friendship.module.scss";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import BackButton from "../../../../component/UI/BackButton/BackButton";

const STORAGE_KEY = "friendship_calculator";

const initialFormState = {
  name1: "",
  name2: "",
};

const Friendship = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useFormFromLocalStorage(
    STORAGE_KEY,
    initialFormState
  );

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    trackEvent("calculator_used", { calculator_name: "Friendship" });

    const newErrors = {};
    if (!formData.name1) newErrors.name1 = "Name is required";
    if (!formData.name2) newErrors.name2 = "Friend's name is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    dispatch(setCalculatorData({ key: STORAGE_KEY, data: formData }));
    navigate("/friendship-calculator/report");
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Friendship Compatibility Calculator</h1>
        <p>Understanding True Bonds</p>
      </div>

      <div className={styles.infoCard}>
        <h3>What is Friendship?</h3>
        <p>
          Ever wondered if your bond with someone is built to last? Whether it's
          that childhood bestie, your college roommate, or a new connection, a
          Friendship Compatibility Calculator can give you surprising clarity.
        </p>
      </div>

      <FlamesForm
        title="Calculate your Friendship Compatibility here"
        submitText="Show Results"
        name2Label="Your Friend's Name"
        name2Placeholder="Enter your friend's name"
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

export default Friendship;
