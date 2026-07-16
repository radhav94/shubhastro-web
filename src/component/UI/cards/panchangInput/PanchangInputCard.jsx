import { useState, useEffect } from "react";
import styles from "./PanchangInputCard.module.scss";

import PrimaryButton from "../../../PrimaryButton";
import PrimaryText from "../../../PrimaryText";
import LocationSearch from "../../../../utils/location/locationSearchVedic";
import ErrorText from "../../../ErrorText";
import { appColors } from "../../../../utils/theme";
import DateTimePicker from "../../dateTimePicker/DateTimePicker";
import useUserLocation from "../../../../utils/hooks/useUserLocation";

const PanchangInputCard = ({
  imageSrc,
  title,
  onTap,
  initialDate,
  initialLocation,
  initialLatitude,
  initialLongitude,
  showForm = "",
}) => {
  const userLocation = useUserLocation();
  const [formData, setFormData] = useState({
    dateOfBirth: initialDate || "",
    location: initialLocation || "",
    latitude: initialLatitude || userLocation.lat,
    longitude: initialLongitude || userLocation.lon,
  });

  // Sync dateOfBirth when initialDate prop changes (e.g., on page load, refresh, profile change)
  useEffect(() => {
    if (initialDate) {
      setFormData((prev) => ({ ...prev, dateOfBirth: initialDate }));
    }
  }, [initialDate]);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", // Thursday
    year: "numeric", // 2025
    month: "long", // November
    day: "numeric", // 13
  });

  const [errors, setErrors] = useState({});

  // Update location when browser geolocation resolves
  useEffect(() => {
    if (userLocation.loaded && !userLocation.isDefault) {
      setFormData((prev) => ({
        ...prev,
        location: userLocation.locationName,
        latitude: userLocation.lat,
        longitude: userLocation.lon,
      }));
    }
  }, [userLocation.loaded, userLocation.lat, userLocation.lon, userLocation.locationName]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceSelect = (place) => {
    setFormData((prev) => ({
      ...prev,
      location: place.address,
      latitude: place.lat || userLocation.lat,
      longitude: place.lng || userLocation.lon,
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date is required!";
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
          <h1 className={styles.title}>
            {title}
          </h1>
        )}
        <p className={styles.titleText}>
          {(() => {
            const loc = formData?.location || initialLocation || (!userLocation.isDefault ? userLocation.locationName : "");
            return loc ? `${loc},\u00A0` : "";
          })()}
          {formData.dateOfBirth ? Userdob : today}{" "}
        </p>

       
             
            
        {showForm === "overall" && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputBox}>
              {/* Date of Birth */}
              <div className={styles.inputControl}>
                <label htmlFor="dateOfBirth" className={styles.label}>
                  Date <span className={styles.requiredMark}>*</span>
                </label>
                
                 {/* <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className={styles.inputField}
                placeholder="Enter the Date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                onClick={(e) => {
                  if (e.target.showPicker) {
                    e.target.showPicker();
                  }
                }}
              /> */}
              <DateTimePicker
                mode="date"
                selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                onChange={(date) => {
                  if (date) {
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, "0");
                    const dd = String(date.getDate()).padStart(2, "0");
                    setFormData((prev) => ({ ...prev, dateOfBirth: `${yyyy}-${mm}-${dd}` }));
                  } else {
                    setFormData((prev) => ({ ...prev, dateOfBirth: "" }));
                  }
                }}
                placeholder="dd/mm/yyyy"
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
        )}
      </div>
    </div>
  );
};

export default PanchangInputCard;
