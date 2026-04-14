import { useNavigate } from "react-router-dom";
import { useGetSunSignQuery } from "../../../../redux/api/calculator/calcApi";
import styles from "./SunSignReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

const SunSignReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("sun_sign"));
  const { data, isLoading } = useGetSunSignQuery(stored);

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (!data?.response) return <div>No data found</div>;

  const { sun_sign, prediction, bot_response } = data.response;

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />
      {/* HEADER */}
      <h2 className={styles.title}>
        {stored?.name ? `${stored.name}'s Sun Sign Report` : "Sun Sign Report"}
      </h2>

      {/* SUN SIGN CARD */}
      {sun_sign && (
        <div className={styles.card}>
          <h3 className={styles.signName}>{sun_sign}</h3>

          {bot_response && <p className={styles.botText}>{bot_response}</p>}
        </div>
      )}

      {/* PREDICTION */}
      {prediction && (
        <div className={styles.predictionBox}>
          <h4>Your Astrological Profile</h4>
          <p>{prediction}</p>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className={styles.actions}>
        <button
          className={styles.shareBtn}
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "My Sun Sign Report",
                text: prediction || bot_response || "",
              });
            }
          }}
        >
          Share your report
        </button>

        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          Back to Calculator
        </button>
      </div>
    </div>
  );
};

export default SunSignReport;
