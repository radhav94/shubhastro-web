import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import styles from "./Onboarding.module.scss";
import { PATH } from "../../../utils/routes/Paths";
import { logout } from "../../../redux/auth/authSlice";
import { loginWithPhone } from "../../../services/appServices/authService";
import { trackEvent } from "../../../utils/analytics";
import useTruecallerLogin from "./useTruecallerLogin";
import TruecallerLogPanel from "./TruecallerLogPanel";
import { isTruecallerLogViewerEnabled } from "../../../utils/truecaller/truecallerLog";
import { resolvePostLoginRedirect } from "../../../utils/auth/completeCustomerLogin";
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
  // Focused when the CTA is tapped with an incomplete number, so the fix is
  // one keystroke away rather than a hunt back up the page.
  const phoneInputRef = useRef(null);

  /*
    Truecaller one-tap login. Only offered on Android browsers with a configured
    partner key (Truecaller's mobile-web verification supports Android only), so
    everywhere else this stays hidden and the OTP flow is the single path.
  */
  // Read once on mount: the flag is persisted, and re-reading on every render
  // would re-parse the query string for nothing.
  const [truecallerLogViewer] = useState(isTruecallerLogViewerEnabled);

  const {
    isSupported: isTruecallerAvailable,
    isBusy: truecallerBusy,
    unsupportedReason: truecallerUnsupportedReason,
    status: truecallerStatus,
    loginWithTruecaller,
  } = useTruecallerLogin({
    onLoggedIn: ({ isRegistered, deviceLimitReached }) => {
      // Registered users go to their intended destination. New users continue
      // into the onboarding wizard for profile setup — unless the device limit
      // popup needs to show, which only renders on Home.
      if (isRegistered || deviceLimitReached) {
        navigate(resolvePostLoginRedirect(PATH.privateRoutes.HOME.path), { replace: true });
      } else {
        updateFormData({ isVerified: true });
        onNext();
      }
    },
  });

  // Show device kicked message if redirected from interceptor
  useState(() => {
    const msg = sessionStorage.getItem("shubhtalk_device_kicked");
    if (msg) {
      sessionStorage.removeItem("shubhtalk_device_kicked");
      setTimeout(() => toast.error(msg), 300);
    }
  });

  const handleGetOTP = async () => {
    if (loading) return;

    // This was doubly silent: the button carried `disabled={phoneNumber.length < 10}`
    // so the browser swallowed the tap, and this function also wrapped its whole
    // body in the same check. Tapping the offer CTA with a partial number did
    // nothing whatsoever — at the final step of the signup funnel. Say what's
    // missing and put the cursor back in the field.
    if (phoneNumber.length < 10) {
      trackEvent("login_blocked", {
        blocker: "incomplete_mobile_number",
        digits_entered: phoneNumber.length,
      });
      toast.error(
        phoneNumber.length === 0
          ? "Enter your 10-digit mobile number to claim the bonus."
          : `Please enter all 10 digits — ${10 - phoneNumber.length} to go.`
      );
      phoneInputRef.current?.focus();
      return;
    }

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
        trackEvent("login_blocked", {
          blocker: "otp_send_failed",
          error_reason: response.data.message || "non_200_response",
        });
        toast.error(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Login error:", error);
      trackEvent("login_blocked", {
        blocker: "otp_send_failed",
        error_reason: error.response?.status
          ? `http_${error.response.status}`
          : error.message || "request_threw",
      });
      toast.error(
        error.response?.data?.message ||
          "Failed to send OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // The desktop-only phone mockup is a 360x540 screenshot of the app's own UI
  // sitting next to the form. It reads as live interface, so taps land on it and
  // nothing happens. Everything it depicts is behind the sign-in, so answer the
  // tap by pointing at the one control that unlocks it.
  const handleMockupClick = () => {
    toast("Enter your mobile number to open this.", { icon: "ℹ️" });
    phoneInputRef.current?.focus();
  };

  const handleSkipAndProceed = () => {
    dispatch(logout());
    localStorage.removeItem("shubhtalk_redirect_after_login");
    localStorage.removeItem("astro_wallet_balance");
    localStorage.removeItem("shubhtalk_user");
    localStorage.removeItem("shubhtalk_customer_token");
    localStorage.removeItem("shubhtalk_customer_id");
    localStorage.removeItem("selectedKundliProfile");

    /*
     * `replace`, not a push. /login is reached by a plain `navigate("/login")`
     * from ~10 call sites, so it sits in the history stack; pushing the homepage
     * on top of it left the dismissed login wall one Back press away, and a push
     * also truncates the forward entries, so it stayed one Back press away for
     * the rest of the session. Visitors skipped, pressed Back, landed on login,
     * skipped again — the loop shows up as repeated "Skip" plus quick back
     * clicks in session recordings. Replacing the entry means Skip consumes the
     * login screen, and Back returns to whatever they were doing before it.
     */
    navigate(PATH.privateRoutes.HOME.path || "/", { replace: true });
  };

  return (
    <div className={styles.newLoginPage}>
      {/* Main Content */}
      {/* <div className={styles.loginWrapScreen}> */}
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
            <span><b>10K+</b> Astrologers Online</span>
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
            {/*
              Fixed +91. The chevron that used to sit here advertised a country
              picker that does not exist — validation is Indian-format only and
              the backend prefixes "91" — so non-Indian visitors clicked it
              repeatedly and left. Explain on tap rather than imply a choice.
            */}
            <button
              type="button"
              className={styles.newCountryCode}
              onClick={() => toast("We currently support Indian (+91) mobile numbers only.", { icon: "ℹ️" })}
              title="Indian (+91) numbers only"
            >
              <img src="https://flagcdn.com/w40/in.png" alt="India" />
              <span>+91</span>
            </button>
            <input
              ref={phoneInputRef}
              type="tel"
              value={phoneNumber}
              autoFocus
              autoComplete="tel-national"
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
            type="button"
            className={`${styles.newClaimBtn} ${phoneNumber.length < 10 ? styles.newClaimBtnIncomplete : ""}`.trim()}
            onClick={handleGetOTP}
            aria-disabled={phoneNumber.length < 10}
            aria-busy={loading}
          >
            {loading ? "Sending..." : "Claim ₹250 Now"}
            {!loading && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* Truecaller one-tap — Android only, hidden elsewhere so the OTP
              flow stays the single visible path on unsupported devices. */}
          {isTruecallerAvailable && (
            <>
              <div className={styles.altLoginDivider}>
                <span>or</span>
              </div>
              <button
                type="button"
                className={styles.truecallerBtn}
                onClick={loginWithTruecaller}
                disabled={truecallerBusy}
                aria-busy={truecallerBusy}
              >
                <span className={styles.truecallerIcon} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z" />
                  </svg>
                </span>
                {truecallerBusy ? "Verifying with Truecaller..." : "Continue with Truecaller"}
              </button>
            </>
          )}

          {/*
            DEV only. The button has three independent gates (partner key, not
            iOS, is Android) and failing any of them just removes it from the
            DOM — which is impossible to diagnose on a phone, where there are no
            devtools and a dev server started before the env was set looks
            exactly like an unsupported device. Stripped from every production
            build by the `import.meta.env.DEV` guard.
          */}
          {(import.meta.env.DEV || truecallerLogViewer) && !isTruecallerAvailable && (
            <p className={styles.truecallerDevHint}>
              Truecaller hidden — {truecallerUnsupportedReason}
              {truecallerUnsupportedReason === "disabled"
                ? " (set VITE_TRUECALLER_ENABLED to \"true\", then restart the dev server)"
                : truecallerUnsupportedReason === "no_partner_key"
                  ? " (set VITE_TRUECALLER_PARTNER_KEY, then restart the dev server)"
                  : ` (UA: ${(navigator.userAgent || "").slice(0, 60)})`}
            </p>
          )}

          {/*
            Diagnostic log viewer. Off unless the tester opened `?tclog=1` once,
            so it never shows for a real user. Needed because this flow only runs
            on a deployed build on a physical Android phone — no devtools, and the
            page may be frozen by the OS while the Truecaller app is in front.
          */}
          {truecallerLogViewer && (
            <TruecallerLogPanel
              isSupported={isTruecallerAvailable}
              unsupportedReason={truecallerUnsupportedReason}
              status={truecallerStatus}
            />
          )}

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
          <button
            type="button"
            className={styles.phoneMockup}
            onClick={handleMockupClick}
            aria-label="Enter your mobile number to open the app"
          >
            <img
              src={loginMobile}
              alt="ShubhAstro App"
              loading="eager"
            />
          </button>
        </div>
        </div>
      {/* </div> */}

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
