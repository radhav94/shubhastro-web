import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import styles from "./BookingSuccess.module.scss";
import { FiCheckCircle } from "react-icons/fi";

const AUTO_REDIRECT_SECONDS = 5;

const BookingSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  // Guard: only accessible after payment success (must have state)
  const hasAstromallState = !!state.total;
  const hasPoojaState = !!state.pooja;

  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);

  const handleUserAction = useCallback((path) => {
    setCountdown(null);
    navigate(path);
  }, [navigate]);

  useEffect(() => {
    if (!hasAstromallState && !hasPoojaState) return;
    if (countdown === null || countdown <= 0) {
      if (countdown === 0) navigate("/astromall", { replace: true });
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate, hasAstromallState, hasPoojaState]);

  if (!hasAstromallState && !hasPoojaState) {
    return <Navigate to="/astromall" replace />;
  }

  const { pooja, pandit, date, time, total, address } = state;

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <FiCheckCircle className={styles.icon} />
        <h1>Booking Confirmed!</h1>
        <p className={styles.sub}>
          {hasPoojaState
            ? "Your pooja has been booked successfully"
            : "Your payment was successful. Thank you for your purchase!"}
        </p>


        {hasPoojaState && (
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

        {hasAstromallState && (
          <div className={styles.details}>
            <div className={styles.row}>
              <span>Amount Paid</span>
              <strong>₹{Number(total).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            {address && (
              <div className={styles.row}>
                <span>Delivery To</span>
                <strong>
                  {address.name || ""}
                  {address.city ? `, ${address.city}` : ""}
                  {(address.pincode || address.pin) ? ` - ${address.pincode || address.pin}` : ""}
                </strong>
              </div>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => handleUserAction("/astromall")}>
            Browse Products
          </button>
          <button className={styles.secondaryBtn} onClick={() => handleUserAction("/")}>
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
