import { useNavigate } from "react-router-dom";
import { useGetRashiCalQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./RashiReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import TTSButton from "../../../../component/UI/TTSButton";

const RashiReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("rashi_moon_sign"));
  const { data, isLoading } = useGetRashiCalQuery(stored);

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (!data?.response) return <div>No data found</div>;

  const { moon_sign, bot_response, prediction } = data.response;

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />
      {/* HEADER */}
      <h2 className={styles.title}>
        {stored?.name ? `${stored.name}'s Rashi Report` : "Rashi Report"}
      </h2>

      {/* RASHI CARD */}
      {moon_sign && (
        <div className={styles.rashiCard}>
          <div>
            <span className={styles.label}>Your Rashi</span>
            <h3 className={styles.rashiName}>{moon_sign}</h3>
          </div>
        </div>
      )}

      {/* PERSONAL DETAILS */}
      <div className={styles.detailsCard}>
        <h4>Personal Details</h4>

        <div className={styles.detailsGrid}>
          {stored?.name && (
            <div>
              <span>Name</span>
              <p>{stored.name}</p>
            </div>
          )}

          {stored?.gender && (
            <div>
              <span>Gender</span>
              <p>{stored.gender}</p>
            </div>
          )}

          {stored?.dob && (
            <div>
              <span>Date of Birth</span>
              <p>{stored.dob}</p>
            </div>
          )}

          {stored?.place && (
            <div>
              <span>Place of Birth</span>
              <p>{stored.place}</p>
            </div>
          )}
        </div>
      </div>

      {/* ABOUT RASHI */}
      {(prediction || bot_response) && (
        <div className={styles.aboutBox} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
            <TTSButton text={`About Your Rashi. ${prediction || ''} ${bot_response || ''}`} />
          </span>
          <h4>About Your Rashi</h4>

          {prediction && <p>{prediction}</p>}

          {bot_response && <p className={styles.botText}>{bot_response}</p>}
        </div>
      )}

      {/* ACTION */}
      <div className={styles.actions}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          Back to Calculator
        </button>
      </div>
    </div>
  );
};

export default RashiReport;
