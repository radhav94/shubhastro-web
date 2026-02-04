import { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import PrimaryTabs from "../../../component/UI/tabs/PrimaryTabs";
import BasicContent from "./BasicContent/BasicContent";
import KundaliContent from "./kundaliContent/KundaliContent";
import HtmlContentCard from "../../../component/UI/cards/htmlContenCard/HtmlContentCard";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { useKundli } from "./useKundli";
import KpContent from "./KpContent/KpContent";
import ChartsContent from "./ChartsContent/ChartsContent";
import AshtakvargaContent from "./AshtakvargaContent/AshtakvargaContent";
import DashaContent from "./DashaContent/DashaContent";
import Report from "./FreeKundli/Report";
import { buildVedicParam } from "../../../utils/VedicParams.js/vedicParams";
import Prediction from "./FreeKundli/Prediction";
import {
  useGetPlanetsQuery,
  useGetAstroDetailsQuery,
} from "../../../redux/api/kundli/kundliApi";
import {
  useGetAllKundlisQuery,
  useCreateKundliMutation,
  useDeleteKundliMutation,
} from "../../../services/appServices/kundliServicesNew";
import { setForm } from "../../../redux/kundliform/formSlice";
import { Toast } from "../../../component";
import ProfileSelector from "./components/ProfileSelector";
import KundliHeader from "./components/KundliHeader";
import KundliInfoContent from "./components/KundliInfoContent";
import AddProfileModal from "../../../component/UI/Profile/AddProfileModal";
import EditProfileModal from "../../../component/UI/Profile/EditProfileModal";
import DeleteConfirmationModal from "../../../component/UI/modal/deleteModal/DeleteConfirmationModal";
import ProfileListingModal from "../../../component/UI/Profile/ProfileListingModal";
import LocationSearch from "../../../utils/location/locationSearchVedic";
import styles from "./components/ProfileModals.module.scss";

const Kundali = () => {
  const contentRef = useRef(null);
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { kundliId } = useParams();

  // Get initial tab index from query params
  const getInitialTabIndex = () => {
    const tab = searchParams.get('tab');
    const tabMap = {
      'basic': 0,
      'kundli': 1,
      'kp': 2,
      'ashtakvarga': 3,
      'charts': 4,
      'dasha': 5,
      'free-report': 6,
      '12-months': 7,
    };
    return tabMap[tab] || 0;
  };

  const [
    dataIsFilled,
    setDataIsFilled,
    isLoading,
    setIsLoading,
    basicData,
    setBasicData,
    kundliInfoData,
    monthMap,
    onGenerateClick,
    userData,
    planetData,
    kpDetails,
    charts,
    ashtakvarga,
    dasha,
    report,
  ] = useKundli();

  // State management
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showSelectProfile, setShowSelectProfile] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);

  // Token & Auth
  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");
  
  const isLoggedIn = !!token;

  // Temporary profiles for non-logged-in users
  const [tempProfiles, setTempProfiles] = useState([]);

  // Get current user ID
  const currentUserId = role === "ASTROLOGER"
    ? localStorage.getItem("shubhtalk_astro_id")
    : localStorage.getItem("shubhtalk_customer_id");

  // API
  const { data: kundliData, refetch, isFetching } = useGetAllKundlisQuery(undefined, {
    skip: !token,
  });
  const [createKundli, { isLoading: isCreating }] = useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();

  // Combine saved profiles with temporary profiles
  const savedProfiles = kundliData?.data || [];
  const profiles = isLoggedIn ? savedProfiles : tempProfiles;

  // Check if we're in direct kundli view mode (with ID in URL)
  const isDirectKundliView = !!kundliId;

  // Auto-select profile based on kundliId or first profile
  useEffect(() => {
    // If kundliId is present in URL, try to find and select that profile
    if (kundliId && profiles.length && !isFetching) {
      const matchedProfile = profiles.find(p => p._id === kundliId);
      if (matchedProfile && selectedProfile?._id !== matchedProfile._id) {
        setSelectedProfile(matchedProfile);
      } else if (!matchedProfile && !selectedProfile) {
        // Profile not found - show error via toast
        Toast.error("Kundli profile not found");
      }
    } 
    // Otherwise, auto-select first profile if available
    else if (!kundliId && profiles.length && !selectedProfile && !isFetching) {
      setSelectedProfile(profiles[0]);
    }
  }, [kundliId, profiles, selectedProfile, isFetching]);

  // Clear selected profile when user changes (on refresh after login)
  useEffect(() => {
    if (currentUserId && selectedProfile) {
      // If the selected profile doesn't belong to current user, clear it
      // This handles the case where cached data from previous user is shown
      const profileBelongsToCurrentUser = profiles.some(
        profile => profile._id === selectedProfile._id
      );
      
      if (!profileBelongsToCurrentUser) {
        setSelectedProfile(null);
      }
    }
  }, [currentUserId, profiles]);

  // Dispatch selected profile to Redux when profile is selected
  useEffect(() => {
    if (selectedProfile) {
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      const meridiem = selectedProfile.hour >= 12 ? "PM" : "AM";
      const hour12 =
        selectedProfile.hour > 12
          ? selectedProfile.hour - 12
          : selectedProfile.hour === 0
            ? 12
            : selectedProfile.hour;

      const profilePayload = {
        name: selectedProfile.name,
        gender:
          selectedProfile.gender === "male"
            ? "Male"
            : selectedProfile.gender === "female"
              ? "Female"
              : "Others",
        day: String(selectedProfile.day),
        month: months[selectedProfile.month - 1],
        year: String(selectedProfile.year),
        hour: String(hour12),
        minute: String(selectedProfile.min),
        meridiem,
        birthPlace: selectedProfile.place,
        latitude: selectedProfile.lat,
        longitude: selectedProfile.lon,
      };

      dispatch(setForm(profilePayload));
    }
  }, [selectedProfile, dispatch]);

  const payload = useSelector((state) => state?.form?.kundliPayload);
  const params = buildVedicParam(payload);

  const {
    data: fullData,
    isLoading: planetLoading,
    isSuccess: planetSuccess,
  } = useGetPlanetsQuery(params ? params : skipToken);

  const {
    data,
    isSuccess: isAstro,
    isLoading: astroLoading,
  } = useGetAstroDetailsQuery(params ? params : skipToken);

  const astroDetails = data?.response;

  const tabsData = [
    {
      label: "Basic",
      content: (
        <BasicContent
          birthDetails={fullData?.response}
          birthPanchang={fullData?.response?.panchang}
          astroDetails={astroDetails}
        />
      ),
    },
    {
      label: "Kundli",
      content: <KundaliContent />,
    },
    {
      label: "KP",
      content: <KpContent />,
    },
    {
      label: "Ashtakvarga",
      content: <AshtakvargaContent />,
    },
    {
      label: "Charts",
      content: <ChartsContent />,
    },
    {
      label: "Dasha",
      content: <DashaContent />,
    },
    {
      label: "Free Report",
      content: <Report />,
    },
    {
      label: "12 Months Prediction",
      content: <Prediction params={params} skipToken={skipToken} />,
    },
  ];

  useEffect(() => {
    if (planetLoading || isAstro) {
      contentRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [planetLoading, isAstro]);

  // Helper functions
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
        k.place.trim().toLowerCase() === payload.place.trim().toLowerCase()
    );

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
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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

  // Handlers
  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
    setShowSelectProfile(false);
  };

  const handleDeleteProfile = (e, profileId) => {
    e?.stopPropagation?.();
    setProfileToDelete(profileId);
    setShowDeleteModal(true);
  };

  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return;

    try {
      if (isLoggedIn) {
        await deleteKundli(profileToDelete).unwrap();
        Toast.success("Profile deleted successfully");
        await refetch();
      } else {
        setTempProfiles(prev => prev.filter(p => p._id !== profileToDelete));
        Toast.success("Profile deleted");
      }
      
      if (selectedProfile?._id === profileToDelete) {
        setSelectedProfile(null);
      }
      
      setShowDeleteModal(false);
      setProfileToDelete(null);
    } catch (err) {
      const errorMessage = 
        err?.data?.message || 
        err?.message || 
        "Failed to delete profile";
      
      Toast.error(errorMessage);
      setShowDeleteModal(false);
      setProfileToDelete(null);
    }
  };

  const handleSubmitProfile = async (formData) => {
    try {
      const payload = buildKundliPayload(formData);
      
      if (isDuplicateKundli(payload, profiles)) {
        Toast.error("This profile already exists");
        throw new Error("Duplicate profile");
      }

      if (isLoggedIn) {
        const result = await createKundli(payload).unwrap();
        Toast.success("Profile added successfully");
        await refetch();
        
        if (result?.data) {
          setSelectedProfile(result.data);
        }
      } else {
        const tempProfile = {
          ...payload,
          _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        
        setTempProfiles(prev => [...prev, tempProfile]);
        Toast.success("Profile added");
        setSelectedProfile(tempProfile);
      }
      
      setShowAddProfile(false);
    } catch (err) {
      const errorMessage = 
        err?.data?.message || 
        err?.message || 
        "Failed to add profile";
      
      Toast.error(errorMessage);
      throw err;
    }
  };

  const handleEditProfileFromListing = (profile) => {
    setSelectedProfile(profile);
    setShowSelectProfile(false);
    setShowEditProfile(true);
  };

  const handleEditProfile = () => {
    if (selectedProfile) {
      setShowEditProfile(true);
    }
  };

  const handleSubmitEditProfile = async (formData) => {
    try {
      if (isLoggedIn) {
        // Delete old profile and create new one
        if (selectedProfile?._id) {
          await deleteKundli(selectedProfile._id).unwrap();
        }

        const payload = buildKundliPayload(formData);
        const result = await createKundli(payload).unwrap();

        Toast.success("Profile updated successfully");
        await refetch();

        if (result?.data) {
          setSelectedProfile(result.data);
        }
      } else {
        // Update temporary profile
        const payload = buildKundliPayload(formData);
        const updatedProfile = {
          ...payload,
          _id: selectedProfile._id,
        };
        
        setTempProfiles(prev => 
          prev.map(p => p._id === selectedProfile._id ? updatedProfile : p)
        );
        setSelectedProfile(updatedProfile);
        Toast.success("Profile updated");
      }
      
      setShowEditProfile(false);
    } catch (err) {
      const errorMessage = 
        err?.data?.message || 
        err?.message || 
        "Failed to update profile";
      
      Toast.error(errorMessage);
      throw err;
    }
  };

  const getEditInitialData = () => {
    if (!selectedProfile) return null;

    return {
      name: selectedProfile.name,
      identity:
        selectedProfile.gender === "male"
          ? "Male"
          : selectedProfile.gender === "female"
            ? "Female"
            : "Others",
      relation: "Self",
      birthDate: `${selectedProfile.year}-${String(selectedProfile.month).padStart(2, "0")}-${String(selectedProfile.day).padStart(2, "0")}`,
      birthTime: `${String(selectedProfile.hour).padStart(2, "0")}:${String(selectedProfile.min).padStart(2, "0")}`,
      birthPlace: selectedProfile.place,
      unknownBirthTime: false,
      latitude: selectedProfile.lat,
      longitude: selectedProfile.lon,
    };
  };

  return (
    <div className={isDirectKundliView ? "" : "mt-10"}>
      {/* Free Kundli Online Title - Hidden in direct kundli view */}
      {!isDirectKundliView && <KundliHeader />}

      {/* Profile Selector - Hidden in direct kundli view */}
      {!isDirectKundliView && (
        <ProfileSelector
          selectedProfile={selectedProfile}
          onSelectClick={() => setShowSelectProfile(true)}
          onEditClick={handleEditProfile}
        />
      )}

      {/* Show informational content only when no profile is selected and not in direct view */}
      {!selectedProfile && !isDirectKundliView && <KundliInfoContent />}

      <PrimaryLoader isLoading={planetLoading || astroLoading} />

      {/* Show tabs only when profile is selected and data is loaded */}
      {selectedProfile && (
        <div ref={contentRef} id="kundli-tabs">
          {planetLoading || isAstro ? (
            <PrimaryTabs tabs={tabsData} initialActiveIndex={getInitialTabIndex()} />
          ) : (
            <HtmlContentCard sections={kundliInfoData} />
          )}
        </div>
      )}

      {/* Profile Listing Modal */}
      <ProfileListingModal
        isOpen={showSelectProfile}
        onClose={() => setShowSelectProfile(false)}
        profiles={profiles}
        selectedProfileId={selectedProfile?._id}
        onSelectProfile={handleSelectProfile}
        onDeleteProfile={(profileId) => handleDeleteProfile(null, profileId)}
        onEditProfile={handleEditProfileFromListing}
        onAddProfile={() => {
          setShowAddProfile(true);
          setShowSelectProfile(false);
        }}
        title="Select Profile"
        showAddButton={true}
        showDeleteButton={true}
        showEditButton={true}
        emptyMessage={isLoggedIn ? "No profiles found. Add a profile to get started." : "Add profiles to see your kundli."}
      />
      
      {/* Add Profile Modal */}
      <AddProfileModal
        isOpen={showAddProfile}
        onClose={() => setShowAddProfile(false)}
        onSubmit={handleSubmitProfile}
        isLoading={isCreating}
        title="Add Profile"
        showProfileListing={true}
        profiles={profiles}
        selectedProfileId={selectedProfile?._id}
        onSelectProfile={handleSelectProfile}
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

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSubmit={handleSubmitEditProfile}
        isLoading={isCreating}
        title="Edit Profile"
        initialData={getEditInitialData()}
      />
    </div>
  );
};

export default Kundali;
