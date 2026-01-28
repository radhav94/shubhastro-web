import styles from "./MatchMakingV2.module.scss";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronDown, Heart } from "lucide-react";
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
import DeleteConfirmationModal from "../../../component/UI/modal/deleteModal/DeleteConfirmationModal";
import ProfileListingModal from "../../../component/UI/Profile/ProfileListingModal";
import bondIcon from "../../../assets/icons/destiny-icon.svg";

const MatchMaking = () => {
  const navigate = useNavigate();

  /* -------------------- STATE -------------------- */
  const [showSelectProfile, setShowSelectProfile] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);

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

  /* -------------------- TEMPORARY PROFILES (NON-LOGGED-IN) -------------------- */
  const [tempProfiles, setTempProfiles] = useState([]);

  /* -------------------- CURL GENERATOR -------------------- */
  const generateCurlCommand = (endpoint, _method, payload, token) => {
    const baseUrl = import.meta.env.VITE_APP_API_BASE_URL || "https://devapi-shubhtalk.epicon.in";
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
  const { data, refetch } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  const [createKundli, { isLoading: isCreating }] =
    useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();

  const [getNumerologyPrediction] =
    useLazyGetNumerologyPredictionQuery();
  
  // Combine saved profiles (if logged in) with temporary profiles (if not logged in)
  const savedProfiles = data?.data || [];
  const profiles = isLoggedIn ? savedProfiles : tempProfiles;
  
  const location = useLocation();
  useEffect(() => {
    if (location.state?.boyData && location.state?.girlData && profiles.length) {
      const { boyData, girlData } = location.state;
  
      const findProfile = (data) =>
        profiles.find(
          (p) =>
            p.name === data.name &&
            p.place === data.place.address &&
            p.lat === data.place.lat &&
            p.lon === data.place.lng
        );
  
      const boyProfile = findProfile(boyData);
      const girlProfile = findProfile(girlData);
  
      if (boyProfile && girlProfile) {
        setPrimaryProfile(boyProfile);
        setPartnerProfile(girlProfile);
        setSelectedProfile(boyProfile);
      }
    }
  }, [location.state, profiles]);
  /* -------------------- AUTO SELECT -------------------- */
  useEffect(() => {
    if (profiles.length && !primaryProfile) {
      setPrimaryProfile(profiles[0]);
      setSelectedProfile(profiles[0]);
    }
  }, [profiles, primaryProfile]);

  /* -------------------- NUMEROLOGY -------------------- */
  useEffect(() => {
    if (selectedProfile) {
      const date = `${String(selectedProfile.day).padStart(2, "0")}/${String(
        selectedProfile.month
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
        k.place.trim().toLowerCase() === payload.place.trim().toLowerCase()
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
          token
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
        
        setTempProfiles(prev => prev.filter(p => p._id !== profileToDelete));
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
        err?.data?.message || 
        err?.message || 
        "Failed to delete profile";
      
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
        const curlCommand = generateCurlCommand("kundlis/create", "POST", payload, token);
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
        
        setTempProfiles(prev => [...prev, tempProfile]);
        console.log("✅ Temporary profile added");
        Toast.success("Profile added");
        
        // Auto-select the newly created profile based on selectingType
        if (selectingType === "PRIMARY") {
          setPrimaryProfile(tempProfile);
          setSelectedProfile(tempProfile);
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
      
      const errorMessage = 
        err?.data?.message || 
        err?.message || 
        "Failed to add profile";
      
      Toast.error(errorMessage);
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
      hour: data.unknownBirthTime ? 0 : parseInt(timeObj[0]),
      min: data.unknownBirthTime ? 0 : parseInt(timeObj[1]),
      second: 0,
      place: data.birthPlace,
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      tzone: 5.5,
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
    <div className={styles.matchMaking}>
      <div className="w-full max-w-md bg-white flex flex-col">
        {/* HEADER */}
        <div className="bg-[#FFF4EA] px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"
          >
            <ChevronLeft className="text-orange-500 w-5 h-5" />
          </button>

          {/* <div className="text-left flex-1">
            <p className="text-xs text-gray-500">Select Profile</p>
            <div className="flex items-center gap-1 font-semibold text-lg">
              {selectedProfile?.name || "Select Profile"}
              <ChevronDown className="w-4 h-4 text-orange-500" />
            </div>
          </div> */}

          {/* <button
            onClick={handleEditProfile}
            disabled={!selectedProfile}
            className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"
          >
            <Edit2 className="text-orange-500 w-5 h-5" />
          </button> */}
        </div>

        {/* CONTENT */}
        <div className={styles.matchMakingCard}>
          <div className="bg-white border rounded-2xl p-6 text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center">
                <img src={bondIcon} alt="Shubh Talk Logo" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Bonded by Destiny</h2>
            <p className="text-gray-500 text-sm">
              Matchmaking analyzes compatibility between two charts.
            </p>
          </div>

          {/* PRIMARY */}
          <div className="mt-6">
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

          <div className="flex justify-center my-6">
            <Heart className="text-orange-500 w-6 h-6" />
          </div>

          {/* PARTNER */}
          <div>
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
        </div>

        {/* BUTTON */}
        <div className="bg-white px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:static md:shadow-none">
          <button
            onClick={handleProceed}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 rounded-full flex items-center justify-center gap-2"
          >
            Proceed Ahead
            <span className="text-xl">›</span>
          </button>
        </div>
      </div>

      {/* SELECT PROFILE POPUP */}
      <ProfileListingModal
        isOpen={showSelectProfile}
        onClose={() => {
          setShowSelectProfile(false);
          setSelectingType(null);
        }}
        profiles={filteredProfiles}
        selectedProfileId={
          selectingType === "PRIMARY"
            ? primaryProfile?._id
            : partnerProfile?._id
        }
        onSelectProfile={handleSelectProfile}
        onDeleteProfile={(profileId) => handleDeleteProfile({ stopPropagation: () => {} }, profileId)}
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
        emptyMessage={isLoggedIn ? "No profiles found. Add a profile to get started." : "Add profiles to see match results."}
      />
      
      {/* Add Profile Modal */}
      <AddProfileModal
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
      />
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Profile"
          message="Are you sure you want to delete this profile? This action cannot be undone."
          onCancel={() => {
            setShowDeleteModal(false);
            setProfileToDelete(null);
          }}
          onConfirm={confirmDeleteProfile}
        />
      )}
    </div>
  );
};

export default MatchMaking;
