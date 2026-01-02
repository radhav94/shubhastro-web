import { useNavigate } from "react-router-dom";
import { useGetMangalDoshaReportQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./MangalReport.module.scss";

const MangalReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("mangal_dosha"));
  const { data, isLoading } = useGetMangalDoshaReportQuery(stored);

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (!data?.response) return <div>No data found</div>;

  const {
    factors,
    is_dosha_present,
    is_dosha_present_mars_from_lagna,
    is_dosha_present_mars_from_moon,
    is_anshik,
    bot_response,
    score,
    cancellation,
  } = data.response;

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <div className={styles.header}>
        <h2>{stored?.name}'s Mangal Dosha Analysis</h2>
        <p>Complete astrological assessment</p>
      </div>

      {/* STATUS BADGE */}
      <div
        className={`${styles.statusBadge} ${
          is_dosha_present ? styles.manglik : styles.nonManglik
        }`}
      >
        {is_dosha_present ? "Manglik" : "Non Manglik"}
      </div>

      {/* BOT MESSAGE */}
      {bot_response && <div className={styles.botMessage}>{bot_response}</div>}

      {/* DOSHA OVERVIEW */}
      <div className={styles.section}>
        <h3>Dosha Status Overview</h3>

        <div className={styles.grid}>
          <div className={styles.card}>
            <span>Current Status</span>
            <strong>{is_dosha_present ? "Manglik" : "Non Manglik"}</strong>
          </div>

          <div className={styles.card}>
            <span>From Lagna</span>
            <strong>
              {is_dosha_present_mars_from_lagna ? "Manglik" : "Not Present"}
            </strong>
          </div>

          <div className={styles.card}>
            <span>From Moon</span>
            <strong>
              {is_dosha_present_mars_from_moon ? "Manglik" : "Not Present"}
            </strong>
          </div>
        </div>
      </div>

      {/* PLANETARY FACTORS */}
      <div className={styles.section}>
        <h3>Planetary Information</h3>

        <div className={styles.grid}>
          {factors?.mars && (
            <div className={styles.card}>
              <span>Mars Factor</span>
              <p>{factors.mars}</p>
            </div>
          )}

          {factors?.moon && (
            <div className={styles.card}>
              <span>Moon Factor</span>
              <p>{factors.moon}</p>
            </div>
          )}

          {factors?.venus && (
            <div className={styles.card}>
              <span>Venus Factor</span>
              <p>{factors.venus}</p>
            </div>
          )}
        </div>
      </div>

      {/* SCORE & CANCELLATION */}
      <div className={styles.section}>
        <h3>Dosha Score & Cancellation</h3>

        <div className={styles.grid}>
          <div className={styles.card}>
            <span>Manglik Percentage</span>
            <strong>{score}%</strong>
          </div>

          <div className={styles.card}>
            <span>Cancellation</span>
            <strong>
              {cancellation?.cancellationScore > 0 ? "Present" : "Not Present"}
            </strong>
          </div>

          <div className={styles.card}>
            <span>Anshik Dosha</span>
            <strong>{is_anshik ? "Yes" : "No"}</strong>
          </div>
        </div>
      </div>

      {/* DISCLAIMER */}
      <p className={styles.disclaimer}>
        This is a computer generated result. Please consult an astrologer to
        confirm and understand this in detail.
      </p>

      {/* ACTIONS */}
      <div className={styles.actions}>
        <button
          className={styles.shareBtn}
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "My Mangal Dosha Report",
                text: bot_response,
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

export default MangalReport;
