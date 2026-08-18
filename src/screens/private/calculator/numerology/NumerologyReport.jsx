import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetNumerologyReportQuery } from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./NumerologyReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";
import TTSButton from "../../../../component/UI/TTSButton";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";

const CALCULATOR_PATH = "/numerology-calculator";

const NumerologyReport = () => {
  const navigate = useNavigate();

  const stored = useSelector(selectCalculatorData("numerology_report"));
  // isError and refetch were not read, so a failed request was indistinguishable
  // from an empty one — both fell through to a bare "No data found".
  const { data, isLoading, isError, refetch } = useGetNumerologyReportQuery(stored, {
    skip: !stored,
  });

  /*
   * Every state on this screen renders through this shell.
   *
   * The three guard clauses used to return *above* <CalcBackButton />, so the
   * only states a visitor could get stuck in were also the only ones with no way
   * back — no header, no back control, nothing to press. Keeping the back bar in
   * the shell means there is always an exit.
   */
  const renderState = ({ title, text, actions }) => (
    <div className={styles.wrapper}>
      <CalcBackButton />
      <div className={styles.stateCard}>
        <h2 className={styles.stateTitle}>{title}</h2>
        <p className={styles.stateText}>{text}</p>
        <div className={styles.stateActions}>{actions}</div>
      </div>
    </div>
  );

  /*
   * No form data in the store.
   *
   * The calculator slice is in the redux-persist whitelist, so a refresh keeps
   * it — but this is still reachable two ways: a visitor opening
   * /numerology-calculator/report directly (shared link, bookmark, search
   * result), and anyone who logs out, since logout dispatches
   * clearAllCalculatorData. Both used to land on a fullscreen loader that never
   * resolved, because the query is skipped when there is nothing to send.
   */
  if (!stored) {
    return renderState({
      title: "We don't have your details yet",
      text: "Enter your name and date of birth to generate a numerology report.",
      actions: (
        <button
          type="button"
          className={styles.statePrimary}
          onClick={() => navigate(CALCULATOR_PATH, { replace: true })}
        >
          Open the calculator
        </button>
      ),
    });
  }

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <CalcBackButton />
        {/* fullscreen={false}: the default raises a z-index 999999 overlay that
            covers the global header, so the page cannot be left while it shows. */}
        <PrimaryLoader isLoading fullscreen={false} message="Calculating your numbers…" />
      </div>
    );
  }

  if (isError) {
    return renderState({
      title: "Couldn't generate your report",
      text: "The calculation didn't come through. This is usually a connection hiccup — nothing was charged.",
      actions: (
        <>
          <button type="button" className={styles.statePrimary} onClick={() => refetch()}>
            Try again
          </button>
          <button
            type="button"
            className={styles.stateSecondary}
            onClick={() => navigate(CALCULATOR_PATH)}
          >
            Change my details
          </button>
        </>
      ),
    });
  }

  /*
   * The seven numbers, with the missing ones dropped.
   *
   * This used to be a plain array fed straight into .map(), reading
   * `item.category` for the key and `item.title` for the heading. A payload
   * missing any one of the seven keys made `item` undefined and the property
   * access threw, blanking the screen through the error boundary rather than
   * rendering the six numbers that did arrive.
   */
  const cards = [
    data?.response?.destiny,
    data?.response?.soul,
    data?.response?.character,
    data?.response?.personality,
    data?.response?.attitude,
    data?.response?.agenda,
    data?.response?.purpose,
  ].filter((item) => item && (item.title || item.number !== undefined));

  if (cards.length === 0) {
    return renderState({
      title: "No results for those details",
      text: "We couldn't derive any numbers from the name and date of birth provided. Check them and try again.",
      actions: (
        <button
          type="button"
          className={styles.statePrimary}
          onClick={() => navigate(CALCULATOR_PATH)}
        >
          Change my details
        </button>
      ),
    });
  }

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />
      {/* HEADER */}
      <div className={styles.header}>
        <h2>{stored?.name}&apos;s Numerology Report</h2>
        <p>Insights based on your name and date of birth</p>
      </div>

      {/* NUMBER CARDS */}
      <div className={styles.cardsGrid}>
        {cards.map((item, index) => (
          // Index fallback because `category` is not guaranteed to be present,
          // and a duplicate/undefined key silently breaks reconciliation.
          <div key={item.category || `${item.title}-${index}`} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.title}>{item.title}</h3>
              <span className={styles.ttsBtn}>
                <TTSButton text={`${item.title}. Number ${item.number}. ${item.description}${item.master ? '. Master Number' : ''}`} />
              </span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardContent}>
                <p className={styles.text}>{item.description}</p>
                {item.master && (
                  <span className={styles.master}>Master Number</span>
                )}
              </div>
              <div className={styles.circle}>{item.number}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Calculate Again */}
      <button className={styles.calculateBtn} onClick={() => navigate(CALCULATOR_PATH)}>
        Calculate Again
      </button>

      {/* Connect Card */}
      <div className={styles.connectCardWrap}>
        <ConnectCard />
      </div>
    </div>
  );
};

export default NumerologyReport;
