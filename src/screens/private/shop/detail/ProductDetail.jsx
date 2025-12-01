import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "./ProductDetail.module.scss";
import { getToken } from "../../../../utils/token";

const ProductDetail = () => {
  const navigate = useNavigate();
  const { state: product } = useLocation();
  const { slug } = useParams(); // or however you store it

  if (!product) return <div>No product found</div>;
  const handleBookNow = () => {
    const token = getToken();
    const productSlug = product?.slug;

    if (!token) {
      // Redirect to login, but remember the current page
      return navigate("/login", { state: { from: location.pathname } });
    }

    // If logged in → go to consultant page
    navigate(`/shop/${slug}/${productSlug}/consultant?uID=${token}`, {
      state: { product: product },
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.flex}>
        <div className={styles.left}>
          <img src={product.defaultImage} alt={product.name} />
        </div>

        <div className={styles.right}>
          <h2>{product.name}</h2>
          <p className={styles.price}>
            Starting from ₹ {product.minConsultantPrice}
          </p>

          <div
            className={styles.shortDesc}
            dangerouslySetInnerHTML={{ __html: product.shortDescription }}
          />

          <button className={styles.bookBtn} onClick={handleBookNow}>
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
