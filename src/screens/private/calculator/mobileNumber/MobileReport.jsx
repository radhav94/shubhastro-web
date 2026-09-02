import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMobileNumerologyCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import CalcReportLoader from "../CalcReportLoader";
import styles from "./MobileReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";

const MobileReport = () => {
  const navigate = useNavigate();

  const stored = useSelector(selectCalculatorData("mobile_calculator"));

  const [mobileNumerologyCalculator, { data, isLoading, isError, isUninitialized, error }] =
    useMobileNumerologyCalculatorMutation();

  useEffect(() => {
    if (!stored) return;

    mobileNumerologyCalculator(stored)
      .unwrap()
      .catch((err) => {
        console.error("Mobile numerology error:", err);
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
        <div className={styles.header}>
          <h2>✨ Lucky Mobile Number Analysis</h2>
          <p>
            {error?.data?.message ||
              (!stored
                ? "Enter your mobile number to see its numerology analysis."
                : "We couldn't analyse that mobile number. Please try again.")}
          </p>
        </div>
        <button
          className={styles.againBtn}
          onClick={() => navigate("/mobile-number-numerology-calculator")}
        >
          Back to Mobile Numerology Calculator
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
      {/* HEADER */}
      <div className={styles.header}>
        <h2>✨ Lucky Mobile Number Analysis</h2>
        <p>Discover your mobile number's compatibility</p>
      </div>

      {/* NUMBERS CARD */}
      <div className={styles.numbersCard}>
        <div className={styles.numberBox}>
          <span>DESTINY NUMBER</span>
          <strong>{report.destinyNumber}</strong>
        </div>
        <div className={styles.numberBox}>
          <span>MOBILE NUMBER</span>
          <strong>{report.mobileNumber}</strong>
        </div>
      </div>

      {/* COMPATIBILITY CARD */}
      <div className={styles.compatibilityCard}>
        <div className={styles.statusRow}>
          <div className={styles.statusIcon}>👍</div>
          <div>
            <span className={styles.statusLabel}>COMPATIBILITY STATUS</span>
            <h3>{report.status}</h3>
          </div>
        </div>

        <div className={styles.description}>{report.description}</div>
      </div>

      {/* ACTIONS */}
      <button
        className={styles.againBtn}
        onClick={() => navigate("/mobile-number-numerology-calculator")}
      >
        Calculate Again
      </button>

      <ConnectCard />
    </div>
  );
};

export default MobileReport;
