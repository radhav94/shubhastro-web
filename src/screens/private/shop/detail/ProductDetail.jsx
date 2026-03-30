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
import { DefaultImages } from "../../../../utils/appImages";

const ProductDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug, productSlug } = useParams();

  let productFromState = location.state;
  if (!productFromState) {
    const saved = localStorage.getItem("pendingProductDetail");
    if (saved) productFromState = JSON.parse(saved);
  }

  const isLiveDarshan = slug === "live-darshan";

  const { data: epoojaData, isLoading } = useGetSingleEPoojaQuery(
    isLiveDarshan ? productSlug : skipToken
  );

  const { data: oldEpoojaData } = useGetSingleOldEPoojaQuery(
    !isLiveDarshan ? productSlug : skipToken
  );

  const product = useMemo(() => {
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

    if (oldEpoojaData?.data) {
      const p = oldEpoojaData.data;
      return {
        id: p._id,
        name: p.title,
        image: DefaultImages.AstromallProductDefault,
        price: p.price,
        description: p.description,
        benefit: p.benefit,
        duration: p.duration,
        procedure: p.procedure,
        fullData: p,
      };
    }

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
  }, [isLiveDarshan, epoojaData, oldEpoojaData, productFromState]);

  if (!product && !isLoading) return <div>No product found</div>;

  const handleBookNow = () => {
    const token = getToken();

    if (!token) {
      localStorage.setItem(
        "pendingProductDetail",
        JSON.stringify(product.fullData)
      );
      return navigate("/login", { state: { from: location.pathname } });
    }

    if (isLiveDarshan) {
      navigate(`/shop/${slug}/${productSlug}/play?uID=${token}`);
      return;
    }

    navigate(`/shop/${slug}/${productSlug}/consultant?uID=${token}`, {
      state: { product: product.fullData },
    });
  };

  return (
    <>
      <PrimaryLoader isLoading={isLoading} />

      {product && (
        <div className={styles.wrapper}>
          <div className={styles.flex}>
            <div className={styles.left}>
              <img src={product.image || DefaultImages.AstromallSubCategoryDefault} alt={product.name} />
            </div>

            <div className={styles.right}>
              <h2 className={styles.title}>{product.name}</h2>

              {product.price && (
                <p className={styles.price}>Starting from ₹ {product.price}</p>
              )}

              {product.place && <p className={styles.place}>{product.place}</p>}

              <div
                className={styles.shortDesc}
                dangerouslySetInnerHTML={{
                  __html: product.description,
                }}
              />

              {isLiveDarshan ? (
                <button className={styles.bookBtn} onClick={handleBookNow}>
                  Watch Now
                </button>
              ) : (
                <button className={styles.bookBtn} onClick={handleBookNow}>
                  Book Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetail;
