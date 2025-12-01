import React from "react";
import { SHOP_CATEGORIES } from "./data/shop";
import styles from "./Shop.module.scss";
import { useNavigate } from "react-router-dom";

const Shop = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Shop Categories</h2>

      <div className={styles.grid}>
        {SHOP_CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className={styles.card}
            onClick={() => navigate(`/shop/${cat.slug}`, { state: cat })}
          >
            <img src={cat.image} alt={cat.name} />

            <div className={styles.content}>
              {cat.tag && <span className={styles.tag}>{cat.tag}</span>}
              <h3>{cat.name}</h3>
              <p>{cat.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
