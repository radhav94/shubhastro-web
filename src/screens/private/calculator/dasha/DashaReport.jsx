import { useNavigate } from "react-router-dom";
import { useGetDashaRepQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./DashaReport.module.scss";
import CalcBackButton from "../CalcBackButton";

const DashaReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("dasha_calc"));
  const { data, isLoading } = useGetDashaRepQuery(stored);

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (!data?.response?.dashas) return <div>No data found</div>;

  const dashas = data.response.dashas;

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />
      {/* HEADER */}
      <h2 className={styles.title}>
        {stored?.name
          ? `${stored.name}'s Planetary Dasha Periods`
          : "Planetary Dasha Periods"}
      </h2>

      <p className={styles.subtitle}>
        Complete analysis of your planetary periods and their influences
      </p>

      {/* =========================
          ALL DASHAS (FULL CARDS)
         ========================= */}
      <div className={styles.cardsGrid}>
        {dashas.map((item, index) => (
          <div key={index} className={styles.dashaCard}>
            <div className={styles.cardHeader}>
              <h3>
                {item.dasha} Mahadasha
                {index === 0 && (
                  <span className={styles.badge}>Birth Dasha</span>
                )}
              </h3>

              <span className={styles.date}>
                {item.dasha_start_year} – {item.dasha_end_year}
              </span>
            </div>

            <div className={styles.highlight}>
              {item.planet_in_zodiac
                ? item.planet_in_zodiac
                : "No data available"}
            </div>

            {item.prediction && (
              <p className={styles.description}>{item.prediction}</p>
            )}
          </div>
        ))}
      </div>

      {/* =========================
    PERIOD TIMELINE SUMMARY
========================= */}
      <div className={styles.timeline}>
        {dashas.map((item, index) => (
          <div
            key={index}
            className={`${styles.timelineRow} ${
              index % 2 === 0 ? styles.left : styles.right
            }`}
          >
            {/* DOT */}
            <span className={styles.dot} />

            {/* CARD */}
            <div className={styles.timelineCard}>
              <h4>{item.dasha} Period</h4>

              <span className={styles.timelineDate}>
                {item.dasha_start_year} – {item.dasha_end_year}
              </span>

              {/* <p className={styles.timelineText}>
                {item.planet_in_zodiac || "No data available"}
              </p> */}
            </div>
          </div>
        ))}
      </div>

      {/* =========================
              ACTIONS
         ========================= */}
      <div className={styles.actions}>
        <button
          className={styles.shareBtn}
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "My Dasha Report",
                text: "Check out my planetary dasha periods",
              });
            }
          }}
        >
          Share it with others
        </button>

        <button className={styles.calculateBtn} onClick={() => navigate(-1)}>
          Calculate Again
        </button>
      </div>
    </div>
  );
};

export default DashaReport;
