import { Trash2 } from "lucide-react";
import styles from "./ProfileListingModal.module.scss";

const ProfileListingModal = ({
  isOpen,
  onClose,
  profiles = [],
  selectedProfileId,
  onSelectProfile,
  onDeleteProfile,
  onEditProfile,
  onAddProfile,
  onStartCall,
  startCallMode = false,
  title = "Select Profile",
  showAddButton = true,
  showDeleteButton = true,
  showEditButton = true,
  hasNestedModal = false, // New prop to indicate if nested modal is open
  callModeBtnTitle,
  startCallModeBtnType,
}) => {
  if (!isOpen) return null;

  const formatProfileDisplay = (profile) => {
    if (!profile)
      return { initials: "", birthDate: "", birthTime: "", relation: "" };

    const initials = profile.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 1);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const birthDate = `${String(profile.day).padStart(2, "0")} ${monthNames[profile.month - 1]} ${profile.year}`;

    console.log(`🕐 ${profile.name}: hour=${profile.hour}, min=${profile.min}`);

    const hour12 =
      profile.hour > 12
        ? profile.hour - 12
        : profile.hour === 0
          ? 12
          : profile.hour;
    const meridiem = profile.hour >= 12 ? "PM" : "AM";
    
    console.log(`   → Converted: ${hour12}:${profile.min} ${meridiem}`);
    
    const birthTime = `${String(hour12).padStart(2, "0")}:${String(profile.min).padStart(2, "0")} ${meridiem}`;

    return {
      initials,
      birthDate,
      birthTime,
      relation: profile.relation,
    };
  };

  const handleDeleteClick = (e, profileId) => {
    e.stopPropagation();
    if (onDeleteProfile) {
      onDeleteProfile(profileId);
    }
  };

  const handleEditClick = (e, profile) => {
    e.stopPropagation();
    if (onEditProfile) {
      onEditProfile(profile);
    }
  };

  // Prevent closing when nested modal is open
  const handleOverlayClick = () => {
    if (!hasNestedModal) {
      onClose();
    }
  };

  return (
    <div
      className={`${styles.modalOverlay} ${hasNestedModal ? styles.dimmed : ""}`}
      onClick={handleOverlayClick}
    >
      <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHandle}></div>
        <div className={styles.sheetContent}>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
          <h2 className={styles.sheetTitle}>{title}</h2>

          <div className={styles.profileList}>
            {profiles.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No profiles found. Add your first profile to get started.</p>
              </div>
            ) : (
              profiles.map((profile) => {
                const formatted = formatProfileDisplay(profile);
                const isSelected = selectedProfileId === profile._id;

                return (
                  <div
                    key={profile._id}
                    className={`${styles.profileItem} ${isSelected ? styles.selected : ""}`}
                    onClick={() => onSelectProfile && onSelectProfile(profile)}
                  >
                    <div className={styles.profileAvatar}>
                      {formatted.initials}
                    </div>

                    <div className={styles.profileInfo}>
                      <span className={styles.relationBadge}>
                        {formatted.relation}
                      </span>
                      <h3 className={styles.profileName}>{profile.name}</h3>
                      <p className={styles.profileMeta}>
                        {formatted.birthDate} • {formatted.birthTime}
                      </p>
                      <p className={styles.profileLocation}>{profile.place}</p>
                    </div>

                    <div className={styles.profileActions}>
                      <div className={styles.radioBtn}>
                        {isSelected ? "●" : "○"}
                      </div>
                      {showEditButton && (
                        <button
                          className={styles.editBtn}
                          onClick={(e) => handleEditClick(e, profile)}
                          title="Edit profile"
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                      {showDeleteButton && formatted.relation?.toLowerCase() !== "self" && (
                        <button
                          className={styles.deleteBtn}
                          onClick={(e) => handleDeleteClick(e, profile._id)}
                          title="Delete profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.startCallBtnContainer}>
            {showAddButton && (
              <button
                className={styles.addProfileBtn}
                onClick={() => {
                  if (onAddProfile) {
                    onAddProfile();
                  }
                }}
              >
                + Add Profile
              </button>
            )}
            {startCallMode && (
              <button
                className={`${styles.startCallBtn} ${!selectedProfileId ? styles.disabled : ""}`}
                onClick={onStartCall}
                disabled={!selectedProfileId}
              >
                {startCallModeBtnType
                  ? startCallModeBtnType === "audio"
                    ? "Start Call"
                    : "Start Chat"
                  : callModeBtnTitle}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileListingModal;
