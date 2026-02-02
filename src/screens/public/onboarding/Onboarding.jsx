import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
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
  useEffect(() => {
    const token = localStorage.getItem("shubhtalk_customer_token");
    const userData = localStorage.getItem("userData");
    
    // Only redirect if user was already logged in before coming to this page
    if (token && userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        // Only redirect if user is already registered
        if (parsedUserData.isRegister) {
          navigate(PATH.privateRoutes.HOME.path || "/");
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []); // Run only once on mount

  const isLoadingScreen = currentStep === 6;

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
    />,
    <BirthDetailsScreen
      key="birth"
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkip}
      formData={formData}
      updateFormData={updateFormData}
    />,
    <GuidanceScreen
      key="guidance"
      onNext={handleNext}
      onSkip={handleSkip}
      formData={formData}
      updateFormData={updateFormData}
    />,
    <LoadingScreen key="loading" onComplete={() => navigate(PATH.privateRoutes.HOME.path || "/")} />,
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
