import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMulankCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import CalcReportLoader from "../CalcReportLoader";
import styles from "./MulankReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import TTSButton from "../../../../component/UI/TTSButton";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";
import { useEffect } from "react";

const MulankReport = () => {
  const navigate = useNavigate();
  const stored = useSelector(selectCalculatorData("mulank_calc"));

  const [fetchMulank, { data, isLoading, isUninitialized }] = useMulankCalculatorMutation();

  useEffect(() => {
    if (stored?.name && stored?.dob) {
      fetchMulank({ name: stored.name, dob: stored.dob });
    }
  }, []);

  // Reserves in-flow height while the request runs — see CalcReportLoader.
  if (isLoading || isUninitialized) return <CalcReportLoader message="Calculating your numbers…" />;
  if (!data?.data) return <div>No data found</div>;

  const result = data.data;

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />

      <div className={styles.header}>
        <h2>{result.name}&apos;s Mulank Report</h2>
        <p>Your root number and its cosmic significance</p>
      </div>

      <div className={styles.resultCard} style={{ position: "relative" }}>
        <span style={{ position: "absolute", top: "8px", right: "8px", display: "inline-flex", zIndex: 10, pointerEvents: "auto" }}>
          <TTSButton text={`Mulank Number ${result.mulank}. Title: ${result.title}. Ruling Planet: ${result.rulingPlanet}. ${result.description || ""}`} />
        </span>
        <div className={styles.numberCircle}>{result.mulank}</div>
        <h3 className={styles.resultLabel}>{result.title}</h3>
        <span className={styles.planetBadge}>Ruling Planet: {result.rulingPlanet}</span>
        <p className={styles.meaning}>{result.description}</p>
      </div>

      <div className={styles.actions}>
        <button className={styles.againBtn} onClick={() => navigate("/mulank-calculator")}>
          Calculate Again
        </button>
      </div>

      <ConnectCard />
    </div>
  );
};

export default MulankReport;
