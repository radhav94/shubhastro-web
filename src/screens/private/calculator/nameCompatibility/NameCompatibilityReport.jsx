import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useNameCompatibilityCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import styles from "./NameCompatibilityReport.module.scss";
import CalcReportLoader from "../CalcReportLoader";
import CalcBackButton from "../CalcBackButton";
import TTSButton from "../../../../component/UI/TTSButton";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";

const NameCompatibilityReport = () => {
  const navigate = useNavigate();
  const stored = useSelector(selectCalculatorData("name_compatibility_calc"));

  const [fetchCompatibility, { data, isLoading, isUninitialized }] =
    useNameCompatibilityCalculatorMutation();

  useEffect(() => {
    if (stored?.name1 && stored?.name2) {
      fetchCompatibility({ name1: stored.name1, name2: stored.name2 });
    }
  }, []);

  // Reserves in-flow height while the request runs — see CalcReportLoader.
  if (isLoading || isUninitialized) return <CalcReportLoader message="Checking your match…" />;
  if (!data?.data) return <div>No data found</div>;

  const report = data.data;

  return (
    <div className={styles.pageWrapper}>
      <CalcBackButton />

      <div className={styles.header}>
        <h2>Name Compatibility Results</h2>
      </div>

      <div className={styles.resultCard} style={{ position: "relative" }}>
        <span style={{ position: "absolute", top: "8px", right: "8px", display: "inline-flex", zIndex: 10, pointerEvents: "auto" }}>
          <TTSButton text={`${report.name1} and ${report.name2}. Match percentage ${report.matchPercentage}%. Label: ${report.label}. ${report.analysis}`} />
        </span>

        <p className={styles.subLabel}>Name compatibility between</p>
        <h3 className={styles.namesRow}>
          {report.name1} <span className={styles.heart}>💫</span> {report.name2}
        </h3>

        {/* Score + Info Row */}
        <div className={styles.scoreRow}>
          <div className={styles.circleOuter}>
            <svg className={styles.circleSvg} viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#ffe0cc"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#f75801"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(report.matchPercentage / 100) * 327} 327`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <span className={styles.circleText}>{report.matchPercentage}%</span>
          </div>

          <div className={styles.scoreInfo}>
            <h4 className={styles.scoreTitle}>{report.label}</h4>
            <p className={styles.scoreDesc}>{report.analysis}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className={styles.detailsGrid}>
          <div className={styles.detailCard}>
            <p className={styles.detailLabel}>{report.name1}&apos;s Name Number</p>
            <p className={`${styles.detailValue} ${styles.detailHighlight}`}>{report.nameNumber1}</p>
          </div>
          <div className={styles.detailCard}>
            <p className={styles.detailLabel}>{report.name2}&apos;s Name Number</p>
            <p className={`${styles.detailValue} ${styles.detailHighlight}`}>{report.nameNumber2}</p>
          </div>
          <div className={styles.detailCard}>
            <p className={styles.detailLabel}>{report.name1}&apos;s Ruling Planet</p>
            <p className={styles.detailValue}>{report.rulingPlanet1}</p>
          </div>
          <div className={styles.detailCard}>
            <p className={styles.detailLabel}>{report.name2}&apos;s Ruling Planet</p>
            <p className={styles.detailValue}>{report.rulingPlanet2}</p>
          </div>
        </div>

        {/* Action */}
        <button
          className={styles.calcAgainBtn}
          onClick={() => navigate("/name-compatibility-calculator")}
        >
          Calculate Again
        </button>
      </div>

      <div className={styles.connectCardWrap}>
        <ConnectCard />
      </div>
    </div>
  );
};

export default NameCompatibilityReport;
