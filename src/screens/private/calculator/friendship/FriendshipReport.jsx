import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useFriendshipCalculatorMutation } from "../../../../redux/api/calculator/calcApi";
import { useEffect } from "react";
import CalcReportLoader from "../CalcReportLoader";
import styles from "./FriendshipReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";
import Toast from "../../../../component/toast";
import profileImg from "../../../../assets/images/Profile image.png";

const FriendshipReport = () => {
  const navigate = useNavigate();

  const stored = useSelector(selectCalculatorData("friendship_calculator"));

  const [friendshipCalculator, { data, isLoading }] =
    useFriendshipCalculatorMutation();

  useEffect(() => {
    /*
      No stored input means there is nothing to calculate.

      This used to just `return`, which left `data` undefined and fell into the
      `isLoading || !data` branch below — so the screen rendered "Checking your
      match…" permanently. Anyone reaching /friendship-calculator/report without
      submitting the form first (a bookmark, a shared link, or Back after the
      store was cleared) sat on a loader that could never resolve, with nothing
      on screen to press. Send them to the form that produces the input.
    */
    if (!stored) {
      navigate("/friendship-calculator", { replace: true });
      return;
    }

    friendshipCalculator(stored)
      .unwrap()
      .catch((err) => {
        /*
          Say why, then bounce.

          `message` was already being built on this line and then thrown away, so
          a failed calculation silently teleported the visitor back to the form
          with no explanation at all. The natural reading of that is "my input was
          rejected", so they retype the same two names and submit again — and get
          the same silent bounce. That is the repeated submit / "Calculate Again"
          run Clarity recorded on this calculator between 06:44 and 08:56.
        */
        const message =
          err?.data?.message || "Something went wrong. Please try again.";
        Toast.error(message);
        navigate("/friendship-calculator", { replace: true });
      });
  }, []); // run once

  // Reserves in-flow height while the request runs — see CalcReportLoader.
  if (isLoading || !data) return <CalcReportLoader message="Checking your match…" />;

  const report = data?.data;
  if (!report) return null;

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />
      {/* HEADER */}
      <h3 className={styles.title}>FRIENDSHIP COMPATIBILITY</h3>

      <div className={styles.card}>
        <p className={styles.subtitle}>Your connection results</p>

        {/* NAMES */}
        <div className={styles.namesRow}>
          <div className={styles.nameBox}>{report.name1}</div>
          <div className={styles.connector}>
            <img src={profileImg} alt="handshake" className={styles.connectorImg} />
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
              <span>Match</span>
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

      <ConnectCard />
    </div>
  );
};

export default FriendshipReport;
