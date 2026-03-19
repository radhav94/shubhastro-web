import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./EPoojaCheckout.module.scss";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useGetCartQuery, useRemoveCartItemMutation } from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import Toast from "../../../../component/toast";
import AstromallCartSidebar from "../components/AstromallCartSidebar";

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SJVwTGtUhFpODR";
const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const GST_RATE = 0.18;

const UPI_APPS = [
  { _id: "phonepe", name: "Phonepe", color: "#5f259f", letter: "P", rzpApp: "phonepe", scheme: "phonepe" },
  { _id: "cred", name: "Cred UPI", color: "#1a1a2e", letter: "C", rzpApp: "cred", scheme: "credpay" },
  { _id: "paytm", name: "Paytm", color: "#00baf2", letter: "paytm", rzpApp: "paytm", scheme: "paytmmp" },
];

const OTHER_UPI_APPS = [
  { _id: "gpay", name: "Google Pay", color: "#4285f4", letter: "G", rzpApp: "google_pay", scheme: "gpay" },
  { _id: "bhim", name: "BHIM UPI", color: "#00897b", letter: "B", rzpApp: "bhim", scheme: "upi" },
  { _id: "amazonpay", name: "Amazon Pay", color: "#ff9900", letter: "A", rzpApp: "amazonpay", scheme: "amazonpay" },
];

const PAYMENT_METHODS = [
  { _id: "upi", name: "UPI", icon: "UPI", color: "#4caf50" },
  { _id: "card", name: "Credit/Debit", icon: "💳", color: "#1976d2" },
  { _id: "netbanking", name: "Net Banking", icon: "🏛", color: "#ff9800" },
  { _id: "wallet", name: "Wallet", icon: "👛", color: "#e91e63" },
];

const getItemTitle = (item) => {
  const p = item?.productId || item?.product || item;
  return p?.title || p?.name || "Product";
};
const getItemPrice = (item) => {
  const p = item?.productId || item?.product || item;
  return p?.price || p?.selling_price || 0;
};
const EPoojaCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const address = location.state?.address || null;
  const buyNowProduct = location.state?.buyNowProduct || null;
  const buyNowQtyFromState = location.state?.buyNowQty || 1;

  const isBuyNowMode = !!buyNowProduct;

  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [showOtherUpi, setShowOtherUpi] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [buyNowQty] = useState(buyNowQtyFromState);

  const { data: cartData, isLoading } = useGetCartQuery();
  const [removeCartItem] = useRemoveCartItemMutation();
  const cartItems = cartData?.data?.items || cartData?.data?.cart?.items || cartData?.data || [];
  const rawCartItems = Array.isArray(cartItems) ? cartItems : [];

  const items = isBuyNowMode
    ? [{ productId: buyNowProduct, quantity: buyNowQty, _id: buyNowProduct?._id || "buynow" }]
    : rawCartItems;

  const subtotal = items.reduce((sum, item) => sum + getItemPrice(item) * (item?.quantity || 1), 0);
  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  const grandTotal = Math.round((subtotal + gst) * 100) / 100;

  // Load Razorpay script
  useEffect(() => {
    if (window.Razorpay) { setIsLoaded(true); return; }
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existing) { existing.addEventListener("load", () => setIsLoaded(true)); return; }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => Toast.error("Failed to load payment gateway. Please refresh.");
    document.body.appendChild(script);
  }, []);

  const openRazorpay = useCallback((prefillMethod) => {
    if (!isLoaded || !window.Razorpay) {
      Toast.error("Payment gateway not loaded. Please refresh.");
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);

    const amountInPaise = Math.round(grandTotal * 100);
    const options = {
      key: RAZORPAY_KEY,
      amount: amountInPaise,
      currency: "INR",
      name: "ShubhTalk",
      description: items.length === 1 ? getItemTitle(items[0]) : `${items.length} items from AstroMall`,
      handler: async () => {
        setIsProcessing(false);
        if (!isBuyNowMode && rawCartItems.length > 0) {
          for (const item of rawCartItems) {
            const productId = item?.productId?._id || item?.product?._id || item?._id;
            if (productId) {
              try { await removeCartItem({ productId }).unwrap(); } catch (_) { /* ignore */ }
            }
          }
        }
        if (isBuyNowMode && buyNowProduct?._id) {
          const inCart = rawCartItems.find((item) => {
            const p = item?.productId || item?.product || item;
            return String(p?._id) === String(buyNowProduct._id);
          });
          if (inCart) {
            const pid = inCart?.productId?._id || inCart?.product?._id || inCart?._id;
            if (pid) { try { await removeCartItem({ productId: pid }).unwrap(); } catch (_) { /* ignore */ } }
          }
        }
        Toast.success("Payment successful!");
        navigate("/booking-success", { state: { total: grandTotal, address } });
      },
      prefill: {
        name: localStorage.getItem("shubhtalk_user_name") || "",
        email: localStorage.getItem("shubhtalk_user_email") || "",
        contact: localStorage.getItem("shubhtalk_user_phone") || "",
        method: prefillMethod || selectedMethod,
      },
      theme: { color: "#f75801" },
      modal: {
        ondismiss: () => { setIsProcessing(false); Toast.info("Payment cancelled"); },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setIsProcessing(false);
        Toast.error(response?.error?.description || "Payment failed");
      });
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      Toast.error("Could not open payment gateway. Please try again.");
    }
  }, [isLoaded, isProcessing, grandTotal, items, navigate, address, isBuyNowMode, rawCartItems, removeCartItem, selectedMethod]);

  const handleProceedToPay = useCallback(() => {
    openRazorpay(selectedMethod);
  }, [openRazorpay, selectedMethod]);

  const handleUpiAppPay = useCallback((app) => {
    if (!isLoaded || !window.Razorpay) {
      Toast.error("Payment gateway not loaded. Please refresh.");
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    setSelectedMethod("upi");

    const amountInPaise = Math.round(grandTotal * 100);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const options = {
      key: RAZORPAY_KEY,
      amount: amountInPaise,
      currency: "INR",
      name: "ShubhTalk",
      description: items.length === 1 ? getItemTitle(items[0]) : `${items.length} items from AstroMall`,
      handler: async () => {
        setIsProcessing(false);
        if (!isBuyNowMode && rawCartItems.length > 0) {
          for (const item of rawCartItems) {
            const productId = item?.productId?._id || item?.product?._id || item?._id;
            if (productId) {
              try { await removeCartItem({ productId }).unwrap(); } catch (_) { /* ignore */ }
            }
          }
        }
        if (isBuyNowMode && buyNowProduct?._id) {
          const inCart = rawCartItems.find((item) => {
            const p = item?.productId || item?.product || item;
            return String(p?._id) === String(buyNowProduct._id);
          });
          if (inCart) {
            const pid = inCart?.productId?._id || inCart?.product?._id || inCart?._id;
            if (pid) { try { await removeCartItem({ productId: pid }).unwrap(); } catch (_) { /* ignore */ } }
          }
        }
        Toast.success("Payment successful!");
        navigate("/booking-success", { state: { total: grandTotal, address } });
      },
      prefill: {
        name: localStorage.getItem("shubhtalk_user_name") || "",
        email: localStorage.getItem("shubhtalk_user_email") || "",
        contact: localStorage.getItem("shubhtalk_user_phone") || "",
        method: "upi",
      },
      theme: { color: "#f75801" },
      modal: {
        ondismiss: () => { setIsProcessing(false); },
      },
    };

    // On mobile, use UPI intent to directly open the app
    if (isMobile && app?.rzpApp) {
      options.config = {
        display: {
          blocks: {
            upi: {
              name: "Pay via UPI",
              instruments: [
                { method: "upi", flows: ["intent"], apps: [app.rzpApp] },
              ],
            },
          },
          sequence: ["block.upi"],
          preferences: { show_default_blocks: false },
        },
      };
    }

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setIsProcessing(false);
        Toast.error(response?.error?.description || "Payment failed");
      });
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      Toast.error("Could not open payment gateway. Please try again.");
    }
  }, [isLoaded, isProcessing, grandTotal, items, navigate, address, isBuyNowMode, rawCartItems, removeCartItem]);

  if (!isBuyNowMode && isLoading) {
    return <div className={styles.page}><div style={{ textAlign: "center", padding: "80px 0", color: "#999" }}>Loading...</div></div>;
  }

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.topNav}>
          <button className={styles.backBtn} onClick={() => navigate("/astromall")}>
            <span className={styles.backCircle}><FiChevronLeft /></span>
            <span className={styles.backLabel}>Checkout</span>
          </button>
        </div>
        <div style={{ textAlign: "center", padding: "80px 0", color: "#999" }}>
          <p>Your cart is empty</p>
          <button className={styles.payBtn} style={{ maxWidth: 220, margin: "16px auto" }} onClick={() => navigate("/astromall")}>Browse Products</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topNav}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <span className={styles.backCircle}><FiChevronLeft /></span>
          <span className={styles.backLabel}>Checkout</span>
        </button>
        <div className={styles.topRight}>
          <AstromallCartSidebar />
        </div>
      </div>

      <div className={styles.twoCol}>
        <div className={styles.leftCol}>
          <h2 className={styles.sectionTitle}>PAY WITH UPI</h2>
          <div className={styles.upiCard}>
            <div className={styles.upiApps}>
              {UPI_APPS.map((app) => (
                <div key={app._id} className={styles.upiApp} onClick={() => handleUpiAppPay(app)} style={{ cursor: "pointer" }}>
                  <div className={styles.upiIcon} style={{ background: app.color }}>
                    <span>{app.letter === "paytm" ? "paytm" : app.letter}</span>
                  </div>
                  <span className={styles.upiName}>{app.name}</span>
                </div>
              ))}
            </div>
            <div className={styles.otherUpiWrap}>
              <button className={styles.otherUpiBtn} onClick={() => setShowOtherUpi(!showOtherUpi)}>
                <span className={styles.upiLabel}>UPI</span>
                Pay with other UPI apps
                <FiChevronRight className={`${styles.chevron} ${showOtherUpi ? styles.chevronOpen : ""}`} />
              </button>
              {showOtherUpi && (
                <div className={styles.otherUpiList}>
                  {OTHER_UPI_APPS.map((app) => (
                    <button key={app._id} className={styles.otherUpiItem} onClick={() => { setShowOtherUpi(false); handleUpiAppPay(app); }}>
                      <span className={styles.otherUpiLeft}>
                        <span className={styles.otherUpiIcon} style={{ background: app.color }}>{app.letter}</span>
                        <span className={styles.otherUpiName}>{app.name}</span>
                      </span>
                      <FiChevronRight size={14} color="#999" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <h2 className={styles.sectionTitle}>OTHER PAYMENT METHODS</h2>
          <div className={styles.methodList}>
            {PAYMENT_METHODS.map((m) => (
              <label key={m._id} className={`${styles.methodCard} ${selectedMethod === m._id ? styles.methodActive : ""}`}>
                <span className={styles.methodIcon} style={{ background: m.color }}>{m.icon}</span>
                <span className={styles.methodName}>{m.name}</span>
                <input type="radio" name="payMethod" checked={selectedMethod === m._id} onChange={() => setSelectedMethod(m._id)} className={styles.methodRadio} />
              </label>
            ))}
          </div>
        </div>


        <div className={styles.rightCol}>
          <h2 className={styles.sectionTitle}>PRICE BREAKDOWN</h2>

          <div className={styles.priceCard}>
            {items.map((item, idx) => {
              const title = getItemTitle(item);
              const price = getItemPrice(item);
              const qty = item?.quantity || 1;
              const lineTotal = price * qty;
              return (
                <div key={item?._id || idx} className={styles.priceRow}>
                  <span>{title}{qty > 1 ? ` × ${qty}` : ""}</span>
                  <span>₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              );
            })}

            <div className={`${styles.priceRow} ${styles.priceSubtotal}`}>
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className={styles.priceRow}>
              <span>GST (18%)</span>
              <span>₹{gst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className={`${styles.priceRow} ${styles.priceTotal}`}>
              <span>Total Amount</span>
              <span>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <p className={styles.gstNote}>*All prices are inclusive of applicable GST @18%</p>
          </div>

          {address && (
            <div className={styles.addressBox}>
              <h3 className={styles.addressBoxTitle}>Delivery Address</h3>
              <p className={styles.addressBoxText}>
                {address.name && <strong>{address.name}{address.type ? ` (${address.type})` : ""}: </strong>}
                {!address.name && address.type && <strong>{address.type}: </strong>}
                {address.addressLine1 || address.address || address.line1}
                {(address.addressLine2 || address.line2) ? `, ${address.addressLine2 || address.line2}` : ""}
                {address.landmark ? `, ${address.landmark}` : ""}
                {(address.pincode || address.pin) ? ` - ${address.pincode || address.pin}` : ""}
                {address.city ? `, ${address.city}` : ""}
                {address.state ? `, ${address.state}` : ""}
              </p>
            </div>
          )}

          <h2 className={styles.sectionTitleCenter}>APPLY COUPON</h2>
          <div className={styles.couponRow}>
            <input type="text" placeholder="Enter Coupon Code" className={styles.couponInput} value={coupon} onChange={(e) => setCoupon(e.target.value)} />
            <button className={styles.applyBtn}>Apply</button>
          </div>

          <div className={styles.securedBox}>
            <p className={styles.securedText}>Secured by <strong>Trusted Indian Banks</strong> ✅</p>
            <button className={styles.payBtn} onClick={handleProceedToPay} disabled={isProcessing || !isLoaded}>
              {isProcessing ? "Processing..." : `Pay ₹ ${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} `}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EPoojaCheckout;