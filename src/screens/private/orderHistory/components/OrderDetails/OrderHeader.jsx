import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "./OrderHeader.module.scss";

const OrderHeader = ({ astrologer, onBack }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Fallback avatar with initials
  const getInitials = (name) => {
    if (!name) return "A";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className={styles.orderHeader}>
      <button className={styles.backButton} onClick={onBack} aria-label="Go back">
        <ChevronLeft size={24} />
      </button>
      <div className={styles.astrologerInfo}>
        <div className={styles.avatarContainer}>
          {!imageError && astrologer.image ? (
            <img
              src={astrologer.image}
              alt={astrologer.name}
              className={styles.avatar}
              onError={handleImageError}
            />
          ) : (
            <div className={styles.avatarFallback}>
              {getInitials(astrologer.name)}
            </div>
          )}
          {astrologer.isOnline && <span className={styles.onlineIndicator} />}
        </div>
        <div className={styles.details}>
          <h2 className={styles.name}>{astrologer.name}</h2>
          <p className={styles.experience}>Exp. {astrologer.experience}</p>
        </div>
      </div>
    </div>
  );
};

export default OrderHeader;
