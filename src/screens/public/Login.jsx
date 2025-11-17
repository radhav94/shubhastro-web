import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import LoginLayout from "../../layouts/loginlayout/LoginLayout";
import { PrimaryText, Toast } from "../../component";
import styles from "./Login.module.scss";
import { PATH } from "../../utils/routes/Paths";
import * as AuthServices from "../../services/appServices/authService";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation(); 

  // ✅ If user came from another page, return to that
  const redirectPath =
    location.state?.from || PATH.privateRoutes.HOME.path;

  const [mobileNumber, setMobileNumber] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);

  const isMobileNumberValid = mobileNumber.length === 10;

  // ✅ Already logged in? Send user back to where they came from (NOT home always)
  useEffect(() => {
    const token = localStorage.getItem("verifyOtpToken");
    if (token) {
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, redirectPath]);

  const handleSendOtp = async (event) => {
    event.preventDefault();
    if (!isMobileNumberValid) return;

    const payload = {
      phoneNumber: mobileNumber,
      type: "CUSTOMER",
    };

    try {
      const response = await AuthServices.loginWithPhone(payload);

      if (response.status) {
        navigate(PATH.publicRoutes.OTP_VERIFICATION.path, {
          state: { 
            phoneNumber: mobileNumber, 
            from: redirectPath 
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
          phoneNumber: mobileNumber, 
          resendOtp: handleSendOtp,
          from: redirectPath 
        },
        replace: true,
      });
    }
  };

  return (
    <LoginLayout>
      <div className={styles.loginSection}>
        <h1 className={styles.title}>
          Welcome to Shubh Talk
          <span className={styles.subtitle}>
            Enter your mobile number to Login/Signup
          </span>
        </h1>

        <div className={styles.mobileNumber}>
          <PrimaryText className={styles.label}>
            Mobile number<span>*</span>
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
                  placeholder="Mobile number"
                  pattern="[0-9]*"
                />
              </div>
            </div>

            <button
              type="submit"
              className={`${styles.sendOtpButton} ${
                !isMobileNumberValid ? styles.sendOtpDisable : ""
              }`}
              disabled={!isMobileNumberValid}
            >
              Send OTP
            </button>
          </form>
        </div>

        <div className={styles.byProceeding}>
          By proceeding, you agree to our <a>T&C</a> & <a>Privacy Policy</a>
        </div>
      </div>
    </LoginLayout>
  );
};

export default Login;
