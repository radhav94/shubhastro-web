import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetSunSignQuery } from "../../../../redux/api/calculator/calcApi";
import styles from "./SunSignReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import CalcReportLoader from "../CalcReportLoader";
import { Share2 } from "lucide-react";
import { zodiacSignImages } from "../../horoscope/zodiac";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";

const SunSignReport = () => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const stored = useSelector(selectCalculatorData("sun_sign"));
  const { data, isLoading } = useGetSunSignQuery(stored, { skip: !stored });

  // Reserves in-flow height while the request runs — see CalcReportLoader.
  if (!stored || isLoading) return <CalcReportLoader message="Finding your sun sign…" />;
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
            onClick={() => navigate("/sun-sign-calculator")}
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
