import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useVehicleNumerologyCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import CalcReportLoader from "../CalcReportLoader";
import styles from "./VehicleReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";

const VehicleReport = () => {
  const navigate = useNavigate();

  const stored = useSelector(selectCalculatorData("vehicle_calculator"));

  const [vehicleNumerologyCalculator, { data, isLoading, isError }] =
    useVehicleNumerologyCalculatorMutation();

  useEffect(() => {
    if (!stored) return;

    vehicleNumerologyCalculator(stored)
      .unwrap()
      .catch((err) => {
        console.error("Vehicle numerology error:", err);
      });
  }, []);

  // Reserves in-flow height while the request runs — see CalcReportLoader.
  if (isLoading) return <CalcReportLoader />;
  if (isError) return <div className={styles.center}>No data found</div>;

  const report = data?.data;
  if (!report) return null;

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />
      {/* TITLE */}
      <h2 className={styles.title}>
        Vehicle Number Analysis –
        <span className={styles.vehicle}> {report.vehicle}</span>
      </h2>
      <p className={styles.subtitle}>Discover your number's energy</p>

      {/* STATUS BAR */}
      <div className={styles.statusBar}>🍀 {report.status}</div>

      {/* DESCRIPTION */}
      <div className={styles.descriptionBox}>“{report.description}”</div>

      {/* ACTIONS */}
      <button
        className={styles.againBtn}
        onClick={() => navigate("/lucky-vehicle-number-calculator")}
      >
        Calculate Again
      </button>

      <ConnectCard />
    </div>
  );
};

export default VehicleReport;
