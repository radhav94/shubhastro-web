import React, { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "./ProductDetail.module.scss";
import { getToken } from "../../../../utils/token";

const ProductDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const location = useLocation();

  let product = location.state;

  // Restore product if returning from login
  if (!product) {
    const saved = localStorage.getItem("pendingProductDetail");
    if (saved) product = JSON.parse(saved);
  }

  if (!product) return <div>No product found</div>;

  // Clear saved product once loaded
  // useEffect(() => {
  //   localStorage.removeItem("pendingProductDetail");
  // }, []);

  const handleBookNow = () => {
    const token = getToken();
    const productSlug = product.slug;

    if (!token) {
      // Save product so we can restore after login
      localStorage.setItem("pendingProductDetail", JSON.stringify(product));

      return navigate("/login", { state: { from: location.pathname } });
    }

    // Logged in → go to consultant page
    navigate(`/shop/${slug}/${productSlug}/consultant?uID=${token}`, {
      state: { product },
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
