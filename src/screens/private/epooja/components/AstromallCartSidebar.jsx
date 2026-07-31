import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import styles from "./AstromallCartSidebar.module.scss";
import { FiShoppingCart, FiX, FiTrash2, FiPlus, FiMinus } from "react-icons/fi";
import { useGetCartQuery, useUpdateCartItemMutation, useRemoveCartItemMutation } from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import Toast from "../../../../component/toast";
import { DefaultImages } from "../../../../utils/appImages";
import ProductImage from "../../../../component/UI/ProductImage";
import { BACKEND_PROXY } from "../../../../utils/apiConfig";

const DEFAULT_IMG = DefaultImages.AstromallProductDefault;

const getItemImage = (item, enrichedVariant) => {
  // 1. Enriched variant images (fetched from product API)
  if (enrichedVariant?.images?.length) return enrichedVariant.images[0];
  // 2. Variant snapshot images
  const snap = item?.variantSnapshot;
  if (snap?.images?.length) return snap.images[0];
  // 3. Populated variantId images
  if (typeof item?.variantId === "object" && item.variantId?.images?.length) return item.variantId.images[0];
  // 4. Product images
  const p = item?.productId || item?.product || item;
  if (p?.images?.length) return p.images[0];
  if (p?.banner_image?.original) return p.banner_image.original;
  if (p?.banner_image?.small) return p.banner_image.small;
  return p?.imgUrl || p?.image || p?.thumbnail || DEFAULT_IMG;
};
const getItemTitle = (item) => {
  const p = item?.productId || item?.product || item;
  return p?.title || p?.name || "Product";
};
const getItemPrice = (item) => {
  if (item?.currentPrice) return item.currentPrice;
  if (item?.priceAtAdd) return item.priceAtAdd;
  if (item?.variantSnapshot?.price) return item.variantSnapshot.price;
  const p = item?.productId || item?.product || item;
  const variant = p?.variants?.find((v) => v.isActive) || p?.variants?.[0];
  if (variant?.price) return variant.price;
  return p?.price || p?.selling_price || 0;
};
const getItemRouteId = (item) => {
  const p = item?.productId || item?.product || item;
  return p?.slug || p?.ID || p?.id || p?._id || "";
};

// Convert slug-style values (e.g. "Without-Silver-Capping") to readable text
const formatAttrValue = (value) => {
  if (!value || typeof value !== "string") return value;
  // If value contains hyphens and no spaces, treat as slug
  if (value.includes("-") && !value.includes(" ")) {
    return value.replace(/-/g, " ");
  }
  return value;
};

// Extract variant attributes from all possible sources on the cart item
const getVariantAttrs = (item) => {
  const seen = new Set();
  const attrs = [];
  const add = (name, value) => {
    const key = name?.toString().toLowerCase();
    if (key && value && !seen.has(key)) {
      seen.add(key);
      attrs.push({ name, value: formatAttrValue(value) });
    }
  };

  // Collect from variantSnapshot, variantId (populated), and direct fields
  const sources = [
    item?.variantSnapshot,
    typeof item?.variantId === "object" ? item.variantId : null,
  ].filter(Boolean);

  for (const src of sources) {
    // attributes: [{name,value}] or {type:"x", size:"y"}
    const a = src.attributes;
    if (Array.isArray(a)) a.forEach((x) => add(x.name, x.value));
    else if (a && typeof a === "object") Object.entries(a).forEach(([k, v]) => add(k, v));
    // Direct fields
    ["type", "size", "weight", "color", "material"].forEach((k) => { if (src[k]) add(k, src[k]); });
  }

  // Fallback: show variant title if no structured attrs found
  const vTitle = item?.variantSnapshot?.title || (typeof item?.variantId === "object" ? item.variantId?.title : null);
  if (attrs.length === 0 && vTitle) add("variant", vTitle);

  return attrs;
};

// Fetch product detail to enrich variant info
const fetchProductDetail = async (idOrSlug) => {
  try {
    const BASE_URL = BACKEND_PROXY;
    const role = localStorage.getItem("shubhtalk_role");
    const token = role === "ASTROLOGER" ? localStorage.getItem("shubhtalk_astro_token") : localStorage.getItem("shubhtalk_customer_token");
    const res = await fetch(`${BASE_URL}/api/mall/products/${idOrSlug}`, {
      headers: { accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const json = await res.json();
    return (json?.success || json?.status === true) ? json?.data : null;
  } catch { return null; }
};

const AstromallCartSidebar = () => {
  const navigate = useNavigate();
  const [showCart, setShowCart] = useState(false);
  const [enrichedVariants, setEnrichedVariants] = useState({});
  const [stockLimitedItems, setStockLimitedItems] = useState({});

  const { data: cartData, isLoading } = useGetCartQuery();
  const [removeCartItem] = useRemoveCartItemMutation();
  const [updateCartItem] = useUpdateCartItemMutation();

  const cartItems = cartData?.data?.items || cartData?.data?.cart?.items || cartData?.data || [];
  const items = Array.isArray(cartItems) ? cartItems : [];

  const cartTotal = cartData?.data?.totalAmount || items.reduce((sum, item) => {
    return sum + getItemPrice(item) * (item?.quantity || 1);
  }, 0);

  // Fetch product details to get variant attributes (type/size)
  const enrichVariants = useCallback(async () => {
    if (!items.length) return;
    const productMap = {};
    items.forEach((item) => {
      const p = item?.productId || item?.product || item;
      const pid = p?.slug || p?._id || p?.id || (typeof item?.productId === "string" ? item.productId : "");
      if (pid) productMap[pid] = true;
    });
    const ids = Object.keys(productMap);
    const results = await Promise.all(ids.map((id) => fetchProductDetail(id)));
    const variantMap = {};
    ids.forEach((id, i) => {
      const product = results[i];
      if (!product?.variants?.length) return;
      product.variants.forEach((v) => {
        const vid = v._id || v.id || v.skuCode || v.sku;
        if (vid) variantMap[vid] = v;
      });
    });
    setEnrichedVariants(variantMap);
  }, [items]);

  useEffect(() => {
    if (showCart && items.length > 0) enrichVariants();
  }, [showCart, items.length, enrichVariants]);

  // Get variant info: prefer enriched data, fall back to cart item data
  const getItemVariantInfo = (item) => {
    // Try enriched variant first
    const vid = item?.variantId?._id || item?.variantId?.id || (typeof item?.variantId === "string" ? item.variantId : "") || item?.variantSnapshot?._id || item?.variantSnapshot?.id || "";
    const enriched = enrichedVariants[vid];
    if (enriched) {
      const seen = new Set();
      const attrs = [];
      const add = (name, value) => {
        const key = name?.toString().toLowerCase();
        if (key && value && !seen.has(key)) { seen.add(key); attrs.push({ name, value: formatAttrValue(value) }); }
      };
      const a = enriched.attributes;
      if (Array.isArray(a)) a.forEach((x) => add(x.name, x.value));
      else if (a && typeof a === "object") Object.entries(a).forEach(([k, v]) => add(k, v));
      ["type", "size", "weight", "color", "material"].forEach((k) => { if (enriched[k]) add(k, enriched[k]); });
      if (attrs.length === 0 && enriched.title) add("variant", enriched.title);
      if (attrs.length > 0) return attrs;
    }
    return getVariantAttrs(item);
  };

  const getItemIds = (item) => {
    const p = item?.productId || item?.product || item;
    const productId = p?._id || p?.ID || (typeof item?.productId === "string" ? item.productId : "");
    const variantId = item?.variantId?._id || item?.variantId?.id || (typeof item?.variantId === "string" ? item.variantId : "") || item?.variantSnapshot?._id || item?.variantSnapshot?.id || "";
    return { productId, variantId };
  };

  const handleRemove = async (item) => {
    const { productId, variantId } = getItemIds(item);
    if (!productId) return;
    try {
      await removeCartItem({ productId, variantId }).unwrap();
      Toast.success("Item removed");
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to remove");
    }
  };

  const handleUpdateQty = async (item, newQty) => {
    const { productId, variantId } = getItemIds(item);
    if (!productId) return;
    if (newQty < 1) return;
    const prevQty = item?.quantity || 1;
    const itemKey = `${productId}_${variantId}`;
    try {
      await updateCartItem({ productId, variantId, quantity: newQty }).unwrap();
      if (newQty < prevQty) setStockLimitedItems((prev) => { const next = { ...prev }; delete next[itemKey]; return next; });
    } catch (err) {
      const msg = err?.data?.message || "";
      if (msg === "Insufficient stock") setStockLimitedItems((prev) => ({ ...prev, [itemKey]: true }));
      Toast.error(msg || "Failed to update quantity");
    }
  };

  return (
    <>
      <button className={styles.cartBtnWrap} onClick={() => setShowCart(true)} aria-label="Cart">
        <FiShoppingCart />
        {items.length > 0 && <span className={styles.cartBadge}>{items.length}</span>}
      </button>

      {showCart && createPortal(
        <div className={styles.cartOverlay} onClick={() => setShowCart(false)}>
          <div className={styles.cartSidebar} onClick={(e) => e.stopPropagation()}>
            <div className={styles.cartHeader}>
              <button className={styles.mobileCloseBtn} onClick={() => setShowCart(false)} aria-label="Close cart"><FiX /></button>
              <h2 className={styles.cartTitle}>Your Cart ({items.length})</h2>
              <button className={styles.cartClose} onClick={() => setShowCart(false)} aria-label="Close cart"><FiX /></button>
            </div>

            <div className={styles.cartBody}>
              {isLoading && <p className={styles.cartEmpty}>Loading cart...</p>}

              {!isLoading && items.length === 0 && (
                <div className={styles.cartEmpty}>
                  <FiShoppingCart size={40} color="#ccc" />
                  <p>Your cart is empty</p>
                </div>
              )}

              {!isLoading && items.map((item, idx) => {
                const qty = item?.quantity || 1;
                const itemPrice = getItemPrice(item);
                const routeId = getItemRouteId(item);
                const variantInfo = getItemVariantInfo(item);
                const vid = item?.variantId?._id || item?.variantId?.id || (typeof item?.variantId === "string" ? item.variantId : "") || item?.variantSnapshot?._id || item?.variantSnapshot?.id || "";
                const enrichedV = enrichedVariants[vid];
                const goToDetail = () => {
                  const p = item?.productId || item?.product || item;
                  const variantData = item?.variantSnapshot || (typeof item?.variantId === "object" ? item.variantId : null);
                  const variantIdStr = item?.variantId?._id || item?.variantId?.id || (typeof item?.variantId === "string" ? item.variantId : "") || item?.variantSnapshot?._id || item?.variantSnapshot?.id || "";
                  setShowCart(false);
                  navigate(`/product-details/${routeId}`, { state: { ...(typeof p === "object" ? p : { _id: p }), _selectedVariant: variantData ? { ...variantData, _id: variantData._id || variantIdStr } : variantIdStr ? { _id: variantIdStr } : undefined, _cartQty: qty } });
                };
                const { productId: pId, variantId: vId } = getItemIds(item);
                const sidebarItemKey = `${pId}_${vId}`;
                return (
                  <div key={item?._id || idx} className={styles.cartItem}>
                    <ProductImage src={getItemImage(item, enrichedV)} alt={getItemTitle(item)} className={styles.cartItemImg} onClick={goToDetail} style={{ cursor: "pointer" }} />
                    <div className={styles.cartItemInfo}>
                      <h4 className={styles.cartItemName} onClick={goToDetail} style={{ cursor: "pointer" }}>{getItemTitle(item)}</h4>
                      {variantInfo.length > 0 && (
                        <div className={styles.cartItemAttrs}>
                          {variantInfo.map((a, i) => (
                            <span key={i} className={styles.cartItemAttr}><strong>{a.name}:</strong> {a.value}{i < variantInfo.length - 1 ? "," : ""}</span>
                          ))}
                        </div>
                      )}
                      <div className={styles.qtyRow}>
                        <button className={styles.qtyBtn} onClick={() => handleUpdateQty(item, qty - 1)} disabled={qty <= 1} aria-label="Decrease quantity"><FiMinus size={12} /></button>
                        <span className={styles.qtyVal}>{qty}</span>
                        <button className={`${styles.qtyBtn} ${styles.qtyBtnPlus}`} onClick={() => handleUpdateQty(item, qty + 1)} disabled={stockLimitedItems[sidebarItemKey]} aria-label="Increase quantity"><FiPlus size={12} /></button>
                        <span className={styles.cartItemPrice}>₹{(itemPrice * qty).toLocaleString()}</span>
                      </div>
                    </div>
                    <button className={styles.cartItemRemove} onClick={() => handleRemove(item)} aria-label="Remove"><FiTrash2 size={16} /></button>
                  </div>
                );
              })}
            </div>

            {!isLoading && items.length > 0 && (
              <div className={styles.cartFooter}>
                <div className={styles.cartTotalRow}>
                  <span>Total</span>
                  <span className={styles.cartTotalPrice}>₹{cartTotal.toLocaleString()}</span>
                </div>
                <button className={styles.cartCheckoutBtn} onClick={() => { setShowCart(false); navigate("/viewcart"); }}>
                  Go to Cart
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AstromallCartSidebar;
