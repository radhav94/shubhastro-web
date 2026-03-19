import { useLocation, useNavigate } from "react-router-dom";
import styles from "./BookingSuccess.module.scss";
import { FiCheckCircle } from "react-icons/fi";

const BookingSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pooja, pandit, date, time } = location.state || {};

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <FiCheckCircle className={styles.icon} />
        <h1>Booking Confirmed!</h1>
        <p className={styles.sub}>
          Your pooja has been booked successfully
        </p>

        {pooja && (
          <div className={styles.details}>
            <div className={styles.row}>
              <span>Pooja</span>
              <strong>{pooja.title || pooja.name}</strong>
            </div>
            {pandit && (
              <div className={styles.row}>
                <span>Pandit</span>
                <strong>{pandit.firstName} {pandit.lastName}</strong>
              </div>
            )}
            {date && (
              <div className={styles.row}>
                <span>Date</span>
                <strong>
                  {new Date(date).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
              </div>
            )}
            {time && (
              <div className={styles.row}>
                <span>Time</span>
                <strong>{time}</strong>
              </div>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => navigate("/astromall")}>
            Browse More Poojas
          </button>
          <button className={styles.secondaryBtn} onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
