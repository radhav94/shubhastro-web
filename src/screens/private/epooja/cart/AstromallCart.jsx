import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./AstromallCart.module.scss";
import { FiChevronLeft, FiMinus, FiPlus, FiTrash2, FiShoppingCart, FiX, FiHome, FiBriefcase, FiEdit2 } from "react-icons/fi";
import { useGetCartQuery, useUpdateCartItemMutation, useRemoveCartItemMutation, useGetAddressesQuery, useAddAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation } from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import Toast from "../../../../component/toast";
import AstromallCartSidebar from "../components/AstromallCartSidebar";
import { DefaultImages } from "../../../../utils/appImages";

const DEFAULT_IMG = DefaultImages.AstromallProductDefault;

const getImg = (item) => {
  // Prefer variant snapshot image, then product images
  const snap = item?.variantSnapshot;
  if (snap?.images?.length) return snap.images[0];
  const p = item?.productId || item?.product || item;
  return p?.banner_image?.original || p?.banner_image?.small || (p?.images?.length ? p.images[0] : null) || p?.imgUrl || p?.image || p?.thumbnail || DEFAULT_IMG;
};
const getTitle = (item) => {
  const p = item?.productId || item?.product || item;
  const variantTitle = item?.variantSnapshot?.title;
  const productTitle = p?.title || p?.name || "Product";
  return variantTitle ? `${productTitle} — ${variantTitle}` : productTitle;
};
const getPrice = (item) => {
  // currentPrice from cart API is the most accurate
  if (item?.currentPrice) return item.currentPrice;
  if (item?.priceAtAdd) return item.priceAtAdd;
  const p = item?.productId || item?.product || item;
  return p?.price || p?.selling_price || 0;
};
const getId = (item) => item?.productId?._id || item?.product?._id || item?._id;
const getRouteId = (item) => {
  const p = item?.productId || item?.product || item;
  return p?.slug || p?.ID || p?.id || p?._id || "";
};
const getProductData = (item) => item?.productId || item?.product || item;

const AstromallCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowProduct = location.state?.buyNowProduct || null;
  const isBuyNowMode = !!buyNowProduct;
  const [buyNowQty, setBuyNowQty] = useState(location.state?.buyNowQty || 1);

  const { data: cartData, isLoading } = useGetCartQuery(undefined, { skip: isBuyNowMode });
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeCartItem] = useRemoveCartItemMutation();

  // Address state
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

  const cartItems = cartData?.data?.items || cartData?.data?.cart?.items || cartData?.data || [];
  const regularItems = Array.isArray(cartItems) ? cartItems : [];
  const items = isBuyNowMode
    ? [{ productId: buyNowProduct, quantity: buyNowQty, _id: buyNowProduct?._id }]
    : regularItems;

  const total = isBuyNowMode
    ? items.reduce((sum, item) => sum + getPrice(item) * (item?.quantity || 1), 0)
    : cartData?.data?.totalAmount || items.reduce((sum, item) => sum + getPrice(item) * (item?.quantity || 1), 0);

  const handleQtyChange = async (item, delta) => {
    if (isBuyNowMode) {
      const newQty = buyNowQty + delta;
      if (newQty < 1) return;
      setBuyNowQty(newQty);
      return;
    }
    const productId = getId(item);
    if (!productId) return;
    const newQty = (item?.quantity || 1) + delta;
    if (newQty < 1) return;
    try {
      await updateCartItem({ productId, quantity: newQty }).unwrap();
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to update");
    }
  };

  const handleRemove = async (item) => {
    if (isBuyNowMode) {
      navigate("/astromall");
      return;
    }
    const productId = getId(item);
    if (!productId) return;
    try {
      await removeCartItem({ productId }).unwrap();
      Toast.success("Item removed");
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to remove");
    }
  };

  if (isLoading && !isBuyNowMode) {
    return <div className={styles.page}><div className={styles.loading}>Loading cart...</div></div>;
  }

  return (
    <div className={styles.page}>
      {/* Top Nav */}
      <div className={styles.topNav}>
        <button className={styles.backBtn} onClick={() => navigate("/astromall")}>
          <span className={styles.backCircle}><FiChevronLeft /></span>
          <span className={styles.backLabel}>My Cart</span>
        </button>
        <div className={styles.topRight}>
          <AstromallCartSidebar />
        </div>
      </div>

      {items.length > 0 && <h2 className={styles.sectionTitle}>PRODUCT DETAILS</h2>}

      {items.length === 0 && (
        <div className={styles.emptyCart}>
          <FiShoppingCart size={48} color="#ccc" />
          <p>Your cart is empty</p>
          <button className={styles.browseBtn} onClick={() => navigate("/astromall")}>Browse Products</button>
        </div>
      )}

      {items.map((item, idx) => {
        const qty = item?.quantity || 1;
        const price = getPrice(item);
        const routeId = getRouteId(item);
        const goToDetail = () => navigate(`/product-details/${routeId}`, { state: getProductData(item) });
        return (
          <div key={item?._id || idx} className={styles.productCard}>
            <img src={getImg(item)} alt={getTitle(item)} className={styles.productImg} onClick={goToDetail} style={{ cursor: "pointer" }} onError={(e) => { if (!e.target.src.includes("astromall-product-default")) e.target.src = DEFAULT_IMG; }} />
            <div className={styles.productInfo}>
              <h3 onClick={goToDetail} style={{ cursor: "pointer" }}>{getTitle(item)}</h3>
              <div className={styles.qtyRow}>
                <button className={styles.qtyBtn} onClick={() => handleQtyChange(item, -1)} aria-label="Decrease"><FiMinus /></button>
                <span className={styles.qtyVal}>{String(qty).padStart(2, "0")}</span>
                <button className={`${styles.qtyBtn} ${styles.qtyBtnPlus}`} onClick={() => handleQtyChange(item, 1)} aria-label="Increase"><FiPlus /></button>
              </div>
            </div>
            <button className={styles.removeBtn} onClick={() => handleRemove(item)} aria-label="Remove"><FiTrash2 size={18} /></button>
            <div className={styles.priceCol}>
              <span className={styles.price}>₹{(price * qty).toLocaleString()}</span>
              <span className={styles.taxLabel}>Incl. of all taxes</span>
            </div>
          </div>
        );
      })}

      {items.length > 0 && (
        <div className={styles.bottomBar}>
          <div className={styles.totalCol}>
            <span className={styles.totalPrice}>₹{total.toLocaleString()}</span>
            <span className={styles.taxLabel}>Incl. of all taxes</span>
          </div>
          <button className={styles.checkoutBtn} onClick={() => {
            if (!addressLoading && addressList.length === 0) {
              setEditingAddress(null);
              setNewAddr({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" });
              setShowNewAddress(true);
            } else {
              setShowAddress(true);
            }
          }}>
            {isBuyNowMode ? "Select Address" : "Proceed to Checkout"}
          </button>
        </div>
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
                    <button className={styles.addrActionBtn} onClick={(e) => { e.stopPropagation(); openEditAddress(a); }} aria-label="Edit address"><FiEdit2 size={14} /></button>
                    <button className={styles.addrActionBtn} onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addrId); }} aria-label="Delete address"><FiTrash2 size={14} /></button>
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
                if (isBuyNowMode) {
                  navigate("/checkout", { state: { buyNowProduct: buyNowProduct, buyNowQty: buyNowQty, address: chosen } });
                } else {
                  navigate("/checkout", { state: { address: chosen } });
                }
              }}>Order Here</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Address Modal ── */}
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

export default AstromallCart;
