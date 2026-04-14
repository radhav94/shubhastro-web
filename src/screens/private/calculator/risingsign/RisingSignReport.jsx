import { useNavigate } from "react-router-dom";
import { useGetRisingSignQuery } from "../../../../redux/api/calculator/calcApi";
import styles from "./RisingSignReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

const RisingSignReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("rising_sign"));
  const { data, isLoading } = useGetRisingSignQuery(stored);

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (!data?.response) return <div>No data found</div>;

  const { ascendant, bot_response, prediction } = data.response;

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />
      {/* HEADER */}
      <h2 className={styles.title}>
        {stored?.name
          ? `${stored.name}'s Rising Sign Report`
          : "Rising Sign Report"}
      </h2>

      {/* RISING SIGN CARD */}
      {ascendant && (
        <div className={styles.signCard}>
          <div className={styles.signText}>
            <h3>{ascendant}</h3>
          </div>
        </div>
      )}

      {/* ABOUT ASCENDANT */}
      {(bot_response || prediction) && (
        <div className={styles.aboutBox}>
          <h4>About Your Ascendant</h4>

          {prediction && <p>{prediction}</p>}

          {bot_response && <p className={styles.botText}>{bot_response}</p>}
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className={styles.actions}>
        <button
          className={styles.shareBtn}
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "My Rising Sign Report",
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

export default RisingSignReport;
