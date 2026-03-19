import { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
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
  useLazyGetKundliPdfQuery,
} from "../../../services/appServices/kundliServicesNew";
import { setForm } from "../../../redux/kundliform/formSlice";
import { Toast } from "../../../component";
import ProfileSelector from "./components/ProfileSelector";
import KundliHeader from "./components/KundliHeader";
import KundliInfoContent from "./components/KundliInfoContent";
import styles from "../../../component/UI/tabs/PrimaryTabs.module.scss";
import { ProfileManager } from "../../../component/UI/Profile";


const Kundali = () => {
  const contentRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { kundliId } = useParams();
  
  // State to control active tab - default to Basic (0)
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [shouldRetryDownload, setShouldRetryDownload] = useState(false);
  
  // Sync activeTabIndex with query params on mount and when params change
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      const tabMap = {
        'basic': 0,
        'kundli': 1,
        'kp': 2,
        'ashtakvarga': 3,
        'charts': 4,
        'dasha': 5,
        'free-report': 6,
        '12-months': 7,
        'Download': 8,
        'download': 8, // Support lowercase as well
      };
      setActiveTabIndex(tabMap[tab] || 0);
    }
  }, [searchParams]);

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
  const [getKundliPdf] = useLazyGetKundliPdfQuery();

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

  // Check if user returned from payment and should retry download
  useEffect(() => {
    const fromPayment = searchParams.get('fromPayment');
    if (fromPayment === 'true' && selectedProfile?._id) {
      // Remove the fromPayment param
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('fromPayment');
      setSearchParams(newParams, { replace: true });
      
      // Set flag to retry download
      setShouldRetryDownload(true);
    }
  }, [searchParams, selectedProfile, setSearchParams]);

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

  // Function to handle PDF download
  const handlePdfDownload = async () => {
    if (isDownloadingPdf) return; // Prevent multiple clicks
    
    // Get language from Google Translate cookie
    const getCurrentLang = () => {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("googtrans="));
      if (cookie) {
        const value = decodeURIComponent(cookie.split("=")[1]);
        const parts = value.split("/");
        return parts[2] || "en";
      }
      return "en";
    };

    const selectedLanguage = getCurrentLang();
    
    // Fetch PDF without wallet balance check
    if (selectedProfile?._id) {
      setIsDownloadingPdf(true);
      try {
        const result = await getKundliPdf({ 
          kundliId: selectedProfile._id,
          language: selectedLanguage 
        }).unwrap();
        
        if (result?.success && result?.data) {
          Toast.success("Opening PDF in new tab...");
          
          // Fetch the PDF as a blob to create a dummy URL
          try {
            const response = await fetch(result.data);
            const blob = await response.blob();
            
            // Create a blob URL (this will show as blob:http://... in the browser)
            const blobUrl = URL.createObjectURL(blob);
            
            // Open the blob URL in a new tab
            const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
            
            // Add beforeunload event to the new window to show alert on close
            // Note: Modern browsers show a generic "Leave site?" message for security
            if (newWindow) {
              // Wait a bit for the window to load
              setTimeout(() => {
                try {
                  newWindow.addEventListener('beforeunload', (e) => {
                    // Trigger the browser's native confirmation dialog
                    e.preventDefault();
                    // Modern browsers ignore custom messages and show generic "Leave site?" prompt
                    return '';
                  });
                } catch (error) {
                  console.log('Could not add beforeunload listener:', error);
                }
              }, 500);
            }
            
            // Revoke the blob URL immediately after opening
            // The PDF will still display in the opened window, but the URL becomes invalid
            // This prevents the user from copying and reusing the URL
            setTimeout(() => {
              URL.revokeObjectURL(blobUrl);
            }, 1000); // Revoke after 1 second
            
          } catch (fetchError) {
            console.error("Failed to fetch PDF:", fetchError);
            // Fallback to direct URL if blob creation fails
            window.open(result.data, '_blank', 'noopener,noreferrer');
          }
        } else {
          Toast.error("Failed to load PDF");
        }
      } catch (error) {
        console.error("PDF fetch error:", error);
        
        // Check if status is 400 and redirect to recharge
        if (error?.status === 400) {
          Toast.error(error?.data?.message || "Insufficient balance. Redirecting to recharge...");
          setTimeout(() => {
            // Pass current URL as returnUrl to redirect back after payment
            const currentUrl = window.location.pathname + window.location.search;
            navigate(`/recharge?returnUrl=${encodeURIComponent(currentUrl)}`);
          }, 1500);
        } else {
          Toast.error(error?.data?.message || "Failed to load PDF");
        }
      } finally {
        setIsDownloadingPdf(false);
      }
    } else {
      Toast.error("Please select a profile first");
    }
  };

  // Effect to retry download after payment success
  useEffect(() => {
    if (shouldRetryDownload && selectedProfile?._id && !isDownloadingPdf) {
      setShouldRetryDownload(false);
      Toast.info("Retrying PDF download...");
      handlePdfDownload();
    }
  }, [shouldRetryDownload, selectedProfile, isDownloadingPdf]);

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
    {
      label: (
        <div
          className={styles.downloadButton}
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await handlePdfDownload();
          }}
        >
          {isDownloadingPdf ? (
            <>
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Downloading...
            </>
          ) : (
            <>
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Report
            </>
          )}
        </div>
      ),
      content: (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>Click the Download button above to generate your Kundli PDF</p>
        </div>
      ),
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
      hour: data.unknownBirthTime ? "00" : String(parseInt(timeObj[0])).padStart(2, "0"),
      min: data.unknownBirthTime ? "00" : String(parseInt(timeObj[1])).padStart(2, "0"),
      second: "00",
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
  const handleTabChange = async (tabIndex, tabLabel) => {
    console.log("Tab change requested:", tabIndex, tabLabel);
    
    // For all tabs, allow change
    return true;
  };

  const handleSelectProfile = (profile) => {
    // If it's a temporary profile (from non-logged-in user), add it to tempProfiles
    if (!isLoggedIn && profile._id?.startsWith('temp_')) {
      // Check if this temp profile already exists
      const exists = tempProfiles.some(p => p._id === profile._id);
      if (!exists) {
        setTempProfiles(prev => [...prev, profile]);
      }
    }
    
    setSelectedProfile(profile);
    setShowSelectProfile(false);
    
    // Reset to Basic tab (index 0)
    setActiveTabIndex(0);
    
    // Clear tab and subtab query parameters
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('tab');
    newParams.delete('subtab');
    setSearchParams(newParams, { replace: true });
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
        // Non-logged-in user: create temporary profile without API call
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
      // Only show error toast if it's not a duplicate profile error
      if (err?.message !== "Duplicate profile") {
        const errorMessage = 
          err?.data?.message || 
          err?.message || 
          "Failed to add profile";
        
        Toast.error(errorMessage);
      }
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
    <div className={!isDirectKundliView ? styles.directKundli : ""}>
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
            <PrimaryTabs 
              key={selectedProfile._id} 
              tabs={tabsData} 
              initialActiveIndex={activeTabIndex}
              onTabChange={handleTabChange}
            />
          ) : (
            <HtmlContentCard sections={kundliInfoData} />
          )}
        </div>
      )}


      {/* Profile Manager - Handles all profile operations */}
      <ProfileManager
        isOpen={showSelectProfile}
        onClose={() => setShowSelectProfile(false)}
        onProfileSelect={handleSelectProfile}
        selectedProfileId={selectedProfile?._id}
        title="Select Profile"
        profilesList={profiles}
        onDeleteProfile={(profileId) => {
          if (!isLoggedIn) {
            setTempProfiles(prev => prev.filter(p => p._id !== profileId));
            if (selectedProfile?._id === profileId) {
              setSelectedProfile(null);
            }
          }
        }}
        enabledOperations={{
          list: true,
          add: true,
          edit: true,
          delete: true,
        }}
      />

      {/* Profile Listing Modal */}
      {/* <ProfileListingModal
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
      /> */}
      
      {/* Add Profile Modal */}
      {/* <AddProfileModal
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
        onClose={() => setShowEditProfile(false)}
        onSubmit={handleSubmitEditProfile}
        isLoading={isCreating}
        title="Edit Profile"
        initialData={getEditInitialData()}
      /> */}
    </div>
  );
};

export default Kundali;
