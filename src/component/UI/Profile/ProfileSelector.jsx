import { useState } from "react";
import { Trash2 } from "lucide-react";
import styles from "./ProfileSelector.module.scss";
import { Toast } from "../../index";

const ProfileSelector = ({
  profiles = [],
  selectedProfileId = null,
  onSelect,
  onDelete,
  title = "Select Profile",
  filterOutId = null,
  showAddButton = true,
  onAddClick,
}) => {
  const [showModal, setShowModal] = useState(false);

  const filteredProfiles = filterOutId
    ? profiles.filter((p) => p._id !== filterOutId)
    : profiles;

  const handleSelectProfile = (profile) => {
    if (onSelect) {
      onSelect(profile);
    }
    setShowModal(false);
  };

  const handleDeleteProfile = async (e, profileId) => {
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this profile?")) {
      return;
    }

    try {
      if (onDelete) {
        await onDelete(profileId);
        Toast.success("Profile deleted successfully");
      }
    } catch (err) {
      const errorMessage =
        err?.data?.message || err?.message || "Failed to delete profile";
      Toast.error(errorMessage);
    }
  };

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
      relation: "Self",
    };
  };

  return (
    <>
      {/* Modal */}
      {showModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div
            className={styles.bottomSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.sheetHandle}></div>
            <div className={styles.sheetContent}>
              <button
                className={styles.closeBtn}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
              <h2 className={styles.sheetTitle}>{title}</h2>

              <div className={styles.profileList}>
                {filteredProfiles.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No profiles available</p>
                  </div>
                ) : (
                  filteredProfiles.map((profile) => {
                    const formatted = formatProfileDisplay(profile);

                    return (
                      <div
                        key={profile._id}
                        className={`${styles.profileItem} ${
                          selectedProfileId === profile._id
                            ? styles.selected
                            : ""
                        }`}
                        onClick={() => handleSelectProfile(profile)}
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
                          <p className={styles.profileLocation}>
                            {profile.place}
                          </p>
                        </div>

                        <div className={styles.profileActions}>
                          <div className={styles.radioBtn}>
                            {selectedProfileId === profile._id ? "●" : "○"}
                          </div>
                          {onDelete && (
                            <button
                              className={styles.deleteBtn}
                              onClick={(e) =>
                                handleDeleteProfile(e, profile._id)
                              }
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

              {showAddButton && onAddClick && (
                <button
                  className={styles.addProfileBtn}
                  onClick={() => {
                    setShowModal(false);
                    onAddClick();
                  }}
                >
                  + Add Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileSelector;
