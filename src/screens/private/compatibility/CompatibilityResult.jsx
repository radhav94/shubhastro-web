import { useParams } from "react-router-dom";
import { zodiacList } from "./zodiacList";
import styles from "./Compatibility.module.scss";
import { useGetSimpleCompatibilityQuery } from "../../../redux/api/compatibility/compatibilityApi";
import CompatibilitySignForm from "./CompatibilitySignForm";
import ConnectWithAstrologer from "./ConnectWithAstrologer";

const CompatibilityResult = () => {
  const { p1, p2 } = useParams();
  const { data, isLoading } = useGetSimpleCompatibilityQuery({
    sign1: p1,
    sign2: p2
  });

  const sign1 = zodiacList.find((z) => z.id === Number(p1));
  const sign2 = zodiacList.find((z) => z.id === Number(p2));

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className={styles.wrapper}>
    <h1 className={styles.selectedName} >{sign1.name} & {sign2.name} Compatibility</h1>

    <div className={styles.layout}>
      <div className={styles.leftContent}>
        <div className={styles.resultBox}>
          <h3>Compatibility Insights</h3>

          <div className={styles.progressWrapper}>
            <div
              className={styles.progress}
              style={{ width: `${data?.response?.match_percentage}%` }}
            />
          </div>

          <p className={styles.percentText}>
            {data?.response?.match_percentage}% Match
          </p>

          <p className={styles.description}>{data?.response?.description}</p>
        </div>
      </div>

      <div className={styles.rightSidebar}>
        <CompatibilitySignForm s1={sign1?.id} s2={sign2?.id} />
      </div>
    </div>
    <ConnectWithAstrologer/>
  </div>
  );
};

export default CompatibilityResult;
