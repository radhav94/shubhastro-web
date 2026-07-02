import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetKaalSarpReportQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./KaalSarpReport.module.scss";
import { BsCheckCircleFill } from "react-icons/bs";
import CalcBackButton from "../CalcBackButton";
import TTSButton from "../../../../component/UI/TTSButton";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";

const KaalSarpReport = () => {
  const navigate = useNavigate();

  const stored = useSelector(selectCalculatorData("kaal_sarp"));
  const { data, isLoading } = useGetKaalSarpReportQuery(stored, { skip: !stored });

  if (!stored || isLoading) return <PrimaryLoader isLoading={true} />;
  if (!data?.response) return <div>No data found</div>;

  const { is_dosha_present, bot_response, remedies } = data.response;

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />
      {/* HEADER CARD */}
      <div className={styles.headerCard} style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
          <TTSButton text={`Kaal Sarp Yog. ${is_dosha_present ? 'Present' : 'Not Present'}. ${bot_response || ''}`} />
        </span>
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
        <div className={styles.remediesSection} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
            <TTSButton text={`Recommended Remedies. ${remedies.join('. ')}`} />
          </span>
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
          style={{ display: 'none' }}
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

        <button className={styles.calculateBtn} onClick={() => navigate("/kaal-sarpa-dosh-calculator")}>
          Calculate Again
        </button>
      </div>

      <ConnectCard />
    </div>
  );
};

export default KaalSarpReport;
