import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAgeCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import CalcReportLoader from "../CalcReportLoader";
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

  // Reserves in-flow height while the request runs — see CalcReportLoader.
  if (isLoading) return <CalcReportLoader />;
  if (isError) return <div className={styles.center}>No data found</div>;

  const report = data?.data;
  if (!report) return null;

  return (
    <>
      <CalcBackButton />
      <div className={styles.wrapper}>
        <h2 className={styles.pageTitle}>AGE CALCULATOR</h2>

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

      <div className={styles.connectCardWrap}>
        <ConnectCard />
      </div>
    </>
  );
};

export default AgeReport;
