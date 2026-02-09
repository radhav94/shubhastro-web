import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import styles from "./Onboarding.module.scss";
import { PATH } from "../../../utils/routes/Paths";
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
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  // Start directly at LoginScreen (skip WelcomeScreen)
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    guidance: [],
    name: "",
    identity: "Female",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    unknownBirthTime: false,
    latitude: null,
    longitude: null,
    phoneNumber: "",
    otp: "",
  });

  // Redirect to home if user is already logged in (only on initial mount)
  // DISABLED: This was interfering with the redirect-after-login flow
  // The redirect logic is now handled in OTPScreen and LoadingScreen
  useEffect(() => {
    const token = localStorage.getItem("shubhtalk_customer_token");
    const userData = localStorage.getItem("userData");
    const redirectPath = localStorage.getItem("shubhtalk_redirect_after_login");

    console.log("🔍 Onboarding mount check - token:", !!token, "userData:", !!userData, "redirectPath:", redirectPath);

    // Only redirect if user was already logged in before coming to this page
    // AND there's no redirect path (meaning they came here directly, not from a 401 error)
    if (token && userData && !redirectPath) {
      try {
        const parsedUserData = JSON.parse(userData);
        // Only redirect if user is already registered
        if (parsedUserData.isRegister) {
          console.log("✅ User already logged in (no redirect path), redirecting to home");
          navigate(PATH.privateRoutes.HOME.path || "/");
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    // If there IS a redirect path, let the OTPScreen handle it after login
  }, []); // Run only once on mount

  const isLoadingScreen = currentStep === 6;

  const handleStepChange = (step) => {
    // Validate previous steps before allowing navigation
    if (step > 0 && (!formData.name || formData.name.trim().length < 3)) {
      toast.error("Please complete your name in the first step");
      return;
    }
    
    if (step > 1 && !formData.birthDate) {
      toast.error("Please complete your birth date in the second step");
      return;
    }
    
    // Map the step index to the actual screen index
    // PersonalizeScreen = step 0 -> screen 3
    // BirthDetailsScreen = step 1 -> screen 4
    // GuidanceScreen = step 2 -> screen 5
    const screenIndex = step + 3;
    setCurrentStep(screenIndex);
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    // Prevent going back to WelcomeScreen (step 0) from LoginScreen (step 1)
    // When on LoginScreen and user clicks back, navigate to home instead
    if (currentStep === 1) {
      navigate(PATH.privateRoutes.HOME.path || "/");
      return;
    }
    setCurrentStep((prev) => prev - 1);
  };

  // console.log("currentstep",currentStep)
  const handleSkip = () => {
    // Skip to home
    navigate(PATH.privateRoutes.HOME.path || "/");
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
      onBack={handleBack}
      onSkip={handleSkip}
      formData={formData}
      updateFormData={updateFormData}
      currentStep={0}
      totalSteps={3}
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
      totalSteps={3}
      onStepChange={handleStepChange}
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
    <LoadingScreen key="loading" onComplete={() => {
      // Check for redirect path after registration completion
      const redirectPath = localStorage.getItem("shubhtalk_redirect_after_login");

      if (redirectPath && redirectPath !== "/login") {
        // Clear the redirect path
        localStorage.removeItem("shubhtalk_redirect_after_login");
        navigate(redirectPath);
      } else {
        // No redirect path, go to home
        navigate(PATH.privateRoutes.HOME.path || "/");
      }
    }} />,
  ];

  return (
    <>
      <div className={styles.onboardingContainer}>
        {screens[currentStep]}
      </div>
    </>
  );
};

export default Onboarding;
