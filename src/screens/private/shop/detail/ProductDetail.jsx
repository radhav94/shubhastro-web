import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "./ProductDetail.module.scss";
import { getToken } from "../../../../utils/token";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetSingleEPoojaQuery,
  useGetSingleOldEPoojaQuery,
} from "../../../../redux/api/astromall/epooja/epoojaApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

const ProductDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug, productSlug } = useParams();

  //Restore state on refresh
  let productFromState = location.state;
  if (!productFromState) {
    const saved = localStorage.getItem("pendingProductDetail");
    if (saved) productFromState = JSON.parse(saved);
  }

  // SLUG TYPES
  const isLiveDarshan = slug === "live-darshan";
  const isOnlinePuja = slug === "online-puja";

  // APIs

  //  Live Darshan
  const { data: epoojaData, isLoading } = useGetSingleEPoojaQuery(
    isLiveDarshan ? productSlug : skipToken
  );

  //  Online Puja
  const { data: oldEpoojaData } = useGetSingleOldEPoojaQuery(
    isOnlinePuja ? productSlug : skipToken
  );

  // BUILD PRODUCT

  const product = useMemo(() => {
    //  LIVE DARSHAN (DO NOT TOUCH)
    if (isLiveDarshan && epoojaData?.data) {
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
        place: `${p.district}, ${p.state}`,
        video: p.video_url,
        fullData: p,
      };
    }

    //  ONLINE PUJA
    if (isOnlinePuja && oldEpoojaData?.data) {
      const p = oldEpoojaData.data;

      return {
        id: p._id,
        name: p.title,
        image:
          "https://images.unsplash.com/photo-1625072290979-cac544181be8?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        price: p.price,
        description: p.description,
        benefit: p.benefit,
        duration: p.duration,
        procedure: p.procedure,
        fullData: p,
      };
    }

    //  FALLBACK (OTHER CATEGORIES)
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
  }, [
    isLiveDarshan,
    isOnlinePuja,
    epoojaData,
    oldEpoojaData,
    productFromState,
  ]);

  if (!product) return <div>No product found</div>;

  //BOOK NOW

  const handleBookNow = () => {
    const token = getToken();

    if (!token) {
      localStorage.setItem(
        "pendingProductDetail",
        JSON.stringify(product.fullData)
      );
      return navigate("/login", { state: { from: location.pathname } });
    }

    //  LIVE DARSHAN
    if (isLiveDarshan) {
      navigate(`/shop/${slug}/${productSlug}/play?uID=${token}`);
      return;
    }

    //  ONLINE PUJA + OTHERS
    navigate(`/shop/${slug}/${productSlug}/consultant?uID=${token}`, {
      state: { product: product.fullData },
    });
  };

  /* ---------- UI ---------- */

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

            {/* ONLINE PUJA EXTRA SECTIONS */}
            {isOnlinePuja && (
              <div className={styles.extraSections}>
                {product.benefit && (
                  <div className={styles.shortDesc}>
                    <h3>Benefits</h3>
                    <p>{product.benefit}</p>
                  </div>
                )}

                {product.duration && (
                  <div className={styles.shortDesc}>
                    <h3>Duration</h3>
                    <p>{product.duration}</p>
                  </div>
                )}

                {product.procedure && (
                  <div className={styles.shortDesc}>
                    <h3>Procedure</h3>
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
