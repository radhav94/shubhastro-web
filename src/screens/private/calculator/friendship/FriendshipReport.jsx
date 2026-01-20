import { useNavigate } from "react-router-dom";
import { useFriendshipCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./FriendshipReport.module.scss";

const FriendshipReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("friendship_calculator"));

  const [friendshipCalculator, { data, isLoading, isError }] =
    useFriendshipCalculatorMutation();

  useEffect(() => {
    if (!stored) return;

    friendshipCalculator(stored)
      .unwrap()
      .catch((err) => {
        console.error("Friendship calculator error:", err);
      });
  }, []); // run once

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (isError) return <div className={styles.center}>No data found</div>;

  const report = data?.data;
  if (!report) return null;

  return (
    <div className={styles.wrapper}>
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
                #f59e0b ${report.score * 3.6}deg,
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

        {/* ACTION */}
        <button
          onClick={() =>
            navigator.share?.({
              title: "Friendship Report",
              text: "Check out my Friendship Report",
            })
          }
          className={styles.shareBtn}
        >
          🔗 Share it with others
        </button>
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
