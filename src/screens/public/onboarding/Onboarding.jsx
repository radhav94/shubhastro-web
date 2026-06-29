import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import styles from "./Onboarding.module.scss";
import { PATH } from "../../../utils/routes/Paths";
import { logout } from "../../../redux/auth/authSlice";
import { clearSelectedKundli } from "../../../redux/kundli/kundliSlice";
import { useLogoutUserMutation } from "../../../redux/api/userSession/userSessionApi";
import LoadingScreen from "./LoadingScreen";
import WelcomeScreen from "./WelcomeScreen";
import GuidanceScreen from "./GuidanceScreen";
import BirthDetailsScreen from "./BirthDetailsScreen";
import PersonalizeScreen from "./PersonalizeScreen";
import OTPScreen from "./OTPScreen";
import LoginScreen from "./LoginScreen";

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [logoutUser] = useLogoutUserMutation();

  const isPersonalizeFlow = searchParams.get("step") === "personalize";
  const skipGuidance = searchParams.get("skip") === "welcome" || isPersonalizeFlow;

  const [currentStep, setCurrentStep] = useState(isPersonalizeFlow ? 3 : 1);

  const [formData, setFormData] = useState(() => {
    let phoneNumber = "";
    if (isPersonalizeFlow) {
      try {
        const userData = localStorage.getItem("userData");
        const user = userData ? JSON.parse(userData) : null;
        phoneNumber = user?.phoneNumber || localStorage.getItem("shubhtalk_customer_phone") || "";
      } catch { /* ignore */ }
    }

    return {
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
          navigate(PATH.privateRoutes.HOME.path || "/");
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    // If there IS a redirect path, let the OTPScreen handle it after login
  }, []); // Run only once on mount

  const handleStepChange = (step) => {
    // When guidance is skipped, don't allow navigating to step index 2 (GuidanceScreen)
    if (skipGuidance && step >= 2) return;

    if (step > 0 && (!formData.name || formData.name.trim().length < 3)) {
      toast.error("Please complete your name in the first step");
      return;
    }
    if (step > 1 && !formData.birthDate) {
      toast.error("Please complete your birth date in the second step");
      return;
    }
    setCurrentStep(step + 3);
  };

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
      localStorage.clear();
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
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const screens = [
    <WelcomeScreen key="welcome" onNext={handleNext} />,
    <LoginScreen
      key="login"
      onNext={handleNext}
      onBack={handleBack}
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
        // Check for redirect path after registration completion
        const redirectPath = localStorage.getItem(
          "shubhtalk_redirect_after_login",
        );

        if (redirectPath && redirectPath !== "/login") {
          // Clear the redirect path
          localStorage.removeItem("shubhtalk_redirect_after_login");
          navigate(redirectPath);
        } else {
          // No redirect path, go to home
          navigate(PATH.privateRoutes.HOME.path || "/");
        }
      }}
    />,
  ];

  return (
    <>
      <div className={styles.onboardingContainer}>{screens[currentStep]}</div>
    </>
  );
};

export default Onboarding;
