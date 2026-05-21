import { useSelector } from "react-redux";
import { useGetNumerologyReportQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./NumerologyReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";
import TTSButton from "../../../../component/UI/TTSButton";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";

const NumerologyReport = () => {

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
        <div className={styles.headingUnderline}>
          <div className={styles.dividerLine}>
            <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
              <line y1="0.5" x2="93" y2="0.5" stroke="#030303" />
            </svg>
          </div>
          <span className={styles.dividerMoon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
              <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303" />
            </svg>
          </span>
          <div className={styles.dividerLine}>
            <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
              <line y1="0.5" x2="93" y2="0.5" stroke="#030303" />
            </svg>
          </div>
        </div>
        <p>Insights based on your name and date of birth</p>
      </div>

      {/* NUMBER CARDS */}
      <div className={styles.cardsGrid}>
        {cards.map((item) => (
          <div key={item.category} className={styles.card}>
            <div className={styles.cardContent}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <h3 className={styles.title}>{item.title}</h3>
                <span style={{ marginLeft: "auto", display: "inline-flex" }}>
                  <TTSButton text={`${item.title}. Number ${item.number}. ${item.description}${item.master ? '. Master Number' : ''}`} />
                </span>
              </div>
              <p className={styles.text}>{item.description}</p>
              {item.master && (
                <span className={styles.master}>Master Number</span>
              )}
            </div>
            <div className={styles.circle}>{item.number}</div>
          </div>
        ))}
      </div>

      {/* Connect Card */}
      <div className={styles.connectCardWrap}>
        <ConnectCard />
      </div>
    </div>
  );
};

export default NumerologyReport;
