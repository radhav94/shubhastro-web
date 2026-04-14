import { useNavigate } from "react-router-dom";
import { useGetNumerologyReportQuery } from "../../../../redux/api/calculator/calcApi";
import ShubhTalkLogo from "../../../../assets/icons/logo.png";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./DestinyReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import { PrimaryText } from "../../../../component";

const DestinyReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("destiny_calc"));
  const { data, isLoading } = useGetNumerologyReportQuery(stored);

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (!data?.response?.destiny) return <div>No data found</div>;

  const destiny = data.response.destiny;

  return (
    <div style={{ margin: "0 3rem" }}>
      <CalcBackButton />
      <PrimaryText isCenter isSemiBold size_24>
        Destiny Number Calculator: Discover Your Life's Purpose
      </PrimaryText>
      <PrimaryText style={{ color: "gray", marginTop: "0.7rem" }} size_16>
        A <strong>destiny number calculator</strong> helps you find your true
        life purpose by using the numbers in your full birth name. It’s closely
        connected with other numerology numbers like your Soul Urge Number,
        Personality Number, and even your Name Number, which all reflect
        different layers of your spiritual identity.
      </PrimaryText>
      <PrimaryText style={{ color: "gray", marginTop: "1rem" }} size_16>
        It shows your natural talents, career direction, and spiritual path
        simply. This special tool can also uncover patterns that explain why
        certain things keep happening in your life. Understanding these patterns
        becomes even deeper when you look at bridge numbers and soul numbers,
        which fill the gap between your destiny and life paths.
      </PrimaryText>

      <div style={{ margin: "0 1rem" }}>
        <DividerWithImage imageSrc={ShubhTalkLogo} />
      </div>
      <div className={styles.wrapper}>
        {/* HEADER */}
        <h2 className={styles.pageTitle}>
          {stored?.name}'s Destiny Number Report
        </h2>

        {/* CARD */}
        <div className={styles.card}>
          <div className={styles.circle}>{destiny.number}</div>

          <h3 className={styles.cardTitle}>Destiny Number</h3>

          <h4 className={styles.subTitle}>
            {destiny.master ? "Master Number" : "The Explorer"}
          </h4>

          <p className={styles.description}>{destiny.meaning}</p>
        </div>

        {/* SHARE */}
        <button
          className={styles.shareBtn}
          onClick={() =>
            navigator.share?.({
              title: "Destiny Number  Report",
              text: "Check out my Destiny Number Report",
            })
          }
        >
          🔗 Share It with others
        </button>

        {/* AGAIN */}
        <button
          className={styles.againBtn}
          onClick={() => navigate("/destiny-number-calculator")}
        >
          Calculate Again
        </button>
      </div>
    </div>
  );
};

export default DestinyReport;
