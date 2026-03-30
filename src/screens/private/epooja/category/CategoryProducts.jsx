import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import styles from "./CategoryProducts.module.scss";
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
const getBrand = (item) => typeof item?.brand === "object" ? item?.brand?.name : item?.brand;

const CategoryProducts = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const categoryId = location.state?.categoryId || slug;
  const categoryName = location.state?.name || slug?.replace(/-/g, " ") || "Category";
  const breadcrumbTrail = location.state?.breadcrumbTrail || [];

  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState([]);
  const loaderRef = useRef(null);
  const hasMoreRef = useRef(false);
  const isFetchingRef = useRef(false);

  const { data: productsData, isLoading, isFetching } = useGetProductsQuery(
    { page, limit: LIMIT, category: categoryId },
    { refetchOnMountOrArgChange: true }
  );
  const [addToCart] = useAddToCartMutation();

  const statusFalse = productsData?.data?.status === false;

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

  // Keep refs in sync for the observer callback
  hasMoreRef.current = hasMore;
  isFetchingRef.current = isFetching;

  // Infinite scroll — single observer, reads refs to avoid stale closures
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
  }, [accumulated.length]); // re-attach after new items render

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
      const payload = { productId, quantity: 1 };
      const firstVariant = item?.variants?.find((v) => v.isActive);
      if (firstVariant?._id) payload.variantId = firstVariant._id;
      await addToCart(payload).unwrap();
      Toast.success(`${getTitle(item)} added to cart`);
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to add to cart");
    }
  };

  const handleBack = () => {
    if (breadcrumbTrail.length > 1) {
      // Go back one level in the category tree
      const parentTrail = breadcrumbTrail.slice(0, -1);
      const parent = parentTrail[parentTrail.length - 1];
      navigate(`/categories`, { state: { restoreStack: parentTrail }, replace: true });
    } else if (breadcrumbTrail.length === 1) {
      // At root category level, go to all categories
      navigate("/categories", { replace: true });
    } else {
      // No trail (came from homepage), go back to astromall
      navigate("/astromall");
    }
  };

  const handleBreadcrumbClick = (index) => {
    if (index < 0) {
      // "All Categories" clicked
      navigate("/categories", { replace: true });
    } else {
      const stack = breadcrumbTrail.slice(0, index + 1);
      navigate("/categories", { state: { restoreStack: stack }, replace: true });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={handleBack} aria-label="Go back">
            <FiChevronLeft />
          </button>
          <nav className={styles.breadcrumb}>
            {breadcrumbTrail.length > 0 ? (
              <>
                <span className={styles.breadcrumbLink} onClick={() => handleBreadcrumbClick(-1)}>All Categories</span>
                {breadcrumbTrail.slice(0, -1).map((cat, i) => (
                  <span key={cat.ID}>
                    <span className={styles.breadcrumbSep}>›</span>
                    <span className={styles.breadcrumbLink} onClick={() => handleBreadcrumbClick(i)}>
                      {cat.name}
                    </span>
                  </span>
                ))}
                <span className={styles.breadcrumbSep}>›</span>
                <span className={styles.breadcrumbActive}>{categoryName}</span>
              </>
            ) : (
              <span className={styles.breadcrumbActive}>{categoryName}</span>
            )}
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
          <p>There are no products available in this category right now.</p>
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
                  {item.brand && <p className={styles.brand}>🏷 {getBrand(item)}</p>}
                  <h4>{getTitle(item)}</h4>
                  <p className={styles.desc}>{item.short_description || ""}</p>
                  <p className={styles.price}>₹{getPrice(item)} {getOldPrice(item) > getPrice(item) ? <s>₹{getOldPrice(item)}</s> : null}</p>
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

export default CategoryProducts;
