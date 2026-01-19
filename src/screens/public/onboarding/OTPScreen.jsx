import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import styles from "./Onboarding.module.scss";
import { PATH } from "../../../utils/routes/Paths";
import { verifyOtp, loginWithPhone } from "../../../services/appServices/authService";
import { loginSuccess } from "../../../redux/auth/authSlice";

const OTPScreen = ({ onNext, onBack, formData, updateFormData }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(20);
  const [loading, setLoading] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleContinue = async () => {
    const otpValue = otp.join("");
    if (otpValue.length === 6) {
      setLoading(true);
      try {
        const payload = {
          otp: otpValue,
          phoneNumber: `91${formData.phoneNumber}`,
          type: "CUSTOMER"
        };
        
        const response = await verifyOtp(payload);
        
        if (response.data.success && response.data.statusCode === 200) {
          toast.success(response.data.message || "User verified successfully");
          
          // Store tokens and user data
          const { accessToken, refreshToken, data: userData } = response.data;
          
          // Store with keys that TopBar expects
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("shubhtalk_customer_token", accessToken); // For TopBar
          localStorage.setItem("shubhtalk_role", "CUSTOMER"); // For TopBar
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
          };
          localStorage.setItem("shubhtalk_user", JSON.stringify(userForStorage));
          
          // Dispatch login action to Redux
          dispatch(loginSuccess({ token: accessToken }));
          
          updateFormData({ 
            otp: otpValue,
            isVerified: true,
            userData: userData
          });
          
          // Check if user is already registered
          if (userData.isRegister) {
            // User is already registered, redirect to home
            toast.success("Welcome back!");
            setTimeout(() => {
              navigate(PATH.privateRoutes.HOME.path || "/");
            }, 500);
          } else {
            // New user, proceed to personalization
            onNext();
          }
        } else {
          toast.error(response.data.message || "Invalid OTP");
        }
      } catch (error) {
        console.error("OTP verification error:", error);
        toast.error(error.response?.data?.message || "Failed to verify OTP. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResend = async () => {
    if (resendTimer === 0) {
      try {
        const payload = {
          phoneNumber: `91${formData.phoneNumber}`,
          type: "CUSTOMER"
        };
        
        const response = await loginWithPhone(payload);
        
        if (response.data.success && response.data.statusCode === 200) {
          toast.success("OTP resent successfully");
          setResendTimer(20);
          setOtp(["", "", "", "", "", ""]);
          inputRefs[0].current.focus();
        } else {
          toast.error(response.data.message || "Failed to resend OTP");
        }
      } catch (error) {
        console.error("Resend OTP error:", error);
        toast.error(error.response?.data?.message || "Failed to resend OTP. Please try again.");
      }
    }
  };

  return (
    <div className={styles.otpScreen}>
      <button className={styles.otpbackBtn} onClick={onBack}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className={styles.content}>
        <h1 className={styles.title}>Aligning your stars...</h1>
        <p className={styles.subtitle}>
          We've sent a 6-digit code to your mobile +91 {formData.phoneNumber || "98989 98989"}. Enter it below to continue.
        </p>

        <div className={styles.otpInputs}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={styles.otpInput}
            />
          ))}
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
      </div>

      <button
        className={styles.otpprimaryBtn}
        onClick={handleContinue}
        disabled={otp.join("").length !== 6 || loading}
      >
        {loading ? "Verifying..." : "Continue"}
      </button>
    </div>
  );
};

export default OTPScreen;
