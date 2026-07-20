import { useState } from "react";
import { useDispatch } from "react-redux";
import AddProfileModal from "./AddProfileModal";
import OtpModal from "./OtpModal";
import { Toast } from "../../index";
import * as AuthServices from "../../../services/appServices/authService";
import { saveUserToStorage } from "../../../utils/authStorage";
import { requestFCMToken } from "../../../services/firebase";
import { clearGuestKundliProfiles } from "../../../utils/helper/cookies";
import { loginSuccess, updateRegistrationStatus } from "../../../redux/auth/authSlice";
import { setSelectedKundliProfile } from "../../../redux/aiwow/aiwowSlice";
import { setSelectedKundli } from "../../../redux/kundli/kundliSlice";
import { useCreateKundliMutation, useLazyGetAllKundlisQuery } from "../../../services/appServices/kundliServicesNew";
import { privateRequestNew } from "../../../services/appServices/privateRequestNew";
import { trackEvent } from "../../../utils/analytics";

/**
 * Guest authentication flow for AI Wow services.
 *
 * Instead of redirecting a guest to the login page, we collect their kundli
 * details (with an extra mobile-number field), send an OTP, verify it, log the
 * user in, create the kundli, then hand the created profile back to the parent
 * via onSuccess so it can show the requested result.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {(profile: object|null) => void} onSuccess - called after login + kundli creation
 * @param {string} [title]
 */
const GuestKundliAuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Add Kundli Details",
}) => {
  const dispatch = useDispatch();
  const [createKundli] = useCreateKundliMutation();
  const [fetchAllKundlis] = useLazyGetAllKundlisQuery();

  const [step, setStep] = useState("kundli"); // "kundli" | "otp"
  const [pendingKundli, setPendingKundli] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Build the kundli create payload from the AddProfileModal form values.
  const buildKundliPayload = (data) => {
    const dateObj = new Date(data.birthDate);
    const timeObj = data.birthTime ? data.birthTime.split(":") : ["0", "0"];
    return {
      name: data.name,
      gender: data.identity.toLowerCase(),
      relation: "self",
      day: dateObj.getDate(),
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      hour: data.unknownBirthTime ? "00" : String(parseInt(timeObj[0])).padStart(2, "0"),
      min: data.unknownBirthTime ? "00" : String(parseInt(timeObj[1])).padStart(2, "0"),
      second: "00",
      place: data.birthPlace,
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      tzone: data.timezone ?? 5.5,
    };
  };

  // Registers a new user in the background from the entered kundli details so
  // they never see the "personalize" onboarding screen.
  const registerGuestUser = async (userId) => {
    const fullName = (pendingKundli?.name || "").trim();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");
    const identity = pendingKundli?.identity?.toLowerCase();
    const gender = identity ? (identity === "others" ? "other" : identity) : "female";

    const registerPayload = {
      firstName,
      lastName,
      dateOfBirth: pendingKundli?.birthDate || "",
      place: pendingKundli?.birthPlace || "",
      phoneNumber, // already prefixed with country code "91"
      password: "TempPass@123",
      gender,
      languagePreferences: ["en"],
      role: "CUSTOMER",
      lat: pendingKundli?.latitude || 0,
      lon: pendingKundli?.longitude || 0,
    };

    await AuthServices.registerUser(registerPayload, { skipToast: true });

    // Reflect the new registration status in Redux + storage.
    dispatch(updateRegistrationStatus({ isRegister: true }));
    try {
      const currentUserData = JSON.parse(localStorage.getItem("userData") || "{}");
      localStorage.setItem(
        "userData",
        JSON.stringify({ ...currentUserData, isRegister: true, firstName, lastName })
      );
    } catch {
      /* ignore storage parse errors */
    }
    trackEvent("profile_created", { user_id: userId });
  };

  const resetState = () => {
    setStep("kundli");
    setPendingKundli(null);
    setPhoneNumber("");
    setSendingOtp(false);
    setVerifying(false);
  };

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  // Step 1: kundli form submitted → send OTP, move to OTP step.
  const handleKundliSubmit = async (values) => {
    const phone = "91" + values.mobileNumber;
    try {
      setSendingOtp(true);
      const response = await AuthServices.loginWithPhone({
        phoneNumber: phone,
        type: "CUSTOMER",
      });

      // publicRequest returns the raw axios response; a 2xx status means OTP sent.
      if (response?.status >= 200 && response?.status < 300) {
        setPendingKundli(values);
        setPhoneNumber(phone);
        setStep("otp");
        trackEvent("login_otp_requested", { mobile_number: values.mobileNumber });
      } else {
        Toast.error("Failed to send OTP. Please try again.");
        throw new Error("otp-send-failed");
      }
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Failed to send OTP");
      throw error; // keep the form open
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: OTP entered → verify, log in, create the kundli.
  const handleVerifyOtp = async (otp) => {
    setVerifying(true);
    try {
      const fcmTokens = await requestFCMToken();
      const payload = {
        phoneNumber,
        type: "CUSTOMER",
        otp: String(otp),
        ...(fcmTokens && { fcmTokens, deviceType: "web" }),
      };

      const response = await AuthServices.verifyOtp(payload);

      if (response?.data?.statusCode !== 200) {
        Toast.error(response?.data?.message || "OTP verification failed");
        return false;
      }

      const userData = response?.data?.data || {};
      const { accessToken, refreshToken, _id } = userData;

      // ── Persist the token so background API calls are authorized ──
      saveUserToStorage(userData);
      localStorage.setItem("shubhtalk_role", "CUSTOMER");
      localStorage.setItem("shubhtalk_customer_token", accessToken);
      localStorage.setItem("shubhtalk_customer_id", _id);
      if (accessToken) localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.removeItem("selectedKundliProfile");
      clearGuestKundliProfiles();

      // IMPORTANT: finish registration + kundli creation BEFORE flipping the
      // logged-in state. Dispatching loginSuccess triggers global profile/kundli
      // queries; if they run before the profile/kundli exist, the app redirects
      // the user to the "personalize" onboarding screen.

      // ── Seamless registration for new users ──
      let registered = String(userData?.isRegister) !== "false";
      if (!registered) {
        try {
          await registerGuestUser(_id);
          registered = true;
        } catch (registerErr) {
          // Non-blocking: if registration fails (e.g. already registered), keep going.
          console.error("Guest background registration failed:", registerErr);
        }
      }

      // ── Create the "self" kundli now that the token is available ──
      let createdProfile = null;
      try {
        const result = await createKundli(buildKundliPayload(pendingKundli)).unwrap();
        createdProfile = result?.data || null;
      } catch (kundliErr) {
        // Creation can fail for a returning user (e.g. a "self" kundli already
        // exists). Discard the entered kundli and use the user's existing self
        // kundli instead — without showing an error.
        console.error("Guest kundli creation failed, using existing kundli:", kundliErr);
        try {
          const listResult = await fetchAllKundlis().unwrap();
          const kundlis = listResult?.data || [];
          createdProfile =
            kundlis.find((k) => k.relation?.toLowerCase() === "self") ||
            kundlis[0] ||
            null;
        } catch (fetchErr) {
          console.error("Failed to fetch existing kundlis:", fetchErr);
        }
      }

      // ── Now flip the session state; global queries will find data ready ──
      dispatch(privateRequestNew.util.resetApiState());
      dispatch(
        loginSuccess({
          isRegister: registered,
          isVerified: userData?.isVerified,
          token: accessToken,
        })
      );
      window.dispatchEvent(new Event("auth-change"));
      trackEvent("login_otp_verified", { user_id: _id });
      trackEvent("login_success", { user_id: _id });

      // Select the newly created profile so downstream screens can use it.
      if (createdProfile?._id) {
        dispatch(setSelectedKundliProfile(createdProfile));
        dispatch(setSelectedKundli(createdProfile));
        localStorage.setItem("selectedKundliProfile", JSON.stringify(createdProfile));
      }

      Toast.success("Logged in successfully");
      resetState();
      onSuccess?.(createdProfile);
      return true;
    } catch (error) {
      Toast.error(
        error?.response?.data?.message || error?.data?.message || "OTP verification failed"
      );
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    await AuthServices.loginWithPhone({ phoneNumber, type: "CUSTOMER" });
    Toast.success("OTP resent successfully");
  };

  return (
    <>
      <AddProfileModal
        isOpen={isOpen && step === "kundli"}
        onClose={handleClose}
        onSubmit={handleKundliSubmit}
        isLoading={sendingOtp}
        title={title}
        submitButtonText="Continue"
        showMobileField
        hideRelation
        showProfileListing={false}
        closeOnOverlayClick={false}
      />

      <OtpModal
        isOpen={isOpen && step === "otp"}
        phoneNumber={phoneNumber}
        onVerify={handleVerifyOtp}
        onResend={handleResend}
        onClose={handleClose}
        isVerifying={verifying}
        closeOnOverlayClick={false}
      />
    </>
  );
};

export default GuestKundliAuthModal;
