import { useState } from "react";
import { zodiacList } from "./zodiacList";
import styles from "./Compatibility.module.scss";
import { useNavigate } from "react-router-dom";

const CompatibilitySignForm = ({s1, s2}) => {
  const navigate = useNavigate();
  const [sign1, setSign1] = useState(s1 || 1);
  const [sign2, setSign2] = useState(s2 || 1);

  const handleSubmit = () => {
    navigate(`/compatibility/result/${sign1}/${sign2}`);
  };

  return (
    <div className={styles.formBox}>
      <h3 className={styles.formTitle}>ARE YOU COMPATIBLE ?</h3>
      <p className={styles.formSubtitle}>
        Choose your and your partner's zodiac sign to check compatibility
      </p>

      <div className={styles.selectGroup}>
        <label>Your Sign</label>
        <select value={sign1} onChange={(e) => setSign1(e.target.value)}>
          {zodiacList.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.selectGroup}>
        <label>Partner's Sign</label>
        <select value={sign2} onChange={(e) => setSign2(e.target.value)}>
          {zodiacList.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
      </div>

      <button className={styles.submitBtn} onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
};

export default CompatibilitySignForm;
