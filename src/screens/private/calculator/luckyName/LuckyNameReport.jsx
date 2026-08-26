import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useLuckyNameNumerologyCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import CalcReportLoader from "../CalcReportLoader";
import styles from "./LuckyNameReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import TTSButton from "../../../../component/UI/TTSButton";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";

const DETAIL_LABELS = [
  { key: "lifePath", label: "Life Path" },
  { key: "radical", label: "Radical (Mulank)" },
  { key: "personality", label: "Personality" },
  { key: "destiny", label: "Destiny" },
  { key: "heartDesire", label: "Heart Desire" },
];

const LuckyNameReport = () => {
  const navigate = useNavigate();
  const stored = useSelector(selectCalculatorData("lucky_name_calc"));

  const [fetchReport, { data, isLoading, isUninitialized }] =
    useLuckyNameNumerologyCalculatorMutation();

  useEffect(() => {
    if (stored?.name && stored?.dob && stored?.system) {
      fetchReport({ name: stored.name, dob: stored.dob, system: stored.system });
    }
  }, []);

  // Reserves in-flow height while the request runs — see CalcReportLoader.
  if (isLoading || isUninitialized) return <CalcReportLoader />;
  if (!data?.data) return <div>No data found</div>;

  const report = data.data;
  const compat = report.compatibility;
  const details = report.details;

  const ttsText = `Lucky Name Numerology for ${report.name}. System: ${report.system}. Compatibility score: ${compat.score}%. ${compat.label}. ${compat.description}. Life Path Number ${report.lifePathNumber}. Radical Number ${report.radicalNumber}. Personality Number ${report.personalityNumber}. Destiny Number ${report.destinyNumber}. Heart Desire Number ${report.heartDesireNumber}.`;

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />

      <div className={styles.header}>
        <h2>{report.name}&apos;s Name Numerology</h2>
        <p>Lucky name analysis using the {report.system} system</p>
      </div>

      {/* Compatibility Score Card */}
      <div className={styles.compatCard} style={{ position: "relative" }}>
        <span style={{ position: "absolute", top: "8px", right: "8px", display: "inline-flex", zIndex: 10, pointerEvents: "auto" }}>
          <TTSButton text={ttsText} />
        </span>

        <div className={styles.scoreRow}>
          <div className={styles.circleOuter}>
            <svg className={styles.circleSvg} viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#ffe0cc" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke="#f75801" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(compat.score / 100) * 327} 327`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <span className={styles.circleText}>{compat.score}%</span>
          </div>
          <div className={styles.scoreInfo}>
            <h4 className={styles.scoreLabel}>{compat.label}</h4>
            <p className={styles.scoreDesc}>{compat.description}</p>
          </div>
        </div>

        <span className={styles.systemBadge}>{report.system} System</span>
      </div>

      {/* Number Details Grid */}
      <div className={styles.numbersGrid}>
        {DETAIL_LABELS.map(({ key, label }) => {
          const detail = details?.[key];
          if (!detail) return null;
          return (
            <div key={key} className={styles.numberCard}>
              <div className={styles.numberValue}>{detail.number}</div>
              <p className={styles.numberTitle}>{label}</p>
              <p className={styles.numberPlanet}>{detail.rulingPlanet}</p>
              <p className={styles.numberMeaning}>{detail.meaning}</p>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.againBtn} onClick={() => navigate("/lucky-name-numerology-calculator")}>
          Calculate Again
        </button>
      </div>

      <ConnectCard />
    </div>
  );
};

export default LuckyNameReport;
