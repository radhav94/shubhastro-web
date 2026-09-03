import { useState, useEffect } from "react";
import { trackEvent } from "../../../../utils/analytics";
import AstroBirthForm from "../forms/AstroBirthForm";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import useFormFromLocalStorage from "../useFormFromLocalStorage";
import { validateBirthPlace } from "../../../../utils/helper/birthPlaceCoords";
import { personNameRegex, PERSON_NAME_ERROR } from "../../../../utils/regex";
import styles from "./RashiCalc.module.scss";
import { setCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import BackButton from "../../../../component/UI/BackButton/BackButton";
import { GuestKundliAuthModal } from "../../../../component/UI/Profile";

const STORAGE_KEY = "rashi_moon_sign";

const initialFormState = {
  name: "",
  gender: "",
  dob: "",
  tob: "",
  place: "",
  lat: null,
  lng: null,
  isTimeUnknown: false,
};

const RashiCalc = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useFormFromLocalStorage(
    STORAGE_KEY,
    initialFormState
  );

  const [errors, setErrors] = useState({});
  // Guests are shown the sign-up (kundli + OTP) modal. When it's triggered by
  // "Show Results" we go to the report on success; when it's the on-open gate
  // we just let them use the form after signing in.
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const [pendingResult, setPendingResult] = useState(false);

  const handleChange = (key, value) => {
    setFormData((prev) => {
      if (key === "isTimeUnknown" && value === true) {
        return {
          ...prev,
          isTimeUnknown: true,
        };
      }

      return {
        ...prev,
        [key]: value,
      };
    });

    // clear error on change
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  useEffect(() => {
    trackEvent("calculator_opened", { calculator_name: "Rashi" });
  }, []);

  // Guests must sign up to use the Rashi calculator — show the sign-up popup as
  // soon as the page opens (covers the home-page card, the menu, and direct
  // URLs). Once signed in the form is usable normally.
  useEffect(() => {
    if (!localStorage.getItem("shubhtalk_customer_token")) {
      setShowGuestAuthModal(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    trackEvent("calculator_used", { calculator_name: "Rashi" });

    const newErrors = {};

    if (!formData.name?.trim()) newErrors.name = "Name is required";
    else if (formData.name.trim().length < 3)
      newErrors.name = "Name must be at least 3 characters";
    else if (!personNameRegex.test(formData.name.trim()))
      newErrors.name = PERSON_NAME_ERROR;
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    // Checks the coordinates, not just the text: a hand-typed place that was
    // never picked from the dropdown used to submit with lat: null.
    const placeError = validateBirthPlace(
      formData.place,
      formData.lat,
      formData.lng
    );
    if (placeError) newErrors.place = placeError;

    if (!formData.isTimeUnknown && !formData.tob) {
      newErrors.tob = "Time of birth is required or select unknown";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      ...formData,
      tob: formData.isTimeUnknown ? "12:00" : formData.tob,
    };
    // Persist the form so the report can read it after (guest) auth completes.
    dispatch(setCalculatorData({ key: STORAGE_KEY, data: payload }));

    // Guest users must sign up before seeing the result — show the auth popup
    // instead of navigating to the report.
    const isLoggedIn = Boolean(localStorage.getItem("shubhtalk_customer_token"));
    if (!isLoggedIn) {
      setPendingResult(true);
      setShowGuestAuthModal(true);
      return;
    }

    navigate("/rashi-calculator/report");
  };

  const handleGuestAuthSuccess = () => {
    setShowGuestAuthModal(false);
    // Only jump to the report when the popup was opened by "Show Results" and
    // the form is already filled/validated; the on-open gate just closes.
    if (pendingResult) {
      setPendingResult(false);
      navigate("/rashi-calculator/report");
    }
  };

  return (
    <>
      <BackButton />
      <div className={styles.page}>
      <div className={styles.hero}>
        <h1>Rashi/Moon Sign Calculator</h1>
        <p>Find Your Moon Sign & Unlock Life's Mysteries</p>
      </div>

      <div className={styles.infoCard}>
        <h3>What is Rashi/Moon Sign?</h3>
        <p>
          Ever notice how some days flow effortlessly, while others feel like a
          constant uphill climb? That's because your Rashi, or moon sign, are
          quietly shaping the emotional rhythm of your life. Using a Rashi/Moon
          Sign calculator can make you understand the shape of your emotions.
        </p>
      </div>

      <AstroBirthForm
        title="Rashi Calculator"
        submitText="Show Results"
        formData={formData}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onReset={() => {
          setFormData(initialFormState);
          setErrors({});
        }}
      />
    </div>

    <GuestKundliAuthModal
      isOpen={showGuestAuthModal}
      onClose={() => setShowGuestAuthModal(false)}
      onSuccess={handleGuestAuthSuccess}
      title="Sign up to see your Rashi report"
    />
    </>
  );
};

export default RashiCalc;
