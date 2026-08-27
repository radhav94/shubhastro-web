import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import styles from "./Onboarding.module.scss";
import { PATH } from "../../../utils/routes/Paths";
import { logout } from "../../../redux/auth/authSlice";
import { clearSelectedKundli } from "../../../redux/kundli/kundliSlice";
import { clearAllCalculatorData } from "../../../redux/calculator/calculatorSlice";
import { useLogoutUserMutation } from "../../../redux/api/userSession/userSessionApi";
import DeviceLimitModal from "../../../component/UI/modal/DeviceLimitModal/DeviceLimitModal";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import LoadingScreen from "./LoadingScreen";
import WelcomeScreen from "./WelcomeScreen";
import GuidanceScreen from "./GuidanceScreen";
// Lazy: BirthDetailsScreen is the only onboarding step that renders
// DateTimePicker, which pulls react-datepicker (107 kB) + date-fns (49 kB) —
// together 15% of the entry chunk that every visitor parses on every page.
// Onboarding is a static import (it backs /login), so that cost was paid app-wide
// for a date field on one step.
//
// It is index 4 in the `screens` array below and `currentStep` starts at 1
// (login) or 3 (personalize flow), so this step is never the initial render — it
// is always reached after at least one interaction, by which time the chunk has
// loaded.
const BirthDetailsScreen = lazy(() => import("./BirthDetailsScreen"));
import PersonalizeScreen from "./PersonalizeScreen";
import OTPScreen from "./OTPScreen";
import LoginScreen from "./LoginScreen";
import { draftToOnboardingFormData } from "../guestChat/guestChatConstants";

/**
 * Indices into the positional `screens` array below. Named because the wizard is
 * not purely linear — logins that already prove the phone number (Truecaller)
 * have to land past OTP, and that jump was previously impossible to express.
 */
const STEP = {
  WELCOME: 0,
  LOGIN: 1,
  OTP: 2,
  PERSONALIZE: 3,
  BIRTH: 4,
  GUIDANCE: 5,
  LOADING: 6,
};

/* ───────────────────────── Onboarding answers draft ─────────────────────────
 *
 * `redirectToPersonalize` in services/appServices/kundliServicesNew.js does a
 * `window.location.replace("/login?step=personalize")` when a logged-in user has
 * no self kundli and the Profile API 404s. That is a full page load, so every bit
 * of React state in this wizard is gone — including the name, gender, birth date,
 * birth time and birth place the user may have just typed into PersonalizeScreen
 * and BirthDetailsScreen one screen earlier.
 *
 * The only carry-over that existed was `draftToOnboardingFormData`, and that only
 * covers visitors who came through the guest-chat details form. Anyone who signed
 * up the normal way (enter number → OTP → personalize → birth details) landed on
 * a blank pair of forms and had to answer all six questions again, with no
 * indication that anything had been kept.
 *
 * A Clarity session shows the cost: registered and claimed the welcome bonus at
 * 05:52, then was still entering a place of birth at 20:45 — fifteen minutes and
 * 142 clicks across 21 pages later.
 *
 * sessionStorage for the same reason the guest draft uses it: this holds personal
 * details, so it should survive a navigation within the visit and nothing more.
 * `otp` is deliberately never persisted.
 */
const ONBOARDING_DRAFT_KEY = "shubhtalk_onboarding_draft";

const DRAFT_FIELDS = [
  "name",
  "email",
  "identity",
  "birthDate",
  "birthTime",
  "birthPlace",
  "unknownBirthTime",
  "latitude",
  "longitude",
  "phoneNumber",
  "guidance",
];

const loadOnboardingDraft = () => {
  try {
    const raw = sessionStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const saveOnboardingDraft = (formData) => {
  try {
    const draft = {};
    DRAFT_FIELDS.forEach((key) => {
      const value = formData[key];
      // Skip empties so a partially-filled draft never overwrites a better value
      // when it is merged back over `base`.
      if (value === "" || value === null || value === undefined) return;
      draft[key] = value;
    });
    if (Object.keys(draft).length === 0) return;
    sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* sessionStorage unavailable (private mode / quota) — non-critical */
  }
};

const clearOnboardingDraft = () => {
  try {
    sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);
  } catch {
    /* ignore */
  }
};

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [logoutUser] = useLogoutUserMutation();

  /*
   * Where to go once this flow finishes.
   *
   * Callers that gate a feature behind an account send us here with
   * `state.from` — the live player does exactly that
   * (`navigate("/login?skip=welcome", { state: { from: location.pathname } })`),
   * as does Login.jsx. OTPScreen honours it, but only on the
   * already-registered branch. A *new* user goes onNext() through personalize →
   * birth details → LoadingScreen, and LoadingScreen only ever consulted
   * `shubhtalk_redirect_after_login` in localStorage. Nothing writes that key on
   * this path, so every first-time signup that started at a gated feature was
   * dropped on the homepage instead of the thing they asked for — they then have
   * to find their way back by hand, which is what the live → login → live
   * bouncing in session recordings is.
   *
   * `/login` is excluded for the same reason the localStorage check excludes it:
   * returning here would loop.
   */
  const fromPath =
    typeof location.state?.from === "string" && location.state.from !== "/login"
      ? location.state.from
      : null;

  const isPersonalizeFlow = searchParams.get("step") === "personalize";
  const skipGuidance = searchParams.get("skip") === "welcome" || isPersonalizeFlow;

  const [currentStep, setCurrentStep] = useState(
    isPersonalizeFlow ? STEP.PERSONALIZE : STEP.LOGIN
  );
  const [deviceLimitDevices, setDeviceLimitDevices] = useState(null);
  const [isDeviceLimitOpen, setIsDeviceLimitOpen] = useState(false);

  const [formData, setFormData] = useState(() => {
    let phoneNumber = "";
    if (isPersonalizeFlow) {
      try {
        const userData = localStorage.getItem("userData");
        const user = userData ? JSON.parse(userData) : null;
        phoneNumber = user?.phoneNumber || localStorage.getItem("shubhtalk_customer_phone") || "";
      } catch { /* ignore */ }
    }

    const base = {
      guidance: [],
      name: "",
      email: "",
      identity: "Male",
      birthDate: "",
      birthTime: "",
      birthPlace: "",
      unknownBirthTime: false,
      latitude: null,
      longitude: null,
      phoneNumber,
      otp: "",
    };

    // Users reach `?step=personalize` via a hard redirect from the profile
    // self-check, not by choosing to — including guests who just filled in the
    // chat details form and verified an OTP. Landing them on a blank
    // Personalize + BirthDetails pair asks for the same name, gender, birth
    // date, time and place all over again, which is where they give up. Reuse
    // what they already told us and let them just confirm.
    if (isPersonalizeFlow) {
      // Two sources, applied weakest-first:
      //   guest-chat draft — what a guest typed into the chat details form.
      //   onboarding draft — what they typed into these very screens before the
      //                      hard redirect threw the React state away. More
      //                      recent, so it wins.
      const carried = {
        ...(draftToOnboardingFormData() || {}),
        ...(loadOnboardingDraft() || {}),
      };

      if (Object.keys(carried).length > 0) {
        // Anything already known from the account wins over either draft.
        return { ...base, ...carried, phoneNumber: phoneNumber || carried.phoneNumber || "" };
      }
    }

    return base;
  });

  // Redirect already-logged-in users to home (unless coming from kundli self-check)
  useEffect(() => {
    if (isPersonalizeFlow) return;

    const token = localStorage.getItem("shubhtalk_customer_token");
    const userData = localStorage.getItem("userData");
    const redirectPath = localStorage.getItem("shubhtalk_redirect_after_login");

    if (token && userData && !redirectPath) {
      try {
        const parsedUserData = JSON.parse(userData);
        if (parsedUserData.isRegister) {
          // Same reasoning as the LoadingScreen fallback: if a gated page sent
          // this visitor to log in and they turn out to already be logged in,
          // send them back there rather than to the homepage.
          navigate(fromPath || PATH.privateRoutes.HOME.path || "/");
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    // If there IS a redirect path, let the OTPScreen handle it after login
  }, []); // Run only once on mount

  // Check for device limit after OTP login
  useEffect(() => {
    const stored = localStorage.getItem("shubhtalk_device_limit_reached");
    const sessionStored = sessionStorage.getItem("shubhtalk_device_limit_reached");
    
    console.log("🔍 Onboarding mount - Checking device limit");
    console.log("  📦 localStorage:", stored ? `${JSON.parse(stored).length} devices` : "null");
    console.log("  📦 sessionStorage:", sessionStored ? `${JSON.parse(sessionStored).length} devices` : "null");
    
    if (stored) {
      try {
        const devices = JSON.parse(stored);
        console.log("✅ Device limit found in localStorage, showing popup, devices:", devices);
        setDeviceLimitDevices(devices);
        setIsDeviceLimitOpen(true);
      } catch (error) {
        console.error("❌ Error parsing device limit data:", error);
      }
    } else if (sessionStored) {
      try {
        const devices = JSON.parse(sessionStored);
        console.log("✅ Device limit found in sessionStorage, showing popup, devices:", devices);
        setDeviceLimitDevices(devices);
        setIsDeviceLimitOpen(true);
        // Copy to localStorage for persistence
        localStorage.setItem("shubhtalk_device_limit_reached", sessionStored);
        sessionStorage.removeItem("shubhtalk_device_limit_reached");
      } catch (error) {
        console.error("❌ Error parsing sessionStorage device limit data:", error);
      }
    } else {
      console.log("ℹ️ No device limit found in storage");
    }
  }, []);

  // Arriving here can be involuntary: the profile self-check does a full page
  // replace to `?step=personalize`. Say why, so a user who was midway through
  // starting a chat understands this is the last step rather than a reset.
  useEffect(() => {
    if (!isPersonalizeFlow) return;
    let reason = null;
    try {
      reason = sessionStorage.getItem("shubhtalk_personalize_reason");
      if (reason) sessionStorage.removeItem("shubhtalk_personalize_reason");
    } catch { /* ignore */ }
    if (reason) setTimeout(() => toast(reason, { icon: "ℹ️" }), 300);
  }, [isPersonalizeFlow]);

  const handleStepChange = (step) => {
    // When guidance is skipped, don't allow navigating to step index 2
    // (GuidanceScreen). The dots only render `totalSteps` of them, so this is
    // currently unreachable — but every other branch here explains itself, and a
    // silent return is how a control ends up looking broken if that changes.
    if (skipGuidance && step >= 2) {
      toast.error("That step isn't part of this signup.");
      return;
    }

    if (step > 0 && (!formData.name || formData.name.trim().length < 3)) {
      toast.error("Please complete your name in the first step");
      return;
    }
    if (step > 1 && !formData.birthDate) {
      toast.error("Please complete your birth date in the second step");
      return;
    }
    // The dots are 0-based within the profile-setup steps, which start at
    // PERSONALIZE in this array.
    setCurrentStep(step + STEP.PERSONALIZE);
  };

  /**
   * Jump a new user straight to profile setup, skipping the OTP step.
   *
   * For Truecaller (and any future SSO) the phone number is already verified and
   * the session tokens are already stored, so the OTP step has nothing to
   * verify — it can't even try, since no OTP was ever sent to that number. It
   * used to be reached anyway, because LoginScreen only had `onNext()` and OTP is
   * simply the next index.
   */
  const handleSkipOtp = () => setCurrentStep(STEP.PERSONALIZE);

  const handleNext = () => setCurrentStep((prev) => {
    // Skip GuidanceScreen (step 5) when skipGuidance is true
    if (skipGuidance && prev === 4) return 6;
    return prev + 1;
  });

  const handleBack = () => {
    // Prevent going back to WelcomeScreen (step 0) from LoginScreen (step 1)
    // When on LoginScreen and user clicks back, navigate to home instead
    if (currentStep === 1) {
      navigate(PATH.privateRoutes.HOME.path || "/");
      return;
    }
    setCurrentStep((prev) => prev - 1);
  };

  const handleSkip = () => navigate(PATH.privateRoutes.HOME.path || "/");

  // Logs the user out and sends them back to the home/login entry point.
  // Used by the back button on the personalize (registration) step.
  const performLogout = async () => {
    try {
      await logoutUser({ deviceType: "web" }).unwrap();
    } catch (err) {
      // Proceed with local logout even if the API call fails.
      console.error("Logout API error:", err);
    } finally {
      dispatch(logout());
      dispatch(clearSelectedKundli());
      dispatch(clearAllCalculatorData());
      localStorage.clear();
      // localStorage.clear() doesn't touch sessionStorage, and this is a
      // deliberate abandon — don't prefill the next person's signup with the
      // previous one's birth details.
      clearOnboardingDraft();
      window.dispatchEvent(new Event("auth-change"));
      // Hard redirect so the onboarding state fully resets to the login screen
      // (a React Router navigate would keep the same /login component mounted
      // on the personalize step).
      window.location.replace("/login?skip=welcome");
    }
  };

  // Back button on the Personalize step always logs the user out (in both the
  // deep-link flow and the normal enter-number → OTP → personalize flow),
  // rather than stepping back to the OTP screen.
  const handlePersonalizeBack = () => {
    performLogout();
  };

  const updateFormData = (data) => {
    setFormData((prev) => {
      const next = { ...prev, ...data };
      // Persist on every step so a `window.location.replace` to
      // `?step=personalize` — which can fire from the profile self-check at any
      // point — doesn't cost the user their answers. See ONBOARDING_DRAFT_KEY.
      saveOnboardingDraft(next);
      return next;
    });
  };

  const screens = [
    <WelcomeScreen key="welcome" onNext={handleNext} />,
    <LoginScreen
      key="login"
      onNext={handleNext}
      onBack={handleBack}
      onSkipOtp={handleSkipOtp}
      formData={formData}
      updateFormData={updateFormData}
    />,
    <OTPScreen
      key="otp"
      onNext={handleNext}
      onBack={handleBack}
      formData={formData}
      updateFormData={updateFormData}
    />,
    <PersonalizeScreen
      key="personalize"
      onNext={handleNext}
      onBack={handlePersonalizeBack}
      onSkip={handleSkip}
      formData={formData}
      updateFormData={updateFormData}
      currentStep={0}
      totalSteps={skipGuidance ? 2 : 3}
      onStepChange={handleStepChange}
    />,
    <BirthDetailsScreen
      key="birth"
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkip}
      formData={formData}
      updateFormData={updateFormData}
      currentStep={1}
      totalSteps={skipGuidance ? 2 : 3}
      onStepChange={handleStepChange}
      skipGuidance={skipGuidance}
    />,
    <GuidanceScreen
      key="guidance"
      onNext={handleNext}
      onSkip={handleSkip}
      formData={formData}
      updateFormData={updateFormData}
      currentStep={2}
      totalSteps={3}
      onStepChange={handleStepChange}
    />,
    <LoadingScreen
      key="loading"
      onComplete={() => {
        // The wizard finished, so the draft has served its purpose. Leaving it
        // would prefill a later signup in the same tab.
        clearOnboardingDraft();

        // Check for redirect path after registration completion
        const redirectPath = localStorage.getItem(
          "shubhtalk_redirect_after_login",
        );

        if (redirectPath && redirectPath !== "/login") {
          // Clear the redirect path
          localStorage.removeItem("shubhtalk_redirect_after_login");
          navigate(redirectPath);
        } else {
          // Fall back to the page that sent us here before defaulting to home.
          navigate(fromPath || PATH.privateRoutes.HOME.path || "/");
        }
      }}
    />,
  ];

  return (
    <>
      <div className={styles.onboardingContainer}>
        {/* Boundary for the lazy BirthDetailsScreen. Inline rather than
            fullscreen so the step swap doesn't flash a blurred overlay over the
            onboarding card. */}
        <Suspense fallback={<PrimaryLoader fullscreen={false} />}>
          {screens[currentStep]}
        </Suspense>
      </div>
      <DeviceLimitModal 
        isOpen={isDeviceLimitOpen}
        onClose={() => {
          setIsDeviceLimitOpen(false);
          localStorage.removeItem("shubhtalk_device_limit_reached");
        }}
        onDeviceUpdated={(updatedDevices) => {
          if (updatedDevices && updatedDevices.length > 0) {
            setDeviceLimitDevices(updatedDevices);
            localStorage.setItem("shubhtalk_device_limit_reached", JSON.stringify(updatedDevices));
          } else {
            setIsDeviceLimitOpen(false);
            localStorage.removeItem("shubhtalk_device_limit_reached");
          }
        }}
        devices={deviceLimitDevices || []}
      />
    </>
  );
};

export default Onboarding;
