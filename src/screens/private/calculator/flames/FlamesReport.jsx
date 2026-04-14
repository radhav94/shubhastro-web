import { useNavigate } from "react-router-dom";
import { useFlamesCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import styles from "./FlamesReport.module.scss";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import CalcBackButton from "../CalcBackButton";

const FlamesReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("flames_calculator"));

  const [flamesCalculator, { data, isLoading, isError }] =
    useFlamesCalculatorMutation();

  useEffect(() => {
    if (!stored) return;

    flamesCalculator(stored)
      .unwrap()
      .catch((err) => {
        console.error("Flames calculator error:", err);
      });
  }, []); // run once

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (isError) return <div className={styles.center}>No data found</div>;

  const report = data?.data;
  if (!report) return null;

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />
      <div className={styles.card}>
        <h3 className={styles.title}>FLAMES RESULT</h3>

        <p className={styles.names}>
          {report.name1} <span className={styles.fire}>🔥</span> {report.name2}
        </p>

        <div className={styles.resultBox}>
          <span className={styles.icon}>⚡</span>
          <h2>{report.result.toUpperCase()}</h2>
          <p>{report.description}</p>
        </div>

        <button
          onClick={() =>
            navigator.share?.({
              title: "Flames Report",
              text: "Check out my Flames Report",
            })
          }
          className={styles.shareBtn}
        >
          🔗 Share It with others
        </button>
      </div>

      <button className={styles.againBtn} onClick={() => navigate("/flames-calculator")}>
        Calculate Again
      </button>
    </div>
  );
};

export default FlamesReport;
