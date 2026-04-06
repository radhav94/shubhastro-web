import { useState } from "react";
import styles from "./PanchangInputCard.module.scss";

import PrimaryButton from "../../../PrimaryButton";
import PrimaryText from "../../../PrimaryText";
import LocationSearch from "../../../../utils/location/locationSearchVedic";
import ErrorText from "../../../ErrorText";
import { appColors } from "../../../../utils/theme";

const PanchangInputCard = ({ imageSrc, title, onTap, initialDate, initialLocation, initialLatitude, initialLongitude }) => {
  const [formData, setFormData] = useState({
    dateOfBirth: initialDate || "",
    location: initialLocation || "",
    latitude: initialLatitude || "19.132",
    longitude: initialLongitude || "72.342",
  });
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", // Thursday
    year: "numeric", // 2025
    month: "long", // November
    day: "numeric", // 13
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceSelect = (place) => {
    setFormData((prev) => ({
      ...prev,
      location: place.address,
      latitude: place.lat || 19.132,
      longitude: place.lng || 72.342,
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = "Date is required!";
    // if (!formData.location) newErrors.location = "Location is required!";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    onTap(formData);
  };

  const Userdob = new Date(formData?.dateOfBirth).toLocaleDateString("en-US", {
    weekday: "long", // Thursday
    year: "numeric", // 2025
    month: "long", // November
    day: "numeric", // 13
  });

  return (
    <div className={styles.panchangWidget}>
      {imageSrc && (
        <div className={styles.leftSide}>
          <img src={imageSrc} alt="Panchang Widget" />
        </div>
      )}

      <div className={styles.rightSide}>
        {title && (
          <PrimaryText isCenter isSemiBold size_28>
            {title}
          </PrimaryText>
        )}
        <PrimaryText isCenter size_20 color={appColors.greyDark}>
          {formData?.location || initialLocation || "Mumbai, India"},&nbsp;
          {formData.dateOfBirth ? Userdob : today}{" "}
        </PrimaryText>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputBox}>
            {/* Date of Birth */}
            <div className={styles.inputControl}>
              <label htmlFor="dateOfBirth" className={styles.label}>
                Date <span className={styles.requiredMark}>*</span>
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className={styles.inputField}
                placeholder="Enter the Date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                onClick={(e) => {
                  // Manually show date picker
                  if (e.target.showPicker) {
                    e.target.showPicker();
                  }
                }}
                // max={new Date().toISOString().split("T")[0]}
              />
              {errors.dateOfBirth && (
                <ErrorText>{errors.dateOfBirth}</ErrorText>
              )}
            </div>

            {/*  Location (custom search) */}
            <div className={styles.inputControl}>
              <label htmlFor="location" className={styles.label}>
                Location
              </label>
              <LocationSearch
                value={formData.location}
                onChange={(e) =>
                  handleInputChange({
                    target: { name: "location", value: e.target.value },
                  })
                }
                onPlaceSelect={handlePlaceSelect}
              />
              {errors.location && <ErrorText>{errors.location}</ErrorText>}
            </div>

            {/* Submit Button */}
            <div className={styles.submitButtonWrapper}>
              <PrimaryButton
                width={"100%"}
                title="Submit"
                type="submit"
                textColor="#ffffff"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PanchangInputCard;
