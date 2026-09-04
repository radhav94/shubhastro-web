/**
 * =========================================================
 * SHUBHASTRO BRANCH EVENTS TRACKING
 * =========================================================
 *
 * Centralized event tracking for all app branches and flows.
 * All events are tracked to:
 * 1. Branch.io via window.trackBranchEvent()
 * 2. GTM and GA4 via trackEvent()
 *
 * Every event tracks:
 * - user_id
 * - timestamp
 * - app_version
 * - device_type
 * - plus custom parameters passed in
 *
 * Usage Example:
 *   import { BranchEvents } from "../utils/branchEvents";
 *   
 *   BranchEvents.trackLandingPageOpen();
 *   BranchEvents.trackOtpSent({ phone: "+91XXXXXXXXXX" });
 *   BranchEvents.trackConsultationStarted({ astrologer_id: "123", duration: 30 });
 *
 * =========================================================
 */

import { trackEvent } from "./analytics";

/**
 * Track event to Branch.io directly via window.trackBranchEvent
 * All Branch events must route through this single function
 */
const trackToBranch = (eventName, eventData = {}) => {
  try {
    if (typeof window !== "undefined" && typeof window.trackBranchEvent === "function") {
      // Use the common window.trackBranchEvent function
      window.trackBranchEvent(eventName, eventData);
    } else if (IS_DEV) {
      console.warn("[BranchEvents] window.trackBranchEvent not available for event:", eventName);
    }
  } catch (error) {
    if (IS_DEV) console.error("[BranchEvents] Failed to track to Branch:", error);
  }
};

const IS_DEV = import.meta.env.DEV;

/**
 * Log event to console in development mode
 * @private
 */
const logEvent = (eventName, params = {}) => {
  if (IS_DEV) {
    console.log(
      `[BranchEvents] ${eventName}`,
      Object.keys(params).length > 0 ? params : ""
    );
  }
};

/**
 * =========================================================
 * ONBOARDING & AUTHENTICATION EVENTS
 * =========================================================
 */

export const BranchEvents = {
  /**
   * Landing Page / App Open
   * Tracked when user first opens the app or landing page
   */
  trackLandingPageOpen: (params = {}) => {
    const eventParams = {
      event_category: "onboarding",
      event_type: "landing_page_open",
      page_name: params.page_name || "Home",
      route_name: params.route_name || null,
      route_path: params.route_path || window.location.pathname,
      page_url: window.location.href,
      referrer: document.referrer || null,
      user_type: params.user_type || "guest",
      user_id: params.user_id || null,
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("landing_page_open", eventParams);
    trackToBranch("Landing Page", eventParams);
    trackEvent("landing_page_open", eventParams);
  },

  /**
   * Signup Started
   * Tracked when user initiates the signup process
   */
  trackSignupStarted: (params = {}) => {
    const eventParams = {
      event_category: "onboarding",
      event_type: "signup_started",
      page_name: params.page_name || "Signup",
      route_name: params.route_name || "signup",
      route_path: params.route_path || window.location.pathname,
      user_type: "guest",
      signup_method: params.signup_method || null,
      source: params.source || "direct",
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("signup_started", eventParams);
    trackToBranch("Signup Started", eventParams);
    trackEvent("signup_started", eventParams);
  },

  /**
   * OTP Sent
   * Tracked when OTP is sent to user
   * @param {Object} params - { phone: string, method: "sms"|"email"|"whatsapp" }
   */
  trackOtpSent: (params = {}) => {
    const eventParams = {
      event_category: "onboarding",
      event_type: "otp_sent",
      page_name: params.page_name || "OTP",
      route_name: params.route_name || "verify-otp",
      route_path: params.route_path || window.location.pathname,
      user_type: "guest",
      otp_channel: params.otp_channel || params.method || "sms",
      signup_method: params.signup_method || "phone",
      success: true,
      phone: params.phone || null,
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("otp_sent", eventParams);
    trackToBranch("OTP Sent", eventParams);
    trackEvent("otp_sent", eventParams);
  },

  /**
   * OTP Verified
   * Tracked when user successfully verifies OTP
   * @param {Object} params - { phone: string, verification_time_ms: number }
   */
  trackOtpVerified: (params = {}) => {
    const eventParams = {
      event_category: "onboarding",
      event_type: "otp_verified",
      page_name: params.page_name || "OTP",
      route_name: params.route_name || "verify-otp",
      route_path: params.route_path || window.location.pathname,
      user_type: "guest",
      verification_method: params.verification_method || "sms",
      success: true,
      phone: params.phone || null,
      verification_time_ms: params.verification_time_ms || 0,
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("otp_verified", eventParams);
    trackToBranch("OTP Verified", eventParams);
    trackEvent("otp_verified", eventParams);
  },

  /**
   * Registration Completed
   * Tracked when user completes account registration
   * @param {Object} params - { user_id: string, signup_method: string }
   */
  trackRegistrationCompleted: (params = {}) => {
    const eventParams = {
      event_category: "onboarding",
      event_type: "registration_completed",
      page_name: params.page_name || "Registration",
      route_name: params.route_name || "signup",
      route_path: params.route_path || window.location.pathname,
      user_type: "logged_in",
      registration_method: params.registration_method || params.signup_method || "phone",
      user_id: params.user_id || null,
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("registration_completed", eventParams);
    trackToBranch("Registration Completed", eventParams);
    trackEvent("registration_completed", eventParams);
  },

  /**
   * Profile Completed
   * Tracked when user completes their profile setup
   * @param {Object} params - { user_id: string, profile_fields: string[] }
   */
  trackProfileCompleted: (params = {}) => {
    const eventParams = {
      event_category: "onboarding",
      event_type: "profile_completed",
      page_name: params.page_name || "Profile",
      route_name: params.route_name || "profile",
      route_path: params.route_path || window.location.pathname,
      user_type: "logged_in",
      user_id: params.user_id || null,
      profile_completion_status: "completed",
      birth_date_provided: params.birth_date_provided || false,
      location_provided: params.location_provided || false,
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("profile_completed", eventParams);
    trackToBranch("Profile Completed", eventParams);
    trackEvent("profile_completed", eventParams);
  },

  /**
   * Promo Eligible
   * Tracked when user becomes eligible for a promo/offer
   * @param {Object} params - { promo_code: string, promo_type: string, value: number }
   */
  trackPromoEligible: (params = {}) => {
    const eventParams = {
      event_category: "promotion",
      event_type: "promo_eligible",
      page_name: params.page_name || "Promo",
      route_name: params.route_name || null,
      route_path: params.route_path || window.location.pathname,
      user_type: params.user_type || "logged_in",
      user_id: params.user_id || null,
      promo_id: params.promo_id || null,
      promo_type: params.promo_type || "standard",
      eligibility_status: true,
      promo_value: params.promo_value || 0,
      currency: params.currency || "INR",
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("promo_eligible", eventParams);
    trackToBranch("Promo Eligible", eventParams);
    trackEvent("promo_eligible", eventParams);
  },

  /**
   * Promo Credited
   * Tracked when user receives promo credit/wallet balance
   * @param {Object} params - { promo_code: string, amount: number, reason: string }
   */
  trackPromoCredited: (params = {}) => {
    const eventParams = {
      event_category: "promotion",
      event_type: "promo_credited",
      page_name: params.page_name || "Promo",
      route_name: params.route_name || null,
      route_path: params.route_path || window.location.pathname,
      user_type: params.user_type || "logged_in",
      user_id: params.user_id || null,
      promo_id: params.promo_id || null,
      promo_type: params.promo_type || "standard",
      credit_status: "success",
      promo_amount: params.promo_amount || 0,
      currency: params.currency || "INR",
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("promo_credited", eventParams);
    trackToBranch("Promo Credited", eventParams);
    trackEvent("promo_credited", eventParams);
  },

  /**
   * =========================================================
   * ASTROLOGER & CONSULTATION EVENTS
   * =========================================================
   */

  /**
   * Astrologer Listing Viewed
   * Tracked when user views the list of available astrologers
   * @param {Object} params - { filter_type: string, result_count: number }
   */
  trackAstrologerListingViewed: (params = {}) => {
    const eventParams = {
      event_category: "astrologer_discovery",
      event_type: "astrologer_listing_viewed",
      page_name: params.page_name || "Astrologers",
      route_name: params.route_name || "astrologers",
      route_path: params.route_path || window.location.pathname,
      user_type: params.user_type || "logged_in",
      user_id: params.user_id || null,
      listing_type: params.listing_type || "all",
      category: params.category || null,
      filter: params.filter || null,
      sort_by: params.sort_by || "rating",
      result_count: params.result_count || 0,
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("astrologer_listing_viewed", eventParams);
    trackToBranch("Astrologer Listing Viewed", eventParams);
    trackEvent("astrologer_listing_viewed", eventParams);
  },

  /**
   * Astrologer Profile Viewed
   * Tracked when user views a specific astrologer's profile
   * @param {Object} params - { astrologer_id: string, specialization: string }
   */
  trackAstrologerProfileViewed: (params = {}) => {
    const eventParams = {
      event_category: "astrologer_discovery",
      event_type: "astrologer_profile_viewed",
      page_name: params.page_name || "Astrologer Profile",
      route_name: params.route_name || "astrologer-detail",
      route_path: params.route_path || window.location.pathname,
      user_type: params.user_type || "logged_in",
      user_id: params.user_id || null,
      astrologer_id: params.astrologer_id || null,
      astrologer_name: params.astrologer_name || null,
      category: params.category || "general",
      source: params.source || "listing",
      rating: params.rating || 0,
      experience_years: params.experience_years || 0,
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("astrologer_profile_viewed", eventParams);
    trackToBranch("Astrologer Profile Viewed", eventParams);
    trackEvent("astrologer_profile_viewed", eventParams);
  },

  /**
   * Wallet Screen Viewed
   * Tracked when user opens the wallet/balance screen
   * @param {Object} params - { current_balance: number, screen_source: string }
   */
  trackWalletScreenViewed: (params = {}) => {
    const eventParams = {
      event_category: "wallet",
      event_type: "wallet_screen_viewed",
      page_name: params.page_name || "Wallet",
      route_name: params.route_name || "wallet",
      route_path: params.route_path || window.location.pathname,
      user_type: "logged_in",
      user_id: params.user_id || null,
      source: params.source || "menu",
      current_balance: params.current_balance || 0,
      currency: params.currency || "INR",
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("wallet_screen_viewed", eventParams);
    trackToBranch("Wallet Screen Viewed", eventParams);
    trackEvent("wallet_screen_viewed", eventParams);
  },

  /**
   * Recharge Pack Selected
   * Tracked when user selects a recharge pack
   * @param {Object} params - { pack_id: string, amount: number, pack_name: string }
   */
  trackRechargePackSelected: (params = {}) => {
    const eventParams = {
      event_category: "wallet",
      event_type: "recharge_pack_selected",
      page_name: params.page_name || "Recharge",
      route_name: params.route_name || "recharge",
      route_path: params.route_path || window.location.pathname,
      user_type: "logged_in",
      user_id: params.user_id || null,
      pack_id: params.pack_id || null,
      pack_name: params.pack_name || "standard",
      amount: params.amount || 0,
      currency: params.currency || "INR",
      source: params.source || "wallet",
      includes_bonus: params.includes_bonus || false,
      bonus_amount: params.bonus_amount || 0,
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("recharge_pack_selected", eventParams);
    trackToBranch("Recharge Pack Selected", eventParams);
    trackEvent("recharge_pack_selected", eventParams);
  },

  /**
   * Actual Wallet Recharge Initiated
   * Tracked when user initiates payment for wallet recharge
   * @param {Object} params - { amount: number, payment_method: string, pack_id: string }
   */
  trackWalletRechargeInitiated: (params = {}) => {
    const eventParams = {
      event_category: "wallet",
      event_type: "wallet_recharge_initiated",
      page_name: params.page_name || "Payment",
      route_name: params.route_name || "payment",
      route_path: params.route_path || window.location.pathname,
      user_type: "logged_in",
      user_id: params.user_id || null,
      pack_id: params.pack_id || null,
      pack_name: params.pack_name || null,
      amount: params.amount || 0,
      currency: params.currency || "INR",
      payment_method: params.payment_method || "card",
      transaction_id: params.transaction_id || null,
      order_id: params.order_id || null,
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("wallet_recharge_initiated", eventParams);
    trackToBranch("Actual Wallet Recharge Initiated", eventParams);
    trackEvent("wallet_recharge_initiated", eventParams);
  },

  /**
   * Actual Wallet Recharge Successful
   * Tracked when wallet recharge payment is successful
   * @param {Object} params - { amount: number, transaction_id: string, pack_id: string }
   */
  trackWalletRechargeSuccessful: (params = {}) => {
    const eventParams = {
      event_category: "wallet",
      event_type: "wallet_recharge_successful",
      page_name: params.page_name || "Payment Success",
      route_name: params.route_name || "payment",
      route_path: params.route_path || window.location.pathname,
      user_type: "logged_in",
      user_id: params.user_id || null,
      pack_id: params.pack_id || null,
      pack_name: params.pack_name || null,
      amount: params.amount || 0,
      currency: params.currency || "INR",
      payment_method: params.payment_method || "card",
      transaction_id: params.transaction_id || null,
      order_id: params.order_id || null,
      payment_status: "success",
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("wallet_recharge_successful", eventParams);
    trackToBranch("Actual Wallet Recharge Successful", eventParams);
    trackEvent("wallet_recharge_successful", eventParams);
  },

  /**
   * Consultation Started
   * Tracked when a consultation (chat/call) begins
   * @param {Object} params - { astrologer_id: string, consultation_type: string, duration: number }
   */
  trackConsultationStarted: (params = {}) => {
    const eventParams = {
      event_category: "consultation",
      event_type: "consultation_started",
      page_name: params.page_name || "Consultation",
      route_name: params.route_name || "consultation",
      route_path: params.route_path || window.location.pathname,
      user_type: "logged_in",
      user_id: params.user_id || null,
      astrologer_id: params.astrologer_id || null,
      astrologer_name: params.astrologer_name || null,
      consultation_id: params.consultation_id || null,
      consultation_type: params.consultation_type || "chat",
      source: params.source || "listing",
      duration_minutes: params.duration_minutes || 0,
      cost: params.cost || 0,
      currency: params.currency || "INR",
      order_id: params.order_id || null,
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("consultation_started", eventParams);
    trackToBranch("Consultation Started", eventParams);
    trackEvent("consultation_started", eventParams);
  },

  /**
   * Consultation Completed
   * Tracked when a consultation ends
   * @param {Object} params - { astrologer_id: string, consultation_type: string, actual_duration: number }
   */
  trackConsultationCompleted: (params = {}) => {
    const eventParams = {
      event_category: "consultation",
      event_type: "consultation_completed",
      page_name: params.page_name || "Consultation End",
      route_name: params.route_name || "consultation",
      route_path: params.route_path || window.location.pathname,
      user_type: "logged_in",
      user_id: params.user_id || null,
      astrologer_id: params.astrologer_id || null,
      astrologer_name: params.astrologer_name || null,
      consultation_id: params.consultation_id || null,
      consultation_type: params.consultation_type || "chat",
      actual_duration_minutes: params.actual_duration_minutes || 0,
      scheduled_duration_minutes: params.scheduled_duration_minutes || 0,
      cost: params.cost || 0,
      currency: params.currency || "INR",
      order_id: params.order_id || null,
      completion_status: "completed",
      rating: params.rating || 0,
      review_provided: params.review_provided || false,
      platform: params.platform || "web",
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("consultation_completed", eventParams);
    trackToBranch("Consultation Completed", eventParams);
    trackEvent("consultation_completed", eventParams);
  },
};

/**
 * Test event - use this to verify events are being tracked
 * @param {string} testName - Name of the test
 * @param {Object} params - Custom test parameters
 */
export const trackTestEvent = (testName = "test_event", params = {}) => {
  console.log("🔥 trackTestEvent CALLED");

  const eventParams = {
    event_category: "test",
    event_type: "test_event",
    test_name: testName,
    test_timestamp: new Date().toISOString(),
    ...params,
  };

  console.log("🔥 eventParams:", eventParams);

  logEvent(`TEST_EVENT: ${testName}`, eventParams);

  console.log("[BranchEvents] Before trackEvent");

  trackEvent("test_event", eventParams);

  console.log("[BranchEvents] After trackEvent");
};

export default BranchEvents;
