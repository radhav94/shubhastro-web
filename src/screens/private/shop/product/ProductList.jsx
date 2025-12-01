import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { SHOP_PRODUCTS } from "../data/productData";
import styles from "./ProductList.module.scss";

const ProductList = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const categoryProducts = SHOP_PRODUCTS[slug] || [];

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>{location.state?.name}</h2>

      <div className={styles.grid}>
        {categoryProducts.map((product) => (
          <div
            key={product.id}
            className={styles.card}
            onClick={() =>
              navigate(`/shop/${slug}/${product.slug}`, { state: product })
            }
          >
            <img src={product.defaultImage} alt={product.name} />

            {/* AstroTalk-style BOOK button */}
            <button
              className={styles.bookBtn}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/shop/${slug}/${product.slug}`, { state: product });
              }}
            >
              Book
            </button>

            <div className={styles.content}>
              <h3>{product.name}</h3>
              <p>Starting from ₹ {product.minConsultantPrice}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
