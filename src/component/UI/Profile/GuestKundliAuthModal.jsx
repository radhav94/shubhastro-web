import { useState } from "react";
import { useDispatch } from "react-redux";
import AddProfileModal from "./AddProfileModal";
import GuestDetailsForm from "./GuestDetailsForm";
import OtpModal from "./OtpModal";
import { Toast } from "../../index";
import * as AuthServices from "../../../services/appServices/authService";
import { saveUserToStorage } from "../../../utils/authStorage";
import { requestFCMToken } from "../../../services/firebase";
import { clearGuestKundliProfiles } from "../../../utils/helper/cookies";
import { loginSuccess } from "../../../redux/auth/authSlice";
import { setSelectedKundliProfile } from "../../../redux/aiwow/aiwowSlice";
import { setSelectedKundli } from "../../../redux/kundli/kundliSlice";
import { useCreateKundliMutation, useLazyGetAllKundlisQuery } from "../../../services/appServices/kundliServicesNew";
import { privateRequestNew, setApiErrorToastSilenced } from "../../../services/appServices/privateRequestNew";
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
  // When true, the kundli/OTP forms render inline (as a message inside the
  // Pandit AI chat) instead of as a full-screen overlay.
  inline = false,
}) => {
  const dispatch = useDispatch();
  const [createKundli] = useCreateKundliMutation();
  const [fetchAllKundlis] = useLazyGetAllKundlisQuery();

  const [step, setStep] = useState("kundli"); // "kundli" | "otp" | "done"
  const [pendingKundli, setPendingKundli] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Build the kundli create payload from the AddProfileModal form values.
  const buildKundliPayload = (data, relation = "self") => {
    const dateObj = new Date(data.birthDate);
    const timeObj = data.birthTime ? data.birthTime.split(":") : ["0", "0"];
    return {
      name: data.name,
      gender: data.identity.toLowerCase(),
      relation,
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

  // Normalizes the HTTP status out of an RTK Query error (fetchBaseQuery uses a
  // string status like "PARSING_ERROR" with the real code in originalStatus).
  const getErrorStatus = (err) =>
    typeof err?.status === "number" ? err.status : err?.originalStatus;

  // Creates the kundli, retrying once if the server responds with a 500.
  // The global error toast is silenced for this call: during guest login a
  // create can fail harmlessly (e.g. an existing user already has kundlis) and
  // we recover by falling back to their existing kundli — the user shouldn't
  // see an error like "Please Delete One Kundli from Existing One".
  const createKundliWithRetry = async (payload) => {
    setApiErrorToastSilenced("createKundli", true);
    try {
      return await createKundli(payload).unwrap();
    } catch (err) {
      if (getErrorStatus(err) === 500) {
        // Recall the API once on a server error.
        return await createKundli(payload).unwrap();
      }
      throw err;
    } finally {
      setApiErrorToastSilenced("createKundli", false);
    }
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

    // Trigger the welcome-bonus popup shown to newly registered users.
    localStorage.setItem("shubhtalk_show_welcome_bonus", "true");

    // NOTE: Do NOT dispatch any redux auth change here. Components like
    // TopHeader run getAllKundlis with `skip: !token`; a redux change would
    // re-render them and fire getAllKundlis BEFORE the kundli is created,
    // which triggers the profile 404 -> personalize redirect. The logged-in
    // state is flipped later via loginSuccess, after the kundli exists.
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

      // Decide the flow from the verifyOtp response's `isRegister` flag:
      //   true  → existing account: DON'T register or create a kundli; reuse the
      //           user's existing kundli and show the "welcome back" popup.
      //   false → new user: register (sets welcome-bonus) + create a self kundli.
      // New users are the only ones the backend marks isRegister === false;
      // anything else (true / missing) is an existing account.
      const isExistingUser = String(userData?.isRegister) !== "false";

      let registered = true;
      let createdProfile = null;

      if (isExistingUser) {
        // Welcome-back popup for existing users.
        const backName =
          userData?.firstName ||
          (pendingKundli?.name || "").trim().split(/\s+/)[0] ||
          "";
        localStorage.setItem("shubhtalk_welcome_back_name", backName);
        localStorage.setItem("shubhtalk_show_welcome_back", "true");

        // Existing account: their "self" kundli is already set, so create a NEW
        // profile labeled "other" from the details entered here and use that
        // (instead of reusing the existing self kundli).
        try {
          const result = await createKundliWithRetry(buildKundliPayload(pendingKundli, "other"));
          createdProfile = result?.data || null;
        } catch (kundliErr) {
          console.error("Guest 'other' kundli creation failed, falling back:", kundliErr);
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
      } else {
        // ── New user: register (creates profile + sets welcome-bonus flag) ──
        // Done BEFORE flipping the session so global queries don't trigger the
        // "personalize" redirect.
        try {
          await registerGuestUser(_id);
        } catch (registerErr) {
          console.error("Guest background registration failed:", registerErr);
          registered = String(userData?.isRegister) !== "false";
        }

        // ── Create the "self" kundli (retry once on 500) ──
        try {
          const result = await createKundliWithRetry(buildKundliPayload(pendingKundli));
          createdProfile = result?.data || null;
        } catch (kundliErr) {
          if (getErrorStatus(kundliErr) === 500) {
            // Failed twice with a server error — return to the add-profile form.
            console.error("Guest kundli creation failed twice (500):", kundliErr);
            Toast.error("Something went wrong. Please try again.");
            setStep("kundli");
            return false;
          }
          // Fallback: a self kundli may already exist — use it.
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

      // Move to a "done" step so neither the kundli form nor OTP modal re-appears
      // while we wait for the welcome-bonus popup to close.
      setStep("done");

      // For new users, the welcome-bonus popup should be visible before we
      // trigger the success callback (which navigates/shows results). Wait for
      // the popup to close via the custom event it dispatches.
      if (!isExistingUser) {
        // Immediately tell the WelcomeBonusModal to check the flag (no route
        // change happens here, so the pathname-based effect won't fire on its own).
        // Small delay to let React settle after loginSuccess re-renders the tree.
        await new Promise((resolve) => setTimeout(resolve, 100));
        window.dispatchEvent(new Event("show-welcome-bonus"));

        await new Promise((resolve) => {
          const handler = () => {
            window.removeEventListener("welcome-bonus-closed", handler);
            resolve();
          };
          window.addEventListener("welcome-bonus-closed", handler);
          // Safety timeout in case the event never fires (e.g. component unmounted).
          setTimeout(() => {
            window.removeEventListener("welcome-bonus-closed", handler);
            resolve();
          }, 6000);
        });
      } else {
        // For existing users, show the welcome-back popup immediately and wait
        // for it to close before proceeding. Use a short delay to let React
        // settle after loginSuccess re-renders the tree (WelcomeBackModal may
        // remount and needs its event listener attached first).
        await new Promise((resolve) => setTimeout(resolve, 100));
        window.dispatchEvent(new Event("show-welcome-back"));

        await new Promise((resolve) => {
          const handler = () => {
            window.removeEventListener("welcome-back-closed", handler);
            resolve();
          };
          window.addEventListener("welcome-back-closed", handler);
          setTimeout(() => {
            window.removeEventListener("welcome-back-closed", handler);
            resolve();
          }, 6000);
        });
      }

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

  // Inline submit wrapper: handleKundliSubmit rethrows so AddProfileModal's
  // Formik can keep the form open on error. GuestDetailsForm doesn't need that,
  // so swallow the (already-toasted) error to avoid an unhandled rejection.
  const handleInlineSubmit = async (details) => {
    try {
      await handleKundliSubmit(details);
    } catch {
      /* error toast already shown in handleKundliSubmit */
    }
  };

  const showKundliStep =
    isOpen && step === "kundli" && !localStorage.getItem("shubhtalk_customer_token");

  return (
    <>
      {inline ? (
        showKundliStep && (
          <GuestDetailsForm submitting={sendingOtp} onSubmit={handleInlineSubmit} />
        )
      ) : (
        <AddProfileModal
          isOpen={showKundliStep}
          onClose={handleClose}
          onSubmit={handleKundliSubmit}
          isLoading={sendingOtp}
          title={title}
          submitButtonText="Continue"
          showMobileField
          hideRelation
          showProfileListing={false}
          closeOnOverlayClick={false}
          inline={inline}
        />
      )}

      <OtpModal
        isOpen={isOpen && step === "otp"}
        phoneNumber={phoneNumber}
        onVerify={handleVerifyOtp}
        onResend={handleResend}
        onClose={handleClose}
        isVerifying={verifying}
        closeOnOverlayClick={false}
        inline={inline}
      />
    </>
  );
};

export default GuestKundliAuthModal;
