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
  const { phoneNumber, from ,type} = location.state || {};

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
    type, // incoming type from login page (CUSTOMER or ASTROLOGER)
    otp: parseInt(otp, 10),
  };

  try {
    const response = await AuthServices.verifyOtp(payload);

    if (response?.data?.statusCode === 200) {
      const { isRegister, accessToken,_id,astrologer_id} = response?.data?.data || {};

      // localStorage.setItem("astrologerId",_id);
    if (type === "CUSTOMER") {
  localStorage.setItem("userId", _id);   // ⭐ Logged in user
}
if (type === "ASTROLOGER") {
  localStorage.setItem("loggedAstroId", _id);  // ⭐ Logged in astrologer
}


      // store token
      if (accessToken) {
        localStorage.setItem("verifyOtpToken", accessToken);
      }

      Toast.success("OTP verified successfully");

      // Convert string/boolean backend flag safely
      const isNewUser = String(isRegister) === "false";

      // ⭐ ASTROLOGER FLOW — ALWAYS go to dashboard
      if (type === "ASTROLOGER") {
        navigate(PATH.privateRoutes.ASTROLOGER_DASHBOARD.path, { replace: true });
        return;
      }

      // ⭐ CUSTOMER FLOW — check register status
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
