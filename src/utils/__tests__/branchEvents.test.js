/**
 * =========================================================
 * BRANCH EVENTS TEST SUITE
 * =========================================================
 *
 * Tests for all branch events tracking.
 * Run with: npm run test -- branchEvents.test.js
 *
 * This verifies that all events are properly structured
 * and passed to the analytics tracking system.
 *
 * =========================================================
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { BranchEvents, trackTestEvent } from "../branchEvents";
import * as analyticsModule from "../analytics";

// Mock the analytics module
vi.mock("../analytics", () => ({
  trackEvent: vi.fn(),
}));

describe("BranchEvents - Onboarding & Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should track landing page open", () => {
    BranchEvents.trackLandingPageOpen();
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "landing_page_open",
      expect.objectContaining({
        event_category: "onboarding",
        event_type: "landing_page_open",
      })
    );
  });

  it("should track signup started with params", () => {
    BranchEvents.trackSignupStarted({ source: "landing_page" });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "signup_started",
      expect.objectContaining({
        event_category: "onboarding",
        event_type: "signup_started",
        source: "landing_page",
      })
    );
  });

  it("should track OTP sent with phone and method", () => {
    BranchEvents.trackOtpSent({
      phone: "+91-9876543210",
      method: "sms",
    });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "otp_sent",
      expect.objectContaining({
        event_category: "onboarding",
        event_type: "otp_sent",
        phone: "+91-9876543210",
        method: "sms",
      })
    );
  });

  it("should track OTP verified with phone and time", () => {
    BranchEvents.trackOtpVerified({
      phone: "+91-9876543210",
      verification_time_ms: 45000,
    });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "otp_verified",
      expect.objectContaining({
        event_category: "onboarding",
        event_type: "otp_verified",
        phone: "+91-9876543210",
        verification_time_ms: 45000,
      })
    );
  });

  it("should track registration completed with user_id", () => {
    BranchEvents.trackRegistrationCompleted({
      user_id: "user_12345",
      signup_method: "phone",
    });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "registration_completed",
      expect.objectContaining({
        event_category: "onboarding",
        event_type: "registration_completed",
        user_id: "user_12345",
        signup_method: "phone",
      })
    );
  });

  it("should track profile completed with profile fields", () => {
    BranchEvents.trackProfileCompleted({
      user_id: "user_12345",
      profile_fields: ["name", "birth_date", "location"],
      birth_date_provided: true,
      location_provided: true,
    });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "profile_completed",
      expect.objectContaining({
        event_category: "onboarding",
        event_type: "profile_completed",
        user_id: "user_12345",
        birth_date_provided: true,
        location_provided: true,
      })
    );
  });

  it("should track promo eligible with promo details", () => {
    BranchEvents.trackPromoEligible({
      promo_code: "PROMO123",
      promo_type: "signup_bonus",
      promo_value: 500,
      currency: "INR",
    });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "promo_eligible",
      expect.objectContaining({
        event_category: "promotion",
        event_type: "promo_eligible",
        promo_code: "PROMO123",
        promo_type: "signup_bonus",
        promo_value: 500,
        currency: "INR",
      })
    );
  });

  it("should track promo credited with amount and reason", () => {
    BranchEvents.trackPromoCredited({
      promo_code: "PROMO123",
      amount: 500,
      currency: "INR",
      reason: "signup_bonus",
    });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "promo_credited",
      expect.objectContaining({
        event_category: "promotion",
        event_type: "promo_credited",
        promo_code: "PROMO123",
        amount: 500,
        currency: "INR",
        reason: "signup_bonus",
      })
    );
  });
});

describe("BranchEvents - Astrologer & Consultation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should track astrologer listing viewed with filter", () => {
    BranchEvents.trackAstrologerListingViewed({
      filter_type: "specialization",
      result_count: 15,
      sort_by: "rating",
    });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "astrologer_listing_viewed",
      expect.objectContaining({
        event_category: "astrologer_discovery",
        event_type: "astrologer_listing_viewed",
        filter_type: "specialization",
        result_count: 15,
        sort_by: "rating",
      })
    );
  });

  it("should track astrologer profile viewed with details", () => {
    BranchEvents.trackAstrologerProfileViewed({
      astrologer_id: "ast_001",
      astrologer_name: "Dr. Sharma",
      specialization: "vedic_astrology",
      rating: 4.8,
      experience_years: 15,
    });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "astrologer_profile_viewed",
      expect.objectContaining({
        event_category: "astrologer_discovery",
        event_type: "astrologer_profile_viewed",
        astrologer_id: "ast_001",
        astrologer_name: "Dr. Sharma",
        specialization: "vedic_astrology",
        rating: 4.8,
        experience_years: 15,
      })
    );
  });

  it("should track wallet screen viewed with balance", () => {
    BranchEvents.trackWalletScreenViewed({
      current_balance: 2500,
      currency: "INR",
      screen_source: "menu",
    });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "wallet_screen_viewed",
      expect.objectContaining({
        event_category: "wallet",
        event_type: "wallet_screen_viewed",
        current_balance: 2500,
        currency: "INR",
        screen_source: "menu",
      })
    );
  });

  it("should track recharge pack selected with amount", () => {
    BranchEvents.trackRechargePackSelected({
      pack_id: "pack_500",
      pack_name: "Silver",
      amount: 500,
      currency: "INR",
      includes_bonus: true,
      bonus_amount: 100,
    });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "recharge_pack_selected",
      expect.objectContaining({
        event_category: "wallet",
        event_type: "recharge_pack_selected",
        pack_id: "pack_500",
        pack_name: "Silver",
        amount: 500,
        includes_bonus: true,
        bonus_amount: 100,
      })
    );
  });

  it("should track wallet recharge initiated with payment method", () => {
    BranchEvents.trackWalletRechargeInitiated({
      amount: 500,
      currency: "INR",
      payment_method: "credit_card",
      pack_id: "pack_500",
      order_id: "order_12345",
    });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "wallet_recharge_initiated",
      expect.objectContaining({
        event_category: "wallet",
        event_type: "wallet_recharge_initiated",
        amount: 500,
        payment_method: "credit_card",
        order_id: "order_12345",
      })
    );
  });

  it("should track wallet recharge successful with transaction", () => {
    BranchEvents.trackWalletRechargeSuccessful({
      amount: 500,
      currency: "INR",
      transaction_id: "txn_abc123",
      order_id: "order_12345",
      pack_id: "pack_500",
      payment_method: "credit_card",
    });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "wallet_recharge_successful",
      expect.objectContaining({
        event_category: "wallet",
        event_type: "wallet_recharge_successful",
        amount: 500,
        transaction_id: "txn_abc123",
        payment_status: "success",
      })
    );
  });

  it("should track consultation started with astrologer and type", () => {
    BranchEvents.trackConsultationStarted({
      astrologer_id: "ast_001",
      astrologer_name: "Dr. Sharma",
      consultation_type: "video",
      duration_minutes: 30,
      cost: 500,
      currency: "INR",
      order_id: "order_cons_123",
    });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "consultation_started",
      expect.objectContaining({
        event_category: "consultation",
        event_type: "consultation_started",
        astrologer_id: "ast_001",
        consultation_type: "video",
        duration_minutes: 30,
        cost: 500,
      })
    );
  });

  it("should track consultation completed with duration and rating", () => {
    BranchEvents.trackConsultationCompleted({
      astrologer_id: "ast_001",
      astrologer_name: "Dr. Sharma",
      consultation_type: "video",
      actual_duration_minutes: 28,
      scheduled_duration_minutes: 30,
      cost: 500,
      currency: "INR",
      order_id: "order_cons_123",
      rating: 5,
      review_provided: true,
    });
    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "consultation_completed",
      expect.objectContaining({
        event_category: "consultation",
        event_type: "consultation_completed",
        actual_duration_minutes: 28,
        scheduled_duration_minutes: 30,
        rating: 5,
        review_provided: true,
      })
    );
  });
});

describe("BranchEvents - Test Events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should track test event with custom parameters", () => {
    trackTestEvent("test_onboarding_flow", {
      test_step: "otp_verification",
      success: true,
    });

    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "test_event",
      expect.objectContaining({
        event_category: "test",
        event_type: "test_event",
        test_name: "test_onboarding_flow",
        test_step: "otp_verification",
        success: true,
      })
    );
  });

  it("should track generic test event", () => {
    trackTestEvent();

    expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
      "test_event",
      expect.objectContaining({
        event_category: "test",
        event_type: "test_event",
        test_name: "test_event",
      })
    );
  });
});

describe("BranchEvents - Event Structure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should include event_category in all events", () => {
    BranchEvents.trackLandingPageOpen();
    const call = analyticsModule.trackEvent.mock.calls[0];
    expect(call[1]).toHaveProperty("event_category");
  });

  it("should include event_type in all events", () => {
    BranchEvents.trackOtpSent({ phone: "+91-1234567890" });
    const call = analyticsModule.trackEvent.mock.calls[0];
    expect(call[1]).toHaveProperty("event_type");
  });

  it("should include timestamp in time-sensitive events", () => {
    BranchEvents.trackOtpSent({ phone: "+91-1234567890" });
    const call = analyticsModule.trackEvent.mock.calls[0];
    expect(call[1]).toHaveProperty("timestamp");
  });

  it("should preserve custom parameters", () => {
    const customParam = { custom_field: "custom_value", nested: { value: 123 } };
    BranchEvents.trackLandingPageOpen(customParam);
    const call = analyticsModule.trackEvent.mock.calls[0];
    expect(call[1]).toMatchObject(customParam);
  });
});
