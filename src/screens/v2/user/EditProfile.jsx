import {
  ChevronLeft,
  Upload,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./EditProfile.module.css";

const EditProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "Priya Gupta",
    profilePhoto: "",
    identity: "Female",
    relation: "Self",
    birthDate: "01/01/2002",
    birthTime: "12:01 PM",
    unknownBirthTime: false,
    placeOfBirth: "New Delhi, India",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    navigate("/profile");
  };

  return (
    <div className={styles.editProfile}>
      <div className={styles.editProfileHeader}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.pageTitle}>Edit Profile</h1>
      </div>

      <div className={styles.editProfileContainer}>
        <div className={styles.profilePhotoSection}>
          <div className={styles.profilePhotoCircle}>
            <button className={styles.uploadIconButton}>
              <Upload size={24} />
            </button>
          </div>
        </div>

        <div className={styles.formSection}>
          <label className={styles.formLabel}>Name</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder="Enter here"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
          />
        </div>

        <div className={styles.formSection}>
          <label className={styles.formLabel}>Identity</label>
          <div className={styles.identityButtons}>
            <button
              className={`${styles.identityBtn} ${formData.identity === "Male" ? styles.active : ""}`}
              onClick={() => handleInputChange("identity", "Male")}
            >
              Male
            </button>
            <button
              className={`${styles.identityBtn} ${formData.identity === "Female" ? styles.active : ""}`}
              onClick={() => handleInputChange("identity", "Female")}
            >
              Female
            </button>
            <button
              className={`${styles.identityBtn} ${formData.identity === "Others" ? styles.active : ""}`}
              onClick={() => handleInputChange("identity", "Others")}
            >
              Others
            </button>
          </div>
        </div>

        <div className={styles.formSection}>
          <label className={styles.formLabel}>Relation</label>
          <div className={styles.inputWithIcon}>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Select relation"
              value={formData.relation}
              onChange={(e) => handleInputChange("relation", e.target.value)}
            />
            <ChevronDown size={20} className={styles.inputIcon} />
          </div>
        </div>

        <div className={styles.formSection}>
          <label className={styles.formLabel}>Birth Date</label>
          <div className={styles.inputWithIcon}>
            <input
              type="text"
              className={styles.formInput}
              placeholder="DD/MM/YYYY"
              value={formData.birthDate}
              onChange={(e) => handleInputChange("birthDate", e.target.value)}
            />
            <Calendar size={20} className={styles.inputIcon} />
          </div>
        </div>

        <div className={styles.formSection}>
          <label className={styles.formLabel}>Birth Time</label>
          <div className={styles.inputWithIcon}>
            <input
              type="text"
              className={styles.formInput}
              placeholder="-"
              value={formData.birthTime}
              onChange={(e) => handleInputChange("birthTime", e.target.value)}
              disabled={formData.unknownBirthTime}
            />
            <Clock size={20} className={styles.inputIcon} />
          </div>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.unknownBirthTime}
              onChange={(e) =>
                handleInputChange("unknownBirthTime", e.target.checked)
              }
            />
            <span>Don't know the exact time of birth</span>
          </label>
        </div>

        <div className={styles.formSection}>
          <label className={styles.formLabel}>Place of Birth</label>
          <div className={styles.inputWithIcon}>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Enter location"
              value={formData.placeOfBirth}
              onChange={(e) =>
                handleInputChange("placeOfBirth", e.target.value)
              }
            />
            <MapPin size={20} className={styles.inputIcon} />
          </div>
        </div>

        <button className={styles.submitButton} onClick={handleSubmit}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
