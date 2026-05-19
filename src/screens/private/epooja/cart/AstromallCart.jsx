// AstromallCart - Cart with integrated checkout and product validation
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./AstromallCart.module.scss";
import { FiChevronLeft, FiChevronRight, FiMinus, FiPlus, FiTrash2, FiShoppingCart, FiX, FiHome, FiBriefcase, FiEdit2, FiAlertTriangle } from "react-icons/fi";
import {
  useGetCartQuery, useUpdateCartItemMutation, useRemoveCartItemMutation,
  useGetAddressesQuery, useAddAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation,
  useCreateMallOrderMutation, useUpdateMallOrderMutation,
} from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import Toast from "../../../../component/toast";
import AstromallCartSidebar from "../components/AstromallCartSidebar";
import { DefaultImages } from "../../../../utils/appImages";
import ProductImage from "../../../../component/UI/ProductImage";

import phonepeLogo from "../../../../assets/icons/upi/phonepe.svg";
import credLogo from "../../../../assets/icons/upi/cred.svg";
import paytmLogo from "../../../../assets/icons/upi/paytm.svg";
import gpayLogo from "../../../../assets/icons/upi/gpay.svg";
import bhimLogo from "../../../../assets/icons/upi/bhim.svg";
import amazonpayLogo from "../../../../assets/icons/upi/amazonpay.svg";
import upiLogo from "../../../../assets/icons/upi/UPI.svg";
import debitlogo from "../../../../assets/icons/upi/debit.svg";
import netbankinglogo from "../../../../assets/icons/upi/netbanking.svg";
import walletlogo from "../../../../assets/icons/upi/wallet.svg";

const DEFAULT_IMG = DefaultImages.AstromallProductDefault;
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;
const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const UPI_APPS = [
  { _id: "phonepe", name: "Phonepe", logo: phonepeLogo, rzpApp: "phonepe" },
  { _id: "cred", name: "Cred UPI", logo: credLogo, rzpApp: "cred" },
  { _id: "paytm", name: "Paytm", logo: paytmLogo, rzpApp: "paytm" },
];
const OTHER_UPI_APPS = [
  { _id: "gpay", name: "Google Pay", logo: gpayLogo, rzpApp: "google_pay" },
  { _id: "bhim", name: "BHIM UPI", logo: bhimLogo, rzpApp: "bhim" },
  { _id: "amazonpay", name: "Amazon Pay", logo: amazonpayLogo, rzpApp: "amazonpay" },
];
const PAYMENT_METHODS = [
  { _id: "upi", name: "UPI", logo: upiLogo },
  { _id: "card", name: "Credit/Debit", logo: debitlogo },
  { _id: "netbanking", name: "Net Banking", logo: netbankinglogo },
  { _id: "wallet", name: "Wallet", logo: walletlogo },
];

const getImg = (item, enrichedVariant) => {
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
const getTitle = (item) => {
  const p = item?.productId || item?.product || item;
  const variantTitle = item?.variantSnapshot?.title;
  const productTitle = p?.title || p?.name || "Product";
  return variantTitle ? `${productTitle} — ${variantTitle}` : productTitle;
};
const getPrice = (item) => {
  if (item?.currentPrice) return item.currentPrice;
  if (item?.priceAtAdd) return item.priceAtAdd;
  if (item?.variantSnapshot?.price) return item.variantSnapshot.price;
  const p = item?.productId || item?.product || item;
  const variant = p?.variants?.find((v) => v.isActive) || p?.variants?.[0];
  if (variant?.price) return variant.price;
  return p?.price || p?.selling_price || 0;
};
const getGstPercent = (item) => {
  const p = item?.productId || item?.product || item;
  return p?.gst || 0;
};
const getId = (item) => item?.productId?._id || item?.product?._id || item?._id;
const getVariantId = (item) => item?.variantId?._id || item?.variantId?.id || (typeof item?.variantId === "string" ? item.variantId : "") || item?.variantSnapshot?._id || item?.variantSnapshot?.id || "";
const getRouteId = (item) => {
  const p = item?.productId || item?.product || item;
  if (typeof p === "string") return p;
  return p?.slug || p?.ID || p?.id || p?._id || "";
};
const getProductData = (item) => {
  const p = item?.productId || item?.product || item;
  return typeof p === "string" ? { _id: p } : p;
};

// Extract variant attributes from cart item + enriched product data
const getCartVariantAttrs = (item, enrichedVariants = {}) => {
  const seen = new Set();
  const attrs = [];
  const add = (name, value) => {
    const key = name?.toString().toLowerCase();
    if (key && value && !seen.has(key)) { seen.add(key); attrs.push({ name, value }); }
  };

  // Try enriched variant first (fetched from product API)
  const vid = item?.variantId?._id || item?.variantId?.id || (typeof item?.variantId === "string" ? item.variantId : "") || item?.variantSnapshot?._id || item?.variantSnapshot?.id || "";
  const enriched = enrichedVariants[vid];
  const sources = [enriched, item?.variantSnapshot, typeof item?.variantId === "object" ? item.variantId : null].filter(Boolean);

  for (const src of sources) {
    const a = src.attributes;
    if (Array.isArray(a)) a.forEach((x) => add(x.name, x.value));
    else if (a && typeof a === "object") Object.entries(a).forEach(([k, v]) => add(k, v));
    ["type", "size", "weight", "color", "material"].forEach((k) => { if (src[k]) add(k, src[k]); });
    if (attrs.length > 0) break; // use first source that has data
  }

  // Fallback: variant title
  const vTitle = enriched?.title || item?.variantSnapshot?.title || (typeof item?.variantId === "object" ? item.variantId?.title : null);
  if (attrs.length === 0 && vTitle) add("variant", vTitle);

  return attrs;
};

// Format slug to readable label (e.g., "Without-Silver-Capping" → "Without Silver Capping")
const formatAttrValue = (val) => {
  if (!val) return "";
  return val.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// Fetch fresh product detail from API
const fetchProductDetail = async (productIdOrSlug) => {
  try {
    const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
    const role = localStorage.getItem("shubhtalk_role");
    const token = role === "ASTROLOGER" ? localStorage.getItem("shubhtalk_astro_token") : localStorage.getItem("shubhtalk_customer_token");
    const res = await fetch(`${BASE_URL}/api/mall/products/${productIdOrSlug}`, {
      headers: { accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const json = await res.json();
    if (json?.success || json?.status === true) return json?.data || null;
    return null;
  } catch { return null; }
};

const AstromallCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowProduct = location.state?.buyNowProduct || null;
  const buyNowVariant = location.state?.buyNowVariant || null;
  const isBuyNowMode = !!buyNowProduct;
  const [buyNowQty, setBuyNowQty] = useState(location.state?.buyNowQty || 1);

  const { data: cartData, isLoading } = useGetCartQuery(undefined, { skip: isBuyNowMode });
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeCartItem] = useRemoveCartItemMutation();

  // Checkout state
  const [checkoutStep, setCheckoutStep] = useState("cart");
  const [chosenAddress, setChosenAddress] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [showOtherUpi, setShowOtherUpi] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [isRzpLoaded, setIsRzpLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const actualPaymentMethodRef = useRef(null);
  const orderIdRef = useRef(null);
  const checkoutRef = useRef(null);

  // Product validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);
  const [validatedProducts, setValidatedProducts] = useState({});
  const [stockLimitedItems, setStockLimitedItems] = useState({});

  const [createMallOrder] = useCreateMallOrderMutation();
  const [updateMallOrder] = useUpdateMallOrderMutation();

  // Address state
  const [showAddress, setShowAddress] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddr, setNewAddr] = useState({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" });
  const [addrErrors, setAddrErrors] = useState({});

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

  useEffect(() => {
    if (checkoutStep !== "checkout") return;
    if (window.Razorpay) { setIsRzpLoaded(true); return; }
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existing) { existing.addEventListener("load", () => setIsRzpLoaded(true)); return; }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => setIsRzpLoaded(true);
    script.onerror = () => Toast.error("Failed to load payment gateway. Please refresh.");
    document.body.appendChild(script);
  }, [checkoutStep]);

  const cartItems = cartData?.data?.items || cartData?.data?.cart?.items || cartData?.data || [];
  const regularItems = Array.isArray(cartItems) ? cartItems : [];
  const items = isBuyNowMode
    ? [{ productId: buyNowProduct, variantId: buyNowVariant?._id || buyNowVariant?.id || buyNowVariant?.skuCode || buyNowVariant?.sku || "", variantSnapshot: buyNowVariant, quantity: buyNowQty, _id: buyNowProduct?._id || "buynow" }]
    : regularItems;

  // Enriched variant map for showing type/size
  const [enrichedVariants, setEnrichedVariants] = useState({});
  useEffect(() => {
    if (!items.length) return;
    let cancelled = false;
    const run = async () => {
      const pidSet = new Set();
      items.forEach((item) => {
        const p = item?.productId || item?.product || item;
        const pid = p?.slug || p?._id || p?.id || (typeof item?.productId === "string" ? item.productId : "");
        if (pid) pidSet.add(pid);
      });
      const ids = [...pidSet];
      const results = await Promise.all(ids.map((id) => fetchProductDetail(id)));
      if (cancelled) return;
      const vMap = {};
      ids.forEach((id, i) => {
        const product = results[i];
        if (!product?.variants?.length) return;
        product.variants.forEach((v) => {
          const vid = v._id || v.id || v.skuCode || v.sku;
          if (vid) vMap[vid] = v;
        });
      });
      setEnrichedVariants(vMap);
    };
    run();
    return () => { cancelled = true; };
  }, [items.length]);

  const total = isBuyNowMode
    ? items.reduce((sum, item) => sum + getPrice(item) * (item?.quantity || 1), 0)
    : cartData?.data?.totalAmount || items.reduce((sum, item) => sum + getPrice(item) * (item?.quantity || 1), 0);

  // Live price/GST from validated product data
  const getLivePrice = useCallback((item) => {
    const p = item?.productId || item?.product || item;
    const pid = p?._id || p?.id;
    const fresh = validatedProducts[pid];
    if (!fresh) return getPrice(item);
    const cartVid = getVariantId(item);
    const variant = cartVid ? fresh.variants?.find((v) => String(v._id) === String(cartVid)) : (fresh.variants?.find((v) => v.isActive) || fresh.variants?.[0]);
    return variant?.price || fresh.price || fresh.selling_price || getPrice(item);
  }, [validatedProducts]);

  const getLiveGstPercent = useCallback((item) => {
    const p = item?.productId || item?.product || item;
    const fresh = validatedProducts[p?._id || p?.id];
    if (!fresh) return getGstPercent(item);
    return fresh.gst || 0;
  }, [validatedProducts]);

  const subtotal = items.reduce((sum, item) => sum + getLivePrice(item) * (item?.quantity || 1), 0);
  const gst = items.reduce((sum, item) => {
    const lineTotal = getLivePrice(item) * (item?.quantity || 1);
    return sum + Math.round(lineTotal * getLiveGstPercent(item) / 100 * 100) / 100;
  }, 0);
  const grandTotal = Math.round((subtotal + gst) * 100) / 100;

  // Validate products before checkout
  const validateCartProducts = useCallback(async () => {
    if (items.length === 0) return true;
    setIsValidating(true);
    setValidationIssues([]);
    const issues = [];
    const freshMap = {};
    const productIds = [...new Set(items.map((item) => {
      const p = item?.productId || item?.product || item;
      return p?.slug || p?._id || p?.id || p?.ID;
    }).filter(Boolean))];
    const results = await Promise.all(productIds.map((id) => fetchProductDetail(id)));
    productIds.forEach((id, i) => { if (results[i]) freshMap[results[i]._id || id] = results[i]; });

    for (const item of items) {
      const p = item?.productId || item?.product || item;
      const pid = p?._id || p?.id;
      const fresh = freshMap[pid];
      const itemTitle = getTitle(item);
      if (!fresh) continue;
      const cartVid = getVariantId(item);
      const freshVariant = cartVid ? fresh.variants?.find((v) => String(v._id) === String(cartVid)) : (fresh.variants?.find((v) => v.isActive) || fresh.variants?.[0]);
      // Stock check
      const stock = freshVariant?.stock ?? fresh?.stock;
      const qty = item?.quantity || 1;
      if (stock !== undefined && stock !== null) {
        if (stock === 0) issues.push({ itemId: pid, type: "out_of_stock", message: `"${itemTitle}" is now out of stock` });
        else if (stock < qty) issues.push({ itemId: pid, type: "low_stock", message: `"${itemTitle}" only has ${stock} left in stock (you have ${qty})`, stock });
      }
      // Price change
      const oldPrice = getPrice(item);
      const newPrice = freshVariant?.price || fresh.price || fresh.selling_price || oldPrice;
      if (newPrice !== oldPrice) issues.push({ itemId: pid, type: "price_changed", message: `"${itemTitle}" price changed from ₹${oldPrice} to ₹${newPrice}` });
      // GST change
      const oldGst = getGstPercent(item);
      const newGst = fresh.gst || 0;
      if (newGst !== oldGst) issues.push({ itemId: pid, type: "gst_changed", message: `"${itemTitle}" GST changed from ${oldGst}% to ${newGst}%` });
    }
    setValidatedProducts(freshMap);
    setValidationIssues(issues);
    setIsValidating(false);
    const hasBlockers = issues.some((i) => i.type === "out_of_stock");
    if (hasBlockers) { Toast.error("Some items are out of stock. Please update your cart."); return false; }
    if (issues.length > 0) Toast.info("Some product details have changed. Please review before paying.");
    return true;
  }, [items]);

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
      if (editingAddress) { await updateAddressApi({ addressId: editingAddress._id || editingAddress.id, ...newAddr }).unwrap(); Toast.success("Address updated"); }
      else { await addAddress(newAddr).unwrap(); Toast.success("Address added"); }
      setShowNewAddress(false); setEditingAddress(null); setAddrErrors({});
      setNewAddr({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" });
      setShowAddress(true);
    } catch (err) { Toast.error(err?.data?.message || "Failed to save address"); }
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
    setNewAddr({ name: addr.name || "", phone: addr.phone || "", addressLine1: addr.addressLine1 || "", addressLine2: addr.addressLine2 || "", city: addr.city || "", state: addr.state || "", pincode: addr.pincode || "", landmark: addr.landmark || "", type: addr.type || "home", country: addr.country || "IN" });
    setShowAddress(false); setShowNewAddress(true);
  };

  const handleDeleteAddress = async (addrId) => {
    if (!addrId || !window.confirm("Are you sure you want to delete this address?")) return;
    try { await deleteAddress({ addressId: addrId }).unwrap(); Toast.success("Address deleted"); if (selectedAddress === addrId) setSelectedAddress(null); }
    catch (err) { Toast.error(err?.data?.message || "Failed to delete address"); }
  };

  const handleQtyChange = async (item, delta) => {
    if (isBuyNowMode) { const nq = buyNowQty + delta; if (nq >= 1) setBuyNowQty(nq); return; }
    const productId = getId(item); if (!productId) return;
    const variantId = getVariantId(item);
    const itemKey = `${productId}_${variantId}`;
    const newQty = (item?.quantity || 1) + delta; if (newQty < 1) return;
    try {
      await updateCartItem({ productId, variantId, quantity: newQty }).unwrap();
      if (delta < 0) setStockLimitedItems((prev) => { const next = { ...prev }; delete next[itemKey]; return next; });
    }
    catch (err) {
      const msg = err?.data?.message || "";
      if (msg === "Insufficient stock") setStockLimitedItems((prev) => ({ ...prev, [itemKey]: true }));
      Toast.error(msg || "Failed to update");
    }
  };

  const handleRemove = async (item) => {
    if (isBuyNowMode) { navigate("/shubh-mall"); return; }
    const productId = getId(item); if (!productId) return;
    try { await removeCartItem({ productId, variantId: getVariantId(item) }).unwrap(); Toast.success("Item removed"); }
    catch (err) { Toast.error(err?.data?.message || "Failed to remove"); }
  };

  const proceedToCheckout = useCallback(async (address) => {
    setShowAddress(false);
    if (isBuyNowMode) {
      navigate("/checkout", { state: { buyNowProduct, buyNowVariant, buyNowQty, address } });
    } else {
      navigate("/checkout", { state: { address } });
    }
  }, [isBuyNowMode, buyNowProduct, buyNowVariant, buyNowQty, navigate]);

  const buildShippingAddress = useCallback(() => {
    if (!chosenAddress) return undefined;
    return { name: chosenAddress.name || "", phone: chosenAddress.phone || "", address: chosenAddress.addressLine1 || chosenAddress.address || "", city: chosenAddress.city || "", state: chosenAddress.state || "", pincode: Number(chosenAddress.pincode || chosenAddress.pin) || 0 };
  }, [chosenAddress]);

  const createOrder = useCallback(async () => {
    const orderItems = items.map((item) => {
      const p = item?.productId || item?.product || item;
      const variantId = item?.variantId?._id || item?.variantId?.id || (typeof item?.variantId === "string" ? item.variantId : "") || item?.variantSnapshot?._id || item?.variantSnapshot?.id || item?.variantSnapshot?.sku || item?.variant?._id || item?.variant?.id || (typeof item?.variant === "string" ? item.variant : "") || "";
      return { productId: String(p?._id || p?.id || p?.ID || ""), variantId: String(variantId), quantity: item?.quantity || 1 };
    });
    const shippingAddress = buildShippingAddress();
    const cartId = cartData?.data?.cartId || cartData?.data?.cart?._id || cartData?.data?._id || "";
    const payload = { items: orderItems, ...(cartId && { cartId }), sub_total: subtotal, gst_amount: gst, shipping_charge: 0, cod_charge: 0, total_amount: grandTotal, payment_method: "online", ...(shippingAddress && { shipping_address: shippingAddress }), notes: "" };
    try {
      const res = await createMallOrder(payload).unwrap();
      orderIdRef.current = res?.data?.order?._id || res?.data?._id || res?.order?._id || res?._id || res?.data?.order?.id || res?.data?.id || res?.order?.id || res?.id;
      const gatewayOrderId = res?.data?.order?.gatewayOrderId || res?.data?.gatewayOrderId || res?.order?.gatewayOrderId || res?.gatewayOrderId || res?.data?.order?.razorpay_order_id || res?.data?.razorpay_order_id || res?.order?.razorpay_order_id || res?.razorpay_order_id;
      return { orderId: orderIdRef.current, gatewayOrderId };
    } catch (err) { console.error("[AstromallCart] Failed to create order:", err); return null; }
  }, [items, grandTotal, subtotal, gst, cartData, buildShippingAddress, createMallOrder]);

  const updateOrder = useCallback(async (paymentStatus, paymentMethod) => {
    const orderId = orderIdRef.current; if (!orderId) return;
    const shippingAddress = buildShippingAddress();
    try { await updateMallOrder({ orderId, payment_status: paymentStatus, order_status: paymentStatus === "paid" ? "confirmed" : "failed", payment_method: paymentMethod || "online", sub_total: subtotal, gst_amount: gst, shipping_charge: 0, cod_charge: 0, total_amount: grandTotal, ...(shippingAddress && { shipping_address: shippingAddress }), notes: "" }).unwrap(); }
    catch (err) { console.error("[AstromallCart] Failed to update order:", err); }
  }, [grandTotal, subtotal, gst, buildShippingAddress, updateMallOrder]);

  // Only remove the exact items (product + variant) that were purchased
  const postPaymentCleanup = useCallback(async () => {
    for (const item of items) {
      const p = item?.productId || item?.product || item;
      const pid = p?._id || p?.id;
      const vid = getVariantId(item);
      if (pid) {
        try { await removeCartItem({ productId: pid, variantId: vid }).unwrap(); } catch (_) { /* ignore */ }
      }
    }
  }, [items, removeCartItem]);

  const openRazorpay = useCallback(async (prefillMethod) => {
    if (!isRzpLoaded || !window.Razorpay) { Toast.error("Payment gateway not loaded. Please refresh."); return; }
    if (isProcessing) return;
    const valid = await validateCartProducts();
    if (!valid || validationIssues.some((i) => i.type === "out_of_stock")) return;
    setIsProcessing(true);
    const orderResult = await createOrder();
    if (!orderResult) { setIsProcessing(false); Toast.error("Failed to create order. Please try again."); return; }
    const { gatewayOrderId } = orderResult;
    const amountInPaise = Math.round(grandTotal * 100);
    const options = {
      key: RAZORPAY_KEY, amount: amountInPaise, currency: "INR", name: "ShubhTalk",
      description: items.length === 1 ? getTitle(items[0]) : `${items.length} items from ShubhMall`,
      ...(gatewayOrderId && { order_id: gatewayOrderId }),
      handler: async () => {
        setIsProcessing(false);
        await updateOrder("paid", actualPaymentMethodRef.current || selectedMethod || "online");
        actualPaymentMethodRef.current = null;
        await postPaymentCleanup();
        Toast.success("Payment successful!");
        navigate("/booking-success", { state: { total: grandTotal, address: chosenAddress } });
      },
      prefill: { name: localStorage.getItem("shubhtalk_user_name") || "", email: localStorage.getItem("shubhtalk_user_email") || "", contact: localStorage.getItem("shubhtalk_user_phone") || "", method: prefillMethod || selectedMethod },
      theme: { color: "#f75801" },
      modal: { ondismiss: () => { setIsProcessing(false); updateOrder("failed", selectedMethod); Toast.info("Payment cancelled"); } },
    };
    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.authorized", (resp) => { actualPaymentMethodRef.current = resp?.method || null; });
      rzp.on("payment.failed", (resp) => { setIsProcessing(false); updateOrder("failed", resp?.error?.metadata?.payment_method || selectedMethod); Toast.error(resp?.error?.description || "Payment failed"); });
      rzp.open();
    } catch (err) { setIsProcessing(false); Toast.error("Could not open payment gateway. Please try again."); }
  }, [isRzpLoaded, isProcessing, grandTotal, items, navigate, chosenAddress, selectedMethod, createOrder, updateOrder, postPaymentCleanup, validateCartProducts, validationIssues]);

  const handleUpiAppPay = useCallback(async (app) => {
    if (!isRzpLoaded || !window.Razorpay) { Toast.error("Payment gateway not loaded. Please refresh."); return; }
    if (isProcessing) return;
    const valid = await validateCartProducts();
    if (!valid || validationIssues.some((i) => i.type === "out_of_stock")) return;
    setIsProcessing(true); setSelectedMethod("upi");
    const orderResult = await createOrder();
    if (!orderResult) { setIsProcessing(false); Toast.error("Failed to create order. Please try again."); return; }
    const amountInPaise = Math.round(grandTotal * 100);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const options = {
      key: RAZORPAY_KEY, amount: amountInPaise, currency: "INR", name: "ShubhTalk",
      description: items.length === 1 ? getTitle(items[0]) : `${items.length} items from ShubhMall`,
      handler: async () => {
        setIsProcessing(false);
        await updateOrder("paid", actualPaymentMethodRef.current || "upi");
        actualPaymentMethodRef.current = null;
        await postPaymentCleanup();
        Toast.success("Payment successful!");
        navigate("/booking-success", { state: { total: grandTotal, address: chosenAddress } });
      },
      prefill: { name: localStorage.getItem("shubhtalk_user_name") || "", email: localStorage.getItem("shubhtalk_user_email") || "", contact: localStorage.getItem("shubhtalk_user_phone") || "", method: "upi" },
      theme: { color: "#f75801" },
      modal: { ondismiss: () => { setIsProcessing(false); updateOrder("failed", "upi"); } },
    };
    if (isMobile && app?.rzpApp) {
      options.config = { display: { blocks: { upi: { name: "Pay via UPI", instruments: [{ method: "upi", flows: ["intent"], apps: [app.rzpApp] }] } }, sequence: ["block.upi"], preferences: { show_default_blocks: false } } };
    }
    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.authorized", (resp) => { actualPaymentMethodRef.current = resp?.method || null; });
      rzp.on("payment.failed", (resp) => { setIsProcessing(false); updateOrder("failed", resp?.error?.metadata?.payment_method || "upi"); Toast.error(resp?.error?.description || "Payment failed"); });
      rzp.open();
    } catch (err) { setIsProcessing(false); Toast.error("Could not open payment gateway. Please try again."); }
  }, [isRzpLoaded, isProcessing, grandTotal, items, navigate, chosenAddress, createOrder, updateOrder, postPaymentCleanup, validateCartProducts, validationIssues]);

  const hasOutOfStock = validationIssues.some((i) => i.type === "out_of_stock");

  if (isLoading && !isBuyNowMode) {
    return <div className={styles.page}><div className={styles.loading}>Loading cart...</div></div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.topNav}>
        <button className={styles.backBtn} onClick={() => { if (checkoutStep === "checkout") { setCheckoutStep("cart"); setValidationIssues([]); setValidatedProducts({}); } else navigate("/shubh-mall"); }}>
          <span className={styles.backCircle}><FiChevronLeft /></span>
          <span className={styles.backLabel}>{checkoutStep === "checkout" ? "Checkout" : "My Cart"}</span>
        </button>
        <div className={styles.topRight}><AstromallCartSidebar /></div>
      </div>

      {isValidating && <div className={styles.validatingBar}>Verifying product availability &amp; prices...</div>}

      {checkoutStep === "cart" && (<>
        {items.length > 0 && <h2 className={styles.sectionTitle}>PRODUCT DETAILS</h2>}
        {items.length === 0 && (<div className={styles.emptyCart}><FiShoppingCart size={48} color="#ccc" /><p>Your cart is empty</p><button className={styles.browseBtn} onClick={() => navigate("/shubh-mall")}>Browse Products</button></div>)}
        {items.map((item, idx) => {
          const qty = item?.quantity || 1, price = getPrice(item), routeId = getRouteId(item);
          const cartVid = getVariantId(item);
          const itemKey = `${getId(item)}_${cartVid}`;
          const enrichedV = enrichedVariants[cartVid];
          const variantInfo = getCartVariantAttrs(item, enrichedVariants);
          const goToDetail = () => {
            if (!routeId) return;
            const p = getProductData(item);
            const variantData = item?.variantSnapshot || (typeof item?.variantId === "object" ? item.variantId : null);
            const variantIdStr = item?.variantId?._id || item?.variantId?.id || (typeof item?.variantId === "string" ? item.variantId : "") || item?.variantSnapshot?._id || item?.variantSnapshot?.id || "";
            navigate(`/product-details/${routeId}`, { state: { ...p, _selectedVariant: variantData ? { ...variantData, _id: variantData._id || variantIdStr } : variantIdStr ? { _id: variantIdStr } : undefined, _cartQty: qty } });
          };
          return (
            <div key={item?._id || idx} className={styles.productCard}>
              <ProductImage src={getImg(item, enrichedV)} alt={getTitle(item)} className={styles.productImg} onClick={goToDetail} style={{ cursor: "pointer" }} />
              <div className={styles.productInfo}>
                <h3 onClick={goToDetail} style={{ cursor: "pointer" }}>{getTitle(item)}</h3>
                {variantInfo.length > 0 && (
                  <div className={styles.variantAttrs}>
                    {variantInfo.map((a, i) => (
                      <span key={i} className={styles.variantAttr}><strong>{formatAttrValue(a.name)}:</strong> {formatAttrValue(a.value)}{i < variantInfo.length - 1 ? "," : ""}</span>
                    ))}
                  </div>
                )}
                <div className={styles.qtyRow}>
                  <button className={styles.qtyBtn} onClick={() => handleQtyChange(item, -1)} aria-label="Decrease"><FiMinus /></button>
                  <span className={styles.qtyVal}>{String(qty).padStart(2, "0")}</span>
                  <button className={`${styles.qtyBtn} ${styles.qtyBtnPlus}`} onClick={() => handleQtyChange(item, 1)} disabled={stockLimitedItems[itemKey]} aria-label="Increase"><FiPlus /></button>
                </div>
              </div>
              <button className={styles.removeBtn} onClick={() => handleRemove(item)} aria-label="Remove"><FiTrash2 size={18} /></button>
              <div className={styles.priceCol}><span className={styles.price}>₹{(price * qty).toLocaleString()}</span></div>
            </div>);
        })}
        {items.length > 0 && (
          <div className={styles.bottomBar}>
            <div className={styles.totalCol}><span className={styles.totalPrice}>₹{total.toLocaleString()}</span></div>
            <button className={styles.checkoutBtn} disabled={isValidating} onClick={async () => {
              const valid = await validateCartProducts();
              if (!valid) return;
              if (!addressLoading && addressList.length === 0) {
                setEditingAddress(null);
                setNewAddr({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" });
                setShowNewAddress(true);
              } else {
                setShowAddress(true);
              }
            }}>{isValidating ? "Verifying..." : "Proceed to Checkout"}</button>
          </div>
        )}
      </>)}

      {checkoutStep === "checkout" && (
        <div ref={checkoutRef}>
          {validationIssues.length > 0 && (
            <div className={styles.issuesBanner}>
              <div className={styles.issuesHeader}><FiAlertTriangle size={18} /> Product changes detected</div>
              {validationIssues.map((issue, i) => (<div key={i} className={`${styles.issueRow} ${issue.type === "out_of_stock" ? styles.issueError : styles.issueWarn}`}>{issue.message}</div>))}
              {hasOutOfStock && (<button className={styles.backToCartBtn} onClick={() => { setCheckoutStep("cart"); setValidationIssues([]); setValidatedProducts({}); }}>← Back to Cart to update</button>)}
            </div>
          )}
          <div className={styles.twoCol}>
            <div className={styles.leftCol}>
              <h2 className={styles.sectionTitle}>PAY WITH UPI</h2>
              <div className={styles.upiCard}>
                <div className={styles.upiApps}>
                  {UPI_APPS.map((app) => (<div key={app._id} className={styles.upiApp} onClick={() => handleUpiAppPay(app)} style={{ cursor: hasOutOfStock ? "not-allowed" : "pointer", opacity: hasOutOfStock ? 0.5 : 1 }}><img src={app.logo} alt={app.name} className={styles.upiIconImg} width={48} height={48} /><span className={styles.upiName}>{app.name}</span></div>))}
                </div>
                <div className={styles.otherUpiWrap}>
                  <button className={styles.otherUpiBtn} onClick={() => setShowOtherUpi(!showOtherUpi)}><img src={upiLogo} alt="UPI" className={styles.upiLabelImg} width={28} height={28} />Pay with other UPI apps<FiChevronRight className={`${styles.chevron} ${showOtherUpi ? styles.chevronOpen : ""}`} /></button>
                  {showOtherUpi && (<div className={styles.otherUpiList}>{OTHER_UPI_APPS.map((app) => (<button key={app._id} className={styles.otherUpiItem} onClick={() => { setShowOtherUpi(false); handleUpiAppPay(app); }}><span className={styles.otherUpiLeft}><img src={app.logo} alt={app.name} className={styles.otherUpiIconImg} width={32} height={32} /><span className={styles.otherUpiName}>{app.name}</span></span><FiChevronRight size={14} color="#999" /></button>))}</div>)}
                </div>
              </div>
              <h2 className={styles.sectionTitle}>OTHER PAYMENT METHODS</h2>
              <div className={styles.methodList}>
                {PAYMENT_METHODS.map((m) => (<label key={m._id} className={`${styles.methodCard} ${selectedMethod === m._id ? styles.methodActive : ""}`}><img src={m.logo} alt={m.name} className={styles.methodIconImg} width={32} height={32} /><span className={styles.methodName}>{m.name}</span><input type="radio" name="payMethod" checked={selectedMethod === m._id} onChange={() => setSelectedMethod(m._id)} className={styles.methodRadio} /></label>))}
              </div>
            </div>
            <div className={styles.rightCol}>
              <h2 className={styles.sectionTitle}>PRICE BREAKDOWN</h2>
              <div className={styles.priceCard}>
                {items.map((item, idx) => { const title = getTitle(item), price = getLivePrice(item), qty = item?.quantity || 1, vInfo = getCartVariantAttrs(item, enrichedVariants); return (<div key={item?._id || idx} className={styles.priceRow}><span>{title}{qty > 1 ? ` × ${qty}` : ""}{vInfo.length > 0 && <span className={styles.priceRowAttrs}>{vInfo.map((a, i) => <span key={i}><strong>{a.name}:</strong> {a.value}{i < vInfo.length - 1 ? ", " : ""}</span>)}</span>}</span><span>₹{(price * qty).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>); })}
                <div className={`${styles.priceRow} ${styles.priceSubtotal}`}><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                <div className={styles.priceRow}><span>GST</span><span>₹{gst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                <div className={`${styles.priceRow} ${styles.priceTotal}`}><span>Total Amount</span><span>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                <p className={styles.gstNote}>*All prices are inclusive of applicable GST</p>
              </div>
              {chosenAddress && (<div className={styles.addressBox}><h3 className={styles.addressBoxTitle}>Delivery Address</h3><p className={styles.addressBoxText}>{chosenAddress.name && <strong>{chosenAddress.name}{chosenAddress.type ? ` (${chosenAddress.type})` : ""}: </strong>}{chosenAddress.addressLine1 || chosenAddress.address}{chosenAddress.addressLine2 ? `, ${chosenAddress.addressLine2}` : ""}{chosenAddress.landmark ? `, ${chosenAddress.landmark}` : ""}{chosenAddress.pincode ? ` - ${chosenAddress.pincode}` : ""}{chosenAddress.city ? `, ${chosenAddress.city}` : ""}{chosenAddress.state ? `, ${chosenAddress.state}` : ""}</p><button className={styles.changeAddrBtn} onClick={() => setShowAddress(true)}>Change</button></div>)}
              <h2 className={styles.sectionTitleCenter}>APPLY COUPON</h2>
              <div className={styles.couponRow}><input type="text" placeholder="Enter Coupon Code" className={styles.couponInput} value={coupon} onChange={(e) => setCoupon(e.target.value)} /><button className={styles.applyBtn}>Apply</button></div>
              <div className={styles.securedBox}>
                <p className={styles.securedText}>Secured by <strong>Trusted Indian Banks</strong> ✅</p>
                <button className={styles.payBtn} onClick={() => openRazorpay(selectedMethod)} disabled={isProcessing || !isRzpLoaded || hasOutOfStock || isValidating}>{isProcessing ? "Processing..." : isValidating ? "Verifying..." : hasOutOfStock ? "Items out of stock" : `Pay ₹ ${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddress && (
        <div className={styles.overlay} onClick={() => setShowAddress(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowAddress(false)} aria-label="Close"><FiX /></button>
            <h2 className={styles.modalTitle}>SELECT ADDRESS</h2>
            <div className={styles.addressList}>
              {addressLoading && <p style={{ textAlign: "center", color: "#999", padding: "16px 0" }}>Loading addresses...</p>}
              {!addressLoading && addressList.length === 0 && <p style={{ textAlign: "center", color: "#aaa", padding: "16px 0" }}>No saved addresses</p>}
              {!addressLoading && addressList.map((a) => {
                const addrId = a._id || a.id, addrType = a.type || "home";
                return (
                  <div key={addrId} className={`${styles.addressCard} ${selectedAddress === addrId ? styles.addressActive : ""}`} onClick={() => setSelectedAddress(addrId)} style={{ cursor: "pointer" }}>
                    <span className={styles.addressIcon}>{addrType === "home" ? <FiHome /> : <FiBriefcase />}</span>
                    <div className={styles.addressInfo}><span className={styles.addressType}>{a.name || addrType}{a.phone ? ` · ${a.phone}` : ""}</span><p className={styles.addressText}>{[a.addressLine1, a.addressLine2, a.landmark].filter(Boolean).join(", ")}<br />{[a.city, a.state, a.pincode].filter(Boolean).join(", ")}</p></div>
                    <button className={styles.addrActionBtn} onClick={(e) => { e.stopPropagation(); openEditAddress(a); }} aria-label="Edit address"><FiEdit2 size={14} /></button>
                    <button className={styles.addrActionBtn} onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addrId); }} aria-label="Delete address"><FiTrash2 size={14} /></button>
                    <input type="radio" name="address" checked={selectedAddress === addrId} readOnly className={styles.addressRadio} />
                  </div>);
              })}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.addAddressBtn} onClick={() => { setShowAddress(false); setEditingAddress(null); setNewAddr({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" }); setShowNewAddress(true); }}>Add New Address +</button>
              <button className={styles.orderBtn} disabled={!selectedAddress || isValidating} onClick={() => { const chosen = addressList.find((a) => (a._id || a.id) === selectedAddress); proceedToCheckout(chosen); }}>{isValidating ? "Verifying..." : "Proceed to Pay"}</button>
            </div>
          </div>
        </div>
      )}

      {showNewAddress && (
        <div className={styles.overlay} onClick={() => setShowNewAddress(false)}>
          <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowNewAddress(false)} aria-label="Close"><FiX /></button>
            <h2 className={styles.modalTitle}>{editingAddress ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}</h2>
            <div className={styles.formRow}>
              <div className={styles.formGroup}><label className={styles.formLabel}>Name <span style={{color:'#dc2626'}}>*</span></label><input type="text" placeholder="Full name" className={`${styles.formInput} ${addrErrors.name ? styles.formInputError : ""}`} value={newAddr.name} onChange={(e) => { setNewAddr({ ...newAddr, name: e.target.value }); setAddrErrors({ ...addrErrors, name: "" }); }} />{addrErrors.name && <p className={styles.formError}>{addrErrors.name}</p>}</div>
              <div className={styles.formGroup}><label className={styles.formLabel}>Phone <span style={{color:'#dc2626'}}>*</span></label><input type="tel" placeholder="Phone number" maxLength={10} className={`${styles.formInput} ${addrErrors.phone ? styles.formInputError : ""}`} value={newAddr.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setNewAddr({ ...newAddr, phone: v }); setAddrErrors({ ...addrErrors, phone: "" }); }} />{addrErrors.phone && <p className={styles.formError}>{addrErrors.phone}</p>}</div>
            </div>
            <div className={styles.formGroup}><label className={styles.formLabel}>Address line 1 <span style={{color:'#dc2626'}}>*</span></label><input type="text" placeholder="Enter here" className={`${styles.formInput} ${addrErrors.addressLine1 ? styles.formInputError : ""}`} value={newAddr.addressLine1} onChange={(e) => { setNewAddr({ ...newAddr, addressLine1: e.target.value }); setAddrErrors({ ...addrErrors, addressLine1: "" }); }} />{addrErrors.addressLine1 && <p className={styles.formError}>{addrErrors.addressLine1}</p>}</div>
            <div className={styles.formGroup}><label className={styles.formLabel}>Address line 2</label><input type="text" placeholder="Enter here" className={styles.formInput} value={newAddr.addressLine2} onChange={(e) => setNewAddr({ ...newAddr, addressLine2: e.target.value })} /></div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}><label className={styles.formLabel}>Pincode <span style={{color:'#dc2626'}}>*</span></label><input type="text" placeholder="Enter here" maxLength={6} className={`${styles.formInput} ${addrErrors.pincode ? styles.formInputError : ""}`} value={newAddr.pincode} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setNewAddr({ ...newAddr, pincode: v }); setAddrErrors({ ...addrErrors, pincode: "" }); }} />{addrErrors.pincode && <p className={styles.formError}>{addrErrors.pincode}</p>}</div>
              <div className={styles.formGroup}><label className={styles.formLabel}>City <span style={{color:'#dc2626'}}>*</span></label><input type="text" placeholder="Enter here" className={`${styles.formInput} ${addrErrors.city ? styles.formInputError : ""}`} value={newAddr.city} onChange={(e) => { setNewAddr({ ...newAddr, city: e.target.value }); setAddrErrors({ ...addrErrors, city: "" }); }} />{addrErrors.city && <p className={styles.formError}>{addrErrors.city}</p>}</div>
              <div className={styles.formGroup}><label className={styles.formLabel}>State <span style={{color:'#dc2626'}}>*</span></label><input type="text" placeholder="Type here" className={`${styles.formInput} ${addrErrors.state ? styles.formInputError : ""}`} value={newAddr.state} onChange={(e) => { setNewAddr({ ...newAddr, state: e.target.value }); setAddrErrors({ ...addrErrors, state: "" }); }} />{addrErrors.state && <p className={styles.formError}>{addrErrors.state}</p>}</div>
            </div>
            <div className={styles.formGroup}><label className={styles.formLabel}>Landmark</label><input type="text" placeholder="Near..." className={styles.formInput} value={newAddr.landmark} onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })} /></div>
            <div className={styles.saveAsGroup}><span className={styles.saveAsLabel}>Save Address as</span><div className={styles.saveAsTags}><button className={`${styles.saveAsTag} ${newAddr.type === "home" ? styles.saveAsActive : ""}`} onClick={() => setNewAddr({ ...newAddr, type: "home" })}>Home</button><button className={`${styles.saveAsTag} ${newAddr.type === "work" ? styles.saveAsActive : ""}`} onClick={() => setNewAddr({ ...newAddr, type: "work" })}>Work</button><button className={`${styles.saveAsTag} ${newAddr.type === "other" ? styles.saveAsActive : ""}`} onClick={() => setNewAddr({ ...newAddr, type: "other" })}>Other</button></div></div>
            <button className={styles.saveAddressBtn} onClick={handleAddAddress} disabled={isAddingAddress || isUpdatingAddress}>{(isAddingAddress || isUpdatingAddress) ? "Saving..." : (editingAddress ? "Update Address ›" : "Save Address ›")}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AstromallCart;
