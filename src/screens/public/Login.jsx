import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import LoginLayout from "../../layouts/loginlayout/LoginLayout";
import { PrimaryText, Toast } from "../../component";
import styles from "./Login.module.scss";
import { PATH } from "../../utils/routes/Paths";
import { AppIcons, appSvgs } from "../../utils/appImages";
import * as AuthServices from "../../services/appServices/authService";
import { trackEvent } from "../../utils/analytics";
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // If user came from another page, return to that
  const redirectPath = location.state?.from || PATH.privateRoutes.HOME.path;

  const [mobileNumber, setMobileNumber] = useState("");
  const [selectedRole, setSelectedRole] = useState("USER"); // USER / ASTROLOGER

  const isMobileNumberValid = mobileNumber.length === 10;

  // Track login screen open
  useEffect(() => {
    trackEvent("login_initiated", { source_screen: location.state?.from || "direct" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Already logged in? Send user back to where they came from
  useEffect(() => {
    // const token = localStorage.getItem("verifyOtpToken");
    const role = localStorage.getItem("shubhtalk_role");
    const token =
      role === "ASTROLOGER"
        ? localStorage.getItem("shubhtalk_astro_token")
        : localStorage.getItem("shubhtalk_customer_token");

    if (token) {
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, redirectPath]);

  const handleSendOtp = async (event) => {
    event.preventDefault();

    // Doubly silent before: the button was `disabled={!isMobileNumberValid}` so
    // the browser swallowed the tap, and this guard returned without a word.
    // Same defect as the onboarding LoginScreen CTA — this is the other entry
    // point into the same funnel.
    if (!isMobileNumberValid) {
      trackEvent("login_blocked", {
        blocker: "incomplete_mobile_number",
        digits_entered: mobileNumber.length,
      });
      Toast.error(
        mobileNumber.length === 0
          ? "Please enter your 10-digit mobile number."
          : `Please enter all 10 digits — ${Math.max(0, 10 - mobileNumber.length)} to go.`
      );
      return;
    }

    const type = selectedRole === "USER" ? "CUSTOMER" : "ASTROLOGER";

    const payload = {
      phoneNumber: "91" + mobileNumber,
      type: type,
    };

    if (type === "ASTROLOGER") {
      trackEvent("astro_signup_started", { source: "login" });
      trackEvent("astro_mobile_entered", { mobile_number: mobileNumber });
    } else {
      trackEvent("login_mobile_entered", { mobile_number: mobileNumber });
    }
    trackEvent("login_otp_requested", { mobile_number: mobileNumber });

    try {
      const response = await AuthServices.loginWithPhone(payload);

      if (response.status) {
        navigate(PATH.publicRoutes.OTP_VERIFICATION.path, {
          state: {
            phoneNumber: "91" + mobileNumber,
            type, // 👈 PASSING TYPE TO OTP PAGE
            from: redirectPath,
          },
          replace: true,
        });
      } else {
        Toast.error("Error", response.message);
      }
    } catch (error) {
      Toast.error("Error", error?.message || "Something went wrong");

      navigate(PATH.publicRoutes.OTP_VERIFICATION.path, {
        state: {
          phoneNumber: "91" + mobileNumber,
          type, // 👈 PASSING TYPE TO OTP PAGE
          resendOtp: handleSendOtp,
          from: redirectPath,
        },
        replace: true,
      });
    }
  };

  return (
    <LoginLayout>
      <div className={styles.loginSection}>
        <div className={styles.logoContainer} onClick={() => navigate("/")}>
          <img src={AppIcons.Logo} alt="Shubh Talk Logo" />
        </div>
        <h1 className={styles.title}>
          Welcome to Shubh Talk
          <span className={styles.subtitle}>
            Enter your mobile number to Login/Signup
          </span>
        </h1>

        {/* ----------- ROLE TABS ------------- */}
        <div className={styles.roleTabs}>
          <button
            className={`${styles.roleTab} ${
              selectedRole === "USER" ? styles.active : ""
            }`}
            onClick={() => setSelectedRole("USER")}
          >
            User
          </button>

          <button
            className={`${styles.roleTab} ${
              selectedRole === "ASTROLOGER" ? styles.active : ""
            }`}
            onClick={() => setSelectedRole("ASTROLOGER")}
          >
            Astrologer
          </button>
        </div>

        <div className={styles.mobileNumber}>
          <PrimaryText className={styles.label}>
            Mobile Number<span>*</span>
          </PrimaryText>

          <form onSubmit={handleSendOtp}>
            <div className={styles.mobileInputContainer}>
              <div className={styles.countryCodeInput}>
                <input
                  type="text"
                  value="+91"
                  readOnly
                  className={styles.countryCode}
                />
              </div>

              <div className={styles.phoneInput}>
                <input
                  type="tel"
                  id="phone"
                  value={mobileNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) setMobileNumber(value);
                  }}
                  inputMode="numeric"
                  required
                  placeholder="Mobile Number"
                  pattern="[0-9]*"
                />
              </div>
            </div>

            {/*
              Kept tappable on purpose — `handleSendOtp` explains what's missing.
              `.sendOtpDisable` still supplies the dimmed look.
            */}
            <button
              type="submit"
              className={`${styles.sendOtpButton} ${
                !isMobileNumberValid ? styles.sendOtpDisable : ""
              }`}
              aria-disabled={!isMobileNumberValid}
            >
              Send OTP
            </button>
          </form>
        </div>

        <div className={styles.byProceeding}>
          By proceeding, you agree to our
          <Link to={PATH.privateRoutes.TERMS_CONDITIONS_VIEW.path}>T&C</Link> &{" "}
          <Link to={PATH.privateRoutes.PRIVACY_SECURITY.path}>
            Privacy Policy
          </Link>
        </div>
      </div>
    </LoginLayout>
  );
};

export default Login;
