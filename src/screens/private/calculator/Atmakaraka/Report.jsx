import { useNavigate } from "react-router-dom";
import { useGetAtmakarakaQuery } from "../../../../redux/api/calculator/calcApi";
import styles from "./AtmakarakaReport.module.scss";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import CalcBackButton from "../CalcBackButton";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";

const AtmakarakaReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("atmakaraka-and-darakaraka"));

  const { data, isLoading } = useGetAtmakarakaQuery(stored);

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;
  if (!data?.response) return <div>No data found</div>;

  // 🔥 Convert response object to array
  const karakas = Object.values(data.response);

  return (
    <div className={styles.wrapper}>
      <CalcBackButton />
      {/* HEADER */}
      <h2 className={styles.title}>{stored?.name}'s Karaka Analysis</h2>
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
      <p className={styles.subtitle}>Atmakaraka & Karaka Overview</p>

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
      {/* <div className={styles.actions}>
        <button className={styles.calculateBtn} onClick={() => navigate(-1)}>
          Calculate Again
        </button>
      </div> */}

        {/* Connect Card between accordion items */}
                <div className={styles.connectCardWrap}>
                  <ConnectCard />
                </div>
    </div>
  );
};

export default AtmakarakaReport;
