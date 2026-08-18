import { ChevronLeft, Camera, Calendar, Clock, MapPin, ChevronDown } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import styles from './AddProfile.module.scss'
import Toast from '../../../component/toast'

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
    <div className={styles.addProfilePage}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.title}>Edit Profile</h1>
      </div>

      <div className={styles.content}>
        {/* Avatar Section */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarCircle}>
            <div className={styles.avatarIcon}>
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="20" r="12" fill="#F3AD3D" />
                <path d="M10 50C10 38 18 32 30 32C42 32 50 38 50 50" fill="#F3AD3D" />
              </svg>
            </div>
          </div>
          <button className={styles.cameraButton}>
            <Camera size={20} />
          </button>
        </div>

        {/* Name Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Name</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Enter here"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
          />
        </div>

        {/* Gender Selection */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Your Identity</label>
          <div className={styles.genderButtons}>
            <button
              className={`${styles.identityBtn} ${formData.identity === "Male" ? styles.active : ""}`}
              onClick={() => handleInputChange("identity", "Male")}
            >
              <span className={styles.genderIcon}>♂</span>
              <span>Male</span>
            </button>
            <button
              className={`${styles.identityBtn} ${formData.identity === "Female" ? styles.active : ""}`}
              onClick={() => handleInputChange("identity", "Female")}
            >
              <span className={styles.genderIcon}>♀</span>
              <span>Female</span>
            </button>
            <button
              className={`${styles.identityBtn} ${formData.identity === "Others" ? styles.active : ""}`}
              onClick={() => handleInputChange("identity", "Others")}
            >
              <span className={styles.genderIcon}>⚥</span>
              <span>Others</span>
            </button>
          </div>
        </div>

        {/* Relation Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Relation</label>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={formData.relation}
              onChange={(e) => handleInputChange("relation", e.target.value)}
            />
            <ChevronDown size={20} className={styles.inputIcon} />
          </div>
        </div>

        {/* Birth Date Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Birth Date</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              className={styles.input}
              placeholder="01/01/2002"
              value={formData.birthDate}
              onChange={(e) => handleInputChange("birthDate", e.target.value)}
            />
            <Calendar size={20} className={styles.inputIcon} />
          </div>
        </div>

        {/* Birth Time Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Birth Time</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              className={styles.input}
              placeholder="12:01 PM"
              value={formData.birthTime}
              onChange={(e) => handleInputChange("birthTime", e.target.value)}
              // A natively disabled input fires no events, so tapping it did
              // nothing at all. Keep it tappable and say why it's locked.
              readOnly={formData.unknownBirthTime}
              aria-disabled={formData.unknownBirthTime || undefined}
              onClick={() => {
                if (formData.unknownBirthTime) {
                  Toast.info("Uncheck “Don’t know the exact time of birth” to pick a time");
                }
              }}
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

        {/* Place of Birth Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Place of Birth</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              className={styles.input}
              placeholder="New Delhi, India"
              value={formData.placeOfBirth}
              onChange={(e) =>
                handleInputChange("placeOfBirth", e.target.value)
              }
            />
            <MapPin size={20} className={styles.inputIcon} />
          </div>
        </div>

        {/* Save Button */}
        <button 
          className={styles.saveButton} 
          onClick={handleSubmit}
        >
          {'Save Profile'}
          <ChevronLeft size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
