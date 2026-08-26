import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetAtmakarakaQuery } from "../../../../redux/api/calculator/calcApi";
import styles from "./AtmakarakaReport.module.scss";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import CalcBackButton from "../CalcBackButton";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";

const AtmakarakaReport = () => {
  const navigate = useNavigate();

  const stored = useSelector(selectCalculatorData("atmakaraka-and-darakaraka"));

  const { data, isLoading } = useGetAtmakarakaQuery(stored, { skip: !stored });

  /*
    Both of these used to contribute (almost) no height to the flow, which is the
    largest single source of the 1.335 CLS Clarity recorded on this route.

    `PrimaryLoader` defaults to `fullscreen`, which is `position: fixed` — so
    while the karaka request was in flight this route rendered an empty box.
    HomeLayout is `min-height: 100vh` with `.contentWrapper { flex: 1 }` and the
    footer as the next flex child, so an empty route pulls the (tall, mobile)
    footer up into the viewport. When the data landed, the back-button spacer,
    title, subtitle, an ~8-row table and the ConnectCard banner — roughly 550-650px
    — were inserted in one commit and shoved that footer back down. All of it
    after first paint, so all of it counts.

    Reserving the height up front means the footer starts below the fold and stays
    there, and `fullscreen={false}` keeps the loader in the space being reserved
    instead of covering the page.
  */
  if (!stored || isLoading) {
    return (
      <div className={styles.stateWrap}>
        <PrimaryLoader fullscreen={false} isLoading={true} message="Preparing your report…" />
      </div>
    );
  }

  if (!data?.response) {
    return (
      <div className={styles.stateWrap}>
        <CalcBackButton />
        <p className={styles.stateText}>
          We couldn&apos;t build this report. Please check your details and try again.
        </p>
        <button
          className={styles.calculateBtn}
          onClick={() => navigate("/atmakaraka-and-darakaraka-calculator")}
        >
          Calculate Again
        </button>
      </div>
    );
  }

  // 🔥 Convert response object to array
  const karakas = Object.values(data.response);

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />
      {/* HEADER */}
      <h2 className={styles.title}>{stored?.name}'s Karaka Analysis</h2>
      <p className={styles.subtitle}>Atmakaraka & DaraKaraka Overview</p>

      {/* TABLE */}
      <div className={styles.tableWrapper}>
        <table>
          <thead>
            <tr>
              <th>Karaka</th>
              <th>Planet</th>
              <th>Signifier</th>
              <th>House</th>
              <th>Zodiac</th>
              <th>Local Degree</th>
              <th>Global Degree</th>
            </tr>
          </thead>

          <tbody>
            {karakas.map((item, index) => (
              <tr key={index}>
                <td className={styles.karaka}>{item.name}</td>
                <td className={styles.planet}>{item.planet}</td>
                <td>{item.siginfier}</td>
                <td>{item.house}</td>
                <td>{item.zodiac}</td>
                <td>{item.local_degree.toFixed(2)}°</td>
                <td>{item.global_degree.toFixed(2)}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ACTIONS */}
      <button className={styles.calculateBtn} onClick={() => navigate("/atmakaraka-and-darakaraka-calculator")}>
        Calculate Again
      </button>

        {/* Connect Card between accordion items */}
                <div className={styles.connectCardWrap}>
                  <ConnectCard />
                </div>
    </div>
  );
};

export default AtmakarakaReport;
