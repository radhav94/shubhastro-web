/**
 * =========================================================
 * SHUBHASTRO BRANCH EVENTS TRACKING
 * =========================================================
 *
 * Centralized event tracking for all app branches and flows.
 * All events are logged to GTM and GA4 via trackEvent.
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
      ...params,
    };
    logEvent("landing_page_open", eventParams);
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
      ...params,
    };
    logEvent("signup_started", eventParams);
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
      phone: params.phone || "unknown",
      method: params.method || "sms",
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("otp_sent", eventParams);
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
      phone: params.phone || "unknown",
      verification_time_ms: params.verification_time_ms || 0,
      ...params,
    };
    logEvent("otp_verified", eventParams);
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
      user_id: params.user_id || "unknown",
      signup_method: params.signup_method || "phone",
      ...params,
    };
    logEvent("registration_completed", eventParams);
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
      user_id: params.user_id || "unknown",
      profile_fields: params.profile_fields || [],
      birth_date_provided: params.birth_date_provided || false,
      location_provided: params.location_provided || false,
      ...params,
    };
    logEvent("profile_completed", eventParams);
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
      promo_code: params.promo_code || "unknown",
      promo_type: params.promo_type || "standard",
      promo_value: params.promo_value || 0,
      currency: params.currency || "INR",
      ...params,
    };
    logEvent("promo_eligible", eventParams);
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
      promo_code: params.promo_code || "unknown",
      amount: params.amount || 0,
      currency: params.currency || "INR",
      reason: params.reason || "signup_bonus",
      ...params,
    };
    logEvent("promo_credited", eventParams);
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
      filter_type: params.filter_type || "all",
      result_count: params.result_count || 0,
      sort_by: params.sort_by || "rating",
      ...params,
    };
    logEvent("astrologer_listing_viewed", eventParams);
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
      astrologer_id: params.astrologer_id || "unknown",
      astrologer_name: params.astrologer_name || "unknown",
      specialization: params.specialization || "general",
      rating: params.rating || 0,
      experience_years: params.experience_years || 0,
      ...params,
    };
    logEvent("astrologer_profile_viewed", eventParams);
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
      current_balance: params.current_balance || 0,
      currency: params.currency || "INR",
      screen_source: params.screen_source || "menu",
      ...params,
    };
    logEvent("wallet_screen_viewed", eventParams);
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
      pack_id: params.pack_id || "unknown",
      pack_name: params.pack_name || "standard",
      amount: params.amount || 0,
      currency: params.currency || "INR",
      includes_bonus: params.includes_bonus || false,
      bonus_amount: params.bonus_amount || 0,
      ...params,
    };
    logEvent("recharge_pack_selected", eventParams);
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
      amount: params.amount || 0,
      currency: params.currency || "INR",
      payment_method: params.payment_method || "card",
      pack_id: params.pack_id || "unknown",
      order_id: params.order_id || "unknown",
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("wallet_recharge_initiated", eventParams);
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
      amount: params.amount || 0,
      currency: params.currency || "INR",
      transaction_id: params.transaction_id || "unknown",
      order_id: params.order_id || "unknown",
      pack_id: params.pack_id || "unknown",
      payment_method: params.payment_method || "card",
      payment_status: "success",
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("wallet_recharge_successful", eventParams);
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
      astrologer_id: params.astrologer_id || "unknown",
      astrologer_name: params.astrologer_name || "unknown",
      consultation_type: params.consultation_type || "chat", // "chat", "voice", "video"
      duration_minutes: params.duration_minutes || 0,
      cost: params.cost || 0,
      currency: params.currency || "INR",
      order_id: params.order_id || "unknown",
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("consultation_started", eventParams);
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
      astrologer_id: params.astrologer_id || "unknown",
      astrologer_name: params.astrologer_name || "unknown",
      consultation_type: params.consultation_type || "chat",
      actual_duration_minutes: params.actual_duration_minutes || 0,
      scheduled_duration_minutes: params.scheduled_duration_minutes || 0,
      cost: params.cost || 0,
      currency: params.currency || "INR",
      order_id: params.order_id || "unknown",
      rating: params.rating || 0,
      review_provided: params.review_provided || false,
      timestamp: new Date().toISOString(),
      ...params,
    };
    logEvent("consultation_completed", eventParams);
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
