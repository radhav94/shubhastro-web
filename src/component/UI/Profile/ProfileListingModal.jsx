import { Trash2 } from "lucide-react";
import styles from "./ProfileListingModal.module.scss";

const ProfileListingModal = ({
  isOpen,
  onClose,
  profiles = [],
  selectedProfileId,
  onSelectProfile,
  onDeleteProfile,
  onAddProfile,
  title = "Select Profile",
  showAddButton = true,
  showDeleteButton = true,
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
      .slice(0, 2);

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

    const hour12 =
      profile.hour > 12
        ? profile.hour - 12
        : profile.hour === 0
          ? 12
          : profile.hour;
    const meridiem = profile.hour >= 12 ? "PM" : "AM";
    const birthTime = `${String(hour12).padStart(2, "0")}:${String(profile.min).padStart(2, "0")} ${meridiem}`;

    return {
      initials,
      birthDate,
      birthTime,
      relation: profile.relation || "Self",
    };
  };

  const handleDeleteClick = (e, profileId) => {
    e.stopPropagation();
    if (onDeleteProfile) {
      onDeleteProfile(profileId);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
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
                      {showDeleteButton && (
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
        </div>
      </div>
    </div>
  );
};

export default ProfileListingModal;
