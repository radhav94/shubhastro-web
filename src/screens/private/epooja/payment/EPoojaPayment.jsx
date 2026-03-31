import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./EPoojaPayment.module.scss";
import { FiChevronLeft, FiSearch, FiMinus, FiPlus, FiX, FiHome, FiBriefcase, FiTrash2, FiShoppingCart, FiEdit2 } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { useGetCartQuery, useUpdateCartItemMutation, useRemoveCartItemMutation, useAddToCartMutation, useGetAddressesQuery, useAddAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation } from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import Toast from "../../../../component/toast";
import AstromallCartSidebar from "../components/AstromallCartSidebar";

const DEFAULT_IMG = "https://images.unsplash.com/photo-1625072290979-cac544181be8?w=800&q=80";

// ─── DUMMY COUPONS (no API yet) ───
const COUPONS = [
  { _id: "c1", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&q=80", label: "Exclusive", expires: "20/12/2025", text: "Claim 100% Extra on First Recharge" },
  { _id: "c2", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&q=80", label: "Exclusive", expires: "20/12/2025", text: "Claim 100% Extra on First Recharge" },
  { _id: "c3", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&q=80", label: "Exclusive", expires: "20/12/2025", text: "Claim 100% Extra on First Recharge" },
];

const EPoojaPayment = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [showAddress, setShowAddress] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddr, setNewAddr] = useState({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" });
  const [addrErrors, setAddrErrors] = useState({});

  // Address API
  const { data: addressData, isLoading: addressLoading } = useGetAddressesQuery();
  const [addAddress, { isLoading: isAddingAddress }] = useAddAddressMutation();
  const [updateAddressApi, { isLoading: isUpdatingAddress }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const addresses = addressData?.data || addressData?.data?.addresses || [];
  const addressList = Array.isArray(addresses) ? addresses : [];

  useEffect(() => {
    if (addressList.length > 0 && !selectedAddress) {
      const def = addressList.find((a) => a.isDefault) || addressList[0];
      setSelectedAddress(def?._id || def?.id);
    }
  }, [addressList, selectedAddress]);

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
    const price = getItemPrice(item);
    const qty = item?.quantity || 1;
    return sum + price * qty;
  }, 0);

  // Suggested products from cart response (if available)
  const suggested = cartData?.data?.suggestedProducts || cartData?.data?.recommended || [];

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
      name: addr.name || "", phone: addr.phone || "", addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "", city: addr.city || "", state: addr.state || "",
      pincode: addr.pincode || "", landmark: addr.landmark || "", type: addr.type || "home", country: addr.country || "IN",
    });
    setShowAddress(false);
    setShowNewAddress(true);
  };

  const handleDeleteAddress = async (addrId) => {
    if (!addrId || !window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await deleteAddress({ addressId: addrId }).unwrap();
      Toast.success("Address deleted");
      if (selectedAddress === addrId) setSelectedAddress(null);
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to delete address");
    }
  };

  const getItemVariantId = (item) => item?.variantId?._id || item?.variantId || item?.variantSnapshot?._id || "";

  const handleQtyChange = async (item, delta) => {
    const productId = item?.productId?._id || item?.product?._id || item?._id;
    const variantId = getItemVariantId(item);
    const currentQty = item?.quantity || 1;
    const newQty = currentQty + delta;
    if (!productId) return;
    if (newQty < 1) return;
    try {
      await updateCartItem({ productId, variantId, quantity: newQty }).unwrap();
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to update quantity");
    }
  };

  const handleRemoveItem = async (item) => {
    const productId = item?.productId?._id || item?.product?._id || item?._id;
    const variantId = getItemVariantId(item);
    if (!productId) return;
    try {
      await removeCartItem({ productId, variantId }).unwrap();
      Toast.success("Item removed from cart");
      // If cart becomes empty, go back to astromall
      if (items.length <= 1) navigate("/astromall");
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to remove item");
    }
  };

  const handleAddSuggested = async (product) => {
    const productId = product?._id || product?.id || product?.ID;
    if (!productId) return;
    const firstVariant = product?.variants?.find((v) => v.isActive) || product?.variants?.[0];
    try {
      const payload = { productId, quantity: 1 };
      if (firstVariant?._id) payload.variantId = firstVariant._id;
      await addToCart(payload).unwrap();
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
    if (item?.currentPrice) return item.currentPrice;
    if (item?.priceAtAdd) return item.priceAtAdd;
    if (item?.variantSnapshot?.price) return item.variantSnapshot.price;
    const p = item?.productId || item?.product || item;
    const variant = p?.variants?.find((v) => v.isActive) || p?.variants?.[0];
    if (variant?.price) return variant.price;
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
                    <button className={styles.editBtn} onClick={(e) => { e.stopPropagation(); openEditAddress(a); }} aria-label="Edit address"><FiEdit2 size={14} /></button>
                    <button className={styles.editBtn} onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addrId); }} aria-label="Delete address"><FiTrash2 size={14} /></button>
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
                navigate("/checkout", { state: { address: chosen } });
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
    </div>
  );
};

export default EPoojaPayment;
