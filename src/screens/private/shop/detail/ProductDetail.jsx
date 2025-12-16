import React, { use, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "./ProductDetail.module.scss";
import { getToken } from "../../../../utils/token";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetSingleEPoojaQuery } from "../../../../redux/api/astromall/epooja/epoojaApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

const ProductDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug, productSlug } = useParams();

  let productFromState = location.state;
  if (!productFromState) {
    const saved = localStorage.getItem("pendingProductDetail");
    if (saved) productFromState = JSON.parse(saved);
  }

  const isPooja = slug === "online-puja";

  const { data: epoojaData, isLoading } = useGetSingleEPoojaQuery(
    isPooja ? productSlug : skipToken
  );

  /** Build unified product object */
  const product = useMemo(() => {
    if (isPooja && epoojaData?.data) {
      const p = epoojaData.data;

      return {
        id: p._id,
        name: p.title,
        image: p.image,
        price: p.price,
        description: p.description,
        benefit: p.benefit,
        duration: p.duration,
        procedure: p.procedure,
        fullData: p,
        place: `${p.district}, ${p.state}`,
        video: p.video_url,
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
    if (isPooja) {
      navigate(`/shop/${slug}/${productSlug}/play?uID=${token}`);
    } else {
      navigate(`/shop/${slug}/${productSlug}/consultant?uID=${token}`, {
        state: { product: product.fullData },
      });
    }
  };

  return (
    <>
      <PrimaryLoader isLoading={isLoading} />
      <div className={styles.wrapper}>
        <div className={styles.flex}>
          {/* LEFT IMAGE */}
          <div className={styles.left}>
            <img src={product.image} alt={product.name} />
          </div>

          {/* RIGHT CONTENT */}
          <div className={styles.right}>
            <h2 className={styles.title}>{product.name}</h2>

            {product?.price && (
              <p className={styles.price}>Starting from ₹ {product.price}</p>
            )}
            {product?.place && <p className={styles.place}>{product.place}</p>}

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
    </>
  );
};

export default ProductDetail;
