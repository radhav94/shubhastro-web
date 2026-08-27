import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useFlamesCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import styles from "./FlamesReport.module.scss";
import CalcReportLoader from "../CalcReportLoader";
import CalcBackButton from "../CalcBackButton";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";

const FlamesReport = () => {
  const navigate = useNavigate();

  const stored = useSelector(selectCalculatorData("flames_calculator"));

  const [flamesCalculator, { data, isLoading }] =
    useFlamesCalculatorMutation();

  useEffect(() => {
    if (!stored) return;

    flamesCalculator(stored)
      .unwrap()
      .then((res) => {
        if (!res?.success) {
          navigate("/flames-calculator", { replace: true });
        }
      })
      .catch(() => {
        navigate("/flames-calculator", { replace: true });
      });
  }, []); // run once

  // Reserves in-flow height while the request runs — see CalcReportLoader.
  if (isLoading || !data) return <CalcReportLoader />;

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

        <button className={styles.againBtn} onClick={() => navigate("/flames-calculator")}>
          Calculate Again
        </button>
      </div>

      <ConnectCard />
    </div>
  );
};

export default FlamesReport;
