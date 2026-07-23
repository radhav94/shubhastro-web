import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import styles from "./Onboarding.module.scss";
import { PATH } from "../../../utils/routes/Paths";
import { logout } from "../../../redux/auth/authSlice";
import { loginWithPhone } from "../../../services/appServices/authService";
import { trackEvent } from "../../../utils/analytics";
import rsBox from "../../../assets/images/rs-box.png";
import loginMobile from "../../../assets/images/login-mobile.png";
import bGuid from "../../../assets/images/b-guidence.png";
import bAstrologer from "../../../assets/images/b-astrology.png";
import bAccurate from "../../../assets/images/b-prediction.png";
import bPrivate from "../../../assets/images/b-private.png";

const LoginScreen = ({ onNext, onBack, formData, updateFormData }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [phoneNumber, setPhoneNumber] = useState(formData.phoneNumber || "");
  const [loading, setLoading] = useState(false);

  const handleGetOTP = async () => {
    if (phoneNumber.length >= 10) {
      setLoading(true);
      trackEvent("mobile_number_entered", { mobile_number: phoneNumber, country_code: "91" });
      trackEvent("otp_requested", { mobile_number: phoneNumber });
      try {
        const payload = {
          phoneNumber: `91${phoneNumber}`,
          type: "CUSTOMER",
        };

        const response = await loginWithPhone(payload);

        if (response.data.success && response.data.statusCode === 200) {
          trackEvent("otp_sent", { mobile_number: phoneNumber, delivery_status: "success" });
          toast.success(response.data.message || "OTP sent successfully");
          updateFormData({ phoneNumber });
          onNext();
        } else {
          toast.error(response.data.message || "Failed to send OTP");
        }
      } catch (error) {
        console.error("Login error:", error);
        toast.error(
          error.response?.data?.message ||
            "Failed to send OTP. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSkipAndProceed = () => {
    dispatch(logout());
    localStorage.removeItem("shubhtalk_redirect_after_login");
    localStorage.removeItem("astro_wallet_balance");
    localStorage.removeItem("shubhtalk_user");
    localStorage.removeItem("shubhtalk_customer_token");
    localStorage.removeItem("shubhtalk_customer_id");
    localStorage.removeItem("selectedKundliProfile");
    navigate(PATH.privateRoutes.HOME.path || "/");
  };

  return (
    <div className={styles.newLoginPage}>
      {/* Main Content */}
      <div>
      <div className={styles.newLoginHero}>
        {/* Left Section */}
        <div className={styles.newLoginLeft}>
          {/* Online counter */}
          <div className={styles.onlineCounter}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#F75801" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="#F75801" strokeWidth="2"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#F75801" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#F75801" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span><b>10K+</b> Astrons Online</span>
          </div>

          {/* Offer Section */}
          <div className={styles.offerSection}>
            <div className={styles.giftBox}>
              <img
                src={rsBox}
                alt="Gift"
                loading="eager"
              />
            </div>
            <div className={styles.offerText}>
              <h1>
                <span className={styles.rupeeSymbol}>₹</span>250
              </h1>
              <p className={styles.rechargeLabel}>RECHARGE</p>
              <p className={styles.forNewSignups}>FOR NEW SIGN UPS</p>
            </div>
          </div>

          {/* Feature Badges */}
          <div className={styles.featureBadges}>
            <div className={styles.topLineStart}>
              <b className={styles.bLeft}></b>
              <span className={styles.starIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                  <path d="M14.25 6.75C12.056 4.55601 10.5 0 10.5 0C10.5 0 9.43472 4.25385 7.5 6.5C5.24008 9.1237 0 10 0 10C0 10 4.74008 10.8763 7 13.5C8.93472 15.7461 10.5 20 10.5 20C10.5 20 12.056 15.694 14.25 13.5C16.444 11.306 20.5 10 20.5 10C20.5 10 16.444 8.94398 14.25 6.75Z" fill="#F99A46"/>
                </svg>
              </span>
              <b className={styles.bRight}></b>
            </div>
            <div className={styles.featureBadge}>
              <div className={styles.badgeIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#F75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <strong>Enjoy AI</strong>
                <span>Features</span>
              </div>
            </div>
            <div className={styles.featureBadge}>
              <div className={styles.badgeIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="#F75801" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#F75801" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <strong>Private</strong>
                <span>Sessions</span>
              </div>
            </div>
          </div>

          {/* Phone Input */}
          <div className={styles.newPhoneInput}>
            <div className={styles.newCountryCode}>
              <img src="https://flagcdn.com/w40/in.png" alt="India" />
              <span>+91</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <input
              type="tel"
              value={phoneNumber}
              autoFocus
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && phoneNumber.length >= 10 && !loading) {
                  handleGetOTP();
                }
              }}
              placeholder="Enter mobile number"
              maxLength={10}
              inputMode="numeric"
            />
          </div>

          {/* CTA Button */}
          <button
            className={styles.newClaimBtn}
            onClick={handleGetOTP}
            disabled={phoneNumber.length < 10 || loading}
          >
            {loading ? "Sending..." : "Claim ₹250 Now"}
            {!loading && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* Security note */}
          <p className={styles.securityNote}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
              <path d="M22 4L12 14.01l-3-3" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            100% Secure | Your number is safe with us
          </p>

          {/* Skip */}
          <button className={styles.newSkipLink} onClick={handleSkipAndProceed}>
            Skip
          </button>

          {/* Terms */}
          <p className={styles.newTerms}>
            By submitting, you agree to our{" "}
            <Link to={PATH.privateRoutes.TERMS_CONDITIONS_VIEW.path}>
              Terms & Conditions
            </Link>
          </p>
        </div>

        {/* Right Section - Phone Mockup */}
        <div className={styles.newLoginRight}>
          <div className={styles.phoneMockup}>
            <img
              src={loginMobile}
              alt="ShubhAstro App"
              loading="eager"
            />
          </div>
        </div>
        </div>
      </div>

      {/* Bottom Trust Bar */}
      <div className={styles.trustBar}>
        <div className={styles.trustItem}>
          <div className={styles.trustIcon}>
            <img src={bGuid} alt="" />
          </div>
          <div>
            <strong>Personalized</strong>
            <span>Guidance</span>
          </div>
        </div>
        <div className={styles.trustItem}>
          <div className={styles.trustIcon}>
            <img src={bAstrologer} alt="" />
          </div>
          <div>
            <strong>Talk to Expert</strong>
            <span>Astrologers</span>
          </div>
        </div>
        <div className={styles.trustItem}>
          <div className={styles.trustIcon}>
            <img src={bAccurate} alt="" />
          </div>
          <div>
            <strong>Accurate</strong>
            <span>Predictions</span>
          </div>
        </div>
        <div className={styles.trustItem}>
          <div className={styles.trustIcon}>
            <img src={bPrivate} alt="" />
          </div>
          <div>
            <strong>100% Private</strong>
            <span>& Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
