import { useState, useRef, useEffect, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import styles from "./Onboarding.module.scss";
import { PATH } from "../../../utils/routes/Paths";
import {
  verifyOtp,
  loginWithPhone,
} from "../../../services/appServices/authService";
import { loginSuccess, setEmail } from "../../../redux/auth/authSlice";
import { requestFCMToken } from "../../../services/firebase";
import { privateRequestNew } from "../../../services/appServices/privateRequestNew";
import { clearSelectedKundli } from "../../../redux/kundli/kundliSlice";
import { clearGuestKundliProfiles } from "../../../utils/helper/cookies";
import { getDeviceInfo, getDeviceType } from "../../../utils/deviceInfo";
import { trackEvent } from "../../../utils/analytics";
// import onboardingBg from "../../../assets/images/onboarding.png";
import onboardingBg from "../../../assets/images/new-login-bg-2.jpeg";
// import onboardingBgMobile from "../../../assets/images/login-mobile-bg.png";
import LanguageSelector from "../../../component/LanguageSelector";
import BackButton from "../../../component/UI/BackButton/BackButton";

// Isolated timer component — its state changes won't re-render the OTP inputs
const ResendTimer = memo(({ onResend }) => {
  const [timer, setTimer] = useState(20);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const handleClick = () => {
    if (timer === 0) {
      onResend();
      setTimer(20);
    }
  };

  return (
    <div className={styles.resendContainer}>
      <span className={styles.resendText}>Didn't get it?</span>
      <button
        className={styles.resendBtn}
        onClick={handleClick}
        disabled={timer > 0}
      >
        {timer > 0 ? `Resend in ${timer}s` : "Resend"}
      </button>
    </div>
  );
});
const OTPScreen = ({ onNext, onBack, formData, updateFormData }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const handleContinueRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const inputRef = useRef(null);
  // Holds the AbortController for the in-flight OTP verification so it can be
  // cancelled if the user requests a new OTP mid-request.
  const verifyAbortRef = useRef(null);

  // Prevent iOS Safari from scrolling page when keyboard opens
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = '0px';

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, []);

  // Web OTP API - auto-read OTP from SMS
  useEffect(() => {
    if ("OTPCredential" in window) {
      const ac = new AbortController();
      navigator.credentials
        .get({ otp: { transport: ["sms"] }, signal: ac.signal })
        .then((otpCredential) => {
          if (otpCredential?.code) {
            setOtp(otpCredential.code);
            // Auto-submit is handled by the otp length useEffect below
          }
        })
        .catch(() => {});
      return () => ac.abort();
    }
  }, []);



  const handleContinue = async () => {
    const otpValue = otp;

    /*
      Say what is missing, and put the keyboard back. The OTP boxes are divs over
      a hidden input, so on mobile a lost focus means no keyboard and no way to
      finish the code — refocusing here is the actual recovery action.

      This branch used to not exist: `if (length === 6)` with no else, behind a
      `disabled` button. An incomplete code meant the tap was swallowed and
      nothing was said, which is where this flow was being abandoned.
    */
    if (otpValue.length !== 6) {
      toast.error(
        otpValue.length === 0
          ? "Enter the 6-digit code we sent you"
          : `Enter all 6 digits — ${6 - otpValue.length} to go`
      );
      inputRef.current?.focus();
      return;
    }

    if (loading || isSubmittingRef.current) {
      toast.error("Verifying your code. One moment.");
      return;
    }

    {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setLoading(true);
      trackEvent("otp_entered", { mobile_number: formData.phoneNumber });
      try {
        const fcmTokens = await requestFCMToken();

        const payload = {
          otp: otpValue,
          phoneNumber: `91${formData.phoneNumber}`,
          type: "CUSTOMER",
          deviceInfo: getDeviceInfo(),
          ...(fcmTokens && { fcmTokens, deviceType: getDeviceType() }),
        };

        const controller = new AbortController();
        verifyAbortRef.current = controller;
        const response = await verifyOtp(payload, { signal: controller.signal });

        if (response.data.success && response.data.statusCode === 200) {
          // Store tokens and user data
          const { data: userData } = response.data;
          const accessToken = userData.accessToken;
          const refreshToken = userData.refreshToken;
          trackEvent("otp_verified_success", { user_id: userData._id, mobile_number: formData.phoneNumber });

          // Set role FIRST before setting tokens
          localStorage.setItem("shubhtalk_role", "CUSTOMER");

          // Store with keys that TopBar expects
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("shubhtalk_customer_token", accessToken);
          localStorage.setItem("shubhtalk_customer_id", userData._id); // Add customer ID
          localStorage.setItem("userData", JSON.stringify(userData));

          // Store user in the format that getUserFromStorage expects
          const userForStorage = {
            id: userData._id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phoneNumber: userData.phoneNumber,
            place: userData.place,
            role: userData.role,
            languagePreferences: userData.languagePreferences || [],
            accessToken: accessToken,
            refreshToken: refreshToken,
            email: userData.email || "",
          };
          localStorage.setItem(
            "shubhtalk_user",
            JSON.stringify(userForStorage),
          );

          // Clear RTK Query cache on login to prevent showing previous user's data
          dispatch(privateRequestNew.util.resetApiState());
          
          // Clear any stale guest/previous user profile selection
          dispatch(clearSelectedKundli());
          localStorage.removeItem("selectedKundliProfile");

          // Remove all kundli profiles added while browsing as a guest
          clearGuestKundliProfiles();

          // Dispatch login action to Redux
          dispatch(
            loginSuccess({
              isRegister: userData?.isRegister,
              isVerified: userData?.isVerified,
              token: accessToken,
            }),
          );

          // Store email from backend if available
          if (userData?.email) {
            dispatch(setEmail(userData.email));
          }

          updateFormData({
            otp: otpValue,
            isVerified: true,
            userData: userData,
          });

          // Dismiss any lingering toasts (error toasts, OTP send toast, etc.)
          toast.dismiss();

          // Show backend success message
          toast.success(response.data.message || "User verified successfully");

          // Handle max device limit
          console.log("🔍 Checking device limit from backend response...");
          console.log("  max_device_reached:", userData.max_device_reached);
          console.log("  activeDevices:", userData.activeDevices?.length, "devices");
          console.log("  Full activeDevices data:", userData.activeDevices);
          
          if (userData.max_device_reached && userData.activeDevices?.length) {
            // Store in both session and localStorage
            // sessionStorage for immediate popup on login
            // localStorage for persistence across page refresh
            const deviceData = JSON.stringify(userData.activeDevices);
            console.log("📱 Device limit detected! Storing devices:", userData.activeDevices);
            sessionStorage.setItem("shubhtalk_device_limit_reached", deviceData);
            localStorage.setItem("shubhtalk_device_limit_reached", deviceData);
          } else {
            console.log("ℹ️ No device limit. max_device_reached:", userData.max_device_reached, "activeDevices:", userData.activeDevices?.length);
            // Clear any previous device limit data
            localStorage.removeItem("shubhtalk_device_limit_reached");
            sessionStorage.removeItem("shubhtalk_device_limit_reached");
          }

          // Check if user is already registered
          if (userData.isRegister) {
            trackEvent("login_success", { user_id: userData._id });
            // User is already registered, check for redirect path
            const redirectPath = localStorage.getItem(
              "shubhtalk_redirect_after_login",
            );
            
            // Also check if redirected from device logout
            const logoutRedirectPath = sessionStorage.getItem("shubhtalk_redirect_after_logout");
            
            console.log("🔍 OTPScreen - Checking redirect path after login");
            console.log("📍 Redirect path from localStorage:", redirectPath);
            console.log("📍 Logout redirect path from sessionStorage:", logoutRedirectPath);
            console.log(
              "📍 Current window location:",
              window.location.pathname,
            );

            if (logoutRedirectPath && logoutRedirectPath !== "/login") {
              // User was logged out and had a page to return to
              console.log("✅ Redirecting to page after device logout:", logoutRedirectPath);
              sessionStorage.removeItem("shubhtalk_redirect_after_logout");
              setTimeout(() => {
                navigate(logoutRedirectPath);
              }, 500);
            } else if (redirectPath && redirectPath !== "/login") {
              // Clear the redirect path
              localStorage.removeItem("shubhtalk_redirect_after_login");
              console.log("✅ Redirecting to saved path:", redirectPath);
              // toast.success("Welcome back!");
              setTimeout(() => {
                console.log("🚀 Executing navigate to:", redirectPath);
                navigate(redirectPath);
              }, 500);
            } else {
              // No redirect path, go to home
              console.log("ℹ️ No valid redirect path, going to home");
              console.log("📍 redirectPath value:", redirectPath);
              // toast.success("Welcome back!");
              setTimeout(() => {
                console.log("🚀 Executing navigate to home");
                navigate(location?.state?.from || PATH.privateRoutes.HOME.path,{ replace: true });
              }, 500);
            }
          } else {
            // New user, proceed to personalization
            // But first, check if device limit is reached
            if (userData.max_device_reached) {
              // Device limit reached, skip personalization and go to home
              // where the device limit popup will show
              console.log("📱 New user but device limit reached, skipping personalization");
              trackEvent("login_skipped_personalization_device_limit", { user_id: userData._id });
              setTimeout(() => {
                navigate(PATH.privateRoutes.HOME.path || "/", { replace: true });
              }, 500);
            } else {
              // No device limit, proceed to personalization
              console.log("👤 New user, proceeding to personalization");
              trackEvent("profile_creation_started", { user_id: userData._id });
              onNext();
            }
          }
        } else {
          trackEvent("otp_verified_failed", { mobile_number: formData.phoneNumber, error_reason: response.data.message || "invalid_otp" });
          toast.error(response.data.message || "Invalid OTP");
        }
      } catch (error) {
        // The user tapped "Resend OTP" while this request was still in flight.
        // The call was cancelled on purpose, so stop silently and let them
        // verify the freshly sent OTP.
        if (
          error.code === "ERR_CANCELED" ||
          error.name === "CanceledError" ||
          error.name === "AbortError" ||
          error.message === "canceled"
        ) {
          return;
        }
        console.error("OTP verification error:", error);
        trackEvent("otp_verified_failed", { mobile_number: formData.phoneNumber, error_reason: error.response?.data?.message || "verify_error" });
        toast.error(
          error.response?.data?.message ||
          "Failed to verify OTP. Please try again.",
        );
        // Clear OTP input on error
        setOtp("");
        // Focus first OTP input after clearing
        setTimeout(() => {
          const firstInput = document.querySelector(`.${styles.otpInputs} input`);
          firstInput?.focus();
        }, 50);
      } finally {
        setLoading(false);
        isSubmittingRef.current = false;
        verifyAbortRef.current = null;
      }
    }
  };

  // Keep ref updated for Web OTP auto-submit
  handleContinueRef.current = handleContinue;

  // Auto-submit when all 6 digits are filled (debounced to prevent flickering)
  const autoSubmitTimerRef = useRef(null);
  useEffect(() => {
    if (otp.length === 6 && !loading && !isSubmittingRef.current) {
      // Small delay to let the UI render the last digit before submitting
      autoSubmitTimerRef.current = setTimeout(() => {
        if (!isSubmittingRef.current) {
          handleContinueRef.current?.();
        }
      }, 400);
    }
    return () => {
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
      }
    };
  }, [otp]);

  const handleResend = async () => {
    // Cancel any in-flight verification
    if (verifyAbortRef.current) {
      verifyAbortRef.current.abort();
      verifyAbortRef.current = null;
    }
    setLoading(false);
    setOtp("");

    trackEvent("otp_resend_requested", { mobile_number: formData.phoneNumber });
    try {
      const payload = {
        phoneNumber: `91${formData.phoneNumber}`,
        type: "CUSTOMER",
      };

      const response = await loginWithPhone(payload);

      if (response.data.success && response.data.statusCode === 200) {
        toast.success("OTP resent successfully");
      } else {
        toast.error(response.data.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error(
        error.response?.data?.message ||
        "Failed to resend OTP. Please try again.",
      );
    }
  };

  return (
    <div className={styles.loginScreen}>
      {/* <div className={styles.loginBackground}>
        <img
          src={onboardingBg}
          alt="Astrology"
          className={styles.backgroundImage}
        />
        <img
          src={onboardingBgMobile}
          alt="Astrology"
          className={styles.backgroundImageMobile}
        />
      </div> */}

      {/* Back Button - top left corner */}
      <div className={styles.otpBackButtonWrap}>
        <BackButton/>
      </div>

      {/* Language Translator - top right corner */}
      {/* <LanguageSelector /> */}

      <div className={styles.loginContent}>
        <h1 className={styles.title}>Aligning your stars...</h1>
        <p className={styles.subtitle}>
          We've sent a 6-digit code to your mobile <br></br>+91{" "}
          {formData.phoneNumber || "98989 98989"}. Enter it below to continue.
        </p>

        <div className={styles.otpInputs} onClick={() => inputRef.current?.focus()}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`${styles.otpBox} ${otp.length === i ? styles.otpBoxActive : ''} ${otp[i] ? styles.otpBoxFilled : ''}`}
            >
              {otp[i] || ''}
            </div>
          ))}
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            className={styles.otpHiddenInput}
            value={otp}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
              setOtp(val);
            }}
            maxLength={6}
            autoFocus
          />
        </div>

        <ResendTimer onResend={handleResend} />
        {/*
          Never `disabled`. Unlike the resend button — whose label counts down
          and so explains itself — this one still read "Continue" while refusing
          to fire, so an incomplete or mis-autofilled code produced a tap that
          did nothing and explained nothing. handleContinue names the blocker.
        */}
        <button
          className={`${styles.otpprimaryBtn} ${
            otp.length !== 6 || loading ? styles.otpprimaryBtnBlocked : ""
          }`.trim()}
          onClick={handleContinue}
          aria-disabled={otp.length !== 6 || loading}
          aria-busy={loading}
        >
          {loading ? "Verifying..." : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default OTPScreen;
