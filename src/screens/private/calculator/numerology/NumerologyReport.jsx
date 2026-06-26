import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetNumerologyReportQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./NumerologyReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";
import TTSButton from "../../../../component/UI/TTSButton";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";

const NumerologyReport = () => {
  const navigate = useNavigate();

  const stored = useSelector(selectCalculatorData("numerology_report"));
  const { data, isLoading } = useGetNumerologyReportQuery(stored, {
    skip: !stored,
  });

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (!data?.response) return <div>No data found</div>;

  const { destiny, soul, character, personality, attitude, agenda, purpose } =
    data.response;

  const cards = [
    destiny,
    soul,
    character,
    personality,
    attitude,
    agenda,
    purpose,
  ];

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />
      {/* HEADER */}
      <div className={styles.header}>
        <h2>{stored?.name}&apos;s Numerology Report</h2>
        <p>Insights based on your name and date of birth</p>
      </div>

      {/* NUMBER CARDS */}
      <div className={styles.cardsGrid}>
        {cards.map((item) => (
          <div key={item.category} className={styles.card}>
            <span className={styles.ttsBtn}>
              <TTSButton text={`${item.title}. Number ${item.number}. ${item.description}${item.master ? '. Master Number' : ''}`} />
            </span>
            <div className={styles.cardContent}>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.text}>{item.description}</p>
              {item.master && (
                <span className={styles.master}>Master Number</span>
              )}
            </div>
            <div className={styles.circle}>{item.number}</div>
          </div>
        ))}
      </div>

      {/* Calculate Again */}
      <button className={styles.calculateBtn} onClick={() => navigate("/numerology-calculator")}>
        Calculate Again
      </button>

      {/* Connect Card */}
      <div className={styles.connectCardWrap}>
        <ConnectCard />
      </div>
    </div>
  );
};

export default NumerologyReport;
