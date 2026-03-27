import { ShoppingBag } from "lucide-react";
import styles from "./EntityCards.module.scss";

const statusColors = {
  completed: "#4caf50",
  failure: "#f44336",
  initiated: "#ff9800",
};

const OrderCard = ({ item, onClick }) => (
  <div className={styles.card} onClick={() => onClick?.(item)}>
    <div className={styles.iconCircle}>
      <ShoppingBag size={24} />
    </div>
    <div className={styles.cardDetails}>
      <h3 className={styles.cardName}>{item.planName}</h3>
      <p className={styles.cardAmount}>₹{item.totalPrice}</p>
      <span
        className={styles.statusBadge}
        style={{ color: statusColors[item.orderStatus] || "#999" }}
      >
        ● {item.orderStatus?.charAt(0).toUpperCase() + item.orderStatus?.slice(1)}
      </span>
    </div>
  </div>
);

export default OrderCard;
