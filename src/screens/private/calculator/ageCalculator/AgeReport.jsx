import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAgeCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./AgeReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";

const AgeReport = () => {
  const navigate = useNavigate();

  const stored = useSelector(selectCalculatorData("age_calculator"));

  const [ageCalculator, { data, isLoading, isError }] =
    useAgeCalculatorMutation();

  useEffect(() => {
    if (!stored) return;

    ageCalculator(stored)
      .unwrap()
      .catch((err) => {
        console.error("Age calculator error:", err);
      });
  }, []);

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (isError) return <div className={styles.center}>No data found</div>;

  const report = data?.data;
  if (!report) return null;

  return (
    <>
      <div className={styles.wrapper}>
        <CalcBackButton />

        <h2 className={styles.pageTitle}>AGE CALCULATOR</h2>
        {/* <div className={styles.headingUnderline}>
          <div className={styles.dividerLine}>
            <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
              <line y1="0.5" x2="93" y2="0.5" stroke="#030303" />
            </svg>
          </div>
          <span className={styles.dividerMoon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
              <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303" />
            </svg>
          </span>
          <div className={styles.dividerLine}>
            <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
              <line y1="0.5" x2="93" y2="0.5" stroke="#030303" />
            </svg>
          </div>
        </div> */}

        {/* RESULT */}
        <div className={styles.resultCard}>
          <p className={styles.resultLabel}>Your Age Is</p>
          <div className={styles.resultBox}>
            <div className={styles.resultItem}>
              <strong>{report.years}</strong>
              <span>Years</span>
            </div>
            <div className={styles.resultItem}>
              <strong>{report.months}</strong>
              <span>Months</span>
            </div>
            <div className={styles.resultItem}>
              <strong>{report.days}</strong>
              <span>Days</span>
            </div>
          </div>
        </div>

        {/* AGAIN */}
        <button
          className={styles.againBtn}
          onClick={() => navigate("/age-calculator")}
        >
          Calculate Again
        </button>
      </div>

      <ConnectCard />
    </>
  );
};

export default AgeReport;
