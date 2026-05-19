import { useNavigate } from "react-router-dom";
import { useFriendshipCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./FriendshipReport.module.scss";
import CalcBackButton from "../CalcBackButton";

const FriendshipReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("friendship_calculator"));

  const [friendshipCalculator, { data, isLoading }] =
    useFriendshipCalculatorMutation();

  useEffect(() => {
    if (!stored) return;

    friendshipCalculator(stored)
      .unwrap()
      .catch((err) => {
        const message =
          err?.data?.message || "Something went wrong. Please try again.";
        navigate("/friendship-calculator", { replace: true });
      });
  }, []); // run once

  if (isLoading || !data) return <PrimaryLoader isLoading={true} />;

  const report = data?.data;
  if (!report) return null;

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />
      <div className={styles.card}>
        {/* HEADER */}
        <h3 className={styles.title}>Friendship Compatibility</h3>
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
        <p className={styles.subtitle}>Your connection results</p>

        {/* NAMES */}
        <div className={styles.namesRow}>
          <div className={styles.nameBox}>{report.name1}</div>
          <div className={styles.connector}>🤝</div>
          <div className={styles.nameBox}>{report.name2}</div>
        </div>

        {/* SCORE */}
        <div className={styles.scoreWrapper}>
          <div
            className={styles.circle}
            style={{
              background: `conic-gradient(
                #f75801 ${report.score * 3.6}deg,
                #e5e7eb 0deg
              )`,
            }}
          >
            <div className={styles.innerCircle}>
              <h2>{report.score}%</h2>
              <span>MATCH</span>
            </div>
          </div>
        </div>

        {/* CALCULATE AGAIN */}
        <button
          className={styles.againBtn}
          onClick={() => navigate("/friendship-calculator")}
        >
          Calculate Again
        </button>
      </div>
    </div>
  );
};

export default FriendshipReport;
