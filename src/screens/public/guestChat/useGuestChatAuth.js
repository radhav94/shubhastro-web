import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import * as AuthServices from "../../../services/appServices/authService";
import { saveUserToStorage } from "../../../utils/authStorage";
import { requestFCMToken } from "../../../services/firebase";
import { clearGuestKundliProfiles } from "../../../utils/helper/cookies";
import { loginSuccess } from "../../../redux/auth/authSlice";
import { setSelectedKundliProfile } from "../../../redux/aiwow/aiwowSlice";
import { setSelectedKundli } from "../../../redux/kundli/kundliSlice";
import {
  useCreateKundliMutation,
  useLazyGetAllKundlisQuery,
} from "../../../services/appServices/kundliServicesNew";
import { privateRequestNew, setApiErrorToastSilenced } from "../../../services/appServices/privateRequestNew";
import { trackEvent } from "../../../utils/analytics";

/**
 * Guest authentication used by the guest chat flow.
 *
 * Encapsulates the OTP send / verify + register + kundli creation + login steps
 * so the conversational screen can stay focused on collecting the details.
 *
 * The details shape mirrors AddProfileModal form values:
 *   { name, identity, mobileNumber, birthDate, birthTime, unknownBirthTime,
 *     birthPlace, latitude, longitude, timezone }
 */
export const useGuestChatAuth = () => {
  const dispatch = useDispatch();
  const [createKundli] = useCreateKundliMutation();
  const [fetchAllKundlis] = useLazyGetAllKundlisQuery();

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

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

  const getErrorStatus = (err) =>
    typeof err?.status === "number" ? err.status : err?.originalStatus;

  // Silence the global error toast for this call: during guest login a create
  // can fail harmlessly (e.g. an existing user already has kundlis) and we
  // recover by falling back to their existing kundli, so the user shouldn't see
  // an error like "Please Delete One Kundli from Existing One".
  const createKundliWithRetry = async (payload) => {
    setApiErrorToastSilenced("createKundli", true);
    try {
      return await createKundli(payload).unwrap();
    } catch (err) {
      if (getErrorStatus(err) === 500) {
        return await createKundli(payload).unwrap();
      }
      throw err;
    } finally {
      setApiErrorToastSilenced("createKundli", false);
    }
  };

  const registerGuestUser = async (details, phoneNumber, userId) => {
    const fullName = (details?.name || "").trim();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");
    const identity = details?.identity?.toLowerCase();
    const gender = identity ? (identity === "others" ? "other" : identity) : "female";

    const registerPayload = {
      firstName,
      lastName,
      dateOfBirth: details?.birthDate || "",
      place: details?.birthPlace || "",
      phoneNumber,
      password: "TempPass@123",
      gender,
      languagePreferences: ["en"],
      role: "CUSTOMER",
      lat: details?.latitude || 0,
      lon: details?.longitude || 0,
    };

    await AuthServices.registerUser(registerPayload, { skipToast: true });
    localStorage.setItem("shubhtalk_show_welcome_bonus", "true");

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

  /**
   * Step 1 — send the OTP to the given 10-digit mobile number.
   * @returns {Promise<boolean>} true when the OTP was sent.
   */
  const sendOtp = useCallback(async (mobileNumber) => {
    const phone = "91" + mobileNumber;
    setSendingOtp(true);
    try {
      const response = await AuthServices.loginWithPhone({
        phoneNumber: phone,
        type: "CUSTOMER",
      });
      if (response?.status >= 200 && response?.status < 300) {
        trackEvent("login_otp_requested", { mobile_number: mobileNumber });
        return true;
      }
      return false;
    } finally {
      setSendingOtp(false);
    }
  }, []);

  const resendOtp = useCallback(async (mobileNumber) => {
    const phone = "91" + mobileNumber;
    await AuthServices.loginWithPhone({ phoneNumber: phone, type: "CUSTOMER" });
  }, []);

  /**
   * Step 2 — verify the OTP, then register (new user) + create the self kundli
   * and flip the logged-in session.
   *
   * @returns {Promise<{ ok: boolean, userId?: string, profile?: object }>}
   */
  const verifyAndRegister = useCallback(
    async (details, mobileNumber, otp) => {
      const phoneNumber = "91" + mobileNumber;
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
          return { ok: false, message: response?.data?.message || "OTP verification failed" };
        }

        const userData = response?.data?.data || {};
        const { accessToken, refreshToken, _id } = userData;

        // Persist token so the register/kundli/socket calls are authorized.
        saveUserToStorage(userData);
        localStorage.setItem("shubhtalk_role", "CUSTOMER");
        localStorage.setItem("shubhtalk_customer_token", accessToken);
        localStorage.setItem("shubhtalk_customer_id", _id);
        if (accessToken) localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        localStorage.removeItem("selectedKundliProfile");
        clearGuestKundliProfiles();

        const isExistingUser = String(userData?.isRegister) !== "false";
        let registered = true;
        let createdProfile = null;

        if (isExistingUser) {
          // Existing account: the "self" kundli is already theirs, so create a
          // NEW profile labeled "other" from the details entered in this flow
          // and use that (instead of reusing their existing self kundli).
          try {
            const result = await createKundliWithRetry(buildKundliPayload(details, "other"));
            createdProfile = result?.data || null;
          } catch (kundliErr) {
            console.error("Guest 'other' kundli creation failed, falling back:", kundliErr);
            try {
              const listResult = await fetchAllKundlis().unwrap();
              const kundlis = listResult?.data || [];
              createdProfile =
                kundlis.find((k) => k.relation?.toLowerCase() === "self") || kundlis[0] || null;
            } catch (fetchErr) {
              console.error("Failed to fetch existing kundlis:", fetchErr);
            }
          }
        } else {
          try {
            await registerGuestUser(details, phoneNumber, _id);
          } catch (registerErr) {
            console.error("Guest background registration failed:", registerErr);
            registered = String(userData?.isRegister) !== "false";
          }

          try {
            const result = await createKundliWithRetry(buildKundliPayload(details));
            createdProfile = result?.data || null;
          } catch (kundliErr) {
            console.error("Guest kundli creation failed, using existing kundli:", kundliErr);
            try {
              const listResult = await fetchAllKundlis().unwrap();
              const kundlis = listResult?.data || [];
              createdProfile =
                kundlis.find((k) => k.relation?.toLowerCase() === "self") || kundlis[0] || null;
            } catch (fetchErr) {
              console.error("Failed to fetch existing kundlis:", fetchErr);
            }
          }
        }

        // Flip the session now that profile + kundli exist.
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

        if (createdProfile?._id) {
          dispatch(setSelectedKundliProfile(createdProfile));
          dispatch(setSelectedKundli(createdProfile));
          localStorage.setItem("selectedKundliProfile", JSON.stringify(createdProfile));
        }

        // Show the appropriate welcome popup (bonus for new users, welcome-back
        // for existing) — both are mounted in HomeLayout and shown via events.
        if (!isExistingUser) {
          setTimeout(() => window.dispatchEvent(new Event("show-welcome-bonus")), 150);
        } else {
          const backName =
            userData?.firstName || (details?.name || "").trim().split(/\s+/)[0] || "";
          localStorage.setItem("shubhtalk_welcome_back_name", backName);
          localStorage.setItem("shubhtalk_show_welcome_back", "true");
          setTimeout(() => window.dispatchEvent(new Event("show-welcome-back")), 150);
        }

        return { ok: true, userId: _id, profile: createdProfile, isExistingUser };
      } catch (error) {
        return {
          ok: false,
          message:
            error?.response?.data?.message || error?.data?.message || "OTP verification failed",
        };
      } finally {
        setVerifying(false);
      }
    },
    [dispatch, fetchAllKundlis]
  );

  return { sendOtp, resendOtp, verifyAndRegister, sendingOtp, verifying };
};

export default useGuestChatAuth;
