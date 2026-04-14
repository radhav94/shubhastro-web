import { useNavigate } from "react-router-dom";
import { useLoveCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import styles from "./LoveReport.module.scss";
import { PrimaryText } from "../../../../component";
import DividerWithImage from "../../../../component/UI/DividerWithImage";
import ShubhTalkLogo from "../../../../assets/icons/logo.png";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import CalcBackButton from "../CalcBackButton";

const LoveReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("love_calculator"));

  const [loveCalculator, { data, isLoading, isError, error }] =
    useLoveCalculatorMutation();

  useEffect(() => {
    if (!stored) return;

    loveCalculator(stored)
      .unwrap()
      .catch((err) => {
        console.error("Love calculator error:", err);
      });
  }, []); // run once

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (isError) return <div>No data found</div>;

  const report = data?.data;

  if (!report) return null;

  return (
    <div style={{ margin: "0 3rem" }}>
      <CalcBackButton />
      <PrimaryText isCenter isSemiBold size_24>
        Love Calculator: Find Your Perfect Match and Discover True Love
      </PrimaryText>
      <div style={{ margin: "0 1rem" }}>
        <DividerWithImage imageSrc={ShubhTalkLogo} />
      </div>
      <PrimaryText style={{ color: "gray", marginTop: "0.5rem" }} size_16>
        Have you ever thought if you and your crush are a perfect match? A love
        calculator is a fun and simple tool that tells you your love percentage
        and how well you both connect. Just enter names, birth dates, or even
        zodiac signs, and see the result!
      </PrimaryText>
      <PrimaryText style={{ margin: "1rem 0rem", color: "gray" }} size_16>
        Finding love isn’t always easy, but tools like the love calculator make
        it exciting. They help you understand your feelings and check your
        romantic compatibility. Many people use it for fun and to explore their
        bond before starting a relationship. Try it and see what your stars say!
      </PrimaryText>
      <div className={styles.wrapper}>
        <h2 className={styles.heading}>Your Love Percentage</h2>

        <div className={styles.card}>
          <p className={styles.subText}>Percentage of love between</p>
          <h3 className={styles.names}>
            {report.name1} & {report.name2}
          </h3>

          <div className={styles.content}>
            {/* LEFT CIRCLE */}
            <div className={styles.circleWrapper}>
              <div className={styles.circle}>
                <span>{report.score}%</span>
              </div>
            </div>

            {/* DIVIDER */}
            <div className={styles.divider} />

            {/* RIGHT TEXT */}
            <div className={styles.textBox}>
              <h4>{report.title}</h4>
              <p>{report.description}</p>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.primaryBtn}
              onClick={() => navigate("/horoscopes/todays-horoscope")}
            >
              ❤ Get Today's Love Horoscope
            </button>
            <button
              className={styles.secondaryBtn}
              onClick={() =>
                navigator.share?.({
                  title: "Love Report",
                  text: "Check out my Love Report",
                })
              }
            >
              🔗 Share It with others
            </button>
          </div>
        </div>

        <button
          className={styles.againBtn}
          onClick={() => navigate("/love-calculator")}
        >
          ⟳ Calculate Again
        </button>
      </div>
    </div>
  );
};

export default LoveReport;
