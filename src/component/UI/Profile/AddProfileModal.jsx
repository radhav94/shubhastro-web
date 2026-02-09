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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6.75 14C9.37335 14 11.5 11.8734 11.5 9.25C11.5 6.62665 9.37335 4.5 6.75 4.5C4.12665 4.5 2 6.62665 2 9.25C2 11.8734 4.12665 14 6.75 14Z" stroke="#000000" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14 5V2M14 2H11M14 2L10.125 5.875" stroke="#000000" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 10.5C10.6234 10.5 12.75 8.37335 12.75 5.75C12.75 3.12665 10.6234 1 8 1C5.37665 1 3.25 3.12665 3.25 5.75C3.25 8.37335 5.37665 10.5 8 10.5Z" stroke="#000000" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 10.5V15M9.8125 13H6.1875" stroke="#000000" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <g clip-path="url(#clip0_5605_4231)">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M2.62188 1.22009C2.74075 1.22009 2.85474 1.17287 2.93879 1.08882C3.02284 1.00477 3.07006 0.890775 3.07006 0.77191C3.07006 0.653046 3.02284 0.539049 2.93879 0.454999C2.85474 0.370949 2.74075 0.32373 2.62188 0.32373H0.829161C0.710297 0.32373 0.5963 0.370949 0.51225 0.454999C0.4282 0.539049 0.380981 0.653046 0.380981 0.77191V2.56463C0.380981 2.6835 0.4282 2.79749 0.51225 2.88154C0.5963 2.96559 0.710297 3.01281 0.829161 3.01281C0.948026 3.01281 1.06202 2.96559 1.14607 2.88154C1.23012 2.79749 1.27734 2.6835 1.27734 2.56463V1.85382L3.85572 4.4322C3.90197 4.47854 3.95781 4.51418 4.01931 4.53662C3.68903 5.17358 3.51715 5.88076 3.51824 6.59825C3.51824 8.92206 5.28721 10.8331 7.55186 11.0576V13.7378H6.6555C6.53664 13.7378 6.42264 13.785 6.33859 13.869C6.25454 13.9531 6.20732 14.0671 6.20732 14.1859C6.20732 14.3048 6.25454 14.4188 6.33859 14.5028C6.42264 14.5869 6.53664 14.6341 6.6555 14.6341H7.55186V15.5619C7.55186 15.6807 7.59908 15.7947 7.68313 15.8788C7.76718 15.9628 7.88118 16.01 8.00004 16.01C8.11891 16.01 8.2329 15.9628 8.31695 15.8788C8.401 15.7947 8.44822 15.6807 8.44822 15.5619V14.6341H9.34458C9.46345 14.6341 9.57744 14.5869 9.66149 14.5028C9.74554 14.4188 9.79276 14.3048 9.79276 14.1859C9.79276 14.0671 9.74554 13.9531 9.66149 13.869C9.57744 13.785 9.46345 13.7378 9.34458 13.7378H8.44822V11.0576C10.7129 10.8331 12.4818 8.92206 12.4818 6.59825C12.4828 5.89589 12.3181 5.20321 12.0009 4.57651L12.9439 3.63937L13.5848 4.28026C13.6265 4.32187 13.6759 4.35488 13.7303 4.37739C13.7847 4.39989 13.843 4.41147 13.9018 4.41145C13.9607 4.41143 14.019 4.39981 14.0734 4.37726C14.1277 4.35472 14.1772 4.32168 14.2188 4.28004C14.2604 4.2384 14.2934 4.18897 14.3159 4.13458C14.3384 4.08018 14.35 4.02189 14.3499 3.96302C14.3499 3.90415 14.3383 3.84586 14.3158 3.79148C14.2932 3.73711 14.2602 3.6877 14.2185 3.64609L13.5799 3.00743L14.7227 1.87174V2.56463C14.7227 2.6835 14.77 2.79749 14.854 2.88154C14.9381 2.96559 15.0521 3.01281 15.1709 3.01281C15.2898 3.01281 15.4038 2.96559 15.4878 2.88154C15.5719 2.79749 15.6191 2.6835 15.6191 2.56463V0.77191C15.6191 0.653046 15.5719 0.539049 15.4878 0.454999C15.4038 0.370949 15.2898 0.32373 15.1709 0.32373H13.3782C13.2593 0.32373 13.1453 0.370949 13.0613 0.454999C12.9772 0.539049 12.93 0.653046 12.93 0.77191C12.93 0.890775 12.9772 1.00477 13.0613 1.08882C13.1453 1.17287 13.2593 1.22009 13.3782 1.22009H14.1069L12.9462 2.37371L12.3169 1.74446C12.2328 1.66042 12.1188 1.61324 11.9999 1.61328C11.881 1.61332 11.767 1.66059 11.683 1.74469C11.5989 1.82878 11.5517 1.94282 11.5518 2.06171C11.5518 2.1806 11.5991 2.2946 11.6832 2.37864L12.3102 3.00519L11.5053 3.80519C11.0859 3.27789 10.5528 2.85214 9.94589 2.55972C9.33894 2.2673 8.67376 2.11577 8.00004 2.11645C7.32647 2.11573 6.66143 2.26716 6.05456 2.55942C5.44769 2.85167 4.91467 3.27722 4.49527 3.8043L4.48945 3.79847L1.91107 1.22009H2.62188ZM8.00004 3.01281C7.04912 3.01281 6.13715 3.39056 5.46475 4.06296C4.79235 4.73536 4.4146 5.64733 4.4146 6.59825C4.4146 7.54917 4.79235 8.46114 5.46475 9.13354C6.13715 9.80594 7.04912 10.1837 8.00004 10.1837C8.95096 10.1837 9.86293 9.80594 10.5353 9.13354C11.2077 8.46114 11.5855 7.54917 11.5855 6.59825C11.5855 5.64733 11.2077 4.73536 10.5353 4.06296C9.86293 3.39056 8.95096 3.01281 8.00004 3.01281Z" fill="black"/>
                    </g>
                  </svg>
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
                {/* <option value="Self">Self</option> */}
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
                max={new Date().toISOString().split('T')[0]}
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
