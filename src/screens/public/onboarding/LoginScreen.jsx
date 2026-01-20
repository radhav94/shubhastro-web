import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./Onboarding.module.scss";
import { PATH } from "../../../utils/routes/Paths";
import { loginWithPhone } from "../../../services/appServices/authService";

const LoginScreen = ({ onNext, onBack, formData, updateFormData }) => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState(formData.phoneNumber || "");
  const [loading, setLoading] = useState(false);

  const handleGetOTP = async () => {
    if (phoneNumber.length >= 10) {
      setLoading(true);
      try {
        const payload = {
          phoneNumber: `91${phoneNumber}`,
          type: "CUSTOMER"
        };
        
        const response = await loginWithPhone(payload);
        
        if (response.data.success && response.data.statusCode === 200) {
          toast.success(response.data.message || "OTP sent successfully");
          updateFormData({ phoneNumber });
          onNext(); // Go to OTP screen
        } else {
          toast.error(response.data.message || "Failed to send OTP");
        }
      } catch (error) {
        console.error("Login error:", error);
        toast.error(error.response?.data?.message || "Failed to send OTP. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSkipAndProceed = () => {
    navigate(PATH.privateRoutes.HOME.path || "/");
  };

  return (
    <div className={styles.loginScreen}>
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

      <div className={styles.loginContent}>
        <h1 className={styles.loginTitle}>Begin your journey</h1>
        <p className={styles.loginSubtitle}>
          Personal, private and guided by authentic astrologers.
        </p>

        <div className={styles.phoneInputContainer}>
          <div className={styles.countryCode}>
            <img
              src="https://flagcdn.com/w40/in.png"
              alt="India"
              className={styles.flag}
            />
            <span>▼</span>
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter your Number"
            className={styles.phoneInput}
            maxLength={10}
          />
        </div>

        <button
          className={styles.primaryBtn}
          onClick={handleGetOTP}
          disabled={phoneNumber.length < 10 || loading}
        >
          {loading ? "Sending..." : "Get OTP"}
        </button>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <button className={styles.socialBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>

        <button className={styles.socialBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Sign in with Apple
        </button>

        <button className={styles.skipLink} onClick={handleSkipAndProceed}>
          Skip and Proceed
        </button>

        <p className={styles.terms}>
          By submitting, you agree to our{" "}
          <a href="/terms" className={styles.termsLink}>
            Terms & Conditions
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
