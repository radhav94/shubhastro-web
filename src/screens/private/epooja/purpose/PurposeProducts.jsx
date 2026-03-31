import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../category/CategoryProducts.module.scss";
import { FiChevronLeft } from "react-icons/fi";
import { useGetProductsQuery, useAddToCartMutation } from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import AstromallCartSidebar from "../components/AstromallCartSidebar";
import Toast from "../../../../component/toast";

import { DefaultImages } from "../../../../utils/appImages";
import ProductImage from "../../../../component/UI/ProductImage";

const LIMIT = 8;

const PRODUCT_FALLBACK = DefaultImages.AstromallProductDefault;
const getFirstVariant = (item) => item?.variants?.find((v) => v.isActive) || item?.variants?.[0] || null;
const resolveImg = (img) => {
  if (!img) return null;
  if (typeof img === "string") return img;
  if (typeof img === "object") return img.original || img.small || img.url || img.src || null;
  return null;
};
const getImg = (item) => {
  if (item?.images?.length) {
    for (const img of item.images) {
      const resolved = resolveImg(img);
      if (resolved) return resolved;
    }
  }
  const banner = resolveImg(item?.banner_image);
  if (banner) return banner;
  const imgUrl = resolveImg(item?.imgUrl);
  if (imgUrl) return imgUrl;
  const image = resolveImg(item?.image);
  if (image) return image;
  const thumbnail = resolveImg(item?.thumbnail);
  if (thumbnail) return thumbnail;

  const variant = getFirstVariant(item);
  if (variant?.images?.length) {
    for (const img of variant.images) {
      const resolved = resolveImg(img);
      if (resolved) return resolved;
    }
  }

  return PRODUCT_FALLBACK;
};
const getPrice = (item) => {
  const variant = getFirstVariant(item);
  return variant?.price || item?.price || item?.actualPrice || item?.selling_price || 0;
};
const getOldPrice = (item) => {
  const variant = getFirstVariant(item);
  return variant?.mrp || item?.mrp || item?.originalPrice || item?.compare_price || 0;
};
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
    const productId = item?._id || item?.ID;
    if (!productId) { Toast.error("Unable to add — product ID missing"); return; }
    const firstVariant = item?.variants?.find((v) => v.isActive) || item?.variants?.[0];
    if (!firstVariant?._id) { Toast.error("No variant available for this product"); return; }
    if (firstVariant?.stock === 0) { Toast.error("This variant is out of stock"); return; }
    try {
      await addToCart({ productId, variantId: firstVariant._id, quantity: 1 }).unwrap();
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
                  <ProductImage src={getImg(item)} alt={getTitle(item)} />
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
