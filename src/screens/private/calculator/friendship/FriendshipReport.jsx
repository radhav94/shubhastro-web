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
        <div className={styles.header}>
          <h3>Friendship Compatibility</h3>
          <p>Your connection results</p>
        </div>

        {/* NAMES */}
        <div className={styles.namesRow}>
          <div className={styles.nameBox}>{report.name1}</div>
          <div className={styles.connector}>
            <span>🤝</span>
          </div>
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

          <div className={styles.badge}>{report.label}</div>
        </div>

        {/* ANALYSIS */}
        <div className={styles.analysis}>
          <h4>Your Friendship Analysis</h4>
          <p>{report.description}</p>
        </div>
      </div>

      <button
        className={styles.againBtn}
        onClick={() => navigate("/friendship-calculator")}
      >
        Calculate Again
      </button>
    </div>
  );
};

export default FriendshipReport;
