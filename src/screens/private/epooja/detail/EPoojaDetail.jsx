import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import styles from "./EPoojaDetail.module.scss";
import { FiChevronLeft, FiPlus, FiMinus, FiCalendar, FiX, FiHome, FiBriefcase, FiEdit2, FiTrash2 } from "react-icons/fi";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { useGetEPoojaDetailQuery, useGetProductReviewsQuery, useAddToCartMutation, useGetCartQuery, useUpdateCartItemMutation, useCreateProductReviewMutation, useUpdateProductReviewMutation, useDeleteProductReviewMutation, useGetAddressesQuery, useAddAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation } from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import Toast from "../../../../component/toast";
import AstromallCartSidebar from "../components/AstromallCartSidebar";
import { DefaultImages } from "../../../../utils/appImages";

const StarRating = ({ rating = 0, size = 18 }) => {
  const stars = [];
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push(<FaStar key={i} color="#f75801" size={size} />);
    else if (i === full && hasHalf) stars.push(<FaStarHalfAlt key={i} color="#f75801" size={size} />);
    else stars.push(<FaRegStar key={i} color="#f75801" size={size} />);
  }
  return <span className={styles.starsRow}>{stars}</span>;
};

const FaqItem = ({ q, a, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.faqCard}>
      <button className={styles.faqBtn} onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{q}</span>
        {open ? <FiMinus className={styles.faqIcon} /> : <FiPlus className={styles.faqIcon} />}
      </button>
      {open && (typeof a === 'string' ? <p className={styles.faqAnswer}>{a}</p> : <div className={styles.faqAnswer}>{a}</div>)}
    </div>
  );
};

const InteractiveStars = ({ value = 0, onChange, size = 28 }) => {
  const [hover, setHover] = useState(0);
  return (
    <span className={styles.starsRow} style={{ cursor: "pointer" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <FaStar
          key={i}
          size={size}
          color={(hover || value) >= i ? "#f75801" : "#ddd"}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          style={{ cursor: "pointer", transition: "color 0.15s" }}
        />
      ))}
    </span>
  );
};

const EPoojaDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const location = useLocation();
  const stateData = location.state;

  // Always fetch product detail from API to ensure we have the MongoDB _id
  const { data: apiData, isLoading } = useGetEPoojaDetailQuery(slug, {
    refetchOnMountOrArgChange: true,
  });
  const apiSuccess = !!(apiData?.success || apiData?.status === true);
  const product = (apiSuccess && apiData?.data) ? apiData.data : (stateData || {});

  console.log("Product Details:", apiData?.data);

  // IDs — MongoDB _id needed for cart/review APIs
  const mongoId = product?._id || null;

  // Variant state
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttrs, setSelectedAttrs] = useState({});

  // Helper: get variant identifier — handles both old (_id/skuCode) and new (id/sku) formats
  const getVid = (v) => v?._id || v?.id || v?.skuCode || v?.sku || "";

  // Helper: safely get attributes as {name: value} entries from a variant
  // Old format: [{name, value}] array  |  New format: {type: "gemstone", size: "5-ratti"} object
  const getAttrsEntries = (v) => {
    const a = v?.attributes;
    if (!a) return [];
    if (Array.isArray(a)) return a.map((x) => [x.name, x.value]).filter(([k, val]) => k && val);
    if (typeof a === "object") return Object.entries(a).filter(([k, val]) => k && val);
    return [];
  };

  // Helper: is variant in stock
  const isVariantInStock = (v) => {
    if (v?.inStock === false) return false;
    if (v?.isActive === false) return false;
    if (v?.stock === 0) return false;
    return true;
  };

  // Build attribute dimensions from variantConfig (new) or by scanning variants (old)
  const activeVariants = (product?.variants || []).filter(isVariantInStock);
  const allVariants = product?.variants || [];

  const attrDimensions = (() => {
    // New format: use variantConfig directly
    if (Array.isArray(product?.variantConfig) && product.variantConfig.length > 0) {
      return product.variantConfig.map((c) => ({
        name: c.name,
        values: c.values || [],
      }));
    }
    // Old format: scan variant attributes
    if (!allVariants.length) return [];
    const dimMap = {};
    allVariants.forEach((v) => {
      getAttrsEntries(v).forEach(([name, value]) => {
        if (!dimMap[name]) dimMap[name] = new Set();
        dimMap[name].add(value);
      });
    });
    return Object.entries(dimMap).map(([name, valuesSet]) => ({
      name,
      values: [...valuesSet],
    }));
  })();

  // Track passed variant key for same-product different-variant navigation
  const passedVariantKey = stateData?._selectedVariant?._id || stateData?._selectedVariant?.id || stateData?._selectedVariant?.sku || "";

  useEffect(() => {
    if (product?.variants?.length) {
      const passedVariant = stateData?._selectedVariant;
      let initial = null;
      if (passedVariant) {
        initial = product.variants.find((v) =>
          (passedVariant._id && v._id === passedVariant._id) ||
          (passedVariant.id && v.id === passedVariant.id) ||
          (passedVariant.skuCode && v.skuCode === passedVariant.skuCode) ||
          (passedVariant.sku && v.sku === passedVariant.sku)
        );
      }
      if (!initial) {
        initial = activeVariants[0] || product.variants[0];
      }
      setSelectedVariant(initial);
      const attrs = {};
      getAttrsEntries(initial).forEach(([k, val]) => { attrs[k] = val; });
      setSelectedAttrs(attrs);
    }
  }, [product, passedVariantKey]);

  // When user picks an attribute value, find the matching variant
  const handleAttrSelect = (dimName, value) => {
    const next = { ...selectedAttrs, [dimName]: value };
    // Try exact match among active variants first
    let match = activeVariants.find((v) =>
      Object.entries(next).every(([k, val]) =>
        getAttrsEntries(v).some(([ak, av]) => ak === k && av === val)
      )
    );
    // If no active variant matches all selections, find the first active variant
    // that matches the newly selected dimension and reset other attrs accordingly
    if (!match) {
      match = activeVariants.find((v) =>
        getAttrsEntries(v).some(([ak, av]) => ak === dimName && av === value)
      );
      if (match) {
        const resetAttrs = {};
        getAttrsEntries(match).forEach(([k, val]) => { resetAttrs[k] = val; });
        setSelectedAttrs(resetAttrs);
        setSelectedVariant(match);
        return;
      }
    }
    // Final fallback to any variant (inactive) if nothing active exists for this value
    if (!match) {
      match = allVariants.find((v) =>
        Object.entries(next).every(([k, val]) =>
          getAttrsEntries(v).some(([ak, av]) => ak === k && av === val)
        )
      );
    }
    setSelectedAttrs(next);
    if (match) setSelectedVariant(match);
  };

  // Which attribute values are available (have at least one in-stock variant)
  const getAvailableValues = (dimName) => {
    const otherSelections = { ...selectedAttrs };
    delete otherSelections[dimName];
    return activeVariants
      .filter((v) =>
        Object.entries(otherSelections).every(([k, val]) =>
          getAttrsEntries(v).some(([ak, av]) => ak === k && av === val)
        )
      )
      .flatMap((v) => getAttrsEntries(v).filter(([ak]) => ak === dimName).map(([, av]) => av));
  };

  // Reset gallery index when variant changes
  useEffect(() => { setActiveImg(0); }, [getVid(selectedVariant)]);

  // Fetch reviews — only when we have a valid MongoDB _id
  const { data: reviewsData, isLoading: reviewsLoading } = useGetProductReviewsQuery(
    { productId: mongoId, page: 1, limit: 10 },
    { skip: !mongoId }
  );

  // Auth check
  const isLoggedIn = () => {
    const role = localStorage.getItem("shubhtalk_role");
    const token = role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");
    return !!token;
  };

  const redirectToLogin = () => {
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem("shubhtalk_redirect_after_login", currentPath);
    navigate("/login?skip=welcome");
  };

  // Add to cart
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const [updateCartItem] = useUpdateCartItemMutation();
  const [qty, setQty] = useState(stateData?._cartQty || 1);
  const [stockLimited, setStockLimited] = useState(false);

  // Sync qty with cart data
  const { data: cartData } = useGetCartQuery();
  const cartItems = cartData?.data?.items || cartData?.data?.cart?.items || cartData?.data || [];
  const cartItemsList = Array.isArray(cartItems) ? cartItems : [];
  const cartMatch = cartItemsList.find((item) => {
    const p = item?.productId || item?.product || item;
    const sameProduct = p?._id === product?._id || String(p?._id) === String(product?._id);
    if (!sameProduct) return false;
    const cartVid = item?.variantId?._id || item?.variantId?.id || (typeof item?.variantId === "string" ? item.variantId : "") || item?.variantSnapshot?._id || item?.variantSnapshot?.id || "";
    const cartSku = item?.variantSnapshot?.skuCode || item?.variantSnapshot?.sku || item?.variantId?.skuCode || item?.variantId?.sku || "";
    const selVid = selectedVariant?._id || selectedVariant?.id || "";
    const selSku = selectedVariant?.skuCode || selectedVariant?.sku || "";
    if (selVid && cartVid && String(cartVid) === String(selVid)) return true;
    if (selSku && cartSku && String(cartSku) === String(selSku)) return true;
    if (!selVid && !selSku) return true;
    return false;
  });
  const isInCart = !!cartMatch;

  // Sync qty: cart quantity if variant is in cart, otherwise reset to 1
  useEffect(() => {
    if (cartMatch?.quantity) {
      setQty(cartMatch.quantity);
    } else {
      setQty(1);
    }
  }, [getVid(selectedVariant), cartMatch?.quantity]);

  // Reset stock limit only when variant changes
  useEffect(() => {
    setStockLimited(false);
  }, [getVid(selectedVariant)]);

  const handleQtyChange = async (newQty) => {
    if (newQty < 1) return;
    if (isInCart) {
      const productId = cartMatch?.productId?._id || cartMatch?.product?._id || cartMatch?._id || product?._id;
      const variantId = cartMatch?.variantId?._id || cartMatch?.variantId?.id || (typeof cartMatch?.variantId === "string" && cartMatch.variantId ? cartMatch.variantId : "") || cartMatch?.variantSnapshot?._id || getVid(selectedVariant) || "";
      if (productId) {
        try {
          await updateCartItem({ productId, variantId, quantity: newQty }).unwrap();
          setQty(newQty);
          if (newQty < qty) setStockLimited(false);
        } catch (err) {
          const msg = err?.data?.message || "";
          if (msg === "Insufficient stock") setStockLimited(true);
          Toast.error(msg || "Failed to update quantity");
        }
      }
    } else {
      setQty(newQty);
    }
  };

  const [showAddress, setShowAddress] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [newAddr, setNewAddr] = useState({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" });

  // Address API
  const { data: addressData, isLoading: addressLoading } = useGetAddressesQuery(undefined, { skip: !isLoggedIn() });
  const [addAddress, { isLoading: isAddingAddress }] = useAddAddressMutation();
  const [updateAddressApi, { isLoading: isUpdatingAddress }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const addresses = addressData?.data || addressData?.data?.addresses || [];
  const addressList = Array.isArray(addresses) ? addresses : [];
  const [editingAddress, setEditingAddress] = useState(null);
  const [addrErrors, setAddrErrors] = useState({});
  useEffect(() => {
    if (addressList.length > 0 && !selectedAddress) {
      const def = addressList.find((a) => a.isDefault) || addressList[0];
      setSelectedAddress(def?._id || def?.id);
    }
  }, [addressList, selectedAddress]);

  // Review modal state
  const [createProductReview, { isLoading: isCreatingReview }] = useCreateProductReviewMutation();
  const [updateProductReview, { isLoading: isUpdatingReview }] = useUpdateProductReviewMutation();
  const [deleteProductReview] = useDeleteProductReviewMutation();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: "", comment: "" });
  const [reviewErrors, setReviewErrors] = useState({});
  const [editingReview, setEditingReview] = useState(null);

  const openReviewModal = (review = null) => {
    if (!isLoggedIn()) { redirectToLogin(); return; }
    if (review) {
      setEditingReview(review);
      const rRating = typeof review.rating === "object" ? review.rating?.average : (review.rating || 0);
      setReviewForm({ rating: rRating, title: review.title || "", comment: review.review || review.comment || review.text || "" });
    } else {
      setEditingReview(null);
      setReviewForm({ rating: 0, title: "", comment: "" });
    }
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    const errs = {};
    if (reviewForm.rating === 0) errs.rating = "Please select a rating";
    if (!reviewForm.comment.trim()) errs.comment = "Please write a review";
    setReviewErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      if (editingReview) {
        const reviewId = editingReview.ID || editingReview.id || editingReview._id;
        await updateProductReview({ reviewId, rating: reviewForm.rating, title: reviewForm.title, comment: reviewForm.comment }).unwrap();
        Toast.success("Review updated");
      } else {
        await createProductReview({ productId: product?._id, rating: reviewForm.rating, title: reviewForm.title, comment: reviewForm.comment }).unwrap();
        Toast.success("Review submitted");
      }
      setShowReviewModal(false);
      setEditingReview(null);
      setReviewForm({ rating: 0, title: "", comment: "" });
      setReviewErrors({});
    } catch (err) {
      Toast.error(err?.data?.message || err?.data?.data?.message || "Failed to submit review");
    }
  };

  const handleDeleteReview = async (review) => {
    const reviewId = review.ID || review.id || review._id;
    if (!reviewId) return;
    try {
      await deleteProductReview({ reviewId }).unwrap();
      Toast.success("Review deleted");
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to delete review");
    }
  };

  const validateAddress = () => {
    const errs = {};
    if (!newAddr.name.trim()) errs.name = "Name is required";
    else if (!/^[a-zA-Z\s]+$/.test(newAddr.name.trim())) errs.name = "Name must contain only letters";
    if (!newAddr.phone.trim()) errs.phone = "Phone is required";
    else if (!/^\d{10}$/.test(newAddr.phone.trim())) errs.phone = "Enter a valid 10-digit phone number";
    if (!newAddr.addressLine1.trim()) errs.addressLine1 = "Address line 1 is required";
    if (!newAddr.pincode.trim()) errs.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(newAddr.pincode.trim())) errs.pincode = "Enter a valid 6-digit pincode";
    if (!newAddr.city.trim()) errs.city = "City is required";
    else if (!/^[a-zA-Z\s]+$/.test(newAddr.city.trim())) errs.city = "City must contain only letters";
    if (!newAddr.state.trim()) errs.state = "State is required";
    else if (!/^[a-zA-Z\s]+$/.test(newAddr.state.trim())) errs.state = "State must contain only letters";
    setAddrErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddAddress = async () => {
    if (!validateAddress()) return;
    try {
      if (editingAddress) {
        const addrId = editingAddress._id || editingAddress.id;
        await updateAddressApi({ addressId: addrId, ...newAddr }).unwrap();
        Toast.success("Address updated");
      } else {
        await addAddress(newAddr).unwrap();
        Toast.success("Address added");
      }
      setShowNewAddress(false);
      setEditingAddress(null);
      setAddrErrors({});
      setNewAddr({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" });
      setShowAddress(true);
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to save address");
    }
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
    setNewAddr({
      name: addr.name || "",
      phone: addr.phone || "",
      addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      landmark: addr.landmark || "",
      type: addr.type || "home",
      country: addr.country || "IN",
    });
    setShowAddress(false);
    setShowNewAddress(true);
  };

  const handleDeleteAddress = async (addrId) => {
    if (!addrId) return;
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await deleteAddress({ addressId: addrId }).unwrap();
      Toast.success("Address deleted");
      if (selectedAddress === addrId) setSelectedAddress(null);
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to delete address");
    }
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn()) { redirectToLogin(); return; }
    if (!mongoId) { Toast.error("Loading product details, please wait..."); return; }
    const vid = getVid(selectedVariant);
    if (!vid) { Toast.error("Please select a variant"); return; }
    if (!isVariantInStock(selectedVariant)) { Toast.error("This variant is out of stock"); return; }
    try {
      if (isInCart) {
        const cartVid = cartMatch?.variantId?._id || cartMatch?.variantId?.id || (typeof cartMatch?.variantId === "string" && cartMatch.variantId ? cartMatch.variantId : "") || vid;
        await updateCartItem({ productId: mongoId, variantId: cartVid, quantity: qty }).unwrap();
        Toast.success(`${title} quantity updated`);
        return;
      }
      await addToCart({ productId: mongoId, variantId: vid, skuCode: selectedVariant?.skuCode || selectedVariant?.sku || "", quantity: qty }).unwrap();
      Toast.success(`${title} added to cart`);
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to add to cart");
    }
  };

  const handleBuyNow = () => {
    if (!isLoggedIn()) { redirectToLogin(); return; }
    if (!mongoId) { Toast.error("Loading product details, please wait..."); return; }
    const vid = getVid(selectedVariant);
    if (!vid) { Toast.error("Please select a variant"); return; }
    if (!isVariantInStock(selectedVariant)) { Toast.error("This variant is out of stock"); return; }
    if (!addressLoading && addressList.length === 0) {
      setEditingAddress(null);
      setNewAddr({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" });
      setShowNewAddress(true);
    } else {
      setShowAddress(true);
    }
  };

  // Extract all fields from API response
  const DEFAULT_IMG = DefaultImages.AstromallProductDefault;
  const resolveImg = (img) => {
    if (!img) return null;
    if (typeof img === "string") return img;
    if (typeof img === "object") return img.original || img.small || img.url || img.src || null;
    return null;
  };
  const bannerImg = resolveImg(product?.banner_image) || null;
  // New format: variant.image is a single string; Old format: variant.images is an array
  const variantImg = selectedVariant?.image ? resolveImg(selectedVariant.image) : null;
  const variantImgs = selectedVariant?.images?.length > 0 ? selectedVariant.images.map(resolveImg).filter(Boolean) : [];
  const hasVariantImages = !!(variantImg || variantImgs.length > 0);
  // Collect all variant images as fallback
  const allVariantImages = (product?.variants || [])
    .flatMap((v) => {
      const imgs = [];
      if (v.image) { const r = resolveImg(v.image); if (r) imgs.push(r); }
      if (v.images?.length) imgs.push(...v.images.map(resolveImg).filter(Boolean));
      return imgs;
    });
  const allImages = hasVariantImages
    ? (variantImg ? [variantImg, ...variantImgs] : variantImgs)
    : [bannerImg, ...(product?.images || []).map(resolveImg), resolveImg(product?.imgUrl), resolveImg(product?.image), resolveImg(product?.thumbnail), ...allVariantImages].filter(Boolean);
  const uniqueImages = allImages.length > 0 ? [...new Set(allImages)] : [];

  // Pre-validate images: check which URLs actually load
  const [validatedImages, setValidatedImages] = useState(null); // null = still checking
  useEffect(() => {
    if (uniqueImages.length === 0) { setValidatedImages([]); return; }
    let cancelled = false;
    const checks = uniqueImages.map((src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => resolve(null);
      img.src = src;
    }));
    Promise.all(checks).then((results) => {
      if (!cancelled) setValidatedImages(results.filter(Boolean));
    });
    return () => { cancelled = true; };
  }, [uniqueImages.join(",")]);

  const galleryImages = validatedImages || [];
  const showDefault = validatedImages !== null && galleryImages.length === 0;

  // Build video embed URL if available
  const { videoEmbedUrl, videoThumb } = (() => {
    if (!product?.video_url) return { videoEmbedUrl: null, videoThumb: null };
    let url = product.video_url;
    let videoId = null;
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) videoId = shortMatch[1];
    const shortsMatch = !videoId && url.match(/shorts\/([^?&]+)/);
    if (shortsMatch) videoId = shortsMatch[1];
    const watchMatch = !videoId && url.match(/[?&]v=([^?&]+)/);
    if (watchMatch) videoId = watchMatch[1];
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : null;
    return { videoEmbedUrl: embedUrl, videoThumb: thumb };
  })();

  // Total gallery items = images + video (if exists)
  const totalGalleryItems = galleryImages.length + (videoEmbedUrl ? 1 : 0);
  const videoIndex = videoEmbedUrl ? galleryImages.length : -1;
  const [activeImg, setActiveImg] = useState(0);
  const isVideoActive = activeImg === videoIndex;
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const safeIdx = activeImg >= galleryImages.length ? 0 : activeImg;
  const image = (validatedImages === null) ? null : (showDefault ? DEFAULT_IMG : (galleryImages[safeIdx] || DEFAULT_IMG));
  const title = product?.title || product?.name || "";
  const price = selectedVariant?.price || product?.price || product?.selling_price || product?.mrp || 0;
  const mrp = selectedVariant?.mrp || product?.mrp || product?.compare_price || 0;
  const description = product?.short_description || product?.description || product?.long_description || "";
  const ratingRaw = product?.rating;
  const productRating = typeof ratingRaw === "object" ? (ratingRaw?.average || 0) : (ratingRaw || 0);
  const productReviewCount = (typeof ratingRaw === "object" ? ratingRaw?.totalReviews : null) || product?.reviewCount || product?.review_count || 0;
  const faqs = (product?.faq || product?.quesandans || product?.faqs || []).map((q) => ({ q: q.question || q.q, a: q.answer || q.a }));
  const apiReviews = reviewsData?.data?.data?.reviews || reviewsData?.data?.reviews || reviewsData?.data?.data?.list || reviewsData?.data?.list || (Array.isArray(reviewsData?.data) ? reviewsData.data : []) || (Array.isArray(reviewsData?.data?.data) ? reviewsData.data.data : []);
  const totalReviewCount = reviewsData?.data?.data?.pagination?.total || reviewsData?.data?.pagination?.total || reviewsData?.pagination?.total || reviewsData?.data?.data?.total || reviewsData?.data?.total || apiReviews?.length || productReviewCount;

  // Calculate average rating from reviews API response
  const calcAvg = apiReviews.length > 0
    ? Math.round((apiReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / apiReviews.length) * 10) / 10
    : 0;
  const rating = calcAvg || productRating;
  const reviewCount = totalReviewCount || productReviewCount;

  if (isLoading && !stateData) {
    return <div className={styles.page}><div style={{ textAlign: "center", padding: "80px 0", color: "#999" }}>Loading...</div></div>;
  }

  // API returned but product not found — show 404
  if (!isLoading && apiData && !apiSuccess) {
    return (
      <div className={styles.page}>
        <div className={styles.topNav}>
          <button className={styles.backBtn} onClick={() => navigate("/astromall")}>
            <span className={styles.backCircle}><FiChevronLeft /></span>
            <span className={styles.backLabel}>Back</span>
          </button>
        </div>
        <div style={{ textAlign: "center", padding: "80px 0", color: "#999" }}>
          <p style={{ fontSize: 48, margin: "0 0 8px" }}>404</p>
          <p style={{ fontSize: 16, margin: "0 0 20px" }}>Product not found</p>
          <button className={styles.bookBtn} onClick={() => navigate("/astromall")}>Browse Products</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Top Nav */}
      <div className={styles.topNav}>
        <button className={styles.backBtn} onClick={() => navigate("/astromall")}>
          <span className={styles.backCircle}><FiChevronLeft /></span>
          <span className={styles.backLabel}>AstroMall</span>
        </button>
        <div className={styles.topRight}>
          <AstromallCartSidebar />
        </div>
      </div>

      <div className={styles.twoCol}>
        {/* LEFT — Image Gallery */}
        <div className={styles.leftCol}>
          {isVideoActive ? (
            <div className={styles.mainImageWrap}>
              <iframe
                src={`${videoEmbedUrl}?autoplay=1`}
                className={styles.galleryVideo}
                title="Product video"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          ) : (
            <div
              className={`${styles.mainImageWrap} ${zoomed ? styles.mainImageZoomed : ""}`}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
              }}
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
            >
              {image ? (
                <img
                  src={image}
                  alt={title}
                  className={styles.mainImage}
                  style={zoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999" }}>Loading...</div>
              )}
            </div>
          )}
          {totalGalleryItems > 1 && (
            <div className={styles.thumbRow}>
              {galleryImages.map((img, i) => (
                <img
                  key={img}
                  src={img}
                  alt={`${title} ${i + 1}`}
                  className={`${styles.thumbImg} ${!isVideoActive && safeIdx === i ? styles.thumbActive : ""}`}
                  onClick={() => setActiveImg(i)}
                />
              ))}
              {videoEmbedUrl && (
                <div
                  className={`${styles.thumbVideo} ${isVideoActive ? styles.thumbActive : ""}`}
                  onClick={() => setActiveImg(videoIndex)}
                  role="button"
                  tabIndex={0}
                  aria-label="Play product video"
                >
                  <img
                    src={videoThumb || galleryImages[0]}
                    alt="Video"
                    className={styles.thumbVideoImg}
                  />
                  <span className={styles.playIcon}>▶</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Content */}
        <div className={styles.rightCol}>
          {title && <h1 className={styles.title}>{title}</h1>}

          <div className={styles.ratingLine}>
            <StarRating rating={rating} size={18} />
            <span className={styles.revCount}>({Number(reviewCount || 0).toLocaleString()} reviews)</span>
          </div>

          {description && <p className={styles.desc}>{description}</p>}

          {/* Price */}
          <div className={styles.priceRow}>
            <p className={styles.price}>₹{price}</p>
            {mrp > price && <p className={styles.mrp}>₹{mrp}</p>}
          </div>

          {/* Variant Selector — Grouped by Attribute */}
          {attrDimensions.length > 0 && (
            <div className={styles.attrSelector}>
              {attrDimensions.map((dim) => {
                const isTypeDim = dim.name.toLowerCase() === "type";
                const available = new Set(getAvailableValues(dim.name));
                return (
                  <div key={dim.name} className={styles.attrGroup}>
                    <span className={styles.attrLabel}>{dim.name}</span>
                    <div className={styles.attrOptions}>
                      {dim.values.map((val) => {
                        const isSelected = selectedAttrs[dim.name] === val;
                        const isAvailable = isTypeDim ? true : available.has(val);
                        return (
                          <button
                            key={val}
                            className={`${styles.attrBtn} ${isSelected ? styles.attrBtnActive : ""} ${!isAvailable ? styles.attrBtnDisabled : ""}`}
                            onClick={() => isAvailable && handleAttrSelect(dim.name, val)}
                            disabled={!isAvailable}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback: flat variant buttons when no attributes/config exist */}
          {attrDimensions.length === 0 && activeVariants.filter((v) => v.title).length > 1 && (
            <div className={styles.variantWrap}>
              {activeVariants.map((variant, idx) => {
                if (!variant.title) return null;
                return (
                  <button
                    key={getVid(variant) || `v-${idx}`}
                    className={`${styles.variantBtn} ${selectedVariant === variant || getVid(selectedVariant) === getVid(variant) ? styles.variantActive : ""}`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    {variant.title}
                  </button>
                );
              })}
            </div>
          )}

          {/* Qty + Buttons */}
          <div className={styles.actionRow}>
            <div className={styles.qtyRow}>
              <button className={styles.qtyBtn} onClick={() => handleQtyChange(qty - 1)} disabled={qty <= 1} aria-label="Decrease quantity"><FiMinus /></button>
              <span className={styles.qtyVal}>{qty}</span>
              <button className={`${styles.qtyBtn} ${styles.qtyBtnPlus}`} onClick={() => handleQtyChange(qty + 1)} disabled={stockLimited} aria-label="Increase quantity"><FiPlus /></button>
            </div>
            <div className={styles.btnGroup}>
              <button className={styles.cartBtn} onClick={handleAddToCart} disabled={isAddingToCart || !isVariantInStock(selectedVariant)}>
                {!isVariantInStock(selectedVariant) ? "Out of Stock" : isAddingToCart ? "Adding..." : "Add to Cart"}
              </button>
              <button className={styles.bookBtn} onClick={handleBuyNow} disabled={isAddingToCart || !isVariantInStock(selectedVariant)}>
                Buy Now
              </button>
            </div>
          </div>

          {/* Specifications */}
          {product?.specifications?.length > 0 && (
            <div className={styles.faqSection}>
              <FaqItem
                q="Specifications"
                defaultOpen
                a={
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {product.specifications.map((spec, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "8px 12px", fontSize: "14px", fontWeight: 600, color: "#555", width: "40%" }}>{spec.key}</td>
                          <td style={{ padding: "8px 12px", fontSize: "14px", color: "#222" }}>{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
              />
            </div>
          )}

          {/* FAQ */}
          {faqs.length > 0 && (
            <div className={styles.faqSection}>
              {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
            </div>
          )}

          {/* Reviews */}
          <div className={styles.reviewSection}>
            <h2 className={styles.reviewHeading}>USER REVIEWS</h2>

            <div className={styles.reviewSummary}>
              <StarRating rating={rating} size={28} />
              <p>{Number(rating).toFixed(1)} out of 5 · {reviewCount.toLocaleString()} total ratings</p>
            </div>

            {reviewsLoading && <p style={{ textAlign: "center", color: "#999", padding: "16px 0" }}>Loading reviews...</p>}

            {!reviewsLoading && apiReviews.length > 0 && (
              <div className={styles.reviewList}>
                {apiReviews.map((r, i) => {
                  const rName = [r.firstName, r.lastName].filter(Boolean).join(" ") || r.userName || r.user_name || r.name || "Anonymous";
                  const rRating = typeof r.rating === "object" ? r.rating?.average : (r.rating || r.stars || 0);
                  const rText = r.review || r.comment || r.text || "";
                  const rDate = r.createdAt || r.created_at || r.date || "";
                  const fDate = rDate && rDate.includes("T") ? new Date(rDate).toLocaleDateString("en-IN") : rDate;
                  const currentUserId = localStorage.getItem("shubhtalk_customer_id");
                  const reviewOwnerId = r.userId?._id || r.userId || r.user?._id || r.user || r.customerId || r.customer_id || r.createdBy;
                  const isOwn = !!(currentUserId && reviewOwnerId && String(currentUserId) === String(reviewOwnerId));
                  return (
                    <div key={r._id || r.id || i} className={styles.reviewCard}>
                      <div className={styles.reviewTop}>
                        {fDate && <span className={styles.reviewDate}><FiCalendar size={13} /> {fDate}</span>}
                        <div className={styles.reviewTopRight}>
                          {isOwn && <button className={styles.reviewActionBtn} onClick={() => openReviewModal(r)} aria-label="Edit review"><FiEdit2 size={14} /></button>}
                          {isOwn && <button className={styles.reviewActionBtn} onClick={() => handleDeleteReview(r)} aria-label="Delete review"><FiTrash2 size={14} /></button>}
                          {rRating > 0 && <span className={styles.reviewBadge}>★ {Number(rRating).toFixed(1)}</span>}
                        </div>
                      </div>
                      <h4 className={styles.reviewName}>{rName}</h4>
                      {r.title && <p className={styles.reviewTitle}>{r.title}</p>}
                      {rText && <p className={styles.reviewText}>{rText}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            {!reviewsLoading && apiReviews.length === 0 && (
              <p style={{ textAlign: "center", color: "#aaa", padding: "20px 0" }}>No reviews yet</p>
            )}

            <div className={styles.shareWrap}>
              <button className={styles.shareBtn} onClick={() => openReviewModal()}>Write a Review</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Address Modal ── */}
      {showAddress && (
        <div className={styles.overlay} onClick={() => setShowAddress(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowAddress(false)} aria-label="Close"><FiX /></button>
            <h2 className={styles.modalTitle}>SELECT ADDRESS</h2>
            <div className={styles.addressList}>
              {addressLoading && <p style={{ textAlign: "center", color: "#999", padding: "16px 0" }}>Loading addresses...</p>}
              {!addressLoading && addressList.length === 0 && (
                <p style={{ textAlign: "center", color: "#aaa", padding: "16px 0" }}>No saved addresses</p>
              )}
              {!addressLoading && addressList.map((a) => {
                const addrId = a._id || a.id;
                const addrType = a.type || "home";
                return (
                  <div key={addrId} className={`${styles.addressCard} ${selectedAddress === addrId ? styles.addressActive : ""}`} onClick={() => setSelectedAddress(addrId)} style={{ cursor: "pointer" }}>
                    <span className={styles.addressIcon}>{addrType === "home" ? <FiHome /> : <FiBriefcase />}</span>
                    <div className={styles.addressInfo}>
                      <span className={styles.addressType}>{a.name || addrType}{a.phone ? ` · ${a.phone}` : ""}</span>
                      <p className={styles.addressText}>
                        {[a.addressLine1, a.addressLine2, a.landmark].filter(Boolean).join(", ")}
                        <br />{[a.city, a.state, a.pincode].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <button className={styles.reviewActionBtn} onClick={(e) => { e.stopPropagation(); openEditAddress(a); }} aria-label="Edit address"><FiEdit2 size={14} /></button>
                    <button className={styles.reviewActionBtn} onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addrId); }} aria-label="Delete address"><FiTrash2 size={14} /></button>
                    <input type="radio" name="address" checked={selectedAddress === addrId} readOnly className={styles.addressRadio} />
                  </div>
                );
              })}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.addAddressBtn} onClick={() => { setShowAddress(false); setEditingAddress(null); setNewAddr({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" }); setShowNewAddress(true); }}>Add New Address +</button>
              <button className={styles.orderBtn} disabled={!selectedAddress} onClick={() => {
                const chosen = addressList.find((a) => (a._id || a.id) === selectedAddress);
                setShowAddress(false);
                navigate("/checkout", { state: { buyNowProduct: product, buyNowVariant: selectedVariant, buyNowQty: qty, address: chosen } });
              }}>Order Here</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add New Address Modal ── */}
      {showNewAddress && (
        <div className={styles.overlay} onClick={() => setShowNewAddress(false)}>
          <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowNewAddress(false)} aria-label="Close"><FiX /></button>
            <h2 className={styles.modalTitle}>{editingAddress ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}</h2>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name <span style={{color:'#dc2626'}}>*</span></label>
                <input type="text" placeholder="Full name" className={`${styles.formInput} ${addrErrors.name ? styles.formInputError : ""}`} value={newAddr.name} onChange={(e) => { setNewAddr({ ...newAddr, name: e.target.value }); setAddrErrors({ ...addrErrors, name: "" }); }} />
                {addrErrors.name && <p className={styles.formError}>{addrErrors.name}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone <span style={{color:'#dc2626'}}>*</span></label>
                <input type="tel" placeholder="Phone number" maxLength={10} className={`${styles.formInput} ${addrErrors.phone ? styles.formInputError : ""}`} value={newAddr.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setNewAddr({ ...newAddr, phone: v }); setAddrErrors({ ...addrErrors, phone: "" }); }} />
                {addrErrors.phone && <p className={styles.formError}>{addrErrors.phone}</p>}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address line 1 <span style={{color:'#dc2626'}}>*</span></label>
              <input type="text" placeholder="Enter here" className={`${styles.formInput} ${addrErrors.addressLine1 ? styles.formInputError : ""}`} value={newAddr.addressLine1} onChange={(e) => { setNewAddr({ ...newAddr, addressLine1: e.target.value }); setAddrErrors({ ...addrErrors, addressLine1: "" }); }} />
              {addrErrors.addressLine1 && <p className={styles.formError}>{addrErrors.addressLine1}</p>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address line 2</label>
              <input type="text" placeholder="Enter here" className={styles.formInput} value={newAddr.addressLine2} onChange={(e) => setNewAddr({ ...newAddr, addressLine2: e.target.value })} />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Pincode <span style={{color:'#dc2626'}}>*</span></label>
                <input type="text" placeholder="Enter here" maxLength={6} className={`${styles.formInput} ${addrErrors.pincode ? styles.formInputError : ""}`} value={newAddr.pincode} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setNewAddr({ ...newAddr, pincode: v }); setAddrErrors({ ...addrErrors, pincode: "" }); }} />
                {addrErrors.pincode && <p className={styles.formError}>{addrErrors.pincode}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>City <span style={{color:'#dc2626'}}>*</span></label>
                <input type="text" placeholder="Enter here" className={`${styles.formInput} ${addrErrors.city ? styles.formInputError : ""}`} value={newAddr.city} onChange={(e) => { setNewAddr({ ...newAddr, city: e.target.value }); setAddrErrors({ ...addrErrors, city: "" }); }} />
                {addrErrors.city && <p className={styles.formError}>{addrErrors.city}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>State <span style={{color:'#dc2626'}}>*</span></label>
                <input type="text" placeholder="Type here" className={`${styles.formInput} ${addrErrors.state ? styles.formInputError : ""}`} value={newAddr.state} onChange={(e) => { setNewAddr({ ...newAddr, state: e.target.value }); setAddrErrors({ ...addrErrors, state: "" }); }} />
                {addrErrors.state && <p className={styles.formError}>{addrErrors.state}</p>}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Landmark</label>
              <input type="text" placeholder="Near..." className={styles.formInput} value={newAddr.landmark} onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })} />
            </div>
            <div className={styles.saveAsGroup}>
              <span className={styles.saveAsLabel}>Save Address as</span>
              <div className={styles.saveAsTags}>
                <button className={`${styles.saveAsTag} ${newAddr.type === "home" ? styles.saveAsActive : ""}`} onClick={() => setNewAddr({ ...newAddr, type: "home" })}>Home</button>
                <button className={`${styles.saveAsTag} ${newAddr.type === "work" ? styles.saveAsActive : ""}`} onClick={() => setNewAddr({ ...newAddr, type: "work" })}>Work</button>
                <button className={`${styles.saveAsTag} ${newAddr.type === "other" ? styles.saveAsActive : ""}`} onClick={() => setNewAddr({ ...newAddr, type: "other" })}>Other</button>
              </div>
            </div>
            <button className={styles.saveAddressBtn} onClick={handleAddAddress} disabled={isAddingAddress || isUpdatingAddress}>
              {(isAddingAddress || isUpdatingAddress) ? "Saving..." : (editingAddress ? "Update Address ›" : "Save Address ›")}
            </button>
          </div>
        </div>
      )}

      {/* ── Review Modal ── */}
      {showReviewModal && (
        <div className={styles.overlay} onClick={() => setShowReviewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowReviewModal(false)} aria-label="Close"><FiX /></button>
            <h2 className={styles.modalTitle}>{editingReview ? "Edit Review" : "Write a Review"}</h2>

            <div className={styles.reviewFormStars}>
              <p className={styles.formLabel}>Your Rating *</p>
              <InteractiveStars value={reviewForm.rating} onChange={(val) => { setReviewForm({ ...reviewForm, rating: val }); setReviewErrors({ ...reviewErrors, rating: "" }); }} size={32} />
              {reviewErrors.rating && <p className={styles.formError}>{reviewErrors.rating}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Title (optional)</label>
              <input type="text" placeholder="e.g. Great product!" className={styles.formInput} value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Your Review <span style={{color:'#dc2626'}}>*</span></label>
              <textarea placeholder="Share your experience..." className={`${styles.formTextarea} ${reviewErrors.comment ? styles.formInputError : ""}`} rows={4} value={reviewForm.comment} onChange={(e) => { setReviewForm({ ...reviewForm, comment: e.target.value }); setReviewErrors({ ...reviewErrors, comment: "" }); }} />
              {reviewErrors.comment && <p className={styles.formError}>{reviewErrors.comment}</p>}
            </div>

            <button className={styles.submitReviewBtn} onClick={handleSubmitReview} disabled={isCreatingReview || isUpdatingReview}>
              {(isCreatingReview || isUpdatingReview) ? "Submitting..." : (editingReview ? "Update Review" : "Submit Review")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EPoojaDetail;
