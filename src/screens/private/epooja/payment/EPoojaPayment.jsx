import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./EPoojaPayment.module.scss";
import { FiChevronLeft, FiSearch, FiMinus, FiPlus, FiX, FiHome, FiBriefcase, FiTrash2, FiShoppingCart } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { useGetCartQuery, useUpdateCartItemMutation, useRemoveCartItemMutation, useAddToCartMutation } from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import Toast from "../../../../component/toast";
import AstromallCartSidebar from "../components/AstromallCartSidebar";

const DEFAULT_IMG = "https://images.unsplash.com/photo-1625072290979-cac544181be8?w=800&q=80";

// ─── DUMMY COUPONS (no API yet) ───
const COUPONS = [
  { _id: "c1", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&q=80", label: "Exclusive", expires: "20/12/2025", text: "Claim 100% Extra on First Recharge" },
  { _id: "c2", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&q=80", label: "Exclusive", expires: "20/12/2025", text: "Claim 100% Extra on First Recharge" },
  { _id: "c3", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&q=80", label: "Exclusive", expires: "20/12/2025", text: "Claim 100% Extra on First Recharge" },
];

// ─── DUMMY ADDRESSES (no API yet) ───
const ADDRESSES = [
  { _id: "a1", type: "Home", icon: "home", address: "E-145, Silverline Nursing house...", pin: "110092" },
  { _id: "a2", type: "Work", icon: "work", address: "A-23, Near Noida 15 Metro Pillar 4", pin: "110092" },
];

const EPoojaPayment = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [showAddress, setShowAddress] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(ADDRESSES[0]._id);
  const [newAddr, setNewAddr] = useState({ line1: "", line2: "", pincode: "", city: "", state: "", saveAs: "Home" });

  // Cart is the single source of truth
  const { data: cartData, isLoading } = useGetCartQuery();
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeCartItem] = useRemoveCartItemMutation();
  const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();

  // Cart items from API
  const cartItems = cartData?.data?.items || cartData?.data?.cart?.items || cartData?.data || [];
  const items = Array.isArray(cartItems) ? cartItems : [];

  // Calculate total from cart items
  const total = items.reduce((sum, item) => {
    const price = item?.productId?.price || item?.product?.price || item?.price || 0;
    const qty = item?.quantity || 1;
    return sum + price * qty;
  }, 0);

  // Suggested products from cart response (if available)
  const suggested = cartData?.data?.suggestedProducts || cartData?.data?.recommended || [];

  const handleQtyChange = async (item, delta) => {
    const productId = item?.productId?._id || item?.product?._id || item?._id;
    const currentQty = item?.quantity || 1;
    const newQty = currentQty + delta;
    if (!productId) return;
    if (newQty < 1) return;
    try {
      await updateCartItem({ productId, quantity: newQty }).unwrap();
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to update quantity");
    }
  };

  const handleRemoveItem = async (item) => {
    const productId = item?.productId?._id || item?.product?._id || item?._id;
    if (!productId) return;
    try {
      await removeCartItem({ productId }).unwrap();
      Toast.success("Item removed from cart");
      // If cart becomes empty, go back to astromall
      if (items.length <= 1) navigate("/astromall");
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to remove item");
    }
  };

  const handleAddSuggested = async (product) => {
    const productId = product?._id || product?.id;
    if (!productId) return;
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      Toast.success(`${product?.title || product?.name || "Item"} added to cart`);
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to add to cart");
    }
  };

  const getItemImage = (item) => {
    const p = item?.productId || item?.product || item;
    return p?.banner_image?.original || p?.banner_image?.small || (p?.images?.length ? p.images[0] : null) || p?.imgUrl || p?.image || p?.thumbnail || DEFAULT_IMG;
  };

  const getItemTitle = (item) => {
    const p = item?.productId || item?.product || item;
    return p?.title || p?.name || "Product";
  };

  const getItemPrice = (item) => {
    const p = item?.productId || item?.product || item;
    return p?.price || p?.selling_price || 0;
  };

  if (isLoading) {
    return <div className={styles.page}><div style={{ textAlign: "center", padding: "80px 0", color: "#999" }}>Loading cart...</div></div>;
  }

  return (
    <div className={styles.page}>
      {/* ── Top Nav ── */}
      <div className={styles.topNav}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <span className={styles.backCircle}><FiChevronLeft /></span>
          <span className={styles.backLabel}>Cart</span>
        </button>
        <div className={styles.topRight}>
          <button className={styles.iconBtn} aria-label="Search"><FiSearch /></button>
          <AstromallCartSidebar />
        </div>
      </div>

      {/* ── Product Details ── */}
      <h2 className={styles.sectionTitle}>PRODUCT DETAILS</h2>

      {items.length === 0 && !isLoading && (
        <div className={styles.emptyCart}>
          <FiShoppingCart size={48} color="#ccc" />
          <p>Your cart is empty</p>
          <button className={styles.addressBtn} onClick={() => navigate("/astromall")}>Browse Products</button>
        </div>
      )}

      {items.map((item, idx) => {
        const qty = item?.quantity || 1;
        const price = getItemPrice(item);
        const itemTotal = price * qty;
        return (
          <div key={item?._id || idx} className={styles.productCard}>
            <img
              src={getItemImage(item)}
              alt={getItemTitle(item)}
              className={styles.productImg}
              onError={(e) => { e.target.src = DEFAULT_IMG; }}
            />
            <div className={styles.productInfo}>
              <div className={styles.productHeader}>
                <h3>{getItemTitle(item)}</h3>
                <div className={styles.productActions}>
                  <button className={styles.editBtn} onClick={() => handleRemoveItem(item)} aria-label="Remove item">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              <div className={styles.qtyRow}>
                <button className={styles.qtyBtn} onClick={() => handleQtyChange(item, -1)} aria-label="Decrease quantity">
                  <FiMinus />
                </button>
                <span className={styles.qtyVal}>{String(qty).padStart(2, "0")}</span>
                <button className={`${styles.qtyBtn} ${styles.qtyBtnPlus}`} onClick={() => handleQtyChange(item, 1)} aria-label="Increase quantity">
                  <FiPlus />
                </button>
              </div>
            </div>
            <div className={styles.productPrice}>
              <span className={styles.totalPrice}>₹{itemTotal.toLocaleString()}</span>
              <span className={styles.taxLabel}>Incl. of all taxes</span>
            </div>
          </div>
        );
      })}

      {/* ── Apply Coupons ── */}
      <h2 className={styles.sectionTitle}>APPLY COUPONS</h2>
      <div className={styles.couponScroll}>
        {COUPONS.map((c) => (
          <div key={c._id} className={styles.couponCard}>
            <div className={styles.couponImgWrap}>
              <img src={c.image} alt={c.label} />
              <span className={styles.couponBadge}><FaStar size={10} /> {c.label}</span>
            </div>
            <div className={styles.couponBody}>
              <span className={styles.couponExpiry}>Expires on {c.expires}</span>
              <p className={styles.couponText}>{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Price + Select Address ── */}
      {items.length > 0 && (
        <div className={styles.bottomBar}>
          <div className={styles.bottomPrice}>
            <span className={styles.totalPrice}>₹{total.toLocaleString()}</span>
            <span className={styles.taxLabel}>Incl. of all taxes</span>
          </div>
          <button className={styles.addressBtn} onClick={() => setShowAddress(true)}>
            Select Address
          </button>
        </div>
      )}

      {/* ── Products You Might Like ── */}
      {suggested.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>PRODUCTS YOU MIGHT LIKE</h2>
          <div className={styles.suggestedScroll}>
            {suggested.map((p, idx) => {
              const sImg = p?.banner_image?.original || p?.banner_image?.small || (p?.images?.length ? p.images[0] : null) || p?.image || DEFAULT_IMG;
              const sTitle = p?.title || p?.name || "Product";
              const sPrice = p?.price || p?.selling_price || 0;
              const sMrp = p?.mrp || p?.compare_price || 0;
              const sDesc = p?.short_description || p?.description || "";
              return (
                <div key={p?._id || idx} className={styles.sugCard}>
                  <div className={styles.sugImgWrap}>
                    <img src={sImg} alt={sTitle} onError={(e) => { e.target.src = DEFAULT_IMG; }} />
                    <span className={styles.sugBadge}>Suggested</span>
                  </div>
                  <div className={styles.sugBody}>
                    <h4>{sTitle}</h4>
                    {sDesc && <p className={styles.sugDesc}>{sDesc}</p>}
                    <div className={styles.sugPriceRow}>
                      <span className={styles.sugPrice}>₹{sPrice.toLocaleString()}</span>
                      {sMrp > sPrice && <span className={styles.sugOldPrice}>₹{sMrp.toLocaleString()}</span>}
                    </div>
                    <button className={styles.addCartBtn} onClick={() => handleAddSuggested(p)} disabled={isAdding}>+ Add to cart</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Address Modal ── */}
      {showAddress && (
        <div className={styles.overlay} onClick={() => setShowAddress(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowAddress(false)} aria-label="Close"><FiX /></button>
            <h2 className={styles.modalTitle}>SELECT ADDRESS</h2>
            <div className={styles.addressList}>
              {ADDRESSES.map((a) => (
                <label key={a._id} className={`${styles.addressCard} ${selectedAddress === a._id ? styles.addressActive : ""}`}>
                  <span className={styles.addressIcon}>{a.icon === "home" ? <FiHome /> : <FiBriefcase />}</span>
                  <div className={styles.addressInfo}>
                    <span className={styles.addressType}>{a.type}</span>
                    <p className={styles.addressText}>{a.address}<br />{a.pin}</p>
                  </div>
                  <input type="radio" name="address" checked={selectedAddress === a._id} onChange={() => setSelectedAddress(a._id)} className={styles.addressRadio} />
                </label>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.addAddressBtn} onClick={() => { setShowAddress(false); setShowNewAddress(true); }}>Add New Address +</button>
              <button className={styles.orderBtn} onClick={() => {
                setShowAddress(false);
                navigate("/checkout", { state: { address: ADDRESSES.find((a) => a._id === selectedAddress) } });
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
            <h2 className={styles.modalTitle}>ADD NEW ADDRESS</h2>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address line 1</label>
              <input type="text" placeholder="Enter here" className={styles.formInput} value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address line 2</label>
              <input type="text" placeholder="Enter here" className={styles.formInput} value={newAddr.line2} onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })} />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Pincode</label>
                <input type="text" placeholder="Enter here" className={styles.formInput} value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>City</label>
                <input type="text" placeholder="Enter here" className={styles.formInput} value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>State</label>
                <input type="text" placeholder="Type here" className={styles.formInput} value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} />
              </div>
            </div>
            <div className={styles.saveAsGroup}>
              <span className={styles.saveAsLabel}>Save Address as</span>
              <div className={styles.saveAsTags}>
                <button className={`${styles.saveAsTag} ${newAddr.saveAs === "Home" ? styles.saveAsActive : ""}`} onClick={() => setNewAddr({ ...newAddr, saveAs: "Home" })}>Home</button>
                <button className={`${styles.saveAsTag} ${newAddr.saveAs === "Work" ? styles.saveAsActive : ""}`} onClick={() => setNewAddr({ ...newAddr, saveAs: "Work" })}>Work</button>
              </div>
            </div>
            <button className={styles.saveAddressBtn} onClick={() => {
              setShowNewAddress(false);
              navigate("/checkout", { state: { address: newAddr } });
            }}>Save Address &rsaquo;</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EPoojaPayment;
