import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetRisingSignQuery } from "../../../../redux/api/calculator/calcApi";
import styles from "./RisingSignReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import TTSButton from "../../../../component/UI/TTSButton";
import { zodiacSignImages } from "../../horoscope/zodiac";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";

const RisingSignReport = () => {
  const navigate = useNavigate();
  const [aboutOpen, setAboutOpen] = useState(true);

  const stored = useSelector(selectCalculatorData("rising_sign"));
  const { data, isLoading } = useGetRisingSignQuery(stored);

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (!data?.response) return <div>No data found</div>;

  const { ascendant, bot_response, prediction } = data.response;
  const signKey = ascendant?.toLowerCase();
  const signImage = zodiacSignImages[signKey];

  return (
    <>
    <div className={styles.wrapper}>
      <CalcBackButton />

      {/* HEADER */}
      <h2 className={styles.title}>
        {stored?.name
          ? `${stored.name.toUpperCase()}'S RISING SIGN REPORT`
          : "RISING SIGN REPORT"}
      </h2>

      {/* RISING SIGN CARD */}
      {ascendant && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderText}>
              Your rising sign is {ascendant}
            </span>
          </div>

          {signImage && (
            <div className={styles.signImageWrap}>
              <img src={signImage} alt={ascendant} className={styles.signImage} />
            </div>
          )}

          <h3 className={styles.signName}>{ascendant}</h3>

          <button
            className={styles.backBtn}
            onClick={() => navigate(-1)}
          >
            Calculate Again
          </button>
        </div>
      )}

      {/* ABOUT ASCENDANT ACCORDION */}
      {(bot_response || prediction) && (
        <div className={styles.predictionBox}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() => setAboutOpen((prev) => !prev)}
            aria-expanded={aboutOpen}
          >
            <span>About Your Ascendant</span>
            <span className={styles.ttsWrap}>
              <TTSButton text={`About Your Ascendant. ${prediction || ''} ${bot_response || ''}`} />
              <svg
                className={`${styles.chevron} ${aboutOpen ? styles.chevronOpen : ""}`}
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e84d00"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>
          <div className={`${styles.accordionBody} ${aboutOpen ? styles.accordionBodyOpen : ""}`}>
            {prediction && <p>{prediction}</p>}
            {bot_response && <p className={styles.botText}>{bot_response}</p>}
          </div>
        </div>
      )}
    </div>

    <ConnectCard />
  </>
  );
};

export default RisingSignReport;
