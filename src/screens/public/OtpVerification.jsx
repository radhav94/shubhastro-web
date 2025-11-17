import React, { useEffect, useState } from "react";
import OtpInput from "react-otp-input";
import styles from "./OtpVerification.module.scss";
import LoginLayout from "../../layouts/loginlayout/LoginLayout";
import { useLocation, useNavigate } from "react-router-dom";
import { PrimaryText, Toast } from "../../component";
import { PATH } from "../../utils/routes/Paths";
import * as AuthServices from "../../services/appServices/authService";

const OtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ⬇️ extract passed data
  const { phoneNumber, from } = location.state || {};

  // redirect back to the page user came from
  const redirectPath = from || PATH.privateRoutes.HOME.path;

  const [otp, setOtp] = useState("");
  const [counter, setCounter] = useState(5);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const isOtpComplete = otp.length === 6;

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    const payload = {
      phoneNumber,
      type: "CUSTOMER",
      otp: parseInt(otp, 10),
    };

    try {
      const response = await AuthServices.verifyOtp(payload);

      if (response?.data?.statusCode === 200) {
        const { isRegister, accessToken } = response?.data?.data || {};

        if (accessToken) {
          localStorage.setItem("verifyOtpToken", accessToken);
        }

        Toast.success("OTP verified successfully");
        localStorage.setItem("isLoggedIn", "true");

        // ⬇️ NEW USER → GO TO REGISTER
        if (isRegister === "false") {
          navigate(PATH.publicRoutes.REGISTER.path, {
            replace: true,
            state: { from: redirectPath },
          });
        } else {
          // ⬇️ EXISTING USER → BACK TO SAME PAGE
          navigate(redirectPath, { replace: true });
        }
      }
    } catch (error) {
      Toast.error(error?.response?.data?.message || "OTP verification failed");
    }
  };

  const handleEditNumber = () => navigate(-1);

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

  const handleResend = () => {
    if (isTimerActive) return;
    setIsTimerActive(true);
    setCounter(5);
  };

  return (
    <LoginLayout>
      <div className={styles.loginSection}>
        <h1 className={styles.title}>
          Welcome to ShubhTalk
          <span className={styles.subtitle}>
            You will receive the OTP via SMS on
            <div className={styles.phoneContainer}>
              {phoneNumber}
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
              containerStyle={styles.otpInputContainer}
              inputStyle={styles.otpInput}
              renderInput={(props) => <input {...props} />}
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
