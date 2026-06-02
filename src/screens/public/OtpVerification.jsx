import React, { useEffect, useState } from "react";
import OtpInput from "react-otp-input";
import styles from "./OtpVerification.module.scss";
import LoginLayout from "../../layouts/loginlayout/LoginLayout";
import { useLocation, useNavigate } from "react-router-dom";
import { PrimaryText, Toast } from "../../component";
import { PATH } from "../../utils/routes/Paths";
import * as AuthServices from "../../services/appServices/authService";
import { saveUserToStorage } from "../../utils/authStorage";
import { requestFCMToken } from "../../services/firebase";

const OtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // ⬇️ extract passed data
  const { phoneNumber, from ,type} = location.state || {};

  // redirect back to the page user came from
  const redirectPath = from || PATH.privateRoutes.HOME.path;

  const [otp, setOtp] = useState("");
  const [counter, setCounter] = useState(120);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const isOtpComplete = otp.length === 6;

  // Auto-submit when OTP is fully filled (e.g., SMS autofill on iOS)
  useEffect(() => {
    if (isOtpComplete && !isVerifying) {
      handleVerifyOtp({ preventDefault: () => {} });
    }
  }, [otp]);

// const handleVerifyOtp = async (event) => {
//   event.preventDefault();

//   const payload = {
//     phoneNumber,
//     type,
//     otp: parseInt(otp, 10),
//   };

//   try {
//     const response = await AuthServices.verifyOtp(payload);

//     if (response?.data?.statusCode === 200) {
//       const { isRegister, accessToken,_id,astrologer_id} = response?.data?.data || {};

//       // localStorage.setItem("astrologerId",_id);
//     if (type === "CUSTOMER") {
//   localStorage.setItem("userId", _id);   // ⭐ Logged in user
// }
// if (type === "ASTROLOGER") {
//   localStorage.setItem("loggedAstroId", _id);  // ⭐ Logged in astrologer
// }


//       // store token
//       if (accessToken) {
//         localStorage.setItem("verifyOtpToken", accessToken);
//       }

//       Toast.success("OTP verified successfully");

//       // Convert string/boolean backend flag safely
//       const isNewUser = String(isRegister) === "false";

//       // ⭐ ASTROLOGER FLOW — ALWAYS go to dashboard
//       if (type === "ASTROLOGER") {
//         navigate(PATH.privateRoutes.ASTROLOGER_DASHBOARD.path, { replace: true });
//         return;
//       }

//       // ⭐ CUSTOMER FLOW — check register status
//       if (isNewUser) {
//         navigate(PATH.publicRoutes.REGISTER.path, {
//           replace: true,
//           state: { from: location },
//         });
//       } else {
//         navigate(redirectPath, { replace: true });
//       }
//     }
//   } catch (error) {
//     Toast.error(error?.response?.data?.message || "OTP verification failed");
//   }
// };



const handleVerifyOtp = async (event) => {
  event.preventDefault();
  if (isVerifying) return;
  setIsVerifying(true);

  const fcmTokens = await requestFCMToken();

  const payload = {
    phoneNumber,
    type, // "CUSTOMER" or "ASTROLOGER"
    otp: String(otp),
    ...(fcmTokens && { fcmTokens, deviceType: "web" }),
  };

  try {
    const response = await AuthServices.verifyOtp(payload);

    if (response?.data?.statusCode === 200) {
      const userData = response?.data?.data || {};
      const { isRegister, accessToken, _id } = userData;

      // SAVE ONLY NECESSARY DATA
      saveUserToStorage(userData);

      // Clear everything first to avoid conflict
      // localStorage.removeItem("shubhtalk_role");
      // localStorage.removeItem("shubhtalk_customer_id");
      // localStorage.removeItem("shubhtalk_customer_token");
      // localStorage.removeItem("shubhtalk_astro_id");
      // localStorage.removeItem("shubhtalk_astro_token");

      // -----------------------------
      // ⭐ STORE LOGIN BASED ON ROLE
      // -----------------------------
      if (type === "CUSTOMER") {
        localStorage.setItem("shubhtalk_role", "CUSTOMER");
        localStorage.setItem("shubhtalk_customer_id", _id);
        localStorage.setItem("shubhtalk_customer_token", accessToken);
        
        // Clear any cached profile data from previous user
        localStorage.removeItem("selectedKundliProfile");
      }

      if (type === "ASTROLOGER") {
        localStorage.setItem("shubhtalk_role", "ASTROLOGER");
        localStorage.setItem("shubhtalk_astro_id", _id);
        localStorage.setItem("shubhtalk_astro_token", accessToken);
        
        // Clear any cached profile data from previous user
        localStorage.removeItem("selectedKundliProfile");
      }

      Toast.success("OTP verified successfully");

      // -----------------------------
      // ⭐ REDIRECTION BASED ON ROLE
      // -----------------------------

      // ASTRO ALWAYS GOES TO ASTRO DASHBOARD
      if (type === "ASTROLOGER") {
        navigate(PATH.privateRoutes.ASTROLOGER_DASHBOARD.path, { replace: true });
        return;
      }

      // CUSTOMER → IF NEW, REGISTER
      const isNewUser = String(isRegister) === "false";

      if (isNewUser) {
        navigate(PATH.publicRoutes.REGISTER.path, {
          replace: true,
          state: { from: location },
        });
      } else {
        navigate(redirectPath, { replace: true });
      }
    }
  } catch (error) {
    Toast.error(error?.response?.data?.message || "OTP verification failed");
    // Clear OTP input on error
    setOtp("");
  } finally {
    setIsVerifying(false);
  }
};



  const handleEditNumber = () => navigate("/login");

  // Timer logic
  useEffect(() => {
    if (!isTimerActive || counter <= 0) {
      if (isTimerActive && counter <= 0) {
        setIsTimerActive(false);
      }
      return;
    }

    const timer = setTimeout(() => setCounter(counter - 1), 1000);
    return () => clearTimeout(timer);
  }, [counter, isTimerActive]);

  const handleResend = async () => {
    if (isTimerActive) return;

  try {
    const payload = {
      phoneNumber,
      type,
    };

    await AuthServices.loginWithPhone(payload);

    Toast.success("OTP resent successfully");

    setIsTimerActive(true);
    setCounter(120);
  } catch (error) {
    Toast.error(error?.response?.data?.message || "Failed to resend OTP");
  }
  };

  return (
    <LoginLayout>
      <div className={styles.loginSection}>
        <h1 className={styles.title}>
          Welcome to ShubhTalk
          <span className={styles.subtitle}>
            You will receive the OTP via SMS on
            <div className={styles.phoneContainer}>
              +{phoneNumber}
              <button onClick={handleEditNumber} className={styles.editButton}>
                <img
                  src="https://images.astroyogi.com/astroyogi/edit_icon_yellow.png"
                  alt="Edit number"
                />
              </button>
            </div>
          </span>
        </h1>

        <div className={styles.otpSection}>
          <form onSubmit={handleVerifyOtp}>
            <OtpInput
              value={otp}
              onChange={setOtp}
              numInputs={6}
              shouldAutoFocus
              containerStyle={styles.otpInputContainer}
              inputStyle={styles.otpInput}
              renderInput={(props, index) => (
                <input
                  {...props}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace") {
                      e.preventDefault();

                      const otpArray = otp.split("");

                      if (otpArray[index]) {
                        // 🔹 current box clear
                        otpArray[index] = "";
                        setOtp(otpArray.join(""));
                      } else if (index > 0) {
                        // 🔹 move to previous box
                        otpArray[index - 1] = "";
                        setOtp(otpArray.join(""));

                        const prevInput = document.querySelectorAll(
                          `.${styles.otpInput}`
                        )[index - 1];

                        prevInput?.focus();
                      }
                    }

                    // allow only numbers
                    if (
                      !/^[0-9]$/.test(e.key) &&
                      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(
                        e.key
                      )
                    ) {
                      e.preventDefault();
                    }
                  }}
                />
              )}
            />


            <button
              type="submit"
              className={`${styles.verifyButton} ${
                !isOtpComplete ? styles.disabled : ""
              }`}
              disabled={!isOtpComplete}
            >
              Verify OTP
            </button>
          </form>
            <div className={styles.resendOptions}>
              <button
                type="button"
                className={styles.resendButton}
                onClick={handleResend}
                disabled={isTimerActive}
              >
                {isTimerActive ? (
                  <>
                    Resend OTP in <strong>{counter}s</strong>
                  </>
                ) : (
                  "Resend OTP"
                )}
              </button>
          </div>
        </div>

        <div className={styles.byProceeding}>
          By proceeding, you agree to our{" "}
          <a href="/termandcondition.aspx">T&C</a> &{" "}
          <a href="/policy.aspx">Privacy Policy</a>
        </div>
      </div>
    </LoginLayout>
  );
};

export default OtpVerification;
