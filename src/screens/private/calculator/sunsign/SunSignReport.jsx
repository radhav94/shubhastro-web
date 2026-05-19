import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetSunSignQuery } from "../../../../redux/api/calculator/calcApi";
import styles from "./SunSignReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import { Share2 } from "lucide-react";
import { zodiacSignImages } from "../../horoscope/zodiac";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";

const SunSignReport = () => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const stored = useSelector(selectCalculatorData("sun_sign"));
  const { data, isLoading } = useGetSunSignQuery(stored);

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (!data?.response) return <div>No data found</div>;

  const { sun_sign, prediction, bot_response } = data.response;
  const signKey = sun_sign?.toLowerCase();
  const signImage = zodiacSignImages[signKey];

  const handleShare = async () => {
    const shareData = {
      title: `${stored?.name}'s Sun Sign Report`,
      text: `My sun sign is ${sun_sign}! Check yours on ShubhAstro.`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // user cancelled share
    }
  };

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />

      {/* HEADER */}
      <h2 className={styles.title}>
        {stored?.name
          ? `${stored.name.toUpperCase()}'S SUN SIGN REPORT`
          : "SUN SIGN REPORT"}
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

      {/* SUN SIGN CARD */}
      {sun_sign && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderText}>
              Your sun sign is {sun_sign}
            </span>
            <button
              type="button"
              className={styles.shareBtn}
              onClick={handleShare}
              aria-label="Share result"
              style={{ display: 'none' }}
            >
              <Share2 size={18} />
            </button>
          </div>

          {signImage && (
            <div className={styles.signImageWrap}>
              <img src={signImage} alt={sun_sign} className={styles.signImage} />
            </div>
          )}

          <h3 className={styles.signName}>{sun_sign}</h3>

          <button
            className={styles.backBtn}
            onClick={() => navigate(-1)}
          >
            Calculate Again
          </button>
        </div>
      )}

      {/* PREDICTION ACCORDION */}
      {prediction && (
        <div className={styles.predictionBox}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
          >
            <span>Your Astrological Profile</span>
            <svg
              className={`${styles.chevron} ${profileOpen ? styles.chevronOpen : ""}`}
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
          <div className={`${styles.accordionBody} ${profileOpen ? styles.accordionBodyOpen : ""}`}>
            <p>{prediction}</p>
          </div>
        </div>
      )}

      <ConnectCard />
    </div>
  );
};

export default SunSignReport;
