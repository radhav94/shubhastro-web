import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./EPoojaCheckout.module.scss";
import detailStyles from "../detail/EPoojaDetail.module.scss";
import { FiChevronLeft, FiChevronRight, FiX, FiHome, FiBriefcase, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useGetCartQuery, useRemoveCartItemMutation, useCreateMallOrderMutation, useUpdateMallOrderMutation, useGetAddressesQuery, useAddAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation, useValidateCouponMutation } from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import Toast from "../../../../component/toast";
import AstromallCartSidebar from "../components/AstromallCartSidebar";

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

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SJVwTGtUhFpODR";
const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const UPI_APPS = [
  { _id: "phonepe", name: "Phonepe", logo: phonepeLogo, rzpApp: "phonepe", scheme: "phonepe" },
  { _id: "cred", name: "Cred UPI", logo: credLogo, rzpApp: "cred", scheme: "credpay" },
  { _id: "paytm", name: "Paytm", logo: paytmLogo, rzpApp: "paytm", scheme: "paytmmp" },
];

const OTHER_UPI_APPS = [
  { _id: "gpay", name: "Google Pay", logo: gpayLogo, rzpApp: "google_pay", scheme: "gpay" },
  { _id: "bhim", name: "BHIM UPI", logo: bhimLogo, rzpApp: "bhim", scheme: "upi" },
  { _id: "amazonpay", name: "Amazon Pay", logo: amazonpayLogo, rzpApp: "amazonpay", scheme: "amazonpay" },
];

const PAYMENT_METHODS = [
  { _id: "upi", name: "UPI", logo: upiLogo, color: "#4caf50" },
  { _id: "card", name: "Credit/Debit", logo: debitlogo, color: "#1976d2" },
  { _id: "netbanking", name: "Net Banking", logo: netbankinglogo, color: "#ff9800" },
  { _id: "wallet", name: "Wallet", logo: walletlogo, color: "#e91e63" },
];

const getItemTitle = (item) => {
  const p = item?.productId || item?.product || item;
  const variantTitle = item?.variantSnapshot?.title;
  const productTitle = p?.title || p?.name || "Product";
  return variantTitle ? `${productTitle} — ${variantTitle}` : productTitle;
};
const getItemPrice = (item) => {
  // Cart API fields (most reliable for cart items)
  if (item?.currentPrice) return item.currentPrice;
  if (item?.priceAtAdd) return item.priceAtAdd;
  if (item?.price) return item.price;
  // Try variant snapshot price
  if (item?.variantSnapshot?.price) return item.variantSnapshot.price;
  // Try variantId if populated as object
  if (item?.variantId?.price) return item.variantId.price;
  const p = item?.productId || item?.product || item;
  // Try variant price from product data
  const variant = p?.variants?.find((v) => v.isActive) || p?.variants?.[0];
  if (variant?.price) return variant.price;
  return p?.price || p?.selling_price || 0;
};
const getItemGstPercent = (item) => {
  // Check item-level GST first
  if (item?.gst !== undefined && item?.gst !== null) return item.gst;
  if (item?.variantSnapshot?.gst !== undefined) return item.variantSnapshot.gst;
  if (item?.variantId?.gst !== undefined) return item.variantId.gst;
  const p = item?.productId || item?.product || item;
  return p?.gst || 0;
};

// Extract variant attributes from cart item + enriched product data
const getCheckoutVariantAttrs = (item, enrichedVariants = {}) => {
  const seen = new Set();
  const attrs = [];
  const add = (name, value) => {
    const key = name?.toString().toLowerCase();
    if (key && value && !seen.has(key)) { seen.add(key); attrs.push({ name, value }); }
  };
  const vid = item?.variantId?._id || item?.variantId?.id || (typeof item?.variantId === "string" ? item.variantId : "") || item?.variantSnapshot?._id || item?.variantSnapshot?.id || "";
  const enriched = enrichedVariants[vid];
  const sources = [enriched, item?.variantSnapshot, typeof item?.variantId === "object" ? item.variantId : null].filter(Boolean);
  for (const src of sources) {
    const a = src.attributes;
    if (Array.isArray(a)) a.forEach((x) => add(x.name, x.value));
    else if (a && typeof a === "object") Object.entries(a).forEach(([k, v]) => add(k, v));
    ["type", "size", "weight", "color", "material"].forEach((k) => { if (src[k]) add(k, src[k]); });
    if (attrs.length > 0) break;
  }
  const vTitle = enriched?.title || item?.variantSnapshot?.title || (typeof item?.variantId === "object" ? item.variantId?.title : null);
  if (attrs.length === 0 && vTitle) add("variant", vTitle);
  return attrs;
};

const fetchCheckoutProductDetail = async (idOrSlug) => {
  try {
    const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
    const role = localStorage.getItem("shubhtalk_role");
    const token = role === "ASTROLOGER" ? localStorage.getItem("shubhtalk_astro_token") : localStorage.getItem("shubhtalk_customer_token");
    const res = await fetch(`${BASE_URL}/api/mall/products/${idOrSlug}`, {
      headers: { accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const json = await res.json();
    return (json?.success || json?.status === true) ? json?.data : null;
  } catch { return null; }
};

const EPoojaCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Block direct URL access — must come from cart or buy now flow
  useEffect(() => {
    if (!location.state) {
      navigate("/viewcart", { replace: true });
    }
  }, []);

  const [chosenAddress, setChosenAddress] = useState(location.state?.address || null);
  const buyNowProduct = location.state?.buyNowProduct || null;
  const buyNowVariant = location.state?.buyNowVariant || null;
  const buyNowQtyFromState = location.state?.buyNowQty || 1;

  const isBuyNowMode = !!buyNowProduct;

  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [showOtherUpi, setShowOtherUpi] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponData, setCouponData] = useState(null); // { discount, discount_type, message, ... }
  const [couponError, setCouponError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [buyNowQty] = useState(buyNowQtyFromState);
  const actualPaymentMethodRef = useRef(null);

  // Address modal state
  const [showAddress, setShowAddress] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddr, setNewAddr] = useState({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" });
  const [addrErrors, setAddrErrors] = useState({});

  // Address API
  const { data: addressData, isLoading: addressLoading } = useGetAddressesQuery();
  const [addAddressApi, { isLoading: isAddingAddress }] = useAddAddressMutation();
  const [updateAddressApi, { isLoading: isUpdatingAddress }] = useUpdateAddressMutation();
  const [deleteAddressApi] = useDeleteAddressMutation();
  const addresses = addressData?.data || addressData?.data?.addresses || [];
  const addressList = Array.isArray(addresses) ? addresses : [];

  useEffect(() => {
    if (addressList.length > 0 && !selectedAddress) {
      // Pre-select the current chosen address, or default
      const currentId = chosenAddress?._id || chosenAddress?.id;
      if (currentId && addressList.find((a) => (a._id || a.id) === currentId)) {
        setSelectedAddress(currentId);
      } else {
        const def = addressList.find((a) => a.isDefault) || addressList[0];
        setSelectedAddress(def?._id || def?.id);
      }
    }
  }, [addressList, selectedAddress, chosenAddress]);

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
        await updateAddressApi({ addressId: editingAddress._id || editingAddress.id, ...newAddr }).unwrap();
        Toast.success("Address updated");
      } else {
        await addAddressApi(newAddr).unwrap();
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
    setNewAddr({ name: addr.name || "", phone: addr.phone || "", addressLine1: addr.addressLine1 || "", addressLine2: addr.addressLine2 || "", city: addr.city || "", state: addr.state || "", pincode: addr.pincode || "", landmark: addr.landmark || "", type: addr.type || "home", country: addr.country || "IN" });
    setShowAddress(false);
    setShowNewAddress(true);
  };

  const handleDeleteAddress = async (addrId) => {
    if (!addrId || !window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await deleteAddressApi({ addressId: addrId }).unwrap();
      Toast.success("Address deleted");
      if (selectedAddress === addrId) setSelectedAddress(null);
      if ((chosenAddress?._id || chosenAddress?.id) === addrId) setChosenAddress(null);
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to delete address");
    }
  };

  const { data: cartData, isLoading } = useGetCartQuery();
  const [removeCartItem] = useRemoveCartItemMutation();
  const getCartItemVariantId = (item) => item?.variantId?._id || item?.variantId?.id || (typeof item?.variantId === "string" ? item.variantId : "") || item?.variantSnapshot?._id || item?.variantSnapshot?.id || "";
  const [createMallOrder] = useCreateMallOrderMutation();
  const [updateMallOrder] = useUpdateMallOrderMutation();
  const [validateCoupon, { isLoading: isCouponLoading }] = useValidateCouponMutation();
  const orderIdRef = useRef(null);
  const cartItems = cartData?.data?.items || cartData?.data?.cart?.items || cartData?.data || [];
  const rawCartItems = Array.isArray(cartItems) ? cartItems : [];

  const items = isBuyNowMode
    ? [{ productId: buyNowProduct, variantId: buyNowVariant?._id || buyNowVariant?.id || buyNowVariant?.skuCode || buyNowVariant?.sku || "", variantSnapshot: buyNowVariant, quantity: buyNowQty, _id: buyNowProduct?._id || "buynow" }]
    : rawCartItems;

  // Enriched variant map for showing type/size in price breakdown
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
      const results = await Promise.all(ids.map((id) => fetchCheckoutProductDetail(id)));
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

  // Use cart-level totals from API when available (most reliable), fall back to manual calculation
  const cartApiTotalAmount = cartData?.data?.totalAmount || cartData?.data?.cart?.totalAmount || cartData?.data?.total_amount || 0;
  const cartApiGst = cartData?.data?.totalGst || cartData?.data?.cart?.totalGst || cartData?.data?.gst_amount || cartData?.data?.cart?.gst_amount || 0;

  const manualSubtotal = items.reduce((sum, item) => sum + getItemPrice(item) * (item?.quantity || 1), 0);
  const manualGst = items.reduce((sum, item) => {
    const lineTotal = getItemPrice(item) * (item?.quantity || 1);
    const gstPercent = getItemGstPercent(item);
    return sum + Math.round(lineTotal * gstPercent / 100 * 100) / 100;
  }, 0);

  const subtotal = isBuyNowMode ? manualSubtotal : (cartApiTotalAmount || manualSubtotal);
  const gst = isBuyNowMode ? manualGst : (cartApiGst || manualGst);
  const discount = couponData?.discount_amount || 0;
  const grandTotal = Math.round((subtotal + gst - discount) * 100) / 100;

  // Coupon handlers
  const handleApplyCoupon = async () => {
    if (!coupon.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setCouponError("");
    try {
      const res = await validateCoupon({ code: coupon.trim(), cart_total: subtotal }).unwrap();
      setCouponData(res?.data || res);
      setCouponError("");
      Toast.success(res?.message || "Coupon applied successfully");
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || "Invalid coupon code";
      setCouponError(msg);
      setCouponData(null);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon("");
    setCouponData(null);
    setCouponError("");
  };

  // Shared: build shipping address from state
  const buildShippingAddress = useCallback(() => {
    if (!chosenAddress) return undefined;
    return {
      name: chosenAddress.name || "",
      phone: chosenAddress.phone || "",
      address: chosenAddress.addressLine1 || chosenAddress.address || chosenAddress.line1 || "",
      city: chosenAddress.city || "",
      state: chosenAddress.state || "",
      pincode: Number(chosenAddress.pincode || chosenAddress.pin) || 0,
    };
  }, [chosenAddress]);

  // Step 1: Create order with pending status BEFORE opening Razorpay
  const createOrder = useCallback(async () => {
    const orderItems = items.map((item) => {
      const p = item?.productId || item?.product || item;
      // Extract variantId from cart item data, variant snapshot, or fall back to first active variant
      const variantId = item?.variantId?._id || item?.variantId?.id || (typeof item?.variantId === "string" ? item.variantId : "")
        || item?.variantSnapshot?._id || item?.variantSnapshot?.id || item?.variantSnapshot?.sku
        || item?.variant?._id || item?.variant?.id || (typeof item?.variant === "string" ? item.variant : "")
        || "";
      return {
        productId: String(p?._id || p?.id || p?.ID || ""),
        variantId: String(variantId),
        quantity: item?.quantity || 1,
      };
    });

    const shippingAddress = buildShippingAddress();
    const cartId = cartData?.data?.cartId || cartData?.data?.cart?._id || cartData?.data?._id || "";

    const payload = {
      items: orderItems,
      ...(cartId && { cartId }),
      sub_total: subtotal,
      gst_amount: gst,
      shipping_charge: 0,
      cod_charge: 0,
      total_amount: grandTotal,
      ...(couponData && { coupon: { code: couponData.code, discount_amount: couponData.discount_amount } }),
      payment_method: "online",
      ...(shippingAddress && { shipping_address: shippingAddress }),
      notes: "",
    };

    try {
      const res = await createMallOrder(payload).unwrap();
      console.log("[EPoojaCheckout] Create order response:", JSON.stringify(res));
      orderIdRef.current = res?.data?.order?._id || res?.data?._id || res?.order?._id || res?._id
        || res?.data?.order?.id || res?.data?.id || res?.order?.id || res?.id;
      console.log("[EPoojaCheckout] Using orderId:", orderIdRef.current);

      // Extract Razorpay gateway order ID for checkout (starts with "order_")
      const gatewayOrderId = res?.data?.order?.gatewayOrderId || res?.data?.gatewayOrderId || res?.order?.gatewayOrderId || res?.gatewayOrderId
        || res?.data?.order?.razorpay_order_id || res?.data?.razorpay_order_id || res?.order?.razorpay_order_id || res?.razorpay_order_id;
      console.log("[EPoojaCheckout] Razorpay gatewayOrderId:", gatewayOrderId);

      return { orderId: orderIdRef.current, gatewayOrderId };
    } catch (err) {
      console.error("[EPoojaCheckout] Failed to create order:", err);
      return null;
    }
  }, [items, grandTotal, subtotal, gst, cartData, buildShippingAddress, createMallOrder, couponData]);

  // Step 2: Update order after payment success or failure
  const updateOrder = useCallback(async (paymentStatus, paymentMethod) => {
    const orderId = orderIdRef.current;
    if (!orderId) return;

    const shippingAddress = buildShippingAddress();

    const payload = {
      orderId,
      payment_status: paymentStatus,
      order_status: paymentStatus === "paid" ? "confirmed" : "failed",
      payment_method: paymentMethod || "online",
      sub_total: subtotal,
      gst_amount: gst,
      shipping_charge: 0,
      cod_charge: 0,
      total_amount: grandTotal,
      ...(shippingAddress && { shipping_address: shippingAddress }),
      notes: "",
    };

    try {
      await updateMallOrder(payload).unwrap();
    } catch (err) {
      console.error("[EPoojaCheckout] Failed to update order:", err);
    }
  }, [grandTotal, subtotal, gst, buildShippingAddress, updateMallOrder]);

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

  const openRazorpay = useCallback(async (prefillMethod) => {
    if (!isLoaded || !window.Razorpay) {
      Toast.error("Payment gateway not loaded. Please refresh.");
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);

    // Step 1: Create order with pending status
    const orderResult = await createOrder();
    if (!orderResult) {
      setIsProcessing(false);
      Toast.error("Failed to create order. Please try again.");
      return;
    }

    const { gatewayOrderId } = orderResult;
    if (!gatewayOrderId) {
      console.warn("[EPoojaCheckout] No gatewayOrderId returned from backend. Razorpay order_id will be missing.");
    }

    const amountInPaise = Math.round(grandTotal * 100);
    const options = {
      key: RAZORPAY_KEY,
      amount: amountInPaise,
      currency: "INR",
      name: "ShubhTalk",
      description: items.length === 1 ? getItemTitle(items[0]) : `${items.length} items from AstroMall`,
      ...(gatewayOrderId && { order_id: gatewayOrderId }),
      handler: async () => {
        setIsProcessing(false);
        // Step 2: Update order to paid with actual payment method
        const method = actualPaymentMethodRef.current || selectedMethod || "online";
        actualPaymentMethodRef.current = null;
        await updateOrder("paid", method);
        if (!isBuyNowMode && rawCartItems.length > 0) {
          for (const item of rawCartItems) {
            const productId = item?.productId?._id || item?.product?._id || item?._id;
            const variantId = getCartItemVariantId(item);
            if (productId) {
              try { await removeCartItem({ productId, variantId }).unwrap(); } catch (_) { /* ignore */ }
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
            const vid = getCartItemVariantId(inCart);
            if (pid) { try { await removeCartItem({ productId: pid, variantId: vid }).unwrap(); } catch (_) { /* ignore */ } }
          }
        }
        Toast.success("Payment successful!");
        navigate("/booking-success", { state: { total: grandTotal, address: chosenAddress } });
      },
      prefill: {
        name: localStorage.getItem("shubhtalk_user_name") || "",
        email: localStorage.getItem("shubhtalk_user_email") || "",
        contact: localStorage.getItem("shubhtalk_user_phone") || "",
        method: prefillMethod || selectedMethod,
      },
      theme: { color: "#f75801" },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          updateOrder("failed", selectedMethod);
          Toast.info("Payment cancelled");
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.authorized", (resp) => {
        actualPaymentMethodRef.current = resp?.method || null;
      });
      rzp.on("payment.failed", (resp) => {
        setIsProcessing(false);
        updateOrder("failed", resp?.error?.metadata?.payment_method || selectedMethod);
        Toast.error(resp?.error?.description || "Payment failed");
      });
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      Toast.error("Could not open payment gateway. Please try again.");
    }
  }, [isLoaded, isProcessing, grandTotal, items, navigate, chosenAddress, isBuyNowMode, rawCartItems, removeCartItem, selectedMethod, createOrder, updateOrder]);

  const handleProceedToPay = useCallback(() => {
    openRazorpay(selectedMethod);
  }, [openRazorpay, selectedMethod]);

  const handleUpiAppPay = useCallback(async (app) => {
    if (!isLoaded || !window.Razorpay) {
      Toast.error("Payment gateway not loaded. Please refresh.");
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    setSelectedMethod("upi");

    // Step 1: Create order with pending status
    const orderResult = await createOrder();
    if (!orderResult) {
      setIsProcessing(false);
      Toast.error("Failed to create order. Please try again.");
      return;
    }

    const { gatewayOrderId } = orderResult;
    const amountInPaise = Math.round(grandTotal * 100);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const options = {
      key: RAZORPAY_KEY,
      amount: amountInPaise,
      currency: "INR",
      name: "ShubhTalk",
      description: items.length === 1 ? getItemTitle(items[0]) : `${items.length} items from AstroMall`,
      ...(gatewayOrderId && { order_id: gatewayOrderId }),
      handler: async () => {
        setIsProcessing(false);
        // Step 2: Update order to paid with actual payment method
        const method = actualPaymentMethodRef.current || "upi";
        actualPaymentMethodRef.current = null;
        await updateOrder("paid", method);
        if (!isBuyNowMode && rawCartItems.length > 0) {
          for (const item of rawCartItems) {
            const productId = item?.productId?._id || item?.product?._id || item?._id;
            const variantId = getCartItemVariantId(item);
            if (productId) {
              try { await removeCartItem({ productId, variantId }).unwrap(); } catch (_) { /* ignore */ }
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
            const vid = getCartItemVariantId(inCart);
            if (pid) { try { await removeCartItem({ productId: pid, variantId: vid }).unwrap(); } catch (_) { /* ignore */ } }
          }
        }
        Toast.success("Payment successful!");
        navigate("/booking-success", { state: { total: grandTotal, address: chosenAddress } });
      },
      prefill: {
        name: localStorage.getItem("shubhtalk_user_name") || "",
        email: localStorage.getItem("shubhtalk_user_email") || "",
        contact: localStorage.getItem("shubhtalk_user_phone") || "",
        method: "upi",
      },
      theme: { color: "#f75801" },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          updateOrder("failed", "upi");
        },
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
      rzp.on("payment.authorized", (resp) => {
        actualPaymentMethodRef.current = resp?.method || null;
      });
      rzp.on("payment.failed", (resp) => {
        setIsProcessing(false);
        updateOrder("failed", resp?.error?.metadata?.payment_method || "upi");
        Toast.error(resp?.error?.description || "Payment failed");
      });
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      Toast.error("Could not open payment gateway. Please try again.");
    }
  }, [isLoaded, isProcessing, grandTotal, items, navigate, chosenAddress, isBuyNowMode, rawCartItems, removeCartItem, createOrder, updateOrder]);

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
                  <img src={app.logo} alt={app.name} className={styles.upiIconImg} width={48} height={48} />
                  <span className={styles.upiName}>{app.name}</span>
                </div>
              ))}
            </div>
            <div className={styles.otherUpiWrap}>
              <button className={styles.otherUpiBtn} onClick={() => setShowOtherUpi(!showOtherUpi)}>
                <img src={upiLogo} alt="UPI" className={styles.upiLabelImg} width={28} height={28} />
                Pay with other UPI apps
                <FiChevronRight className={`${styles.chevron} ${showOtherUpi ? styles.chevronOpen : ""}`} />
              </button>
              {showOtherUpi && (
                <div className={styles.otherUpiList}>
                  {OTHER_UPI_APPS.map((app) => (
                    <button key={app._id} className={styles.otherUpiItem} onClick={() => { setShowOtherUpi(false); handleUpiAppPay(app); }}>
                      <span className={styles.otherUpiLeft}>
                        <img src={app.logo} alt={app.name} className={styles.otherUpiIconImg} width={32} height={32} />
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
                {m.logo
                  ? <img src={m.logo} alt={m.name} className={styles.methodIconImg} width={32} height={32} />
                  : <span className={styles.methodIcon} style={{ background: m.color }}>{m.icon}</span>
                }
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
              const p = item?.productId || item?.product || item;
              const title = p?.title || p?.name || "Product";
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
              <span>GST</span>
              <span>₹{gst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {discount > 0 && (
              <div className={`${styles.priceRow} ${styles.priceDiscount}`}>
                <span>Coupon Discount</span>
                <span>− ₹{discount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className={`${styles.priceRow} ${styles.priceTotal}`}>
              <span>Total Amount</span>
              <span>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <p className={styles.gstNote}>*All prices are inclusive of applicable GST</p>
          </div>

          {chosenAddress && (
            <div className={styles.addressBox}>
              <h3 className={styles.addressBoxTitle}>Delivery Address</h3>
              <p className={styles.addressBoxText}>
                {chosenAddress.name && <strong>{chosenAddress.name}{chosenAddress.type ? ` (${chosenAddress.type})` : ""}: </strong>}
                {!chosenAddress.name && chosenAddress.type && <strong>{chosenAddress.type}: </strong>}
                {chosenAddress.addressLine1 || chosenAddress.address || chosenAddress.line1}
                {(chosenAddress.addressLine2 || chosenAddress.line2) ? `, ${chosenAddress.addressLine2 || chosenAddress.line2}` : ""}
                {chosenAddress.landmark ? `, ${chosenAddress.landmark}` : ""}
                {(chosenAddress.pincode || chosenAddress.pin) ? ` - ${chosenAddress.pincode || chosenAddress.pin}` : ""}
                {chosenAddress.city ? `, ${chosenAddress.city}` : ""}
                {chosenAddress.state ? `, ${chosenAddress.state}` : ""}
              </p>
              <button className={styles.changeAddrBtn} onClick={() => setShowAddress(true)}>Change</button>
            </div>
          )}

          {!chosenAddress && (
            <div className={styles.addressBox}>
              <h3 className={styles.addressBoxTitle}>Delivery Address</h3>
              <p className={styles.addressBoxText} style={{ color: "#999" }}>No address selected</p>
              <button className={styles.changeAddrBtn} onClick={() => setShowAddress(true)}>Select Address</button>
            </div>
          )}

          <h2 className={styles.sectionTitleCenter}>APPLY COUPON</h2>
          <div className={styles.couponRow}>
            <input type="text" placeholder="Enter Coupon Code" className={styles.couponInput} value={coupon} onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponError(""); }} disabled={!!couponData} />
            {couponData ? (
              <button className={styles.removeBtn} onClick={handleRemoveCoupon}>Remove</button>
            ) : (
              <button className={styles.applyBtn} onClick={handleApplyCoupon} disabled={isCouponLoading}>
                {isCouponLoading ? "Applying..." : "Apply"}
              </button>
            )}
          </div>
          {couponError && <p className={styles.couponError}>{couponError}</p>}
          {couponData && (
            <p className={styles.couponSuccess}>
              🎉 Coupon applied — you save ₹{discount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}

          <div className={styles.securedBox}>
            <p className={styles.securedText}>Secured by <strong>Trusted Indian Banks</strong> ✅</p>
            <button className={styles.payBtn} onClick={handleProceedToPay} disabled={isProcessing || !isLoaded}>
              {isProcessing ? "Processing..." : `Pay ₹ ${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} `}
            </button>
          </div>
        </div>
      </div>

      {/* ── Address Selection Modal ── */}
      {showAddress && (
        <div className={detailStyles.overlay} onClick={() => setShowAddress(false)}>
          <div className={detailStyles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={detailStyles.modalClose} onClick={() => setShowAddress(false)} aria-label="Close"><FiX /></button>
            <h2 className={detailStyles.modalTitle}>SELECT ADDRESS</h2>
            <div className={detailStyles.addressList}>
              {addressLoading && <p style={{ textAlign: "center", color: "#999", padding: "16px 0" }}>Loading addresses...</p>}
              {!addressLoading && addressList.length === 0 && <p style={{ textAlign: "center", color: "#aaa", padding: "16px 0" }}>No saved addresses</p>}
              {!addressLoading && addressList.map((a) => {
                const addrId = a._id || a.id;
                const addrType = a.type || "home";
                return (
                  <div key={addrId} className={`${detailStyles.addressCard} ${selectedAddress === addrId ? detailStyles.addressActive : ""}`} onClick={() => setSelectedAddress(addrId)} style={{ cursor: "pointer" }}>
                    <span className={detailStyles.addressIcon}>{addrType === "home" ? <FiHome /> : <FiBriefcase />}</span>
                    <div className={detailStyles.addressInfo}>
                      <span className={detailStyles.addressType}>{a.name || addrType}{a.phone ? ` · ${a.phone}` : ""}</span>
                      <p className={detailStyles.addressText}>{[a.addressLine1, a.addressLine2, a.landmark].filter(Boolean).join(", ")}<br />{[a.city, a.state, a.pincode].filter(Boolean).join(", ")}</p>
                    </div>
                    <button className={detailStyles.reviewActionBtn} onClick={(e) => { e.stopPropagation(); openEditAddress(a); }} aria-label="Edit address"><FiEdit2 size={14} /></button>
                    <button className={detailStyles.reviewActionBtn} onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addrId); }} aria-label="Delete address"><FiTrash2 size={14} /></button>
                    <input type="radio" name="address" checked={selectedAddress === addrId} readOnly className={detailStyles.addressRadio} />
                  </div>
                );
              })}
            </div>
            <div className={detailStyles.modalActions}>
              <button className={detailStyles.addAddressBtn} onClick={() => { setShowAddress(false); setEditingAddress(null); setNewAddr({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", landmark: "", type: "home", country: "IN" }); setShowNewAddress(true); }}>Add New Address +</button>
              <button className={detailStyles.orderBtn} disabled={!selectedAddress} onClick={() => {
                const chosen = addressList.find((a) => (a._id || a.id) === selectedAddress);
                setChosenAddress(chosen);
                setShowAddress(false);
              }}>Order Here</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Address Modal ── */}
      {showNewAddress && (
        <div className={detailStyles.overlay} onClick={() => setShowNewAddress(false)}>
          <div className={`${detailStyles.modal} ${detailStyles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <button className={detailStyles.modalClose} onClick={() => setShowNewAddress(false)} aria-label="Close"><FiX /></button>
            <h2 className={detailStyles.modalTitle}>{editingAddress ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}</h2>
            <div className={detailStyles.formRow}>
              <div className={detailStyles.formGroup}><label className={detailStyles.formLabel}>Name *</label><input type="text" placeholder="Full name" className={`${detailStyles.formInput} ${addrErrors.name ? detailStyles.formInputError : ""}`} value={newAddr.name} onChange={(e) => { setNewAddr({ ...newAddr, name: e.target.value }); setAddrErrors({ ...addrErrors, name: "" }); }} />{addrErrors.name && <p className={detailStyles.formError}>{addrErrors.name}</p>}</div>
              <div className={detailStyles.formGroup}><label className={detailStyles.formLabel}>Phone *</label><input type="tel" placeholder="Phone number" maxLength={10} className={`${detailStyles.formInput} ${addrErrors.phone ? detailStyles.formInputError : ""}`} value={newAddr.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setNewAddr({ ...newAddr, phone: v }); setAddrErrors({ ...addrErrors, phone: "" }); }} />{addrErrors.phone && <p className={detailStyles.formError}>{addrErrors.phone}</p>}</div>
            </div>
            <div className={detailStyles.formGroup}><label className={detailStyles.formLabel}>Address line 1 *</label><input type="text" placeholder="Enter here" className={`${detailStyles.formInput} ${addrErrors.addressLine1 ? detailStyles.formInputError : ""}`} value={newAddr.addressLine1} onChange={(e) => { setNewAddr({ ...newAddr, addressLine1: e.target.value }); setAddrErrors({ ...addrErrors, addressLine1: "" }); }} />{addrErrors.addressLine1 && <p className={detailStyles.formError}>{addrErrors.addressLine1}</p>}</div>
            <div className={detailStyles.formGroup}><label className={detailStyles.formLabel}>Address line 2</label><input type="text" placeholder="Enter here" className={detailStyles.formInput} value={newAddr.addressLine2} onChange={(e) => setNewAddr({ ...newAddr, addressLine2: e.target.value })} /></div>
            <div className={detailStyles.formRow}>
              <div className={detailStyles.formGroup}><label className={detailStyles.formLabel}>Pincode *</label><input type="text" placeholder="Enter here" maxLength={6} className={`${detailStyles.formInput} ${addrErrors.pincode ? detailStyles.formInputError : ""}`} value={newAddr.pincode} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setNewAddr({ ...newAddr, pincode: v }); setAddrErrors({ ...addrErrors, pincode: "" }); }} />{addrErrors.pincode && <p className={detailStyles.formError}>{addrErrors.pincode}</p>}</div>
              <div className={detailStyles.formGroup}><label className={detailStyles.formLabel}>City *</label><input type="text" placeholder="Enter here" className={`${detailStyles.formInput} ${addrErrors.city ? detailStyles.formInputError : ""}`} value={newAddr.city} onChange={(e) => { setNewAddr({ ...newAddr, city: e.target.value }); setAddrErrors({ ...addrErrors, city: "" }); }} />{addrErrors.city && <p className={detailStyles.formError}>{addrErrors.city}</p>}</div>
              <div className={detailStyles.formGroup}><label className={detailStyles.formLabel}>State *</label><input type="text" placeholder="Type here" className={`${detailStyles.formInput} ${addrErrors.state ? detailStyles.formInputError : ""}`} value={newAddr.state} onChange={(e) => { setNewAddr({ ...newAddr, state: e.target.value }); setAddrErrors({ ...addrErrors, state: "" }); }} />{addrErrors.state && <p className={detailStyles.formError}>{addrErrors.state}</p>}</div>
            </div>
            <div className={detailStyles.formGroup}><label className={detailStyles.formLabel}>Landmark</label><input type="text" placeholder="Near..." className={detailStyles.formInput} value={newAddr.landmark} onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })} /></div>
            <div className={detailStyles.saveAsGroup}><span className={detailStyles.saveAsLabel}>Save Address as</span><div className={detailStyles.saveAsTags}><button className={`${detailStyles.saveAsTag} ${newAddr.type === "home" ? detailStyles.saveAsActive : ""}`} onClick={() => setNewAddr({ ...newAddr, type: "home" })}>Home</button><button className={`${detailStyles.saveAsTag} ${newAddr.type === "work" ? detailStyles.saveAsActive : ""}`} onClick={() => setNewAddr({ ...newAddr, type: "work" })}>Work</button></div></div>
            <button className={detailStyles.saveAddressBtn} onClick={handleAddAddress} disabled={isAddingAddress || isUpdatingAddress}>{(isAddingAddress || isUpdatingAddress) ? "Saving..." : (editingAddress ? "Update Address ›" : "Save Address ›")}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EPoojaCheckout;