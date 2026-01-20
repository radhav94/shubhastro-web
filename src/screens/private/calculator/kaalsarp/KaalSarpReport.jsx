import { useNavigate } from "react-router-dom";
import { useGetKaalSarpReportQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./KaalSarpReport.module.scss";
import { BsCheckCircleFill } from "react-icons/bs";

const KaalSarpReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("kaal_sarp"));
  const { data, isLoading } = useGetKaalSarpReportQuery(stored);

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (!data?.response) return <div>No data found</div>;

  const { is_dosha_present, bot_response, remedies } = data.response;

  return (
    <div className={styles.wrapper}>
      {/* HEADER CARD */}
      <div className={styles.headerCard}>
        <h2>{stored?.name}'s Kaal Sarp Yog</h2>
        <p className={styles.subTitle}>Analysis Result</p>

        <div
          className={`${styles.statusBadge} ${
            is_dosha_present ? styles.present : styles.notPresent
          }`}
        >
          {is_dosha_present ? "PRESENT" : "NOT PRESENT"}
        </div>

        {bot_response && <p className={styles.resultText}>{bot_response}</p>}
      </div>

      {/* REMEDIES */}
      {Array.isArray(remedies) && remedies.length > 0 && (
        <div className={styles.remediesSection}>
          <h3>Recommended Remedies</h3>
          <p className={styles.remedyHint}>
            These spiritual remedies are traditionally recommended to reduce the
            effects of Kaal Sarp Yog and enhance peace and stability.
          </p>

          <div className={styles.remedyList}>
            {remedies.map((remedy, index) => (
              <div key={index} className={styles.remedyCard}>
                <p>{remedy}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ACTION BUTTONS */}
      <div className={styles.actionsTop}>
        <button
          className={styles.shareBtn}
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "My Kaal Sarp Yog Report",
                text: bot_response,
              });
            }
          }}
        >
          Share Your Report
        </button>

        <button className={styles.calculateBtn} onClick={() => navigate(-1)}>
          Calculate Again
        </button>
      </div>
    </div>
  );
};

export default KaalSarpReport;
