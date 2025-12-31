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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className={styles.title}>
            {data.name} {scope} Horoscope
          </h3>
          <span>{data?.range}</span>
        </div>
        <p className={styles.description}>{data.overview}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <strong>Lucky Color :</strong>
            <span style={{ color: data?.lucky_color_code }}>{data?.lucky_color}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <strong>Lucky Number :</strong>
            <span>
              {Array.isArray(data?.lucky_number) && data.lucky_number.length > 0
                ? data.lucky_number.join(", ")
                : "-"}
            </span>
          </div>
</div>

      </div>
    </div>
  );
};

export default Card;
