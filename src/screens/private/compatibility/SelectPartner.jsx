import { zodiacList } from "./zodiacList";
import { useParams, Link } from "react-router-dom";
import DividerWithImage from "../../../component/UI/DividerWithImage";
import ShubhTalkLogo from "../../../assets/icons/logo.png";
import styles from "./Compatibility.module.scss";

const SelectPartner = () => {
  const { p1 } = useParams();

  // Find selected sign data
  const selectedSign = zodiacList.find(
    (z) => z.id.toString() === p1.toString()
  );

  return (
    <div className={styles.wrapper}>

      {/* ---------- SELECTED SIGN HEADER ---------- */}
      <h1 className={styles.selectedName}>{selectedSign?.name}</h1>

      <div className={styles.selectedIconWrapper}>
        <img
          src={selectedSign?.img}
          alt={selectedSign?.name}
          className={styles.selectedIcon}
        />
      </div>

      <p className={styles.selectedDescription}>{selectedSign?.description}</p>

      {/* Divider */}
      <DividerWithImage imageSrc={ShubhTalkLogo} />

      {/* ---------- PARTNER SELECTION ---------- */}
      <h2 className={styles.sectionTitle}>Choose Your Partner Sign</h2>

      <div className={styles.signGrid}>
        {zodiacList.map((z) => (
          <Link key={z.id} to={`/compatibility/result/${p1}/${z.id}`}>
            <div className={styles.signCard}>
              <img src={z.img} alt={z.name} className={styles.partnerImg} />
              <h4>{z.name}</h4>
              <p>{z.date}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SelectPartner;
