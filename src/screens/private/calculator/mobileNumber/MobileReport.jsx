import { useNavigate } from "react-router-dom";
import { useMobileNumerologyCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./MobileReport.module.scss";
import CalcBackButton from "../CalcBackButton";

const MobileReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("mobile_calculator"));

  const [mobileNumerologyCalculator, { data, isLoading, isError }] =
    useMobileNumerologyCalculatorMutation();

  useEffect(() => {
    if (!stored) return;

    mobileNumerologyCalculator(stored)
      .unwrap()
      .catch((err) => {
        console.error("Mobile numerology error:", err);
      });
  }, []);

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (isError) return <div className={styles.center}>No data found</div>;

  const report = data?.data;
  if (!report) return null;

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />
      {/* HEADER */}
      <div className={styles.header}>
        <h2>✨ Lucky Mobile Number Analysis</h2>
        <p>Discover your mobile number's compatibility</p>
      </div>

      {/* NUMBERS CARD */}
      <div className={styles.numbersCard}>
        <div className={styles.numberBox}>
          <span>DESTINY NUMBER</span>
          <strong>{report.destinyNumber}</strong>
        </div>
        <div className={styles.numberBox}>
          <span>MOBILE NUMBER</span>
          <strong>{report.mobileNumber}</strong>
        </div>
      </div>

      {/* COMPATIBILITY CARD */}
      <div className={styles.compatibilityCard}>
        <div className={styles.statusRow}>
          <div className={styles.statusIcon}>👍</div>
          <div>
            <span className={styles.statusLabel}>COMPATIBILITY STATUS</span>
            <h3>{report.status}</h3>
          </div>
        </div>

        <div className={styles.description}>{report.description}</div>
      </div>

      {/* ACTIONS */}
      <button
        className={styles.againBtn}
        onClick={() => navigate("/mobile-number-numerology-calculator")}
      >
        Calculate Again
      </button>
    </div>
  );
};

export default MobileReport;
