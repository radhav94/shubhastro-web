import { useNavigate } from "react-router-dom";
import { useVehicleNumerologyCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./VehicleReport.module.scss";

const VehicleReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("vehicle_calculator"));

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

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (isError) return <div className={styles.center}>No data found</div>;

  const report = data?.data;
  if (!report) return null;

  return (
    <div className={styles.wrapper}>
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
        onClick={() =>
          navigator.share?.({
            title: "Vehicle Number  Report",
            text: "Check out my Vehicle Number Report",
          })
        }
        className={styles.shareBtn}
      >
        🔗 Share It with others
      </button>

      <button
        className={styles.againBtn}
        onClick={() => navigate("/lucky-vehicle-number-calculator")}
      >
        Calculate Again
      </button>
    </div>
  );
};

export default VehicleReport;
