import { useNavigate } from "react-router-dom";
import { useAgeCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import DateWithSingleInputForm from "../forms/DateWithSingleInputForm";
import styles from "./AgeReport.module.scss";
import CalcBackButton from "../CalcBackButton";

const AgeReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("age_calculator"));

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
    <div className={styles.wrapper}>
      <CalcBackButton />
      {/* FORM (READ ONLY) */}
      <DateWithSingleInputForm
        title="Calculate your Age here"
        inputLabel="Age As Of Date"
        inputName="asOf"
        inputType="date"
        formData={{
          dob: report.dob,
          asOf: report.asOf,
        }}
        hideSubmit
        readOnly
      />

      {/* RESULT */}
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

      {/* AGAIN */}
      <button
        className={styles.againBtn}
        onClick={() => navigate("/age-calculator")}
      >
        Calculate Again
      </button>
    </div>
  );
};

export default AgeReport;
