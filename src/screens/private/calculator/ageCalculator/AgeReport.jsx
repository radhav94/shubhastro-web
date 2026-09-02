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

  const [ageCalculator, { data, isLoading, isError, isUninitialized, error }] =
    useAgeCalculatorMutation();

  useEffect(() => {
    if (!stored) return;

    ageCalculator(stored)
      .unwrap()
      .catch((err) => {
        console.error("Age calculator error:", err);
      });
  }, []);

  const report = data?.data;

  /*
    Reachable without going through the form — bookmark, shared link, or Back
    after the stored payload was cleared. With nothing stored the effect above
    returns without firing, so isLoading/isError stay false and `report` stays
    undefined, which fell through to `if (!report) return null`: a blank content
    area with no explanation and no exit but the browser Back button. A failure
    landed on a bare "No data found" with the same problem.

    Mirrors LoveReport. `isUninitialized` is required because the mutation fires
    from an effect — without it this card flashes before the request leaves.
  */
  const notReady = !stored || isError || (!report && !isLoading && !isUninitialized);
  if (notReady) {
    return (
      <div className={styles.wrapper}>
        <CalcBackButton />
        <h2 className={styles.pageTitle}>AGE CALCULATOR</h2>
        <div className={styles.resultCard}>
          <p className={styles.resultLabel}>
            {error?.data?.message ||
              (!stored
                ? "Enter your date of birth to calculate your age."
                : "We couldn't calculate that age. Please try again.")}
          </p>
          <button
            className={styles.againBtn}
            onClick={() => navigate("/age-calculator")}
          >
            Back to Age Calculator
          </button>
        </div>
      </div>
    );
  }

  // Reserves in-flow height while the request runs — see CalcReportLoader.
  if (isLoading || isUninitialized) return <CalcReportLoader />;
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
