import { useNavigate } from "react-router-dom";
import { useGetAtmakarakaQuery } from "../../../../redux/api/calculator/calcApi";
import styles from "./AtmakarakaReport.module.scss";

const AtmakarakaReport = () => {
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem("atmakaraka-and-darakaraka"));

  const { data, isLoading } = useGetAtmakarakaQuery(stored);

  if (isLoading) return <div>Loading...</div>;
  if (!data?.response) return <div>No data found</div>;

  // 🔥 Convert response object to array
  const karakas = Object.values(data.response);

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <h2 className={styles.title}>{stored?.name}'s Karaka Analysis</h2>
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
      <div className={styles.actions}>
        <button
          className={styles.shareBtn}
          onClick={() =>
            navigator.share?.({
              title: "Karaka Analysis",
              text: "Check out my Karaka Analysis",
            })
          }
        >
          Share it with others
        </button>

        <button className={styles.calculateBtn} onClick={() => navigate(-1)}>
          Calculate Again
        </button>
      </div>
    </div>
  );
};

export default AtmakarakaReport;
