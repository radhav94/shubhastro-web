import { useState, useEffect } from "react";
import ProfileListingModal from "./ProfileListingModal";
import AddProfileModal from "./AddProfileModal";
import EditProfileModal from "./EditProfileModal";
import DeleteConfirmationModal from "../modal/deleteModal/DeleteConfirmationModal";
import { Toast } from "../../index";
import {
  useCreateKundliMutation,
  useGetAllKundlisQuery,
  useDeleteKundliMutation,
  useEditKundliMutation,
} from "../../../services/appServices/kundliServicesNew";
import { getToken } from "../../../utils/token";

/**
 * ProfileManager - Complete profile management flow component
 *
 * Handles the full profile lifecycle:
 * - Profile listing
 * - Adding new profiles
 * - Editing existing profiles
 * - Deleting profiles with confirmation
 * - Profile selection
 * - Start Call mode for profile selection
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the profile manager is open
 * @param {Function} props.onClose - Callback when profile manager closes
 * @param {Function} props.onProfileSelect - Callback when a profile is selected
 * @param {string} props.selectedProfileId - Currently selected profile ID
 * @param {string} props.title - Title for the profile listing modal
 * @param {boolean} props.startCallMode - Enable Start Call selection flow
 * @param {Function} props.onStartCall - Callback when Start Call button is clicked (receives selected profile)
 * @param {Object} props.enabledOperations - Control which operations are enabled (list, add, edit, delete)
 */
const ProfileManager = ({
  isOpen = false,
  onClose = () => {},
  onProfileSelect = () => {},
  selectedProfileId = null,
  title = "Select Profile",
  startCallMode = false,
  callModeBtnTitle = "Start Call",
  onStartCall = () => {},
  enabledOperations = {
    list: true,
    add: true,
    edit: true,
    delete: true,
  },
}) => {
  // Local state for modal visibility
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [profileToEdit, setProfileToEdit] = useState(null);

  // State for Start Call mode
  const [selectedProfileForCall, setSelectedProfileForCall] = useState(null);

  // RTK Query hooks
  const [createKundli, { isLoading: isCreating }] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();
  const [editKundli] = useEditKundliMutation();

  // Get token
  const token = getToken();

  // Fetch profiles
  const { data } = useGetAllKundlisQuery(undefined, {
    skip: !token || !isOpen,
  });

  const profiles = data?.data || [];

  // Reset all modal states when ProfileManager closes
  useEffect(() => {
    if (!isOpen) {
      setShowAddProfile(false);
      setShowEditProfile(false);
      setShowDeleteModal(false);
      setProfileToDelete(null);
      setProfileToEdit(null);
      setSelectedProfileForCall(null);
    }
  }, [isOpen]);

  // Helper function to build kundli payload
  const buildKundliPayload = (data) => {
    const dateObj = new Date(data.birthDate);
    const timeObj = data.birthTime ? data.birthTime.split(":") : ["0", "0"];

    return {
      name: data.name,
      gender: data.identity.toLowerCase(),
      relation: data.relation || "Self",
      day: dateObj.getDate(),
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      hour: data.unknownBirthTime ? 0 : parseInt(timeObj[0]),
      min: data.unknownBirthTime ? 0 : parseInt(timeObj[1]),
      second: 0,
      place: data.birthPlace,
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      tzone: 5.5,
    };
  };

  // Helper function to check for duplicate kundli
  const isDuplicateKundli = (payload, list) =>
    list.some(
      (k) =>
        k.name.trim().toLowerCase() === payload.name.trim().toLowerCase() &&
        k.gender.toLowerCase() === payload.gender.toLowerCase() &&
        Number(k.day) === Number(payload.day) &&
        Number(k.month) === Number(payload.month) &&
        Number(k.year) === Number(payload.year) &&
        Number(k.hour) === Number(payload.hour) &&
        Number(k.min) === Number(payload.min) &&
        Math.abs(Number(k.lat) - Number(payload.lat)) < 0.0001 &&
        Math.abs(Number(k.lon) - Number(payload.lon)) < 0.0001 &&
        k.place.trim().toLowerCase() === payload.place.trim().toLowerCase(),
    );

  // Handler: Open add profile modal
  const handleAddProfile = () => {
    setShowAddProfile(true);
  };

  // Handler: Open edit profile modal
  const handleEditProfile = (profile) => {
    setProfileToEdit(profile);
    setShowEditProfile(true);
  };

  // Handler: Open delete confirmation modal
  const handleDeleteProfile = (profileId) => {
    setProfileToDelete(profileId);
    setShowDeleteModal(true);
  };

  // Handler: Profile selection in Start Call mode
  const handleProfileSelectForCall = (profile) => {
    if (startCallMode) {
      setSelectedProfileForCall(profile);
    }
    // Also call the original onProfileSelect if provided
    if (onProfileSelect) {
      onProfileSelect(profile);
    }
  };

  // Handler: Start Call button click
  const handleStartCall = () => {
    if (selectedProfileForCall && onStartCall) {
      onStartCall(selectedProfileForCall);
      onClose();
    }
  };

  // Handler: Submit new profile
  const handleSubmitProfile = async (formData) => {
    try {
      const payload = buildKundliPayload(formData);

      // Check for duplicate
      if (isDuplicateKundli(payload, profiles)) {
        Toast.error("This profile already exists");
        throw new Error("Duplicate profile");
      }

      await createKundli(payload).unwrap();
      Toast.success("Profile added successfully");
      setShowAddProfile(false);
      onClose();
    } catch (err) {
      console.error("Add profile error:", err);
      setShowAddProfile(false);
      onClose();
      // Only show custom toast for duplicate error (already shown above)
      // For API errors, global handler in privateRequestNew.js will show the toast
      if (err.message !== "Duplicate profile") {
        throw err;
      }
    }
  };

  // Handler: Submit edited profile
  const handleSubmitEditProfile = async (formData) => {
    try {
      if (!profileToEdit) return;

      // Build payload with updated data
      const payload = buildKundliPayload(formData);

      // Call editKundli with id and payload
      await editKundli({
        id: profileToEdit.kundli_ID,
        ...payload,
      }).unwrap();

      Toast.success("Profile updated successfully");

      setShowEditProfile(false);
      setProfileToEdit(null);
    } catch (err) {
      console.error("Edit profile error:", err);
      throw err;
    }
  };

  // Handler: Confirm delete profile
  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return;

    try {
      await deleteKundli(profileToDelete).unwrap();
      Toast.success("Profile deleted successfully");

      setShowDeleteModal(false);
      setProfileToDelete(null);
    } catch (err) {
      console.error("Delete profile error:", err);
      setShowDeleteModal(false);
      setProfileToDelete(null);
    }
  };

  // Handler: Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProfileToDelete(null);
  };

  // Handler: Close add profile modal
  const handleCloseAddProfile = () => {
    setShowAddProfile(false);
    // onClose();
  };

  // Handler: Close edit profile modal
  const handleCloseEditProfile = () => {
    setShowEditProfile(false);
    setProfileToEdit(null);
  };

  // Get initial data for edit modal
  const getEditInitialData = () => {
    if (!profileToEdit) return null;

    return {
      name: profileToEdit.name,
      identity:
        profileToEdit.gender === "male"
          ? "Male"
          : profileToEdit.gender === "female"
            ? "Female"
            : "Others",
      relation: profileToEdit.relation || "Self",
      birthDate: `${profileToEdit.year}-${String(profileToEdit.month).padStart(2, "0")}-${String(profileToEdit.day).padStart(2, "0")}`,
      birthTime: `${String(profileToEdit.hour).padStart(2, "0")}:${String(profileToEdit.min).padStart(2, "0")}`,
      birthPlace: profileToEdit.place,
      unknownBirthTime: false,
      latitude: profileToEdit.lat,
      longitude: profileToEdit.lon,
    };
  };

  return (
    <>
      {/* Profile Listing Modal */}
      <ProfileListingModal
        isOpen={isOpen}
        onClose={onClose}
        startCallMode={startCallMode}
        profiles={profiles}
        selectedProfileId={startCallMode ? selectedProfileForCall?._id : selectedProfileId}
        onSelectProfile={startCallMode ? handleProfileSelectForCall : onProfileSelect}
        onDeleteProfile={handleDeleteProfile}
        onEditProfile={handleEditProfile}
        onAddProfile={handleAddProfile}
        onStartCall={handleStartCall}
        title={title}
        callModeBtnTitle={callModeBtnTitle}
        showAddButton={enabledOperations.add}
        showDeleteButton={enabledOperations.delete}
        showEditButton={enabledOperations.edit}
        hasNestedModal={showAddProfile || showEditProfile || showDeleteModal}
      />

      {/* Add Profile Modal */}
      <AddProfileModal
        isOpen={showAddProfile}
        onClose={handleCloseAddProfile}
        onSubmit={handleSubmitProfile}
        isLoading={isCreating}
        title="Add Profile"
        showProfileListing={false}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={handleCloseEditProfile}
        onSubmit={handleSubmitEditProfile}
        isLoading={isCreating}
        title="Edit Profile"
        initialData={getEditInitialData()}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Profile"
          message="Are you sure you want to delete this profile? This action cannot be undone."
          onCancel={handleCancelDelete}
          onConfirm={confirmDeleteProfile}
        />
      )}
    </>
  );
};

export default ProfileManager;
