import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import styles from "./EPoojaDetail.module.scss";
import { FiChevronLeft, FiPlus, FiMinus, FiCalendar, FiX, FiHome, FiBriefcase, FiEdit2, FiTrash2 } from "react-icons/fi";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { useGetEPoojaDetailQuery, useGetProductReviewsQuery, useAddToCartMutation, useGetCartQuery, useUpdateCartItemMutation, useCreateProductReviewMutation, useUpdateProductReviewMutation, useDeleteProductReviewMutation, useGetAddressesQuery, useAddAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation } from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import Toast from "../../../../component/toast";
import AstromallCartSidebar from "../components/AstromallCartSidebar";

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

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.faqCard}>
      <button className={styles.faqBtn} onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{q}</span>
        {open ? <FiMinus className={styles.faqIcon} /> : <FiPlus className={styles.faqIcon} />}
      </button>
      {open && <p className={styles.faqAnswer}>{a}</p>}
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
  const { data: apiData, isLoading } = useGetEPoojaDetailQuery(slug);
  const apiSuccess = !!(apiData?.success || apiData?.status === true);
  const product = (apiSuccess && apiData?.data) ? apiData.data : (stateData || {});

  // IDs — MongoDB _id needed for cart/review APIs
  const mongoId = product?._id || null;

  // Variant state
  const [selectedVariant, setSelectedVariant] = useState(null);
  useEffect(() => {
    if (product?.variants?.length) {
      const activeVariant = product.variants.find(v => v.isActive);
      setSelectedVariant(activeVariant || product.variants[0]);
    }
  }, [product]);

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
  const [qty, setQty] = useState(1);

  // Sync qty with cart data
  const { data: cartData } = useGetCartQuery();
  const cartItems = cartData?.data?.items || cartData?.data?.cart?.items || cartData?.data || [];
  const cartItemsList = Array.isArray(cartItems) ? cartItems : [];
  const cartMatch = cartItemsList.find((item) => {
    const p = item?.productId || item?.product || item;
    return p?._id === product?._id || String(p?._id) === String(product?._id);
  });
  const isInCart = !!cartMatch;

  useEffect(() => {
    if (cartMatch?.quantity) setQty(cartMatch.quantity);
  }, [cartMatch?.quantity]);

  const handleQtyChange = (newQty) => {
    if (newQty < 1) return;
    setQty(newQty);
    if (isInCart) {
      const productId = cartMatch?.productId?._id || cartMatch?.product?._id || cartMatch?._id;
      if (productId) updateCartItem({ productId, quantity: newQty });
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
    if (!selectedVariant) { Toast.error("Please select a variant"); return; }
    if (selectedVariant?.stock === 0) { Toast.error("This variant is out of stock"); return; }
    try {
      await addToCart({ productId: mongoId, variantId: selectedVariant._id, quantity: qty }).unwrap();
      Toast.success(`${title} added to cart`);
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to add to cart");
    }
  };

  const handleBuyNow = () => {
    if (!isLoggedIn()) { redirectToLogin(); return; }
    if (!mongoId) { Toast.error("Loading product details, please wait..."); return; }
    if (!addressLoading && addressList.length === 0) {
      setEditingAddress(null);
      setNewAddr({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" });
      setShowNewAddress(true);
    } else {
      setShowAddress(true);
    }
  };

  // Extract all fields from API response
  const DEFAULT_IMG = "https://images.unsplash.com/photo-1625072290979-cac544181be8?w=800&q=80";
  const bannerImg = product?.banner_image?.original || product?.banner_image?.small || null;
  const variantImages = selectedVariant?.images?.length ? selectedVariant.images : [];
  const rawImages = variantImages.length > 0 ? variantImages : (product?.images || []);
  const allImages = [bannerImg, ...rawImages, product?.imgUrl, product?.image, product?.thumbnail].filter(Boolean);
  const galleryImages = allImages.length > 0 ? [...new Set(allImages)] : [DEFAULT_IMG];
  const [activeImg, setActiveImg] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const image = galleryImages[activeImg] || galleryImages[0];

  const title = product?.title || product?.name || "";
  const price = selectedVariant?.price || product?.price || product?.selling_price || product?.mrp || 0;
  const mrp = selectedVariant?.mrp || product?.mrp || product?.compare_price || 0;
  const description = product?.short_description || product?.description || product?.long_description || "";
  const ratingRaw = product?.rating;
  const productRating = typeof ratingRaw === "object" ? (ratingRaw?.average || 0) : (ratingRaw || 0);
  const productReviewCount = (typeof ratingRaw === "object" ? ratingRaw?.totalReviews : null) || product?.reviewCount || product?.review_count || 0;
  const faqs = (product?.quesandans || product?.faqs || []).map((q) => ({ q: q.question || q.q, a: q.answer || q.a }));
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
          <div
            className={`${styles.mainImageWrap} ${zoomed ? styles.mainImageZoomed : ""}`}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
            }}
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
          >
            <img
              src={image}
              alt={title}
              className={styles.mainImage}
              style={zoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
            />
          </div>
          {galleryImages.length > 1 && (
            <div className={styles.thumbRow}>
              {galleryImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${title} ${i + 1}`}
                  className={`${styles.thumbImg} ${activeImg === i ? styles.thumbActive : ""}`}
                  onClick={() => setActiveImg(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Content */}
        <div className={styles.rightCol}>
          {title && <h1 className={styles.title}>{title}</h1>}

          <div className={styles.ratingLine}>
            <StarRating rating={rating} size={18} />
            <span className={styles.revCount}>({reviewCount.toLocaleString()} reviews)</span>
          </div>

          {description && <p className={styles.desc}>{description}</p>}

          {/* Price */}
          <div className={styles.priceRow}>
            <p className={styles.price}>₹{price}</p>
            {mrp > price && <p className={styles.mrp}>₹{mrp}</p>}
          </div>

          {/* Variant Selector */}
          {product?.variants?.length > 0 && (
            <div className={styles.variantWrap}>
              {product.variants.map((variant) => (
                <button
                  key={variant._id}
                  className={`${styles.variantBtn} ${selectedVariant?._id === variant._id ? styles.variantActive : ""}`}
                  onClick={() => setSelectedVariant(variant)}
                >
                  {variant.title}
                </button>
              ))}
            </div>
          )}

          {/* Variant Attributes */}
          {selectedVariant?.attributes?.length > 0 && (
            <div className={styles.variantSpecs}>
              {selectedVariant.attributes.map((attr, i) => (
                <p key={i}><strong>{attr.name}:</strong> {attr.value}</p>
              ))}
            </div>
          )}

          {/* Qty + Buttons */}
          <div className={styles.actionRow}>
            <div className={styles.qtyRow}>
              <button className={styles.qtyBtn} onClick={() => handleQtyChange(qty - 1)} aria-label="Decrease quantity"><FiMinus /></button>
              <span className={styles.qtyVal}>{qty}</span>
              <button className={`${styles.qtyBtn} ${styles.qtyBtnPlus}`} onClick={() => handleQtyChange(qty + 1)} aria-label="Increase quantity"><FiPlus /></button>
            </div>
            <div className={styles.btnGroup}>
              <button className={styles.cartBtn} onClick={handleAddToCart} disabled={isAddingToCart || selectedVariant?.stock === 0}>
                {selectedVariant?.stock === 0 ? "Out of Stock" : isAddingToCart ? "Adding..." : "Add to Cart"}
              </button>
              <button className={styles.bookBtn} onClick={handleBuyNow} disabled={isAddingToCart || selectedVariant?.stock === 0}>
                Buy Now
              </button>
            </div>
          </div>

          {/* Video */}
          {product?.video_url && (() => {
            let embedUrl = product.video_url;
            // youtu.be/ID or youtu.be/ID?si=...
            const shortMatch = embedUrl.match(/youtu\.be\/([^?&]+)/);
            if (shortMatch) {
              embedUrl = `https://www.youtube.com/embed/${shortMatch[1]}`;
            } else if (embedUrl.includes("shorts/")) {
              embedUrl = embedUrl.replace("shorts/", "embed/");
            } else {
              // youtube.com/watch?v=ID
              const watchMatch = embedUrl.match(/[?&]v=([^&]+)/);
              if (watchMatch) embedUrl = `https://www.youtube.com/embed/${watchMatch[1]}`;
            }
            return (
              <iframe
                src={embedUrl}
                className={styles.video}
                title="Product video"
                allowFullScreen
              />
            );
          })()}

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
                navigate("/checkout", { state: { buyNowProduct: product, buyNowQty: qty, address: chosen } });
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
                <label className={styles.formLabel}>Name *</label>
                <input type="text" placeholder="Full name" className={`${styles.formInput} ${addrErrors.name ? styles.formInputError : ""}`} value={newAddr.name} onChange={(e) => { setNewAddr({ ...newAddr, name: e.target.value }); setAddrErrors({ ...addrErrors, name: "" }); }} />
                {addrErrors.name && <p className={styles.formError}>{addrErrors.name}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone *</label>
                <input type="tel" placeholder="Phone number" maxLength={10} className={`${styles.formInput} ${addrErrors.phone ? styles.formInputError : ""}`} value={newAddr.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setNewAddr({ ...newAddr, phone: v }); setAddrErrors({ ...addrErrors, phone: "" }); }} />
                {addrErrors.phone && <p className={styles.formError}>{addrErrors.phone}</p>}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address line 1 *</label>
              <input type="text" placeholder="Enter here" className={`${styles.formInput} ${addrErrors.addressLine1 ? styles.formInputError : ""}`} value={newAddr.addressLine1} onChange={(e) => { setNewAddr({ ...newAddr, addressLine1: e.target.value }); setAddrErrors({ ...addrErrors, addressLine1: "" }); }} />
              {addrErrors.addressLine1 && <p className={styles.formError}>{addrErrors.addressLine1}</p>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address line 2</label>
              <input type="text" placeholder="Enter here" className={styles.formInput} value={newAddr.addressLine2} onChange={(e) => setNewAddr({ ...newAddr, addressLine2: e.target.value })} />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Pincode *</label>
                <input type="text" placeholder="Enter here" maxLength={6} className={`${styles.formInput} ${addrErrors.pincode ? styles.formInputError : ""}`} value={newAddr.pincode} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setNewAddr({ ...newAddr, pincode: v }); setAddrErrors({ ...addrErrors, pincode: "" }); }} />
                {addrErrors.pincode && <p className={styles.formError}>{addrErrors.pincode}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>City *</label>
                <input type="text" placeholder="Enter here" className={`${styles.formInput} ${addrErrors.city ? styles.formInputError : ""}`} value={newAddr.city} onChange={(e) => { setNewAddr({ ...newAddr, city: e.target.value }); setAddrErrors({ ...addrErrors, city: "" }); }} />
                {addrErrors.city && <p className={styles.formError}>{addrErrors.city}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>State *</label>
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
              <label className={styles.formLabel}>Your Review *</label>
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
