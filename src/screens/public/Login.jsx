import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginLayout from "../../layouts/loginlayout/LoginLayout";
import { PrimaryText, Toast } from "../../component";
import styles from "./Login.module.scss";
import { PATH } from "../../utils/routes/Paths";
import * as AuthServices from "../../services/appServices/authService";

const Login = () => {
  const navigate = useNavigate();

  const [mobileNumber, setMobileNumber] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);

  const isMobileNumberValid = mobileNumber.length == 10;

  // In your React component file

  const handleSendOtp = async (event) => {
    event.preventDefault();
    if (!isMobileNumberValid) {
      return;
    }

    const payload = {
    phoneNumber: mobileNumber,
    type: "CUSTOMER"
    // "type": "ASTROLOGER"
    // "otp": 8593
}

    try {
      const response = await AuthServices.loginWithPhone(payload);
      if (response.status) {
        navigate(PATH.publicRoutes.OTP_VERIFICATION.path, {
          state: { phoneNumber: mobileNumber},
        }
      );
      } else {
        Toast.error("Error", response.message);
      }
    } catch (error) {
      Toast.error("An unexpected error occurred in handleSendOtp", error);
      navigate(PATH.publicRoutes.OTP_VERIFICATION.path, {
        state: { phoneNumber: mobileNumber, resendOtp: handleSendOtp },
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
                    if (value.length <= 10) {
                      setMobileNumber(value);
                    }
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

        {/* <div>
          <button type="button" className={styles.emailAccount}>
            Have an email account?
          </button>
        </div> */}

        <div className={styles.byProceeding}>
          By proceeding, you agree to our{" "}
          <a>T&C</a> &{" "}
          <a>Privacy Policy</a>
        </div>

        {/* <div className={styles.whatsapp}>
          <label className={styles.checkBoxLabel}>
            <input
              type="checkbox"
              checked={whatsappOptIn}
              onChange={() => setWhatsappOptIn(!whatsappOptIn)}
            />
            <span className={styles.checkmark}></span>
            Get updates on WhatsApp
            <img
              src="https://images.astroyogi.com/astroyogi/common/whats-app-Icon.svg"
              alt="Whatsapp"
              className={styles.whatsappIcon}
            />
          </label>
        </div> */}
      </div>
    </LoginLayout>
  );
};

export default Login;
