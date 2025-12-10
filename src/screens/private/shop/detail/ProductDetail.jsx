import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "./ProductDetail.module.scss";
import { getToken } from "../../../../utils/token";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetSingleEPoojaQuery } from "../../../../redux/api/astromall/epooja/epoojaApi";

const ProductDetail = () => {
  const navigate = useNavigate();
  const { slug, productSlug } = useParams();
  const location = useLocation();

  let productFromState = location.state;
  if (!productFromState) {
    const saved = localStorage.getItem("pendingProductDetail");
    if (saved) productFromState = JSON.parse(saved);
  }

  const isPooja = slug === "online-puja";

  const { data: epoojaData } = useGetSingleEPoojaQuery(
    isPooja ? productSlug : skipToken
  );

  /** Build unified product object */
  const product = useMemo(() => {
    if (isPooja && epoojaData?.data) {
      const p = epoojaData.data;

      return {
        id: p._id,
        name: p.title,
        image: `https://images.unsplash.com/photo-1625072290979-cac544181be8?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`,
        price: p.price,
        description: p.description,
        benefit: p.benefit,
        duration: p.duration,
        procedure: p.procedure,
        fullData: p,
      };
    }

    // fallback product (normal AstroMall)
    if (productFromState) {
      return {
        id: productFromState.id,
        name: productFromState.name,
        image: productFromState.defaultImage,
        price: productFromState.minConsultantPrice,
        description: productFromState.shortDescription,
        fullData: productFromState,
      };
    }

    return null;
  }, [isPooja, epoojaData, productFromState]);

  if (!product) return <div>No product found</div>;

  const handleBookNow = () => {
    const token = getToken();

    if (!token) {
      localStorage.setItem(
        "pendingProductDetail",
        JSON.stringify(product.fullData)
      );
      return navigate("/login", { state: { from: location.pathname } });
    }

    navigate(`/shop/${slug}/${productSlug}/consultant?uID=${token}`, {
      state: { product: product.fullData },
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.flex}>
        {/* LEFT IMAGE */}
        <div className={styles.left}>
          <img src={product.image} alt={product.name} />
        </div>

        {/* RIGHT CONTENT */}
        <div className={styles.right}>
          <h2>{product.name}</h2>

          <p className={styles.price}>Starting from ₹ {product.price}</p>

          {/* Description */}
          <div
            className={styles.shortDesc}
            dangerouslySetInnerHTML={{ __html: product.description }}
          />

          {/* ONLY FOR ONLINE PUJA — show extra sections */}
          {isPooja && (
            <div className={styles.extraSections}>
              {/* Benefit */}
              {product.benefit && (
                <div className={styles.shortDesc}>
                  <h3 className="font-bold text-lg">Benefits</h3>
                  <p>{product.benefit}</p>
                </div>
              )}

              {/* Duration */}
              {product.duration && (
                <div className={styles.shortDesc}>
                  <h3 className="font-bold text-lg">Duration</h3>
                  <p>{product.duration}</p>
                </div>
              )}

              {/* Procedure */}
              {product.procedure && (
                <div className={styles.shortDesc}>
                  <h3 className="font-bold text-lg">Procedure</h3>
                  <p>{product.procedure}</p>
                </div>
              )}
            </div>
          )}

          <button className={styles.bookBtn} onClick={handleBookNow}>
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
