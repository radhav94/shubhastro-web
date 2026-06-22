import styles from "./MatchMakingV2.module.scss";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ChevronDown, Heart } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useGetAllKundlisQuery,
  useCreateKundliMutation,
  useDeleteKundliMutation,
} from "../../../services/appServices/kundliServicesNew";
import { PATH } from "../../../utils/routes/Paths";
import { useLazyGetNumerologyPredictionQuery } from "../../../services/appServices/numerologyServices";
import { Toast } from "../../../component";
import AddProfileModal from "../../../component/UI/Profile/AddProfileModal";
import EditProfileModal from "../../../component/UI/Profile/EditProfileModal";
import DeleteConfirmationModal from "../../../component/UI/modal/deleteModal/DeleteConfirmationModal";
import ProfileListingModal from "../../../component/UI/Profile/ProfileListingModal";
import bondIcon from "../../../assets/icons/destiny-icon.svg";
import matchMakingImg from "../../../assets/images/match-making-top-img.svg";
import matchMakingImgBottom from "../../../assets/images/match-making-bottom-img.svg";
import { ProfileManager } from "../../../component/UI/Profile";
import BackButton from "../../../component/UI/BackButton/BackButton";
// import { setSelectedKundli } from "../../../redux/kundli/kundliSlice";
import {
  getJSONCookie,
  setJSONCookie,
  removeCookie,
} from "../../../utils/helper/cookies";

// Shared cookie key for guest (non-logged-in) kundli profiles across pages
const GUEST_KUNDLI_COOKIE = "guestKundliProfiles";

const MatchMaking = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /* -------------------- STATE -------------------- */
  const [showSelectProfile, setShowSelectProfile] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [profileToEdit, setProfileToEdit] = useState(null);

  const [selectedProfile, setSelectedProfile] = useState(null); // header display
  const [primaryProfile, setPrimaryProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [selectingType, setSelectingType] = useState(null); // PRIMARY | PARTNER

  /* -------------------- TOKEN & AUTH -------------------- */
  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  const isLoggedIn = !!token;

  // Listen to header profile changes from Redux (kundli.selectedKundli)
  const headerSelectedKundli = useSelector((state) => state.kundli.selectedKundli);

  // Get current user ID
  const currentUserId =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_id")
      : localStorage.getItem("shubhtalk_customer_id");

  /* -------------------- TEMPORARY PROFILES (NON-LOGGED-IN) -------------------- */
  // Persisted in cookies so guest kundli profiles survive page navigation/reloads
  const [tempProfiles, setTempProfiles] = useState(() =>
    getJSONCookie(GUEST_KUNDLI_COOKIE, [])
  );

  // Sync tempProfiles to cookie
  useEffect(() => {
    if (!isLoggedIn) {
      setJSONCookie(GUEST_KUNDLI_COOKIE, tempProfiles);
    }
  }, [tempProfiles, isLoggedIn]);

  // Clear temp profiles when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      removeCookie(GUEST_KUNDLI_COOKIE);
      setTempProfiles([]);
    }
  }, [isLoggedIn]);

  /* -------------------- CURL GENERATOR -------------------- */
  const generateCurlCommand = (endpoint, _method, payload, token) => {
    const baseUrl = "/main";
    const url = `${baseUrl}/api/${endpoint}`;

    let curl = `curl --location '${url}' \\\n`;
    curl += `  --header 'accept: application/json' \\\n`;
    curl += `  --header 'Content-Type: application/json' \\\n`;

    if (token) {
      curl += `  --header 'Authorization: Bearer ${token}' \\\n`;
    }

    if (payload) {
      curl += `  --data '${JSON.stringify(payload)}'`;
    }

    return curl;
  };

  /* -------------------- API -------------------- */
  const { data, refetch, isFetching } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  const [createKundli, { isLoading: isCreating }] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();

  const [getNumerologyPrediction] = useLazyGetNumerologyPredictionQuery();

  // Combine saved profiles (if logged in) with temporary profiles (if not logged in)
  const savedProfiles = data?.data || [];
  const profiles = isLoggedIn ? savedProfiles : tempProfiles;

  const location = useLocation();
  useEffect(() => {
    if (
      location.state?.boyData &&
      location.state?.girlData &&
      profiles.length
    ) {
      const { boyData, girlData } = location.state;

      const findProfile = (data) =>
        profiles.find(
          (p) =>
            p.name === data.name &&
            p.place === data.place.address &&
            p.lat === data.place.lat &&
            p.lon === data.place.lng,
        );

      const boyProfile = findProfile(boyData);
      const girlProfile = findProfile(girlData);

      if (boyProfile && girlProfile) {
        setPrimaryProfile(boyProfile);
        setPartnerProfile(girlProfile);
        setSelectedProfile(boyProfile);
        // dispatch(setSelectedKundli(boyProfile));
      }
    }
  }, [location.state, profiles]);

  /* -------------------- AUTO SELECT -------------------- */
  useEffect(() => {
    if (!profiles.length || isFetching) return;
    if (primaryProfile) return;

    // Prefer the globally selected profile from Redux
    if (headerSelectedKundli?._id) {
      const found = profiles.find(p => p._id === headerSelectedKundli._id);
      if (found) {
        setPrimaryProfile(found);
        setSelectedProfile(found);
        return;
      }
    }

    // Fallback to first profile
    setPrimaryProfile(profiles[0]);
    setSelectedProfile(profiles[0]);
  }, [profiles, primaryProfile, isFetching]);

  // Sync primary profile when profile is changed elsewhere (e.g. Kundli screen)
  useEffect(() => {
    if (!headerSelectedKundli?._id) return;
    if (headerSelectedKundli._id !== primaryProfile?._id && profiles.some(p => p._id === headerSelectedKundli._id)) {
      setPrimaryProfile(headerSelectedKundli);
      setSelectedProfile(headerSelectedKundli);
    }
  }, [headerSelectedKundli, profiles]);

  // Clear selected profiles when user changes (on refresh after login)
  useEffect(() => {
    if (currentUserId && (primaryProfile || partnerProfile)) {
      const primaryBelongsToCurrentUser = primaryProfile
        ? profiles.some((profile) => profile._id === primaryProfile._id)
        : true;
      const partnerBelongsToCurrentUser = partnerProfile
        ? profiles.some((profile) => profile._id === partnerProfile._id)
        : true;

      if (!primaryBelongsToCurrentUser) {
        setPrimaryProfile(null);
        setSelectedProfile(null);
      }
      if (!partnerBelongsToCurrentUser) {
        setPartnerProfile(null);
      }
    }
  }, [currentUserId, profiles]);

  /* -------------------- NUMEROLOGY -------------------- */
  useEffect(() => {
    if (selectedProfile) {
      const date = `${String(selectedProfile.day).padStart(2, "0")}/${String(
        selectedProfile.month,
      ).padStart(2, "0")}/${selectedProfile.year}`;
      const name = selectedProfile.name.replaceAll(" ", "");
      getNumerologyPrediction({ date, name, lang: "en" });
    }
  }, [selectedProfile, getNumerologyPrediction]);

  /* -------------------- HELPERS -------------------- */
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
        // Compare lat/lon with tolerance for floating point precision
        Math.abs(Number(k.lat) - Number(payload.lat)) < 0.0001 &&
        Math.abs(Number(k.lon) - Number(payload.lon)) < 0.0001 &&
        k.place.trim().toLowerCase() === payload.place.trim().toLowerCase(),
    );

  /* -------------------- FILTERED LIST -------------------- */
  const filteredProfiles = profiles.filter((p) => {
    if (selectingType === "PRIMARY") {
      // Exclude current partner
      return p._id !== partnerProfile?._id;
    } else if (selectingType === "PARTNER") {
      // Exclude current primary
      return p._id !== primaryProfile?._id;
    }
    return true;
  });

  /* -------------------- SELECT PROFILE -------------------- */
  const handleSelectProfile = (profile) => {
    if (selectingType === "PRIMARY") {
      if (profile._id === partnerProfile?._id) return; // prevent selecting same as partner
      setPrimaryProfile(profile);
      setSelectedProfile(profile);
      // dispatch(setSelectedKundli(profile));
    }

    if (selectingType === "PARTNER") {
      if (profile._id === primaryProfile?._id) return; // prevent selecting same as primary
      setPartnerProfile(profile);
    }

    setShowSelectProfile(false);
    setSelectingType(null);
  };

  /* -------------------- DELETE PROFILE -------------------- */
  const handleDeleteProfile = (e, profileId) => {
    e.stopPropagation(); // Prevent triggering profile selection
    setProfileToDelete(profileId);
    setShowDeleteModal(true);
  };

  /* -------------------- EDIT PROFILE -------------------- */
  const handleEditProfile = (profile) => {
    setProfileToEdit(profile);
    setShowSelectProfile(false);
    setShowEditProfile(true);
  };

  const handleSubmitEditProfile = async (formData) => {
    try {
      if (!profileToEdit) return;

      // Delete old profile
      await deleteKundli(profileToEdit._id).unwrap();

      // Create new profile with updated data
      const payload = buildKundliPayload(formData);
      const result = await createKundli(payload).unwrap();

      Toast.success("Profile updated successfully");
      await refetch();

      // Update selections if edited profile was selected
      if (result?.data) {
        if (primaryProfile?._id === profileToEdit._id) {
          setPrimaryProfile(result.data);
          setSelectedProfile(result.data);
          // dispatch(setSelectedKundli(result.data));
        }
        if (partnerProfile?._id === profileToEdit._id) {
          setPartnerProfile(result.data);
        }
      }

      setShowEditProfile(false);
      setProfileToEdit(null);
    } catch (err) {
      console.error("=== EDIT KUNDLI ERROR ===");
      console.error(err);
      Toast.error(err?.data?.message || "Failed to update profile");
      throw err;
    }
  };

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
      relation: "Self",
      birthDate: `${profileToEdit.year}-${String(profileToEdit.month).padStart(2, "0")}-${String(profileToEdit.day).padStart(2, "0")}`,
      birthTime: `${String(profileToEdit.hour).padStart(2, "0")}:${String(profileToEdit.min).padStart(2, "0")}`,
      birthPlace: profileToEdit.place,
      unknownBirthTime: false,
      latitude: profileToEdit.lat,
      longitude: profileToEdit.lon,
    };
  };

  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return;

    try {
      if (isLoggedIn) {
        // LOGGED IN: Delete from database
        console.log("=== DELETE KUNDLI ===");
        console.log("Deleting profile ID:", profileToDelete);

        const deleteCurl = generateCurlCommand(
          "kundlis/delete",
          "DELETE",
          { kundliId: profileToDelete },
          token,
        );
        console.log("\n📋 DELETE CURL Command:\n");
        console.log(deleteCurl);
        console.log("\n====================");

        await deleteKundli(profileToDelete).unwrap();
        console.log("✅ Profile deleted successfully");

        Toast.success("Profile deleted successfully");

        // Refetch profiles
        await refetch();
      } else {
        // NOT LOGGED IN: Remove from temporary profiles
        console.log("=== DELETE TEMPORARY PROFILE ===");
        console.log("Deleting profile ID:", profileToDelete);

        setTempProfiles((prev) =>
          prev.filter((p) => p._id !== profileToDelete),
        );
        console.log("✅ Temporary profile deleted");
        Toast.success("Profile deleted");
      }

      // Clear selections if deleted profile was selected
      if (primaryProfile?._id === profileToDelete) {
        setPrimaryProfile(null);
        setSelectedProfile(null);
      }
      if (partnerProfile?._id === profileToDelete) {
        setPartnerProfile(null);
      }

      // Close modal
      setShowDeleteModal(false);
      setProfileToDelete(null);
    } catch (err) {
      console.error("=== DELETE KUNDLI ERROR ===");
      console.error("Error object:", err);
      console.error("Error data:", err?.data);
      console.error("===========================");

      const errorMessage =
        err?.data?.message || err?.message || "Failed to delete profile";

      Toast.error(errorMessage);
      setShowDeleteModal(false);
      setProfileToDelete(null);
    }
  };

  /* -------------------- PROCEED -------------------- */
  const handleProceed = (e) => {
    e?.preventDefault();

    if (!primaryProfile || !partnerProfile) {
      Toast.error("Please select both profiles");
      return;
    }

    const isValidProfile = (p) =>
      p.name &&
      p.day &&
      p.month &&
      p.year &&
      p.hour !== undefined &&
      p.min !== undefined &&
      p.place &&
      p.lat !== null &&
      p.lon !== null;

    if (!isValidProfile(primaryProfile) || !isValidProfile(partnerProfile)) {
      Toast.error("Invalid profile details");
      return;
    }

    const formatDate = (y, m, d) =>
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const formatTime = (h, min) =>
      `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;

    const mapProfile = (p) => ({
      name: p.name,
      dob: formatDate(p.year, p.month, p.day),
      tob: formatTime(p.hour, p.min),
      place: {
        address: p.place,
        lat: p.lat,
        lng: p.lon,
      },
    });

    const primaryGender = primaryProfile.gender?.toLowerCase();
    const partnerGender = partnerProfile.gender?.toLowerCase();

    let state;

    // 🔹 Different gender → Male/Female mapping
    if (primaryGender !== partnerGender) {
      state =
        primaryGender === "male"
          ? {
              boyData: mapProfile(primaryProfile),
              girlData: mapProfile(partnerProfile),
            }
          : {
              boyData: mapProfile(partnerProfile),
              girlData: mapProfile(primaryProfile),
            };
    } else {
      // 🔹 Same gender → Primary = boyData, Partner = girlData
      state = {
        boyData: mapProfile(primaryProfile),
        girlData: mapProfile(partnerProfile),
      };
    }

    navigate(PATH.privateRoutes.MATCHMAKING_DETAILS.path, { state });
  };

  /* -------------------- ADD PROFILE -------------------- */
  const handleSubmitProfile = async (formData) => {
    try {
      const payload = buildKundliPayload(formData);

      // Check for duplicate
      if (isDuplicateKundli(payload, profiles)) {
        console.log("❌ Duplicate detected by frontend check");
        Toast.error("This profile already exists");
        throw new Error("Duplicate profile");
      }

      if (isLoggedIn) {
        // LOGGED IN: Save to database
        console.log("=== CREATE KUNDLI API CALL ===");
        console.log("Form Data:", formData);
        console.log("Payload being sent:", JSON.stringify(payload, null, 2));
        console.log("Existing profiles count:", profiles.length);

        // Generate and log curl command
        const curlCommand = generateCurlCommand(
          "kundlis/create",
          "POST",
          payload,
          token,
        );
        console.log("\n📋 CURL Command:\n");
        console.log(curlCommand);
        console.log("\n==============================");

        const result = await createKundli(payload).unwrap();
        console.log("✅ API Response:", result);
        Toast.success("Profile added successfully");

        // Refetch to get updated list
        await refetch();

        // Auto-select the newly created profile based on selectingType
        if (result?.data) {
          const newProfile = result.data;

          if (selectingType === "PRIMARY") {
            setPrimaryProfile(newProfile);
            setSelectedProfile(newProfile);
            // dispatch(setSelectedKundli(newProfile));
          } else if (selectingType === "PARTNER") {
            setPartnerProfile(newProfile);
          }
        }
      } else {
        // NOT LOGGED IN: Add to temporary profiles
        console.log("=== ADD TEMPORARY PROFILE ===");
        console.log("Form Data:", formData);
        console.log("Payload:", JSON.stringify(payload, null, 2));

        // Generate temporary ID
        const tempProfile = {
          ...payload,
          _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        setTempProfiles((prev) => [...prev, tempProfile]);
        console.log("✅ Temporary profile added");
        Toast.success("Profile added");

        // Auto-select the newly created profile based on selectingType
        if (selectingType === "PRIMARY") {
          setPrimaryProfile(tempProfile);
          setSelectedProfile(tempProfile);
          // dispatch(setSelectedKundli(tempProfile));
        } else if (selectingType === "PARTNER") {
          setPartnerProfile(tempProfile);
        }
      }

      setShowAddProfile(false);
      setSelectingType(null);
    } catch (err) {
      console.error("=== CREATE KUNDLI ERROR ===");
      console.error("Error object:", err);
      console.error("Error data:", err?.data);
      console.error("===========================");

      if (err?.message !== "Duplicate profile") {
        const errorMessage =
          err?.data?.message || err?.message || "Failed to add profile";

        Toast.error(errorMessage);
      }
      throw err;
    }
  };

  const buildKundliPayload = (data) => {
    const dateObj = new Date(data.birthDate);
    const timeObj = data.birthTime ? data.birthTime.split(":") : ["0", "0"];

    return {
      name: data.name,
      gender: data.identity.toLowerCase(),
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
      relation: "Self", // You may need to add this to API
    };
  };
  /* -------------------- UI -------------------- */
  return (
    <div className={styles.matchMakingMain}>
      <BackButton />
      <div className={styles.matchMaking}>
          <img className={styles.topImg} src={matchMakingImg} alt="img" />
          
        <div className={styles.matchMakingCard}>
          <div className={styles.topTitles}>
            <h2>Bonded by Destiny</h2>
            <p>Matchmaking analyzes compatibility between two charts.</p>
          </div>

          <div className={styles.matchMakingInputs}>
            <div className={styles.matchInput}>
              <label className="block font-medium mb-2">
                Select Primary Profile
              </label>
              <div
                onClick={() => {
                  setSelectingType("PRIMARY");
                  setShowSelectProfile(true);
                }}
                className="flex items-center justify-between border rounded-xl px-4 py-3 bg-white"
              >
                <span>{primaryProfile?.name || "Select Profile"}</span>
                <ChevronDown className="w-4 h-4 text-orange-500" />
              </div>
            </div>

            <div className={styles.matchInput}>
              <label className="block font-medium mb-2">
                Select Partner’s Profile
              </label>
              <div
                onClick={() => {
                  setSelectingType("PARTNER");
                  setShowSelectProfile(true);
                }}
                className="flex items-center justify-between border rounded-xl px-4 py-3 bg-white"
                >
                <span className={partnerProfile ? "" : "text-gray-400"}>
                  {partnerProfile?.name || "Add Profile"}
                </span>
                <ChevronDown className="w-4 h-4 text-orange-500" />
              </div>
            </div>

            <button className={styles.matchMakingBtn} onClick={handleProceed}>
              Proceed Ahead 
              <svg xmlns="http://www.w3.org/2000/svg" width="7" height="14" viewBox="0 0 7 14" fill="none">
                <path d="M0.75 12.63L5.64 7.74C6.2175 7.1625 6.2175 6.2175 5.64 5.64L0.75 0.75" stroke="white" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <img className={styles.bottomImg} src={matchMakingImgBottom} alt="img" />

        </div>
      </div>

      {/* Profile Manager - Handles all profile operations */}
      <ProfileManager
        isOpen={showSelectProfile}
        onClose={() => {setShowSelectProfile(false);setSelectingType(null);}}
        onProfileSelect={handleSelectProfile}
        selectedProfileId={
          selectingType === "PRIMARY"
            ? primaryProfile?._id
            : partnerProfile?._id
        }
        excludedProfileIds={
          selectingType === "PRIMARY"
            ? partnerProfile?._id ? [partnerProfile._id] : []
            : primaryProfile?._id ? [primaryProfile._id] : []
        }
        title="Select Profile"
        enabledOperations={{
          list: true,
          add: true,
          edit: true,
          delete: true,
        }}
        matchmakingMode={true}
      />

      {/* SELECT PROFILE POPUP */}
      {/* <ProfileListingModal
        isOpen={showSelectProfile}
        onClose={() => {
          setShowSelectProfile(false);
          
        }}
        profiles={filteredProfiles}
        selectedProfileId={
          selectingType === "PRIMARY"
            ? primaryProfile?._id
            : partnerProfile?._id
        }
        onSelectProfile={handleSelectProfile}
        onDeleteProfile={(profileId) =>
          handleDeleteProfile({ stopPropagation: () => {} }, profileId)
        }
        onEditProfile={handleEditProfile}
        onAddProfile={() => {
          setShowAddProfile(true);
          setShowSelectProfile(false);
        }}
        title={
          selectingType === "PRIMARY"
            ? "Select Primary Profile"
            : "Select Partner's Profile"
        }
        showAddButton={true}
        showDeleteButton={true}
        showEditButton={true}
        emptyMessage={
          isLoggedIn
            ? "No profiles found. Add a profile to get started."
            : "Add profiles to see match results."
        }
      /> */}

      {/* Add Profile Modal */}
      {/* <AddProfileModal
        isOpen={showAddProfile}
        onClose={() => {
          setShowAddProfile(false);
          setSelectingType(null);
        }}
        onSubmit={handleSubmitProfile}
        isLoading={isCreating}
        title="Add Profile"
        showProfileListing={true}
        profiles={profiles}
        selectedProfileId={
          selectingType === "PRIMARY"
            ? primaryProfile?._id
            : partnerProfile?._id
        }
        onSelectProfile={(profile) => {
          if (selectingType === "PRIMARY") {
            setPrimaryProfile(profile);
            setSelectedProfile(profile);
          } else if (selectingType === "PARTNER") {
            setPartnerProfile(profile);
          }
        }}
        onDeleteProfile={(profileId) => {
          setProfileToDelete(profileId);
          setShowDeleteModal(true);
        }}
      /> */}
      {/* Delete Confirmation Modal */}
      {/* {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Profile"
          message="Are you sure you want to delete this profile? This action cannot be undone."
          onCancel={() => {
            setShowDeleteModal(false);
            setProfileToDelete(null);
          }}
          onConfirm={confirmDeleteProfile}
        />
      )} */}

      {/* Edit Profile Modal */}
      {/* <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => {
          setShowEditProfile(false);
          setProfileToEdit(null);
        }}
        onSubmit={handleSubmitEditProfile}
        isLoading={isCreating}
        title="Edit Profile"
        initialData={getEditInitialData()}
      /> */}
    </div>
  );
};

export default MatchMaking;
