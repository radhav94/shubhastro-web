import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AstromallCartSidebar.module.scss";
import { FiShoppingCart, FiX, FiTrash2, FiPlus, FiMinus } from "react-icons/fi";
import { useGetCartQuery, useUpdateCartItemMutation, useRemoveCartItemMutation } from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import Toast from "../../../../component/toast";

const DEFAULT_IMG = "https://images.unsplash.com/photo-1625072290979-cac544181be8?w=800&q=80";

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
const getItemRouteId = (item) => {
  const p = item?.productId || item?.product || item;
  return p?.slug || p?.ID || p?.id || p?._id || "";
};

const AstromallCartSidebar = () => {
  const navigate = useNavigate();
  const [showCart, setShowCart] = useState(false);

  const { data: cartData, isLoading } = useGetCartQuery();
  const [removeCartItem] = useRemoveCartItemMutation();
  const [updateCartItem] = useUpdateCartItemMutation();

  const cartItems = cartData?.data?.items || cartData?.data?.cart?.items || cartData?.data || [];
  const items = Array.isArray(cartItems) ? cartItems : [];

  const cartTotal = items.reduce((sum, item) => {
    return sum + getItemPrice(item) * (item?.quantity || 1);
  }, 0);

  const handleRemove = async (item) => {
    const productId = item?.productId?._id || item?.product?._id || item?._id;
    if (!productId) return;
    try {
      await removeCartItem({ productId }).unwrap();
      Toast.success("Item removed");
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to remove");
    }
  };

  const handleUpdateQty = async (item, newQty) => {
    const productId = item?.productId?._id || item?.product?._id || item?._id;
    if (!productId) return;
    if (newQty < 1) return;
    try {
      await updateCartItem({ productId, quantity: newQty }).unwrap();
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to update quantity");
    }
  };

  return (
    <>
      {/* Cart Icon Button */}
      <button className={styles.cartBtnWrap} onClick={() => setShowCart(true)} aria-label="Cart">
        <FiShoppingCart />
        {items.length > 0 && <span className={styles.cartBadge}>{items.length}</span>}
      </button>

      {/* Sidebar */}
      {showCart && (
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
                const goToDetail = () => {
                  const p = item?.productId || item?.product || item;
                  setShowCart(false);
                  navigate(`/product-details/${routeId}`, { state: p });
                };
                return (
                  <div key={item?._id || idx} className={styles.cartItem}>
                    <img src={getItemImage(item)} alt={getItemTitle(item)} className={styles.cartItemImg} onClick={goToDetail} style={{ cursor: "pointer" }} onError={(e) => { e.target.src = DEFAULT_IMG; }} />
                    <div className={styles.cartItemInfo}>
                      <h4 className={styles.cartItemName} onClick={goToDetail} style={{ cursor: "pointer" }}>{getItemTitle(item)}</h4>
                      <div className={styles.qtyRow}>
                        <button className={styles.qtyBtn} onClick={() => handleUpdateQty(item, qty - 1)} disabled={qty <= 1} aria-label="Decrease quantity"><FiMinus size={12} /></button>
                        <span className={styles.qtyVal}>{qty}</span>
                        <button className={`${styles.qtyBtn} ${styles.qtyBtnPlus}`} onClick={() => handleUpdateQty(item, qty + 1)} aria-label="Increase quantity"><FiPlus size={12} /></button>
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
        </div>
      )}
    </>
  );
};

export default AstromallCartSidebar;
