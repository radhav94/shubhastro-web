import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetRashiCalQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./RashiReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import TTSButton from "../../../../component/UI/TTSButton";
import { zodiacSignImages } from "../../horoscope/zodiac";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";

const RashiReport = () => {
  const navigate = useNavigate();
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(true);

  const stored = useSelector(selectCalculatorData("rashi_moon_sign"));
  const { data, isLoading } = useGetRashiCalQuery(stored);

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (!data?.response) return <div>No data found</div>;

  const { moon_sign, bot_response, prediction } = data.response;
  const signKey = moon_sign?.toLowerCase();
  const signImage = zodiacSignImages[signKey];

  const formatDate = (dob) => {
    if (!dob) return "";
    const d = new Date(dob);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <>
    <div className={styles.wrapper}>
      <CalcBackButton />

      {/* HEADER */}
      <h2 className={styles.title}>
        {stored?.name
          ? `${stored.name.toUpperCase()}'S RASHI REPORT`
          : "RASHI REPORT"}
      </h2>

      {/* RASHI CARD */}
      {moon_sign && (
        <>
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <p className={styles.cardLabel}>Your Rashi</p>
              <h3 className={styles.signName}>{moon_sign}</h3>
            </div>
            {signImage && (
              <div className={styles.signImageWrap}>
                <img src={signImage} alt={moon_sign} className={styles.signImage} />
              </div>
            )}
          </div>
          <button className={styles.calcAgainBtn} onClick={() => navigate(-1)}>
            Calculate Again
          </button>
        </>
      )}

      {/* PERSONAL DETAILS ACCORDION */}
      <div className={styles.accordionBox}>
        <button
          type="button"
          className={styles.accordionHeader}
          onClick={() => setDetailsOpen((prev) => !prev)}
          aria-expanded={detailsOpen}
        >
          <span>Personal Details</span>
          <svg
            className={`${styles.chevron} ${detailsOpen ? styles.chevronOpen : ""}`}
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
        </button>
        <div className={`${styles.accordionBody} ${detailsOpen ? styles.accordionBodyOpen : ""}`}>
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
                <p style={{ textTransform: "capitalize" }}>{stored.gender}</p>
              </div>
            )}
            {stored?.dob && (
              <div>
                <span>Date of Birth</span>
                <p>{formatDate(stored.dob)}</p>
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
      </div>

      {/* ABOUT RASHI ACCORDION */}
      {(prediction || bot_response) && (
        <div className={styles.accordionBox}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() => setAboutOpen((prev) => !prev)}
            aria-expanded={aboutOpen}
          >
            <span>About Your Rashi</span>
            <span className={styles.ttsWrap}>
              <TTSButton text={`About Your Rashi. ${prediction || ''} ${bot_response || ''}`} />
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

export default RashiReport;
