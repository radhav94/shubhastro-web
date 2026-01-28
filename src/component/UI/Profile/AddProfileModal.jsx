import { useState } from "react";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import styles from "./AddProfileModal.module.scss";
import { Toast } from "../../index";
import ProfileListingModal from "./ProfileListingModal";

const AddProfileModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  title = "Add Profile",
  // Profile listing props
  showProfileListing = false,
  profiles = [],
  selectedProfileId = null,
  onSelectProfile = null,
  onDeleteProfile = null,
}) => {
  const [showListing, setShowListing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    identity: "Male",
    relation: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    unknownBirthTime: false,
    latitude: null,
    longitude: null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.birthPlace) {
      Toast.error("Please enter birth place");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      Toast.error("Please select a valid location from the dropdown");
      return;
    }

    try {
      await onSubmit(formData);
      
      // Reset form
      setFormData({
        name: "",
        identity: "Male",
        relation: "",
        birthDate: "",
        birthTime: "",
        birthPlace: "",
        unknownBirthTime: false,
        latitude: null,
        longitude: null,
      });
    } catch (err) {
      // Error handling is done in parent
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      identity: "Male",
      relation: "",
      birthDate: "",
      birthTime: "",
      birthPlace: "",
      unknownBirthTime: false,
      latitude: null,
      longitude: null,
    });
    onClose();
  };

  const handleViewProfiles = () => {
    setShowListing(true);
  };

  const handleCloseListing = () => {
    setShowListing(false);
  };

  const handleSelectFromListing = (profile) => {
    if (onSelectProfile) {
      onSelectProfile(profile);
    }
    setShowListing(false);
    onClose();
  };

  const handleDeleteFromListing = (profileId) => {
    if (onDeleteProfile) {
      onDeleteProfile(profileId);
    }
  };

  if (!isOpen) return null;

  // Show profile listing modal if requested
  if (showListing && showProfileListing) {
    return (
      <ProfileListingModal
        isOpen={showListing}
        onClose={handleCloseListing}
        profiles={profiles}
        selectedProfileId={selectedProfileId}
        onSelectProfile={handleSelectFromListing}
        onDeleteProfile={handleDeleteFromListing}
        onAddProfile={() => setShowListing(false)}
        title="Select Profile"
        showAddButton={true}
        showDeleteButton={true}
      />
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.sideSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHandle}></div>

        <div className={styles.sheetContent}>
          <button className={styles.closeBtn} onClick={handleClose}>
            ×
          </button>
          <h2 className={styles.sheetTitle}>{title}</h2>

          <form onSubmit={handleSubmit} className={styles.profileForm}>
            <div className={styles.formGroup}>
              <label>Name</label>
              <input
                type="text"
                placeholder="Enter here"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Identity</label>
              <div className={styles.identityButtons}>
                <button
                  type="button"
                  className={formData.identity === "Male" ? styles.active : ""}
                  onClick={() => setFormData({ ...formData, identity: "Male" })}
                >
                  Male
                </button>
                <button
                  type="button"
                  className={
                    formData.identity === "Female" ? styles.active : ""
                  }
                  onClick={() =>
                    setFormData({ ...formData, identity: "Female" })
                  }
                >
                  Female
                </button>
                <button
                  type="button"
                  className={
                    formData.identity === "Others" ? styles.active : ""
                  }
                  onClick={() =>
                    setFormData({ ...formData, identity: "Others" })
                  }
                >
                  Others
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Relation</label>
              <select
                value={formData.relation}
                onChange={(e) =>
                  setFormData({ ...formData, relation: e.target.value })
                }
                required
              >
                <option value="">Select relation</option>
                <option value="Self">Self</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Friend">Friend</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Birth Date</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Birth Time</label>
              <input
                type="time"
                value={formData.birthTime}
                onChange={(e) =>
                  setFormData({ ...formData, birthTime: e.target.value })
                }
                disabled={formData.unknownBirthTime}
              />
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.unknownBirthTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unknownBirthTime: e.target.checked,
                    })
                  }
                />
                Don't know the exact time of birth
              </label>
            </div>

            <div className={styles.formGroup}>
              <label>Place of Birth</label>
              <LocationSearch
                value={formData.birthPlace}
                onChange={(e) =>
                  setFormData({ ...formData, birthPlace: e.target.value })
                }
                onPlaceSelect={(place) =>
                  setFormData({
                    ...formData,
                    birthPlace: place.address,
                    latitude: place.lat,
                    longitude: place.lng,
                  })
                }
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProfileModal;
