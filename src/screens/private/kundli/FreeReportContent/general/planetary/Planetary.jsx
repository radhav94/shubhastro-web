import styles from './Planetary.module.scss'

const Planetary = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return <p>No planet data available.</p>;
  }

  return (
    <div className={styles.container}>
      {Object.keys(data).map((key) => {
        const planetData = data[key];
        return (
          <div key={key} className={styles.card}>
            <h3 className={styles.title}>
               <span>{planetData.planet}</span> Consideration
            </h3>
            <p className={styles.report}>{planetData.house_report}</p>
          </div>
        );
      })}
    </div>
  );
};

export default Planetary;