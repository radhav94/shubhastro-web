import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetNumerologyReportQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./DestinyReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import TTSButton from "../../../../component/UI/TTSButton";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";

const DestinyReport = () => {
  const navigate = useNavigate();
  const stored = useSelector(selectCalculatorData("destiny_calc"));
  const { data, isLoading } = useGetNumerologyReportQuery(stored, { skip: !stored });

  if (!stored || isLoading) return <PrimaryLoader isLoading={true} />;
  if (!data?.response?.destiny) return <div>No data found</div>;

  const destiny = data.response.destiny;

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />

      <div className={styles.header}>
        <h2>{stored?.name}'s Destiny Number</h2>
        <p>Numerology analysis of your life path</p>
      </div>

      <div className={styles.resultCard} style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
          <TTSButton text={`Destiny Number ${destiny.number}${destiny.master ? '. Master Number' : ''}. ${destiny.meaning || ''}`} />
        </span>
        <div className={styles.numberCircle}>{destiny.number}</div>
        <h3 className={styles.resultLabel}>Destiny Number</h3>
        {destiny.master && <span className={styles.masterBadge}>Master Number</span>}
        <p className={styles.meaning}>{destiny.meaning}</p>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.shareBtn}
          style={{ display: 'none' }}
          onClick={() => navigator.share?.({ title: "Destiny Number Report", text: destiny.meaning })}
        >
          Share Report
        </button>
        <button className={styles.againBtn} onClick={() => navigate("/destiny-number-calculator")}>
          Calculate Again
        </button>
      </div>

      <ConnectCard />
    </div>
  );
};

export default DestinyReport;
