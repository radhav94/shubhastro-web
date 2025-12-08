// Card.jsx
import React from "react";
import styles from "./Card.module.scss";

const Card = ({ data, scope }) => {
  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={data.img} alt={data.name} className={styles.image} />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>
          {data.name} {scope} Horoscope
        </h3>
        <p className={styles.description}>{data.overview}</p>
      </div>
    </div>
  );
};

export default Card;
