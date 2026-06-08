import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import OtpInput from "react-otp-input";
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
import onboardingBg from "../../../assets/images/onboarding.png";
import onboardingBgMobile from "../../../assets/images/login-mobile-bg.png";
import LanguageSelector from "../../../component/LanguageSelector";

const OTPScreen = ({ onNext, onBack, formData, updateFormData }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(20);
  const [loading, setLoading] = useState(false);
  const handleContinueRef = useRef(null);

  // Web OTP API - auto-read OTP from SMS
  useEffect(() => {
    if ("OTPCredential" in window) {
      const ac = new AbortController();
      navigator.credentials
        .get({ otp: { transport: ["sms"] }, signal: ac.signal })
        .then((otpCredential) => {
          if (otpCredential?.code) {
            setOtp(otpCredential.code);
            // Auto-submit after filling
            setTimeout(() => {
              handleContinueRef.current?.();
            }, 300);
          }
        })
        .catch(() => {});
      return () => ac.abort();
    }
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleContinue = async () => {
    const otpValue = otp;
    if (otpValue.length === 6) {
      setLoading(true);
      try {
        const fcmTokens = await requestFCMToken();

        const payload = {
          otp: otpValue,
          phoneNumber: `91${formData.phoneNumber}`,
          type: "CUSTOMER",
          ...(fcmTokens && { fcmTokens, deviceType: "web" }),
        };

        const response = await verifyOtp(payload);

        if (response.data.success && response.data.statusCode === 200) {
          toast.success(response.data.message || "User verified successfully");

          // Store tokens and user data
          const { data: userData } = response.data;
          const accessToken = userData.accessToken;
          const refreshToken = userData.refreshToken;

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

          // Check if user is already registered
          if (userData.isRegister) {
            // User is already registered, check for redirect path
            const redirectPath = localStorage.getItem(
              "shubhtalk_redirect_after_login",
            );
            console.log("🔍 OTPScreen - Checking redirect path after login");
            console.log("📍 Redirect path from localStorage:", redirectPath);
            console.log(
              "📍 Current window location:",
              window.location.pathname,
            );

            if (redirectPath && redirectPath !== "/login") {
              // Clear the redirect path
              localStorage.removeItem("shubhtalk_redirect_after_login");
              console.log("✅ Redirecting to saved path:", redirectPath);
              toast.success("Welcome back!");
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
            console.log("👤 New user, proceeding to personalization");
            onNext();
          }
        } else {
          toast.error(response.data.message || "Invalid OTP");
        }
      } catch (error) {
        console.error("OTP verification error:", error);
        toast.error(
          error.response?.data?.message ||
          "Failed to verify OTP. Please try again.",
        );
        // Clear OTP input on error
        setOtp("");
      } finally {
        setLoading(false);
      }
    }
  };

  // Keep ref updated for Web OTP auto-submit
  handleContinueRef.current = handleContinue;

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (otp.length === 6 && !loading) {
      handleContinue();
    }
  }, [otp]);

  const handleResend = async () => {
    if (resendTimer === 0) {
      try {
        const payload = {
          phoneNumber: `91${formData.phoneNumber}`,
          type: "CUSTOMER",
        };

        const response = await loginWithPhone(payload);

        if (response.data.success && response.data.statusCode === 200) {
          toast.success("OTP resent successfully");
          setResendTimer(20);
          setOtp("");
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
    }
  };

  return (
    <div className={styles.loginScreen}>
      <div className={styles.loginBackground}>
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
      </div>
      <button className={styles.backBtn} onClick={onBack}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Language Translator - top right corner */}
      <LanguageSelector />

      <div className={styles.loginContent}>
        <h1 className={styles.title}>Aligning your stars...</h1>
        <p className={styles.subtitle}>
          We've sent a 6-digit code to your mobile +91{" "}
          {formData.phoneNumber || "98989 98989"}. Enter it below to continue.
        </p>

        <div className={styles.otpInputs}>
          <OtpInput
            value={otp}
            onChange={setOtp}
            numInputs={6}
            shouldAutoFocus
            containerStyle={{ display: 'flex', gap: '12px', justifyContent: 'center' }}
            inputStyle={styles.otpInput}
            renderInput={(props) => (
              <input
                {...props}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
              />
            )}
          />
        </div>

        <div className={styles.resendContainer}>
          <span className={styles.resendText}>Didn't get it?</span>
          <button
            className={styles.resendBtn}
            onClick={handleResend}
            disabled={resendTimer > 0}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}seconds` : "Resend"}
          </button>
        </div>
        <button
          className={styles.otpprimaryBtn}
          onClick={handleContinue}
          disabled={otp.length !== 6 || loading}
        >
          {loading ? "Verifying..." : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default OTPScreen;
