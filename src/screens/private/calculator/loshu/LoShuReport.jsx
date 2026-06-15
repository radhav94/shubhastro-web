import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useLoShuGridCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./LoShuReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import TTSButton from "../../../../component/UI/TTSButton";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";

const LoShuReport = () => {
  const navigate = useNavigate();
  const stored = useSelector(selectCalculatorData("loshu_grid_calc"));

  const [fetchLoShu, { data, isLoading, isUninitialized }] =
    useLoShuGridCalculatorMutation();

  useEffect(() => {
    if (stored?.dob) {
      fetchLoShu({ dob: stored.dob });
    }
  }, []);

  if (isLoading || isUninitialized) return <PrimaryLoader isLoading={true} />;
  if (!data?.data) return <div>No data found</div>;

  const report = data.data;

  // Build TTS text
  const ttsText = `Lo Shu Grid Report. Driver Number ${report.driverNumber}. Conductor Number ${report.conductorNumber}. Numbers present: ${report.numbersPresent.map((n) => `${n.number} ${n.title}`).join(", ")}. Numbers missing: ${report.numbersMissing.map((n) => `${n.number} ${n.title}`).join(", ")}.`;

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />

      <div className={styles.header}>
        <h2>Lo Shu Grid Report</h2>
        <p>Your numerology grid based on DOB: {report.dob}</p>
      </div>

      {/* Driver & Conductor */}
      <div className={styles.driverRow}>
        <div className={styles.driverCard}>
          <p className={styles.driverLabel}>Driver Number</p>
          <p className={styles.driverValue}>{report.driverNumber}</p>
        </div>
        <div className={styles.driverCard}>
          <p className={styles.driverLabel}>Conductor Number</p>
          <p className={styles.driverValue}>{report.conductorNumber}</p>
        </div>
      </div>

      {/* Lo Shu Grid */}
      <div className={styles.gridSection}>
        <h3 className={styles.gridTitle} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "center" }}>
          Your Lo Shu Grid
          <span style={{ display: "inline-flex" }}>
            <TTSButton text={ttsText} />
          </span>
        </h3>
        <div className={styles.grid}>
          {report.grid.flat().map((cell, idx) => (
            <div
              key={idx}
              className={`${styles.gridCell} ${cell.present ? styles.gridCellPresent : styles.gridCellMissing}`}
            >
              <p className={`${styles.cellNumber} ${cell.present ? styles.cellNumberPresent : ""}`}>
                {cell.present ? cell.number : cell.baseNumber}
              </p>
              <p className={styles.cellTitle}>{cell.title}</p>
              <p className={styles.cellMeta}>{cell.planet} • {cell.element}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Numbers Present */}
      {report.numbersPresent?.length > 0 && (
        <div className={styles.numbersSection}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.presentDot} />
            Numbers Present
          </h3>
          <div className={styles.numbersList}>
            {report.numbersPresent.map((item) => (
              <div key={item.number} className={styles.numberCard}>
                <div className={styles.numberBadge}>{item.number}</div>
                <div className={styles.numberInfo}>
                  <p className={styles.numberTitle}>{item.title}</p>
                  <p className={styles.numberCount}>Appears {item.count}×</p>
                  <p className={styles.numberDesc}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Numbers Missing */}
      {report.numbersMissing?.length > 0 && (
        <div className={styles.numbersSection}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.missingDot} />
            Numbers Missing
          </h3>
          <div className={styles.numbersList}>
            {report.numbersMissing.map((item) => (
              <div key={item.number} className={styles.numberCard}>
                <div className={`${styles.numberBadge} ${styles.numberBadgeMissing}`}>{item.number}</div>
                <div className={styles.numberInfo}>
                  <p className={styles.numberTitle}>{item.title}</p>
                  <p className={styles.numberDesc}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.againBtn} onClick={() => navigate("/lo-shu-grid-calculator")}>
          Calculate Again
        </button>
      </div>

      <ConnectCard />
    </div>
  );
};

export default LoShuReport;
