import { useState } from "react";
import { useDispatch } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import styles from "./Onboarding.module.scss";
import LanguageSelector from "../../../component/LanguageSelector";
import { Heart, Rocket, DollarSign, Plus, User, HelpCircle, Eye } from "lucide-react";
import { registerUser } from "../../../services/appServices/authService";
import { useCreateKundliMutation } from "../../../services/appServices/kundliServicesNew";
import { useGetExpertiseFiltersQuery } from "../../../redux/api/astrologer/astrologerApi";
import { setEmail } from "../../../redux/auth/authSlice";

// Static mapping for icon and color by slug (API doesn't provide these)
const slugStyleMap = {
  "face-reading": { icon: Eye, color: "#FFF4E0" },
  "love-relationships": { icon: Heart, color: "#FFE5F0" },
  "career-growth": { icon: Rocket, color: "#E5E0FF" },
  "wealth-finances": { icon: DollarSign, color: "#E5F9E5" },
  "health-well-being": { icon: Plus, color: "#E0F2FF" },
  "self-understanding": { icon: User, color: "#FFE5F0" },
  "others": { icon: HelpCircle, color: "#FFF4E0" },
};

const defaultStyle = { icon: HelpCircle, color: "#F0F0F0" };

// Fallback options if API fails
const fallbackOptions = [
  { id: "face-reading", label: "Face Reading", icon: Eye, color: "#FFF4E0" },
  { id: "love-relationships", label: "Love & Relationships", icon: Heart, color: "#FFE5F0" },
  { id: "career-growth", label: "Career & Growth", icon: Rocket, color: "#E5E0FF" },
  { id: "wealth-finances", label: "Wealth & Finances", icon: DollarSign, color: "#E5F9E5" },
  { id: "health-well-being", label: "Health & Well-Being", icon: Plus, color: "#E0F2FF" },
  { id: "self-understanding", label: "Self-understanding", icon: User, color: "#FFE5F0" },
  { id: "others", label: "Others", icon: HelpCircle, color: "#FFF4E0" },
];

// Validation schema — no min/max constraints, guidance is optional
const validationSchema = Yup.object({
  guidance: Yup.array().of(Yup.string()),
});

const GuidanceScreen = ({ onNext, onSkip, formData, updateFormData, currentStep = 2, totalSteps = 3, onStepChange }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [createKundli] = useCreateKundliMutation();
  const { data: filtersData } = useGetExpertiseFiltersQuery();

  // Extract skill options from API response, fallback to static
  const skillList = filtersData?.data?.find(f => f.title === "Skill")?.list;
  const options = skillList
    ? skillList.map(item => {
        const style = slugStyleMap[item.slug] || defaultStyle;
        return { id: item.slug, label: item.title, icon: style.icon, color: style.color };
      })
    : fallbackOptions;

  const initialValues = {
    guidance: formData.guidance || [],
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    updateFormData({ guidance: values.guidance });

    try {
      // Check if token exists
      const token = localStorage.getItem("shubhtalk_customer_token");
      if (!token) {
        console.error("❌ No authentication token found");
        toast.error("Please complete login and OTP verification first");
        setLoading(false);
        return;
      }

      // Get name from formData and split into first/last name
      const fullName = formData.name || "";
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" "); 

      // Use this firstName as lastName if no last name provided
      // const lastName = nameParts.slice(1).join(" ") || firstname; 


      // Format phone number with 91 prefix (without +)
      let phoneNumber = formData.phoneNumber || "";
      // Remove any existing +91 or 91 prefix to avoid duplication
      phoneNumber = phoneNumber.replace(/^\+?91/, "");
      // Add 91 prefix (without +)
      phoneNumber = `91${phoneNumber}`;
      
      // Prepare registration payload with all fields
      const payload = {
        firstName: firstName,
        lastName: lastName,
        dateOfBirth: formData.birthDate || "",
        place: formData.birthPlace || "",
        phoneNumber: phoneNumber,
        password: "TempPass@123", // Temporary password - backend requires non-empty
        gender: formData.identity 
          ? formData.identity.toLowerCase() === "others" 
            ? "other" 
            : formData.identity.toLowerCase()
          : "female",
        languagePreferences: ["en"],
        role: "CUSTOMER",
        lat: formData.latitude || 0,
        lon: formData.longitude || 0,
      };

      console.log("📤 Registering user with payload:", payload);
      console.log("🔑 Token:", token ? "Present" : "Missing");
      const response = await registerUser(payload);

      console.log("✅ Registration response:", response);
      console.log("📊 Status code:", response?.data?.statusCode);

      if (response?.data?.statusCode === 201 || response?.data?.success) {
        toast.success("Registration successful!");
        localStorage.setItem("shubhtalk_show_welcome_bonus", "true");
        
        // Update user data in localStorage
        const currentUserData = localStorage.getItem("userData");
        const parsedUserData = currentUserData ? JSON.parse(currentUserData) : {};
        
        const updatedUserData = {
          ...parsedUserData,
          isRegister: true,
          firstName: firstName,
          lastName: lastName,
          place: formData.birthPlace,
          dateOfBirth: formData.birthDate,
          gender: formData.identity,
        };
        localStorage.setItem("userData", JSON.stringify(updatedUserData));
        
        // IMPORTANT: Also update shubhtalk_user for TopBar to show name
        const currentUser = localStorage.getItem("shubhtalk_user");
        const parsedUser = currentUser ? JSON.parse(currentUser) : {};
        
        const updatedUser = {
          ...parsedUser,
          firstName: firstName,
          lastName: lastName,
          place: formData.birthPlace,
        };
        localStorage.setItem("shubhtalk_user", JSON.stringify(updatedUser));
        
        // Store email in Redux if user provided one
        if (formData.email) {
          dispatch(setEmail(formData.email));
        }
        
        // Dispatch event to notify TopBar to re-render
        window.dispatchEvent(new Event("auth-change"));
        
        console.log("✅ User data updated in localStorage");

        // Create Kundali profile if birth details are provided
        if (formData.birthDate && formData.birthPlace && formData.latitude && formData.longitude) {
          try {
            console.log("📤 Creating Kundali profile...");
            
            // Parse birth date and time
            const dateObj = new Date(formData.birthDate);
            const timeObj = formData.birthTime ? formData.birthTime.split(":") : ["0", "0"];
            
            const kundliPayload = {
              name: fullName || firstName,
              gender: formData.identity ? formData.identity.toLowerCase() : "female",
              relation: "Self",
              day: dateObj.getDate(),
              month: dateObj.getMonth() + 1,
              year: dateObj.getFullYear(),
              hour: formData.unknownBirthTime ? "00" : String(parseInt(timeObj[0])).padStart(2, "0"),
              min: formData.unknownBirthTime ? "00" : String(parseInt(timeObj[1])).padStart(2, "0"),
              second: "00",
              place: formData.birthPlace,
              lat: formData.latitude,
              lon: formData.longitude,
              tzone: formData.timezone ?? 5.5,
            };

            console.log("📤 Kundali payload:", kundliPayload);
            const kundliResponse = await createKundli(kundliPayload).unwrap();
            console.log("✅ Kundali profile created:", kundliResponse);
            toast.success("Birth chart created successfully!");
          } catch (kundliError) {
            console.error("❌ Failed to create Kundali profile:", kundliError);
            // Don't block the flow if Kundali creation fails
            toast.error("Birth chart creation failed, but you can add it later from your profile");
          }
        }
        
        onNext();
      } else {
        console.warn("⚠️ Unexpected response:", response?.data);
        toast.error(response?.data?.message || "Registration failed");
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
      console.error("📋 Error response:", error.response?.data);
      console.error("📋 Error status:", error.response?.status);
      
      // Check if it's an authorization error
      if (error.response?.status === 401 || error.response?.data?.message?.includes("Authorization")) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to register. Please try again."
        );
      }
    } finally {
      // Always reset loading regardless of success/failure
      setLoading(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      validateOnChange={true}
      validateOnBlur={true}
    >
      {({ values, setFieldValue }) => {
        const toggleOption = (id) => {
          const currentGuidance = values.guidance;
          const newGuidance = currentGuidance.includes(id)
            ? currentGuidance.filter((item) => item !== id)
            : [...currentGuidance, id];
          setFieldValue("guidance", newGuidance);
        };

        return (
          <Form className={styles.guidanceScreen}>
            <div className={styles.header}>
              <div className={styles.progressDots}>
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <span
                    key={index}
                    className={
                      index === currentStep ? styles.dotActive : styles.dotInactive
                    }
                    onClick={() => onStepChange && onStepChange(index)}
                    style={{ cursor: onStepChange ? 'pointer' : 'default' }}
                  ></span>
                ))}
              </div>

              {/* Language Translator */}
              <LanguageSelector style={{ position: 'relative', top: 'auto', right: 'auto' }} />
            </div>

            <div className={styles.content}>
              <h1 className={styles.title}>What brings you here today?</h1>
              <p className={styles.subtitle}>
                Choose what you'd like guidance on love, career, health or more.
              </p>

              <div className={styles.optionsGrid}>
                {options.map((option) => {
                  const Icon = option.icon;
                  const isSelected = values.guidance.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`${styles.optionCard} ${isSelected ? styles.selected : ""}`}
                      style={{ backgroundColor: option.color }}
                      onClick={() => toggleOption(option.id)}
                    >
                      <span className={styles.optionLabel}>{option.label}</span>
                      <div className={styles.optionIcon}>
                        <Icon size={24} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              type="submit"
              className={styles.otpprimaryBtn}
              disabled={loading}
            >
              {loading ? "Saving..." : "Next"}
            </button>
          </Form>
        );
      }}
    </Formik>
  );
};

export default GuidanceScreen;
