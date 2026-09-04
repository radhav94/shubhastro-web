import { useEffect, useState, useCallback, useRef } from "react";
import { useCreateOrderMutation, useVerifyPaymentMutation } from "../../redux/api/payment/paymentApi";
import { useLazyGetWalletBalanceQuery } from "../../redux/api/wallet/walletApi";
import Toast from "../../component/toast";
import { trackEvent } from "../analytics";
import { BranchEvents } from "../branchEvents";

// Constants
const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
const PAYMENT_TIMEOUT = 300000; // 5 minutes
const MIN_AMOUNT = 1; // Minimum amount in INR
const MAX_AMOUNT = 500000; // Maximum amount in INR

// Error messages
const ERROR_MESSAGES = {
  SCRIPT_LOAD_FAILED: "Failed to load payment gateway. Please refresh and try again.",
  INVALID_PLAN: "Invalid plan selected. Please try again.",
  INVALID_AMOUNT: "Invalid payment amount. Please contact support.",
  ORDER_CREATION_FAILED: "Failed to create order. Please try again.",
  PAYMENT_VERIFICATION_FAILED: "Payment verification failed. Please contact support.",
  RAZORPAY_NOT_LOADED: "Payment gateway not loaded. Please refresh the page.",
  MISSING_RAZORPAY_ORDER_ID: "Payment gateway not configured properly. Please contact support.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  TIMEOUT_ERROR: "Payment timeout. Please try again.",
  ALREADY_PROCESSING: "Payment already in progress. Please wait.",
};

/*
 * Analytics for the recharge funnel.
 *
 * Razorpay is the only gateway, and the specific instrument (UPI, card, net
 * banking) is chosen inside Razorpay's own checkout, which we cannot observe
 * from here — so every event in this file reports the gateway as the method.
 */
const PAYMENT_METHOD = "razorpay";

/**
 * Recharge amount in rupees, taken from the plan the user chose.
 *
 * The success and failure events used to read `response?.amount`, but Razorpay's
 * handler payload contains only razorpay_payment_id / razorpay_order_id /
 * razorpay_signature — never an amount — so `amount` was always undefined on
 * every recharge_payment_completed. Mirrors the expression in
 * validatePaymentInputs and the checkout description.
 *
 * @param {Record<string, unknown>} [planData]
 * @returns {number|undefined}
 */
const getPlanAmount = (planData) => {
  const amount = Number(planData?.actualPrice ?? planData?.totalPrice ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
};

/**
 * Custom hook for Razorpay payment integration
 * Handles payment flow with comprehensive error handling and edge cases
 * 
 * @returns {Object} Payment hook interface
 */
export const useRazorpayPayment = () => {
  // State management
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptError, setScriptError] = useState(null);

  // Refs for cleanup and timeout management
  const razorpayInstanceRef = useRef(null);
  const timeoutRef = useRef(null);
  const isUnmountedRef = useRef(false);
  // The script tag this hook instance is listening to, so its listeners can be
  // detached on unmount even after a retry replaced the original element.
  const scriptElRef = useRef(null);
  const orderStatusUpdatedRef = useRef(false); // Track if order status already updated

  // RTK Query mutations
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  const [verifyPayment, { isLoading: isVerifyingPayment }] = useVerifyPaymentMutation();
  const [getWalletBalance] = useLazyGetWalletBalanceQuery();

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      clearPaymentTimeout();
      closeRazorpayModal();
    };
  }, []);

  /**
   * Handle script load success
   */
  const handleScriptLoad = useCallback(() => {
    if (!isUnmountedRef.current) {
      setIsLoaded(true);
      setScriptError(null);
      const script = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
      if (script) script.dataset.loaded = "true";
    }
  }, []);

  /**
   * Handle script load error
   */
  const handleScriptError = useCallback(() => {
    /*
     * Mark the tag as failed even if this hook instance has unmounted.
     *
     * A script element that has errored never fires `load` again, but it stays in
     * the DOM — so without this marker the "script already exists" branch in
     * attemptScriptLoad would attach listeners to a dead tag and wait forever.
     * That is what made a failed gateway load unrecoverable for the rest of the
     * page's life, with a refresh as the only way out.
     */
    const script = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (script) script.dataset.failed = "true";

    if (!isUnmountedRef.current) {
      const error = ERROR_MESSAGES.SCRIPT_LOAD_FAILED;
      setScriptError(error);
      setIsLoaded(false);
      console.error("[Razorpay] Script load failed");
      Toast.error(error);
    }
  }, []);

  /*
   * Injects the checkout script, and can be called again to retry.
   *
   * Defined after the two handlers on purpose: naming them in the dependency
   * array before their `const` initialisers run would throw a TDZ
   * ReferenceError during render.
   *
   * `force` is the retry path — it discards a previously failed tag before
   * re-injecting, which is the part that makes a retry actually possible.
   * Third-party script loads are exactly what fails in the Facebook/Instagram
   * in-app browsers a large share of this traffic arrives in, and a recharge that
   * cannot be retried is a dead end on the revenue path.
   */
  const attemptScriptLoad = useCallback((force = false) => {
    if (window.Razorpay) {
      setIsLoaded(true);
      setScriptError(null);
      return;
    }

    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        setIsLoaded(true);
        setScriptError(null);
        return;
      }
      const alreadyFailed = existingScript.dataset.failed === "true";
      if (!force && !alreadyFailed) {
        // Still in flight from another mount — just listen for its outcome.
        existingScript.addEventListener("load", handleScriptLoad);
        existingScript.addEventListener("error", handleScriptError);
        scriptElRef.current = existingScript;
        return;
      }
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.dataset.loaded = "false";
    script.addEventListener("load", handleScriptLoad);
    script.addEventListener("error", handleScriptError);
    scriptElRef.current = script;
    document.body.appendChild(script);
  }, [handleScriptLoad, handleScriptError]);

  /**
   * Load Razorpay script dynamically
   */
  useEffect(() => {
    attemptScriptLoad();
    return () => {
      const script = scriptElRef.current;
      if (script) {
        script.removeEventListener("load", handleScriptLoad);
        script.removeEventListener("error", handleScriptError);
      }
    };
  }, [attemptScriptLoad, handleScriptLoad, handleScriptError]);

  /**
   * Retry a failed gateway script load. Exposed so the payment UI can offer a
   * real retry instead of only explaining that the gateway is unavailable.
   */
  const retryScriptLoad = useCallback(() => {
    setScriptError(null);
    setIsLoaded(false);
    attemptScriptLoad(true);
  }, [attemptScriptLoad]);

  /**
   * Clear payment timeout
   */
  const clearPaymentTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Close Razorpay modal if open
   */
  const closeRazorpayModal = useCallback(() => {
    if (razorpayInstanceRef.current) {
      try {
        razorpayInstanceRef.current.close();
      } catch (error) {
        console.error("[Razorpay] Error closing modal:", error);
      }
      razorpayInstanceRef.current = null;
    }
  }, []);

  /**
   * Validate payment inputs
   */
  const validatePaymentInputs = useCallback(({ planId, planData }) => {
    if (!planId || typeof planId !== "string") {
      throw new Error(ERROR_MESSAGES.INVALID_PLAN);
    }

    if (!planData || typeof planData !== "object") {
      throw new Error(ERROR_MESSAGES.INVALID_PLAN);
    }

    const amount = planData.actualPrice || planData.totalPrice || 0;
    
    if (!amount || typeof amount !== "number" || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      throw new Error(ERROR_MESSAGES.INVALID_AMOUNT);
    }

    return true;
  }, []);

  /**
   * Create order on backend
   */
  const createPaymentOrder = useCallback(async (planId, planData) => {
    // Amount the user intends to recharge, mirrored from the plan the same way
    // the success/failure events read it, so create-order events are directly
    // comparable to the rest of the funnel.
    const intendedAmount = getPlanAmount(planData);

    // Start of the create-order step — lets GA measure the drop-off between
    // "user committed to pay" and "order actually created", which nothing
    // reported before.
    trackEvent("order_create_initiated", {
      amount: intendedAmount,
      payment_method: PAYMENT_METHOD,
    });

    try {
      const orderPayload = {
        planId,
        paymentGateway: "RAZORPAY",
        device: "web",
        country: "INDIA",
      };

      const orderResponse = await createOrder(orderPayload).unwrap();
      
      // Validate response structure
      if (!orderResponse?.data?.order) {
        throw new Error(ERROR_MESSAGES.ORDER_CREATION_FAILED);
      }

      const orderData = orderResponse.data.order;

      // Check for Razorpay order ID
      if (!orderData.order_ID) {
        console.error("[Razorpay] Missing order_ID in response:", orderData);
        throw new Error(ERROR_MESSAGES.MISSING_RAZORPAY_ORDER_ID);
      }

      /*
        The gateway order id that Razorpay's checkout actually needs as
        `order_id`.

        This guard used to check only `order_ID` above, while
        createRazorpayOptions passed `orderData.gatewayOrderId` — a different
        field that nothing validated. When the payload does not carry it, the
        checkout was opened with `order_id: undefined`: the sheet renders, the
        card and UPI fields appear, and the payment cannot be completed. From the
        user's side that is a checkout whose inputs do nothing.

        Resolved with the same fallbacks the ShubhMall checkout already uses
        (EPoojaCheckout / AstromallCart), so the two paths agree on where this
        value can live.
      */
      const gatewayOrderId =
        orderData.gatewayOrderId ||
        orderData.razorpay_order_id ||
        null;

      if (!gatewayOrderId) {
        console.error(
          "[Razorpay] No gatewayOrderId/razorpay_order_id in order response — " +
            "checkout cannot be completed without it:",
          orderData
        );
        throw new Error(ERROR_MESSAGES.MISSING_RAZORPAY_ORDER_ID);
      }

      // Validate order data
      const amount = orderData.totalPrice || orderData.orderAmt;
      if (!amount || amount < MIN_AMOUNT) {
        throw new Error(ERROR_MESSAGES.INVALID_AMOUNT);
      }

      // Order successfully created and validated — the previously implicit
      // "create-order succeeded" signal (only inferable from
      // payment_gateway_opened) is now explicit.
      trackEvent("order_created", {
        amount: intendedAmount ?? amount,
        payment_method: PAYMENT_METHOD,
      });

      return {
        orderId: orderData.order_ID, // Razorpay order ID
        backendOrderId: orderData._id || orderData.id, // Backend order ID for verification
        gatewayOrderId, // Passed to Razorpay as `order_id`
        amount,
        currency: orderData.currency || "INR",
        orderData,
      };
    } catch (error) {
      // Order creation failed before checkout could open. Previously this only
      // surfaced as a Toast in initiatePayment's catch, so failed orders were
      // invisible in GA. Reported as payment_failed with an explicit reason so
      // it stays separable from gateway/checkout failures.
      const reason =
        error?.data?.message || error?.message || ERROR_MESSAGES.ORDER_CREATION_FAILED;
      trackEvent("payment_failed", {
        amount: intendedAmount,
        payment_method: PAYMENT_METHOD,
        reason,
        stage: "order_create",
      });

      // Handle RTK Query errors
      if (error?.status === "FETCH_ERROR") {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
      
      if (error?.data?.message) {
        throw new Error(error.data.message);
      }

      throw error;
    }
  }, [createOrder]);

  /**
   * Update order status on backend
   */
  const updateOrderStatus = useCallback(async (backendOrderId, planId, status) => {
    try {
      const verifyPayload = {
        orderId: String(backendOrderId),
        planId,
        orderStatus: status,
      };

      await verifyPayment(verifyPayload).unwrap();
      return true;
    } catch (error) {
      console.error(`[Razorpay] Order status update to '${status}' failed:`, error);
      
      if (error?.status === "FETCH_ERROR") {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }

      throw new Error(error?.data?.message || ERROR_MESSAGES.PAYMENT_VERIFICATION_FAILED);
    }
  }, [verifyPayment]);

  /**
   * Handle successful payment
   */
  const handlePaymentSuccess = useCallback(async (response, backendOrderId, planId, planData, onSuccess) => {
    try {
      clearPaymentTimeout();
      orderStatusUpdatedRef.current = true; // Mark as updated to prevent failure handlers

      // Step 1: Update order status to completed (backend will credit wallet)
      await updateOrderStatus(backendOrderId, planId, "completed");

      // Step 2: Refresh wallet balance
      //
      // The wallet is credited by the backend in step 1, so this refresh is also
      // the authoritative post-recharge figure — it is what feeds `new_balance`
      // on recharge_payment_completed. Unwrapped to read the payload; the shape
      // is `{ data: <number> }`, same as useWalletBalance consumes.
      let newBalance;
      try {
        const walletResult = await getWalletBalance().unwrap();
        const parsedBalance = Number(walletResult?.data);
        if (Number.isFinite(parsedBalance)) newBalance = parsedBalance;
      } catch (refreshError) {
        console.error("[Razorpay] Failed to refresh wallet balance:", refreshError);
        // Don't throw - wallet was credited by backend, just refresh failed.
        // new_balance stays undefined rather than reporting a wrong number.
      }

      // Step 3: Show success message
      Toast.success("Payment successful! Wallet credited.");

      const amount = getPlanAmount(planData);
      trackEvent("payment_completed", { amount, transaction_id: response?.razorpay_payment_id, payment_method: PAYMENT_METHOD });
      trackEvent("recharge_payment_completed", {
        amount,
        payment_method: PAYMENT_METHOD,
        new_balance: newBalance,
      });

      // Track Wallet Recharge Successful event
      BranchEvents.trackWalletRechargeSuccessful({
        page_name: "Payment Success",
        route_name: "recharge-payment",
        route_path: window.location.pathname,
        user_type: "logged_in",
        user_id: localStorage.getItem("shubhtalk_customer_id"),
        pack_id: planData?._id || null,
        pack_name: planData?.name || "standard",
        amount: amount,
        currency: "INR",
        payment_method: PAYMENT_METHOD,
        transaction_id: response?.razorpay_payment_id || null,
        order_id: backendOrderId || null,
        payment_status: "success",
      });

      // Step 4: Dispatch wallet update events
      window.dispatchEvent(new Event("wallet-updated"));
      window.dispatchEvent(new Event("walletBalanceUpdated"));

      // Step 5: Call success callback
      if (typeof onSuccess === "function") {
        onSuccess(response);
      }
    } catch (error) {
      console.error("[Razorpay] Post-payment processing failed:", error);
      Toast.error(error.message || ERROR_MESSAGES.PAYMENT_VERIFICATION_FAILED);
      
      // Still call failure callback even if verification fails
      throw error;
    }
  }, [updateOrderStatus, getWalletBalance, clearPaymentTimeout]);

  /**
   * Handle payment failure
   */
  // planData is threaded through purely so the failure events can report the
  // amount the user was trying to add — without it recharge_payment_failed had
  // no way to say how much the attempt was for.
  const handlePaymentFailure = useCallback(async (error, backendOrderId, planId, planData, onFailure) => {
    clearPaymentTimeout();
    closeRazorpayModal(); // Close the Razorpay window immediately
    
    // Prevent duplicate API calls
    if (orderStatusUpdatedRef.current) {
      console.log("[Razorpay] Order status already updated, skipping duplicate call");
      return;
    }
    
    orderStatusUpdatedRef.current = true;
    
    const errorMessage = error?.description || error?.message || "Payment failed";
    console.error("[Razorpay] Payment failed:", error);
    
    // Update order status to failed
    try {
      if (backendOrderId && planId) {
        await updateOrderStatus(backendOrderId, planId, "failure");
      }
    } catch (updateError) {
      console.error("[Razorpay] Failed to update order status to failed:", updateError);
      // Don't throw - we still want to show the payment error to user
    }
    
    Toast.error(errorMessage);

    const amount = getPlanAmount(planData);
    trackEvent("payment_failed", { amount, payment_method: PAYMENT_METHOD, error_code: error?.code, reason: errorMessage });
    trackEvent("recharge_payment_failed", { amount, payment_method: PAYMENT_METHOD, reason: errorMessage });

    if (typeof onFailure === "function") {
      onFailure(error);
    }
  }, [clearPaymentTimeout, closeRazorpayModal, updateOrderStatus]);

  /**
   * Handle payment cancellation
   */
  const handlePaymentDismiss = useCallback(async (backendOrderId, planId, onFailure) => {
    clearPaymentTimeout();
    closeRazorpayModal();
    
    // Prevent duplicate API calls
    if (orderStatusUpdatedRef.current) {
      console.log("[Razorpay] Order status already updated, skipping duplicate call");
      return;
    }
    
    orderStatusUpdatedRef.current = true;
    
    // Update order status to failed (user cancelled)
    try {
      if (backendOrderId && planId) {
        await updateOrderStatus(backendOrderId, planId, "failure");
      }
    } catch (updateError) {
      console.error("[Razorpay] Failed to update order status after cancellation:", updateError);
      // Don't throw - cancellation should still proceed
    }
    
    Toast.info("Payment cancelled");

    trackEvent("payment_cancelled", { payment_method: "razorpay" });

    if (typeof onFailure === "function") {
      onFailure({ cancelled: true });
    }
  }, [clearPaymentTimeout, closeRazorpayModal, updateOrderStatus]);

  /**
   * Get user prefill data
   */
  const getUserPrefillData = useCallback(() => {
    /*
      The logged-in user is persisted as a JSON object under `shubhtalk_user`
      (see utils/authStorage.js) with firstName/lastName/email/phoneNumber — the
      same `phoneNumber` field the TopBar and SideBar display. The old flat keys
      (shubhtalk_user_name/_email/_phone) were never written by any login path,
      so prefill.contact was always empty and Razorpay kept showing its own
      "Enter mobile number to continue" step. Read the real object first; keep
      the legacy keys only as a fallback.
    */
    let user = {};
    try {
      user = JSON.parse(localStorage.getItem("shubhtalk_user")) || {};
    } catch {
      user = {};
    }

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      localStorage.getItem("shubhtalk_user_name") ||
      "";

    const email = user.email || localStorage.getItem("shubhtalk_user_email") || "";

    /*
      Normalise to E.164 (+91XXXXXXXXXX). phoneNumber is stored variously as
      "91XXXXXXXXXX", "+91XXXXXXXXXX" or a bare 10-digit number. Razorpay only
      skips its contact-collection step when the number is complete with a
      country code, so we strip to the last 10 digits and prepend +91. Left
      empty when we have no number, so Razorpay falls back to asking.
    */
    const rawPhone = user.phoneNumber || localStorage.getItem("shubhtalk_user_phone") || "";
    const digits = String(rawPhone).replace(/\D/g, "");
    const tenDigit = digits.length >= 10 ? digits.slice(-10) : "";
    const contact = tenDigit ? `+91${tenDigit}` : "";

    return { name, email, contact };
  }, []);

  /**
   * Build the webhook callback URL with dynamic order params
   */
  const buildCallbackUrl = useCallback((backendOrderId, planId, returnUrl) => {
    const base = `${window.location.origin}/payment/webhook`;
    const params = new URLSearchParams();
    if (backendOrderId) params.set("orderId", String(backendOrderId));
    if (planId) params.set("planId", planId);
    if (returnUrl) params.set("returnUrl", returnUrl);
    return `${base}?${params.toString()}`;
  }, []);

  /**
   * Create Razorpay options
   */
  const createRazorpayOptions = useCallback((orderData, planData, handlers) => {
    const callbackUrl = buildCallbackUrl(
      orderData.backendOrderId,
      planData.planId || orderData.orderData?.planId,
      planData.returnUrl
    );

    return {
      key: RAZORPAY_KEY_ID,
      amount: orderData.amount * 100, // Convert to paise
      currency: orderData.currency,
      name: "ShubhAstro",
      description: `Wallet Recharge - ₹${planData.actualPrice || orderData.amount}`,
      image: `${window.location.origin}/images/mobile-shubh-astro-logo.png`,
      // Resolved and validated in createPaymentOrder, so it is always a real id
      // by the time we get here — never `order_id: undefined`.
      order_id: orderData.gatewayOrderId,
      // NOTE: callback_url removed — using handler only for reliable cross-platform support.
      // callback_url causes Android UPI intent flows to not redirect back properly.
      handler: handlers.onSuccess,
      prefill: getUserPrefillData(),
      theme: {
        color: "#FF6B35",
      },
      modal: {
        ondismiss: handlers.onDismiss,
        confirm_close: true,
        escape: false,
        backdropclose: false,
      },
      retry: {
        enabled: false, // Disable retry to prevent retrying failed payments
      },
      timeout: PAYMENT_TIMEOUT / 1000, // Convert to seconds
    };
  }, [getUserPrefillData, buildCallbackUrl]);

  /**
   * Open Razorpay checkout
   */
  const openRazorpayCheckout = useCallback((options, backendOrderId, planId, planData, onFailure) => {
    if (!window.Razorpay) {
      throw new Error(ERROR_MESSAGES.RAZORPAY_NOT_LOADED);
    }

    try {
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstanceRef.current = razorpayInstance;

      // Handle payment failure event - close modal immediately
      razorpayInstance.on("payment.failed", (response) => {
        // Close the Razorpay modal immediately on failure
        try {
          razorpayInstance.close();
        } catch (closeError) {
          console.error("[Razorpay] Error closing modal on failure:", closeError);
        }
        
        handlePaymentFailure(response.error, backendOrderId, planId, planData, onFailure);
      });

      // Set payment timeout
      timeoutRef.current = setTimeout(() => {
        // Prevent duplicate API calls
        if (orderStatusUpdatedRef.current) {
          console.log("[Razorpay] Order status already updated, skipping timeout call");
          return;
        }
        
        closeRazorpayModal();
        orderStatusUpdatedRef.current = true;
        Toast.error(ERROR_MESSAGES.TIMEOUT_ERROR);
        
        // Update order status to failed on timeout
        if (backendOrderId && planId) {
          updateOrderStatus(backendOrderId, planId, "failure").catch(err => {
            console.error("[Razorpay] Failed to update order status after timeout:", err);
          });
        }

        // This branch marks the order as "failure" on the backend but used to
        // emit nothing, so GA under-counted failures against the backend by
        // however many checkouts were left open past the timeout. Reported with
        // an explicit reason so timeouts stay separable from gateway declines.
        trackEvent("recharge_payment_failed", {
          amount: getPlanAmount(planData),
          payment_method: PAYMENT_METHOD,
          reason: ERROR_MESSAGES.TIMEOUT_ERROR,
        });

        if (typeof onFailure === "function") {
          onFailure({ timeout: true });
        }
      }, PAYMENT_TIMEOUT);

      // Open modal
      razorpayInstance.open();
      trackEvent("payment_gateway_opened", { gateway: "razorpay", amount: options?.amount ? options.amount / 100 : undefined });
    } catch (error) {
      console.error("[Razorpay] Error opening checkout:", error);
      throw error;
    }
  }, [handlePaymentFailure, closeRazorpayModal, updateOrderStatus]);

  /**
   * Main payment initiation function
   */
  const initiatePayment = useCallback(async ({ planId, planData, onSuccess, onFailure }) => {
    // Prevent multiple simultaneous payments
    if (isProcessing) {
      Toast.warning(ERROR_MESSAGES.ALREADY_PROCESSING);
      return;
    }

    // Check if Razorpay is loaded
    if (!isLoaded || scriptError) {
      Toast.error(scriptError || ERROR_MESSAGES.RAZORPAY_NOT_LOADED);
      return;
    }

    // Check if key is configured
    if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID === "rzp_xxxx_xxxxxx") {
      console.error("[Razorpay] API key not configured");
      Toast.error("Payment gateway not configured. Please contact support.");
      return;
    }

    try {
      setIsProcessing(true);
      orderStatusUpdatedRef.current = false; // Reset flag for new payment

      // Step 1: Validate inputs
      validatePaymentInputs({ planId, planData });

      // Step 2: Create order on backend
      const orderData = await createPaymentOrder(planId, planData);

      // Step 3: Create Razorpay options
      const razorpayOptions = createRazorpayOptions(
        orderData,
        planData,
        {
          onSuccess: async (response) => {
            try {
              await handlePaymentSuccess(response, orderData.orderId, planId, planData, onSuccess);
            } catch (error) {
              if (typeof onFailure === "function") {
                onFailure(error);
              }
            } finally {
              setIsProcessing(false);
            }
          },
          onDismiss: () => {
            handlePaymentDismiss(orderData.orderId, planId, onFailure);
            setIsProcessing(false);
          },
        }
      );

      // Step 4: Open Razorpay checkout
      openRazorpayCheckout(razorpayOptions, orderData.orderId, planId, planData, onFailure);

    } catch (error) {
      console.error("[Razorpay] Payment initiation failed:", error);
      
      const errorMessage = error?.message || ERROR_MESSAGES.ORDER_CREATION_FAILED;
      Toast.error(errorMessage);

      if (typeof onFailure === "function") {
        onFailure(error);
      }

      setIsProcessing(false);
    }
  }, [
    isProcessing,
    isLoaded,
    scriptError,
    validatePaymentInputs,
    createPaymentOrder,
    createRazorpayOptions,
    openRazorpayCheckout,
    handlePaymentSuccess,
    handlePaymentDismiss,
  ]);

  return {
    initiatePayment,
    isProcessing: isProcessing || isCreatingOrder || isVerifyingPayment,
    isLoaded,
    scriptError,
    // Lets the payment UI offer a working retry when the gateway script fails,
    // rather than only reporting that it is unavailable.
    retryScriptLoad,
  };
};
