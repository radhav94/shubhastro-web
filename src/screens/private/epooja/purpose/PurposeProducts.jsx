import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../category/CategoryProducts.module.scss";
import { FiChevronLeft } from "react-icons/fi";
import { useGetProductsQuery, useAddToCartMutation } from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import AstromallCartSidebar from "../components/AstromallCartSidebar";
import Toast from "../../../../component/toast";

import { DefaultImages } from "../../../../utils/appImages";

const LIMIT = 8;

const getImg = (item) =>
  item?.banner_image?.original ||
  item?.banner_image?.small ||
  (item?.images?.length ? item.images[0] : null) ||
  item?.imgUrl || item?.image || item?.thumbnail ||
  DefaultImages.AstromallProductDefault;
const getPrice = (item) => item?.price || item?.actualPrice || item?.selling_price || 0;
const getOldPrice = (item) => item?.mrp || item?.originalPrice || item?.compare_price || 0;
const getTitle = (item) => item?.title || item?.name || "Product";
const getBrand = (item) => {
  const b = item?.brand;
  if (!b) return "";
  return typeof b === "string" ? b : b.name || "";
};

const PurposeProducts = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const purposeName = slug?.replace(/-/g, " ") || "Purpose";

  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState([]);
  const loaderRef = useRef(null);
  const hasMoreRef = useRef(false);
  const isFetchingRef = useRef(false);

  const { data: productsData, isLoading, isFetching } = useGetProductsQuery(
    { page, limit: LIMIT, purpose: slug },
    { refetchOnMountOrArgChange: true }
  );
  const [addToCart] = useAddToCartMutation();

  const statusFalse = productsData?.data?.status === false;

  // Reset on slug change
  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [slug]);

  useEffect(() => {
    if (!productsData) return;
    const d = productsData?.data;
    if (d?.status === false) {
      if (page === 1) setAccumulated([]);
      return;
    }
    const items = Array.isArray(d) ? d : (d?.products || d?.list || []);
    const arr = Array.isArray(items) ? items : [];
    if (page === 1) setAccumulated(arr);
    else setAccumulated((prev) => [...prev, ...arr]);
  }, [productsData]);

  const pagination = productsData?.pagination || productsData?.data?.pagination || {};
  const total = pagination.total || productsData?.data?.total || productsData?.data?.totalCount || 0;
  const totalPages = pagination.pages || 0;
  const hasMore = !statusFalse && (totalPages > 0 ? page < totalPages : accumulated.length < total);

  hasMoreRef.current = hasMore;
  isFetchingRef.current = isFetching;

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isFetchingRef.current) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [accumulated.length]);

  const isLoggedIn = () => {
    const role = localStorage.getItem("shubhtalk_role");
    const token = role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");
    return !!token;
  };

  const handleAddToCart = async (e, item) => {
    e.stopPropagation();
    if (!isLoggedIn()) {
      localStorage.setItem("shubhtalk_redirect_after_login", window.location.pathname);
      navigate("/login?skip=welcome");
      return;
    }
    const productId = item?._id;
    if (!productId) { Toast.error("Unable to add — product ID missing"); return; }
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      Toast.success(`${getTitle(item)} added to cart`);
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to add to cart");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate("/astromall")} aria-label="Go back">
            <FiChevronLeft />
          </button>
          <nav className={styles.breadcrumb}>
            <span className={styles.breadcrumbLink} onClick={() => navigate("/astromall")}>AstroMall</span>
            <span className={styles.breadcrumbSep}>›</span>
            <span className={styles.breadcrumbActive}>{purposeName}</span>
          </nav>
        </div>
        <div className={styles.headerRight}>
          <AstromallCartSidebar />
        </div>
      </div>

      {isLoading && <div className={styles.loading}>Loading...</div>}

      {!isLoading && (statusFalse || accumulated.length === 0) && (
        <div className={styles.noProducts}>
          <h2>No Products Available</h2>
          <p>There are no products available for "{purposeName}" right now.</p>
          <button className={styles.browseBtn} onClick={() => navigate("/astromall")}>Browse AstroMall</button>
        </div>
      )}

      {!isLoading && accumulated.length > 0 && (
        <>
          <div className={styles.grid}>
            {accumulated.map((item, i) => (
              <div key={item._id || item.ID || i} className={styles.card} onClick={() => navigate(`/product-details/${item.slug || item.ID}`, { state: item })}>
                {item.is_featured && <span className={styles.badge}>Featured</span>}
                <div className={styles.cardImg}>
                  <img src={getImg(item)} alt={getTitle(item)} onError={(e) => { e.target.src = DefaultImages.AstromallProductDefault; }} />
                </div>
                <div className={styles.cardBody}>
                  {getBrand(item) && <p className={styles.brand}>🏷 {getBrand(item)}</p>}
                  <h4>{getTitle(item)}</h4>
                  <p className={styles.desc}>{item.short_description || ""}</p>
                  <p className={styles.price}>₹{getPrice(item)} {getOldPrice(item) ? <s>₹{getOldPrice(item)}</s> : null}</p>
                  <button className={styles.addCartBtn} onClick={(e) => handleAddToCart(e, item)}>+ Add to cart</button>
                </div>
              </div>
            ))}
          </div>
          <div ref={loaderRef} className={styles.loadMoreWrap}>
            {isFetching && <span className={styles.loadingMore}>Loading...</span>}
          </div>
        </>
      )}
    </div>
  );
};

export default PurposeProducts;
