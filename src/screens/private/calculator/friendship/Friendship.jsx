import { useState } from "react";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { useNavigate } from "react-router-dom";
import FlamesForm from "../forms/FlamesForm";
import styles from "./Friendship.module.scss";

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
    setErrors((prev) => ({ ...prev, [field]: "" }));
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
        submitText="Calculate our Friendship"
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

export default Friendship;
