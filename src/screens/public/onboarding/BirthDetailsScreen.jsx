import { useState } from "react";
import styles from "./Onboarding.module.scss";
import { Calendar, Clock, MapPin } from "lucide-react";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import WheelDatePicker from "../../../component/UI/WheelDatePicker/WheelDatePicker";

const BirthDetailsScreen = ({
  onNext,
  onBack,
  onSkip,
  formData,
  updateFormData,
  currentStep = 1,
  totalSteps = 3,
  onStepChange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localData, setLocalData] = useState({
    birthDate: formData.birthDate || "",
    birthTime: formData.birthTime || "",
    birthPlace: formData.birthPlace || "",
    unknownBirthTime: formData.unknownBirthTime || false,
    latitude: formData.latitude || null,
    longitude: formData.longitude || null,
  });

  const [errors, setErrors] = useState({
    birthDate: "",
    birthPlace: "",
  });

  const validateForm = () => {
    const newErrors = {
      birthDate: "",
      birthPlace: "",
    };

    if (!localData.birthDate) {
      newErrors.birthDate = "Birth date is required";
    }

    if (!localData.birthPlace) {
      newErrors.birthPlace = "Place of birth is required";
    }

    setErrors(newErrors);
    return !newErrors.birthDate && !newErrors.birthPlace;
  };

  const handleNext = () => {
    if (validateForm()) {
      updateFormData(localData);
      onNext();
    }
  };

  // Format date for display (DD/MM/YYYY)
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "DD/MM/YYYY";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className={styles.birthDetailsScreen}>
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
        {/* <button className={styles.skipBtn} onClick={onSkip}>
          Skip for Now
        </button> */}
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>
          Share the moment the stars welcomed you
        </h1>

        <div className={styles.formGroup}>
          <label>Birth Date<span className={styles.required}>*</span></label>
          <div 
            className={`${styles.inputWrapper} ${errors.birthDate ? styles.error : ""}`}
            onClick={() => setShowDatePicker(true)}
          >
            <input
              type="text"
              value={formatDateDisplay(localData.birthDate)}
              readOnly
              className={styles.input}
              placeholder="DD/MM/YYYY"
            />
            <Calendar className={styles.inputIcon} size={20} />
          </div>
          {errors.birthDate && (
            <span className={styles.errorText}>{errors.birthDate}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label>Birth Time</label>
          <div className={styles.inputWrapper}>
            <input
              type="time"
              value={localData.birthTime}
              onClick={(e) => e.target.showPicker?.()}
              onChange={(e) =>
                setLocalData({ ...localData, birthTime: e.target.value })
              }
              className={styles.input}
              placeholder="Select here"
              disabled={localData.unknownBirthTime}
            />
            <Clock className={styles.inputIcon} size={20} />
          </div>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={localData.unknownBirthTime}
              onChange={(e) =>
                setLocalData({
                  ...localData,
                  unknownBirthTime: e.target.checked,
                })
              }
            />
            Don't know the exact time of birth
          </label>
        </div>

        <div className={styles.formGroup}>
          <label>Place of Birth<span className={styles.required}>*</span></label>
          <div className={`${styles.inputWrapper} ${errors.birthPlace ? styles.error : ""}`}>
            <LocationSearch
              value={localData.birthPlace}
              onChange={(e) =>
                setLocalData({ ...localData, birthPlace: e.target.value })
              }
              onPlaceSelect={(place) =>
                setLocalData({
                  ...localData,
                  birthPlace: place.address,
                  latitude: place.lat,
                  longitude: place.lng,
                })
              }
              placeholder="Select here"
            />
            <MapPin className={styles.inputIcon} size={20} />
          </div>
          {errors.birthPlace && (
            <span className={styles.errorText}>{errors.birthPlace}</span>
          )}
        </div>
      </div>

      <button className={styles.otpprimaryBtn} onClick={handleNext}>
        Next
      </button>

      {showDatePicker && (
        <WheelDatePicker
          value={localData.birthDate}
          onChange={(date) => setLocalData({ ...localData, birthDate: date })}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
};

export default BirthDetailsScreen;
