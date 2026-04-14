import { useNavigate } from "react-router-dom";
import { useGetNumerologyReportQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./NumerologyReport.module.scss";
import CalcBackButton from "../CalcBackButton";

const NumerologyReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("numerology_report"));
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
        <h2>{stored?.name}'s Numerology Report</h2>
        <p>Insights based on your name and date of birth</p>
      </div>

      {/* NUMBER CARDS */}
      <div className={styles.cardsGrid}>
        {cards.map((item) => (
          <div key={item.category} className={styles.card}>
            <div className={styles.circle}>{item.number}</div>
            <div className={styles.cardContent}>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.text}>{item.description}</p>
              {item.master && (
                <span className={styles.master}>Master Number</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 👇 PERSONAL DETAILS */}
      <div className={styles.detailsGrid}>
        <div className={styles.detailCard}>
          <h4>✨ Name</h4>
          <p>{stored?.name || "—"}</p>
        </div>

        <div className={styles.detailCard}>
          <h4>✨ Date Of Birth</h4>
          <p>{stored?.dob || "—"}</p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className={styles.actions}>
        <button className={styles.calculateBtn} onClick={() => navigate(-1)}>
          Calculate Again
        </button>
      </div>
    </div>
  );
};

export default NumerologyReport;
