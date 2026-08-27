import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import ProfileListingModal from "./ProfileListingModal";
import AddProfileModal from "./AddProfileModal";
import EditProfileModal from "./EditProfileModal";
import DeleteConfirmationModal from "../modal/deleteModal/DeleteConfirmationModal";
import GuestKundliAuthModal from "./GuestKundliAuthModal";
import { Toast } from "../../index";
import {
  useCreateKundliMutation,
  useGetAllKundlisQuery,
  useDeleteKundliMutation,
  useEditKundliMutation,
} from "../../../services/appServices/kundliServicesNew";
import { getToken } from "../../../utils/token";
import { getJSONCookie, setJSONCookie } from "../../../utils/helper/cookies";
import { clearSelectedKundli } from "../../../redux/kundli/kundliSlice";

// Shared cookie key for guest (non-logged-in) kundli profiles across pages
const GUEST_KUNDLI_COOKIE = "guestKundliProfiles";

// Ceiling on saved kundli profiles, enforced in handleAddProfile.
const MAX_PROFILES = 5;

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
 * @param {string} props.startCallModeBtnType - start call btn Title
 * @param {boolean} props.isOpen - Whether the profile manager is open
 * @param {Function} props.onClose - Callback when profile manager closes
 * @param {Function} props.onProfileSelect - Callback when a profile is selected
 * @param {string} props.selectedProfileId - Currently selected profile ID
 * @param {string} props.title - Title for the profile listing modal
 * @param {boolean} props.startCallMode - Enable Start Call selection flow
 * @param {Function} props.onStartCall - Callback when Start Call button is clicked (receives selected profile)
 * @param {Object} props.enabledOperations - Control which operations are enabled (list, add, edit, delete)
 * @param {string[]} props.excludedProfileIds - Array of profile IDs to exclude from the list
 * @param {Array} props.profilesList - Optional external profiles list (for non-logged-in users)
 * @param {Function} props.onDeleteProfile - Optional callback for profile deletion (for non-logged-in users)
 */
const ProfileManager = ({
  isOpen = false,
  onClose = () => {},
  onProfileSelect = () => {},
  selectedProfileId = undefined,
  title = "Select Profile",
  startCallMode = false,
  startCallModeBtnType = "",
  callModeBtnTitle = "Start Call",
  onStartCall = () => {},
  enabledOperations = {
    list: true,
    add: true,
    edit: true,
    delete: true,
  },
  excludedProfileIds = [],
  profilesList = null,
  onDeleteProfile: onDeleteProfileCallback = null,
  matchmakingMode = false,
}) => {
  // Local state for modal visibility
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [profileToEdit, setProfileToEdit] = useState(null);

  // Track whether we started a guest auth flow. This prevents the
  // ProfileListingModal from flashing when `loginSuccess` sets a token
  // mid-flow (the ternary would otherwise flip to the listing branch).
  const [guestAuthInProgress, setGuestAuthInProgress] = useState(false);

  /*
    Why "+ Add Profile" needs a visible refusal.

    At the profile ceiling, handleAddProfile used to `Toast.error("Please Delete
    One Kundli from Existing One")` and return. The listing modal it was tapped
    from did not change in any way, and a toast renders in a portal at the edge
    of the viewport — Clarity cannot see it, so the tap is recorded as a dead
    click, and the visitor sees nothing happen where they are looking.

    Clarity, Chrome desktop on /kundli: two clicks on profile actions at 10:47
    and 10:57, ten seconds apart, then the visitor left. Tapping, waiting,
    tapping again is what a swallowed control looks like.

    `seq` increments on every refusal and is used as the notice's React key, so a
    second tap remounts the element and replays its animation. Without it the
    repeat tap would set an identical string, React would render nothing new,
    and the click would be dead all over again.
  */
  const [addBlocked, setAddBlocked] = useState(null);

  // State for Start Call mode
  const [selectedProfileForCall, setSelectedProfileForCall] = useState(null);

  const dispatch = useDispatch();

  // Get token
  const token = getToken();

  // RTK Query hooks - Always call unconditionally (Rules of Hooks)
  const [createKundli, { isLoading: isCreating }] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();
  const [editKundli] = useEditKundliMutation();

  // Fetch profiles
  const { data } = useGetAllKundlisQuery(undefined, {
    skip: !token || !isOpen,
  });

  const savedProfiles = data?.data || [];

  // For guests (no token) with no parent-managed list, this component owns the
  // shared guest profiles cookie so the same profiles appear on every page.
  const manageGuestCookie = !token && profilesList === null;
  const [guestProfiles, setGuestProfiles] = useState(() =>
    !token ? getJSONCookie(GUEST_KUNDLI_COOKIE, []) : []
  );

  // Refresh guest profiles from the cookie whenever the modal opens so profiles
  // added on other pages show up here too.
  useEffect(() => {
    if (isOpen && manageGuestCookie) {
      setGuestProfiles(getJSONCookie(GUEST_KUNDLI_COOKIE, []));
    }
  }, [isOpen, manageGuestCookie]);

  // Use external profiles list if provided (parent-managed), otherwise saved
  // profiles for logged-in users or the shared cookie list for guests.
  const profiles =
    profilesList !== null
      ? profilesList
      : token
        ? savedProfiles
        : guestProfiles;

  // Highlight the currently selected kundli. When the caller doesn't pass
  // selectedProfileId (most calculator forms track selection only via the
  // global kundli slice), fall back to the selected kundli in Redux so the
  // radio reflects the active profile. Skipped in matchmaking, where each slot
  // manages its own selection.
  const reduxSelectedKundli = useSelector((state) => state.kundli?.selectedKundli);
  const effectiveSelectedId =
    selectedProfileId !== undefined
      ? selectedProfileId
      : matchmakingMode
        ? null
        : reduxSelectedKundli?._id ?? null;

  // console.log(excludedProfileIds)

  // Filter out excluded profiles
  const filteredProfiles = profiles.filter(
    (profile) => !excludedProfileIds.includes(profile._id)
  );

  // Deleting a profile clears the ceiling notice — it would otherwise keep
  // claiming the list is full while the user is looking at a list that is not.
  useEffect(() => {
    if (profiles.length < MAX_PROFILES) setAddBlocked(null);
  }, [profiles.length]);

  // Reset all modal states when ProfileManager closes
  useEffect(() => {
    if (!isOpen) {
      setShowAddProfile(false);
      setShowEditProfile(false);
      setShowDeleteModal(false);
      setProfileToDelete(null);
      setProfileToEdit(null);
      setSelectedProfileForCall(null);
      setGuestAuthInProgress(false);
      setAddBlocked(null);
    }
  }, [isOpen]);

  // Helper function to build kundli payload
  const buildKundliPayload = (data) => {
    const dateObj = new Date(data.birthDate);
    const timeObj = data.birthTime ? data.birthTime.split(":") : ["0", "0"];

    return {
      name: data.name,
      gender: data.identity.toLowerCase(),
      relation: data.relation || "",
      day: dateObj.getDate(),
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      hour: data.unknownBirthTime ? "00" : String(parseInt(timeObj[0])).padStart(2, "0"),
      min: data.unknownBirthTime ? "00" : String(parseInt(timeObj[1])).padStart(2, "0"),
      second: "00",
      place: data.birthPlace,
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      tzone: data.timezone ?? 5.5,
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
    // At the ceiling, refuse visibly inside the modal instead of via a toast.
    // See the addBlocked declaration for the Clarity evidence.
    if (profiles.length >= MAX_PROFILES) {
      setAddBlocked((prev) => ({
        text: `You already have ${MAX_PROFILES} saved profiles, which is the maximum. Delete one from the list above to add another.`,
        seq: (prev?.seq || 0) + 1,
      }));
      return;
    }

    setAddBlocked(null);

    /*
     * A guest branch used to live here calling setShowGuestAuthModal(), which is
     * declared nowhere in this component — ESLint flagged it as no-undef, and
     * reaching it would have thrown a ReferenceError instead of opening anything.
     * It was also redundant: the render below already routes every tokenless
     * caller to <GuestKundliAuthModal> before ProfileListingModal (the only thing
     * that can invoke this handler) is ever mounted visibly. Removed rather than
     * given a state variable, so the guest path stays in one place. If a
     * tokenless user ever does reach here, falling through is safe —
     * handleSubmitProfile already has a guest branch that stores the profile in
     * the shared cookie.
     */
    setShowAddProfile(true);
  };

  // Handler: Open edit profile modal
  const handleEditProfile = (profile) => {
    setProfileToEdit(profile);
    setShowEditProfile(true);
  };

  // Handler: Open delete confirmation modal
  const handleDeleteProfile = (profileId) => {
    if (!profileId) {
      console.error("❌ No profile ID provided!");
      Toast.error("Cannot delete: Invalid profile ID");
      return;
    }
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

      // Only call API if user is logged in
      if (token) {
        const result = await createKundli(payload).unwrap();
        Toast.success("Profile added successfully");

        /*
          Notify the parent for every mode, not just startCallMode.

          This branch used to tell the parent about the new profile only when
          `startCallMode` was set, while the guest branch below always did. So a
          logged-in visitor who added a profile got "Profile added successfully"
          and a profile that no screen had actually selected. On matchmaking that
          surfaced as filling in the partner's name, date and birth place, saving
          it, then being told "Please select both profiles" on Proceed Ahead —
          the slot was still empty because MatchMakingV2's onProfileSelect never
          fired. Guests were unaffected, which is why it survived.

          Selecting what the user just created is what every consumer wants
          (Kundli, Numerology, LalKitab, matchmaking, the call screens), and the
          guest branch has been doing exactly this for all of them already.
        */
        const newProfile = result?.data;
        if (newProfile) {
          if (startCallMode) {
            setSelectedProfileForCall(newProfile);
          }
          if (onProfileSelect) {
            onProfileSelect(newProfile);
          }
        }
      } else {
        // Non-logged-in user: create a temporary profile
        const tempProfile = {
          ...payload,
          _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        // Persist to the shared guest cookie when this component owns the list
        if (manageGuestCookie) {
          setGuestProfiles((prev) => {
            const next = [...prev, tempProfile];
            setJSONCookie(GUEST_KUNDLI_COOKIE, next);
            return next;
          });
        }

        Toast.success("Profile added");

        // Notify parent so it can select / persist the new profile
        if (onProfileSelect) {
          onProfileSelect(tempProfile);
        }

        // In Start Call mode, auto-select the newly created profile
        if (startCallMode) {
          setSelectedProfileForCall(tempProfile);
        }
      }
      
      // Only close the AddProfileModal, keep ProfileListingModal open
      setShowAddProfile(false);
      
      // OLD LOGIC (commented out): This was closing both modals
      // onClose();
    } catch (err) {
      console.error("Add profile error:", err);
      setShowAddProfile(false);
      
      // Only show custom toast for duplicate error (already shown above)
      // For API errors, global handler in privateRequestNew.js will show the toast
      if (err.message !== "Duplicate profile") {
        // OLD LOGIC: This was closing the ProfileListingModal on error
        // onClose();
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

      // Only call API if user is logged in
      if (token) {
        // Call editKundli with id and payload
        const result = await editKundli({
          id: profileToEdit.kundli_ID,
          ...payload,
        }).unwrap();

        Toast.success("Profile updated successfully");

        // Notify parent with updated profile so kundli data refreshes immediately
        if (onProfileSelect) {
          const updatedProfile = result?.data || {
            ...profileToEdit,
            ...payload,
            hour: Number(payload.hour),
            min: Number(payload.min),
            day: Number(payload.day),
            month: Number(payload.month),
            year: Number(payload.year),
            lat: Number(payload.lat),
            lon: Number(payload.lon),
          };
          onProfileSelect(updatedProfile);
        }
      } else {
        // Non-logged-in user: update the temporary profile
        const updatedProfile = {
          ...payload,
          _id: profileToEdit._id,
        };

        // Persist the update to the shared guest cookie when owned here
        if (manageGuestCookie) {
          setGuestProfiles((prev) => {
            const next = prev.map((p) =>
              p._id === updatedProfile._id ? updatedProfile : p
            );
            setJSONCookie(GUEST_KUNDLI_COOKIE, next);
            return next;
          });
        }

        Toast.success("Profile updated");

        // Call onProfileSelect with updated profile so parent can handle it
        if (onProfileSelect) {
          onProfileSelect(updatedProfile);
        }
      }

      setShowEditProfile(false);
      setProfileToEdit(null);
    } catch (err) {
      console.error("Edit profile error:", err);
      throw err;
    }
  };

  // Handler: Confirm delete profile
  const confirmDeleteProfile = async () => {
    if (!profileToDelete) {
      console.error("❌ No profile ID to delete");
      return;
    }

    console.log("=== ProfileManager Confirm Delete ===");
    console.log("Profile ID to delete:", profileToDelete);
    console.log("Type:", typeof profileToDelete);
    console.log("Length:", profileToDelete?.length);
    console.log("Is valid MongoDB ObjectId format?", /^[a-f\d]{24}$/i.test(profileToDelete));

    try {
      // Find the profile being deleted using _id
      const profileBeingDeleted = profiles.find(p => p._id === profileToDelete);
      
      console.log("Profile being deleted:", profileBeingDeleted);
      
      if (!profileBeingDeleted) {
        console.error("❌ Profile not found in list!");
        Toast.error("Profile not found");
        setShowDeleteModal(false);
        setProfileToDelete(null);
        return;
      }
      
      // Check if this is a "Self" profile
      const isSelfProfile = profileBeingDeleted?.relation?.toLowerCase() === "self";
      
      // Count total "Self" profiles
      const selfProfilesCount = profiles.filter(
        p => p.relation?.toLowerCase() === "self"
      ).length;
      
      // Prevent deletion if this is the last "Self" profile
      if (isSelfProfile && selfProfilesCount === 1) {
        Toast.error("Cannot delete the last Self profile. At least one Self profile is required.");
        setShowDeleteModal(false);
        setProfileToDelete(null);
        return;
      }

      // Only call API if user is logged in
      if (token) {
        console.log("✅ Calling deleteKundli API with ID:", profileToDelete);
        await deleteKundli(profileToDelete).unwrap();
        // Clear selected kundli if the deleted profile was the one selected
        if (reduxSelectedKundli?._id === profileToDelete) {
          dispatch(clearSelectedKundli());
        }
        Toast.success("Profile deleted successfully");
      } else {
        // Non-logged-in user: remove from the shared guest cookie when owned here
        if (manageGuestCookie) {
          setGuestProfiles((prev) => {
            const next = prev.filter((p) => p._id !== profileToDelete);
            setJSONCookie(GUEST_KUNDLI_COOKIE, next);
            return next;
          });
        }
        // Also notify parent via callback if provided
        if (onDeleteProfileCallback) {
          onDeleteProfileCallback(profileToDelete);
        }
        Toast.success("Profile deleted");
      }

      setShowDeleteModal(false);
      setProfileToDelete(null);
    } catch (err) {
      console.error("=== ProfileManager Delete Error ===");
      console.error("Full error:", err);
      console.error("Error data:", err?.data);
      console.error("Error message:", err?.data?.message || err?.message);
      
      const errorMessage = err?.data?.message || err?.message || "Failed to delete profile";
      Toast.error(errorMessage);
      
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

    // Ensure relation value matches the option values exactly (capitalize first letter)
    const relationValue = profileToEdit.relation 
      ? profileToEdit.relation.charAt(0).toUpperCase() + profileToEdit.relation.slice(1).toLowerCase()
      : "Self";

    return {
      name: profileToEdit.name,
      identity:
        profileToEdit.gender === "male"
          ? "Male"
          : profileToEdit.gender === "female"
            ? "Female"
            : "Others",
      relation: relationValue,
      birthDate: `${profileToEdit.year}-${String(profileToEdit.month).padStart(2, "0")}-${String(profileToEdit.day).padStart(2, "0")}`,
      birthTime: `${String(profileToEdit.hour).padStart(2, "0")}:${String(profileToEdit.min).padStart(2, "0")}`,
      birthPlace: profileToEdit.place,
      unknownBirthTime: false,
      latitude: profileToEdit.lat,
      longitude: profileToEdit.lon,
      timezone: profileToEdit.tzone ?? 5.5,
    };
  };

  // When a guest opens ProfileManager, mark that the auth flow started.
  // This prevents the ProfileListingModal from flashing when loginSuccess
  // sets a token mid-flow (which flips the !token condition).
  useEffect(() => {
    if (!token && isOpen) {
      setGuestAuthInProgress(true);
    }
  }, [isOpen, token]);

  return (
    <>
      {/* For guests (or mid-auth-flow): show GuestKundliAuthModal instead of profile listing */}
      {(!token || guestAuthInProgress) && isOpen ? (
        <GuestKundliAuthModal
          isOpen={true}
          onClose={() => {
            setGuestAuthInProgress(false);
            onClose();
          }}
          onSuccess={(profile) => {
            setGuestAuthInProgress(false);
            if (profile && onProfileSelect) {
              onProfileSelect(profile);
            }
            onClose();
          }}
        />
      ) : (
      <>
      {/* Profile Listing Modal */}
      <ProfileListingModal
        isOpen={isOpen}
        onClose={onClose}
        startCallMode={startCallMode}
        profiles={filteredProfiles}
        selectedProfileId={startCallMode ? selectedProfileForCall?._id : effectiveSelectedId}
        onSelectProfile={startCallMode ? handleProfileSelectForCall : onProfileSelect}
        onDeleteProfile={handleDeleteProfile}
        onEditProfile={handleEditProfile}
        onAddProfile={handleAddProfile}
        onStartCall={handleStartCall}
        title={title}
        startCallModeBtnType={startCallModeBtnType}
        callModeBtnTitle={callModeBtnTitle}
        showAddButton={enabledOperations.add}
        showDeleteButton={enabledOperations.delete}
        showEditButton={enabledOperations.edit}
        hasNestedModal={showAddProfile || showEditProfile || showDeleteModal}
        addBlockedNotice={addBlocked}
      />

      {/* Add Profile Modal */}
      <AddProfileModal
        isOpen={showAddProfile}
        onClose={handleCloseAddProfile}
        onSubmit={handleSubmitProfile}
        isLoading={isCreating}
        title="Add Profile"
        showProfileListing={false}
        savedKundlis={profiles}
        matchmakingMode={matchmakingMode}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={handleCloseEditProfile}
        onSubmit={handleSubmitEditProfile}
        isLoading={isCreating}
        title="Edit Profile"
        initialData={getEditInitialData()}
        savedKundlis={profiles}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Profile"
        message="Are you sure you want to delete this profile? This action cannot be undone."
        onCancel={handleCancelDelete}
        onConfirm={confirmDeleteProfile}
      />
      </>
      )}
    </>
  );
};

export default ProfileManager;
