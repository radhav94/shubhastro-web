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

  const [vehicleNumerologyCalculator, { data, isLoading, isError, isUninitialized, error }] =
    useVehicleNumerologyCalculatorMutation();

  useEffect(() => {
    if (!stored) return;

    vehicleNumerologyCalculator(stored)
      .unwrap()
      .catch((err) => {
        console.error("Vehicle numerology error:", err);
      });
  }, []);

  const report = data?.data;

  /*
    This page is a route, so it can be opened without going through the form —
    a bookmark, a shared link, or Back after the stored payload was cleared.

    With nothing stored the effect above returns without firing, so `isLoading`
    and `isError` both stay false and `report` stays undefined, which fell
    through to `if (!report) return null` — a blank content area with no
    explanation and no way forward but the browser Back button. A failed request
    landed on a bare "No data found" with the same lack of an exit.

    Mirrors LoveReport, including why `isUninitialized` is needed: the mutation is
    fired from an effect, so on the very first render nothing is loading and
    nothing has failed yet, and without it this card would flash before the
    request has even left.
  */
  const notReady = !stored || isError || (!report && !isLoading && !isUninitialized);
  if (notReady) {
    return (
      <div className={styles.wrapper}>
        <CalcBackButton />
        <h2 className={styles.title}>Vehicle Number Analysis</h2>
        <div className={styles.descriptionBox}>
          {error?.data?.message ||
            (!stored
              ? "Enter your vehicle number to see its numerology analysis."
              : "We couldn't analyse that vehicle number. Please try again.")}
        </div>
        <button
          className={styles.againBtn}
          onClick={() => navigate("/lucky-vehicle-number-calculator")}
        >
          Back to Vehicle Number Calculator
        </button>
      </div>
    );
  }

  // Reserves in-flow height while the request runs — see CalcReportLoader.
  if (isLoading || isUninitialized) return <CalcReportLoader />;
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
