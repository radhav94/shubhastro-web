import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetRashiCalQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./RashiReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import TTSButton from "../../../../component/UI/TTSButton";
import { zodiacSignImages } from "../../horoscope/zodiac";

const RashiReport = () => {
  const navigate = useNavigate();
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(true);

  const stored = JSON.parse(localStorage.getItem("rashi_moon_sign"));
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
    <div className={styles.wrapper}>
      <CalcBackButton />

      {/* HEADER */}
      <h2 className={styles.title}>
        {stored?.name
          ? `${stored.name.toUpperCase()}'S RASHI REPORT`
          : "RASHI REPORT"}
      </h2>
      <div className={styles.headingUnderline}>
        <div className={styles.dividerLine}>
          <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
            <line y1="0.5" x2="93" y2="0.5" stroke="#030303" />
          </svg>
        </div>
        <span className={styles.dividerMoon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
            <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303" />
          </svg>
        </span>
        <div className={styles.dividerLine}>
          <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
            <line y1="0.5" x2="93" y2="0.5" stroke="#030303" />
          </svg>
        </div>
      </div>

      {/* RASHI CARD */}
      {moon_sign && (
        <div className={styles.rashiCard}>
          <div>
            <span className={styles.label}>Your Rashi</span>
            <h3 className={styles.rashiName}>{moon_sign}</h3>
          </div>
          {signImage && (
            <img src={signImage} alt={moon_sign} className={styles.rashiIcon} />
          )}
        </div>
      )}

      {/* CALCULATE AGAIN */}
      <div className={styles.calcAgainWrap}>
        <button className={styles.calcAgainBtn} onClick={() => navigate(-1)}>
          Calculate Again
        </button>
      </div>

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
  );
};

export default RashiReport;
