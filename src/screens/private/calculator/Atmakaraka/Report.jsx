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

  if (!stored || isLoading) return <PrimaryLoader isLoading={true} />;
  if (!data?.response) return <div>No data found</div>;

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
