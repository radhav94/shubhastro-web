import styles from "./EntityCards.module.scss";

const DefaultEntityCard = ({ item, onClick }) => (
  <div className={styles.card} onClick={() => onClick?.(item)}>
    <div className={styles.cardDetails}>
      <h3 className={styles.cardName}>{item.name || item.title || item._id}</h3>
      {item.description && <p className={styles.cardSub}>{item.description}</p>}
    </div>
  </div>
);

export default DefaultEntityCard;
