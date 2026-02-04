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
 * ProfileManager - Centralized component for managing profile operations
 *
 * Handles all profile-related functionality including:
 * - Fetching profiles from API
 * - Adding new profiles
 * - Editing existing profiles
 * - Deleting profiles
 * - Profile selection
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the profile manager is open
 * @param {Function} props.onClose - Callback when profile manager closes
 * @param {Function} props.onProfileSelect - Callback when a profile is selected
 * @param {string} props.selectedProfileId - Currently selected profile ID
 * @param {string} props.title - Title for the profile listing modal
 * @param {Object} props.enabledOperations - Control which operations are enabled
 * @param {boolean} props.enabledOperations.list - Enable profile listing (default: true)
 * @param {boolean} props.enabledOperations.add - Enable add profile (default: true)
 * @param {boolean} props.enabledOperations.edit - Enable edit profile (default: true)
 * @param {boolean} props.enabledOperations.delete - Enable delete profile (default: true)
 * @param {boolean} props.autoOpenAdd - Auto-open Add Profile modal when isOpen is true
 * @param {boolean} props.autoOpenEdit - Auto-open Edit Profile modal when isOpen is true
 * @param {boolean} props.autoOpenDelete - Auto-open Delete Confirmation modal when isOpen is true
 * @param {Object} props.profileToEdit - Profile object to edit (must include kundli_ID)
 * @param {string} props.profileToDelete - Profile kundli_ID to delete
 */
const ProfileManager = ({
  isOpen = false,
  onClose = () => {},
  onProfileSelect = () => {},
  selectedProfileId = null,
  title = "Select Profile",
  enabledOperations = {
    list: true,
    add: true,
    edit: true,
    delete: true,
  },
  autoOpenAdd = false,
  autoOpenEdit = false,
  autoOpenDelete = false,
  profileToEdit: parentProfileToEdit = null,
  profileToDelete: parentProfileToDelete = null,
}) => {
  // Merge with defaults to ensure backward compatibility
  const operations = {
    list: enabledOperations.list !== false,
    add: enabledOperations.add !== false,
    edit: enabledOperations.edit !== false,
    delete: enabledOperations.delete !== false,
  };
  // Local state for modal visibility
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [profileToEdit, setProfileToEdit] = useState(null);

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

  // Extract stable identifiers for dependency tracking
  const editProfileId = parentProfileToEdit?.kundli_ID || parentProfileToEdit?._id || null;
  const deleteProfileId = parentProfileToDelete;

  // Single useEffect to handle all modal state management
  useEffect(() => {
    if (!isOpen) {
      // Reset all states when ProfileManager closes
      setShowAddProfile(false);
      setShowEditProfile(false);
      setShowDeleteModal(false);
      setProfileToDelete(null);
      setProfileToEdit(null);
      return;
    }

    // When opening, first reset all states to ensure clean slate
    setShowAddProfile(false);
    setShowEditProfile(false);
    setShowDeleteModal(false);
    setProfileToDelete(null);
    setProfileToEdit(null);

    // Use setTimeout to ensure state reset completes before opening new modal
    // This forces React to recognize the state change even with same values
    const timer = setTimeout(() => {
      // ADD MODE
      if (autoOpenAdd && operations.add) {
        setShowAddProfile(true);
      }
      // EDIT MODE
      else if (autoOpenEdit && operations.edit && parentProfileToEdit) {
        setProfileToEdit(parentProfileToEdit);
        setShowEditProfile(true);
      }
      // DELETE MODE
      else if (autoOpenDelete && operations.delete && parentProfileToDelete) {
        setProfileToDelete(parentProfileToDelete);
        setShowDeleteModal(true);
      }
      // Direct mode (when list is disabled)
      else if (!operations.list) {
        if (parentProfileToEdit && operations.edit) {
          setProfileToEdit(parentProfileToEdit);
          setShowEditProfile(true);
        } else if (parentProfileToDelete && operations.delete) {
          setProfileToDelete(parentProfileToDelete);
          setShowDeleteModal(true);
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [
    isOpen,
    autoOpenAdd,
    autoOpenEdit,
    autoOpenDelete,
    operations.add,
    operations.edit,
    operations.delete,
    operations.list,
    editProfileId, // Use stable ID instead of object reference
    deleteProfileId, // Use stable ID instead of object reference
  ]);

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
    if (!operations.add) return;
    setShowAddProfile(true);
  };

  // Handler: Open edit profile modal
  const handleEditProfile = (profile) => {
    if (!operations.edit) return;
    setProfileToEdit(profile);
    setShowEditProfile(true);
  };

  // Handler: Open delete confirmation modal
  const handleDeleteProfile = (profileId) => {
    if (!operations.delete) return;
    setProfileToDelete(profileId);
    setShowDeleteModal(true);
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
    onClose();
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
      {/* Profile Listing Modal - Only render if list operation is enabled */}
      {operations.list && (
        <ProfileListingModal
          isOpen={isOpen}
          onClose={onClose}
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          onSelectProfile={onProfileSelect}
          onDeleteProfile={operations.delete ? handleDeleteProfile : undefined}
          onEditProfile={operations.edit ? handleEditProfile : undefined}
          onAddProfile={operations.add ? handleAddProfile : undefined}
          title={title}
          showAddButton={operations.add}
          showDeleteButton={operations.delete}
          showEditButton={operations.edit}
          hasNestedModal={showAddProfile || showEditProfile || showDeleteModal}
        />
      )}

      {/* Add Profile Modal - Only render if add operation is enabled */}
      {operations.add && (
        <AddProfileModal
          isOpen={showAddProfile}
          onClose={handleCloseAddProfile}
          onSubmit={handleSubmitProfile}
          isLoading={isCreating}
          title="Add Profile"
          showProfileListing={false}
        />
      )}

      {/* Edit Profile Modal - Only render if edit operation is enabled */}
      {operations.edit && (
        <EditProfileModal
          isOpen={showEditProfile}
          onClose={handleCloseEditProfile}
          onSubmit={handleSubmitEditProfile}
          isLoading={isCreating}
          title="Edit Profile"
          initialData={getEditInitialData()}
        />
      )}

      {/* Delete Confirmation Modal - Only render if delete operation is enabled */}
      {operations.delete && showDeleteModal && (
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
