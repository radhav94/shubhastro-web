import { useState } from "react";
import styles from "./Onboarding.module.scss";
import { Calendar, Clock, MapPin } from "lucide-react";
import LocationSearch from "../../../utils/location/locationSearchVedic";

const BirthDetailsScreen = ({
  onNext,
  onBack,
  onSkip,
  formData,
  updateFormData,
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

  const handleNext = () => {
    updateFormData(localData);
    onNext();
  };

  return (
    <div className={styles.birthDetailsScreen}>
      <div className={styles.header}>
        <div className={styles.progressDots}>
          <span className={styles.dotInactive}></span>
          <span className={styles.dotActive}></span>
          <span className={styles.dotInactive}></span>
        </div>
        <button className={styles.skipBtn} onClick={onSkip}>
          Skip for Now
        </button>
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>
          Share the moment the stars welcomed you
        </h1>

        <div className={styles.formGroup}>
          <label>Birth Date</label>
          <div className={styles.inputWrapper}>
            <input
              type="date"
              value={localData.birthDate}
              onClick={(e) => e.target.showPicker?.()}
              onChange={(e) =>
                setLocalData({ ...localData, birthDate: e.target.value })
              }
              className={styles.input}
            />
            <Calendar className={styles.inputIcon} size={20} />
          </div>
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
          <label>Place of Birth</label>
          <div className={styles.inputWrapper}>
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
        </div>
      </div>

      <button className={styles.otpprimaryBtn} onClick={handleNext}>
        Next
      </button>
    </div>
  );
};

export default BirthDetailsScreen;
