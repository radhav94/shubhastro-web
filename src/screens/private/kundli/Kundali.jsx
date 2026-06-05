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
import FreeReportContent from "./FreeReportContent/FreeReportContent";
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
import { setSelectedKundli } from "../../../redux/kundli/kundliSlice";
import { Toast } from "../../../component";
import ProfileSelector from "./components/ProfileSelector";
import KundliHeader from "./components/KundliHeader";
import KundliInfoContent from "./components/KundliInfoContent";
import styles from "../../../component/UI/tabs/PrimaryTabs.module.scss";
import { ProfileManager } from "../../../component/UI/Profile";
import DownloadReportModal from "../aiwow/components/DownloadReportModal";
import { useWalletBalance } from "../wallet/useWalletBalance";
import { useGetChargesQuery } from "../../../redux/api/aiwow/aiwowApi";


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
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [localDownloadedLangs, setLocalDownloadedLangs] = useState({});

  const { balance: walletBalance, refreshWallet } = useWalletBalance();
  const { data: chargesData } = useGetChargesQuery();
  
  // Scroll to top on initial mount (page load / navigation)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      // Scroll to top so tab bar is visible
      window.scrollTo(0, 0);
    }
  }, [searchParams]);

  // Require auth for protected tabs/subtabs
  const tab = searchParams.get('tab');
  const subtab = searchParams.get('subtab');
  const protectedTabs = ['basic', 'dasha'];
  const requiresAuth = (subtab && subtab.startsWith('remed')) || protectedTabs.includes(tab);

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

  // Listen to header profile changes from Redux (kundli.selectedKundli)
  const headerSelectedKundli = useSelector((state) => state.kundli.selectedKundli);

  // Token & Auth
  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");
  
  const isLoggedIn = !!token;

  // Require auth for remedies subtab
  useEffect(() => {
    if (requiresAuth && !token) {
      const fullPath = `/kundli?${searchParams.toString()}`;
      localStorage.setItem("shubhtalk_redirect_after_login", fullPath);
      window.location.replace("/login?skip=welcome");
    }
  }, [requiresAuth, token, searchParams]);

  // Block render while redirecting to login
  if (requiresAuth && !token) {
    return null;
  }

  // Temporary profiles for non-logged-in users (persisted in sessionStorage)
  const [tempProfiles, setTempProfiles] = useState(() => {
    try {
      const saved = sessionStorage.getItem("tempKundliProfiles");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Sync tempProfiles to sessionStorage
  useEffect(() => {
    if (!isLoggedIn) {
      sessionStorage.setItem("tempKundliProfiles", JSON.stringify(tempProfiles));
    }
  }, [tempProfiles, isLoggedIn]);

  // Clear temp profiles when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      sessionStorage.removeItem("tempKundliProfiles");
      setTempProfiles([]);
    }
  }, [isLoggedIn]);

  // Clear temp profiles when navigating away
  useEffect(() => {
    return () => {
      sessionStorage.removeItem("tempKundliProfiles");
    };
  }, []);

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
  const selectedProfileRef = useRef(selectedProfile);
  selectedProfileRef.current = selectedProfile;

  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;

  useEffect(() => {
    const currentProfiles = profilesRef.current;
    // If kundliId is present in URL, try to find and select that profile
    if (kundliId && currentProfiles.length && !isFetching) {
      const matchedProfile = currentProfiles.find(p => p._id === kundliId);
      if (matchedProfile && selectedProfileRef.current?._id !== matchedProfile._id) {
        setSelectedProfile(matchedProfile);
      } else if (!matchedProfile && !selectedProfileRef.current) {
        Toast.error("Kundli profile not found");
      }
    } 
    // Otherwise, auto-select first profile if available
    else if (!kundliId && currentProfiles.length && !selectedProfileRef.current && !isFetching) {
      setSelectedProfile(currentProfiles[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kundliId, profiles.length, isFetching]);

  // Sync with header profile selection (same pattern as AIWow)
  useEffect(() => {
    if (!headerSelectedKundli?._id) return;
    if (headerSelectedKundli._id === selectedProfileRef.current?._id) return;
    // Find the fresh profile from our profiles list
    const match = profilesRef.current.find(p => p._id === headerSelectedKundli._id);
    if (match) {
      setSelectedProfile(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerSelectedKundli?._id]);

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
      dispatch(setSelectedKundli(selectedProfile));
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
  const handlePdfDownload = async (selectedLanguage) => {
    if (isDownloadingPdf) return;

    // Use passed language or fallback to Google Translate cookie
    const lang = selectedLanguage || (() => {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("googtrans="));
      if (cookie) {
        const value = decodeURIComponent(cookie.split("=")[1]);
        const parts = value.split("/");
        return parts[2] || "en";
      }
      return "en";
    })();
    
    // Fetch PDF without wallet balance check
    if (selectedProfile?._id) {
      setIsDownloadingPdf(true);
      try {
        const result = await getKundliPdf({ 
          kundliId: selectedProfile._id,
          language: lang 
        }).unwrap();
        
        if (result?.success && result?.data) {
          try {
            const response = await fetch(result.data);
            if (!response.ok) throw new Error("Fetch failed");
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `Kundli_Report_${selectedProfile?.name || "report"}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
            Toast.success("PDF downloaded!");
          } catch (fetchError) {
            console.error("Failed to fetch PDF as blob:", fetchError);
            Toast.error("Failed to download PDF");
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
            const currentUrl = window.location.pathname + window.location.search;
            navigate(`/recharge?returnUrl=${encodeURIComponent(currentUrl)}`);
          }, 1500);
        } else {
          const msg = error?.data?.message || error?.message || "Failed to generate PDF. Please try again.";
          Toast.error(msg);
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
          ghatkaChakra={fullData?.response?.ghatka_chakra}
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
      label: "Dosha",
      content: <FreeReportContent />,
    },
    {
      label: "12 Months Prediction",
      content: <Prediction params={params} skipToken={skipToken} />,
    },
    {
      label: (
        <div
          className={styles.downloadButton}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!selectedProfile?._id) {
              Toast.error("Please select a profile first");
              return;
            }
            setShowDownloadModal(true);
          }}
        >
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
        </div>
      ),
      content: (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>Click the Download button above to generate your Kundli PDF</p>
        </div>
      ),
    },
  ];

  // Track whether user has interacted (profile change) to allow auto-scroll
  const hasUserInteracted = useRef(false);

  useEffect(() => {
    // Only auto-scroll to content when user explicitly changed profile (not on initial load)
    const hasTabParam = searchParams.get('tab');
    if (hasUserInteracted.current && (planetLoading || isAstro) && !hasTabParam) {
      contentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
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
    // Mark that user has interacted so auto-scroll to content is allowed
    hasUserInteracted.current = true;

    // If it's a temporary profile (from non-logged-in user), add it to tempProfiles
    if (!isLoggedIn && profile._id?.startsWith('temp_')) {
      // Check if this temp profile already exists
      const exists = tempProfiles.some(p => p._id === profile._id);
      if (!exists) {
        setTempProfiles(prev => [...prev, profile]);
      }
    }

    const isSameProfile = selectedProfile?._id && selectedProfile._id === profile._id;

    setSelectedProfile(profile);
    setShowSelectProfile(false);
    setLocalDownloadedLangs({});

    // Only reset tab when selecting a different profile, not when editing the current one
    if (!isSameProfile) {
      setActiveTabIndex(0);

      // Clear tab and subtab query parameters
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('tab');
      newParams.delete('subtab');
      setSearchParams(newParams, { replace: true });
    }
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
      {/* {!isDirectKundliView && <KundliHeader />} */}

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
          {!isDirectKundliView && <KundliHeader />}
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

      {/* Download Report Modal */}
      <DownloadReportModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={async (language) => {
          // Check if this language PDF is already generated
          const freshProfile = profiles.find(p => p._id === selectedProfile?._id);
          const reports = freshProfile?.kundli_report || selectedProfile?.kundli_report || [];
          const existing = Array.isArray(reports) && reports.find(r => r?.language === language && r?.file_url);
          if (existing) {
            // Free — download existing PDF directly
            setShowDownloadModal(false);
            try {
              const res = await fetch(existing.file_url);
              const blob = await res.blob();
              const blobUrl = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = blobUrl;
              link.download = `Kundli_Report_${selectedProfile?.name || "report"}_${language}.pdf`;
              document.body.appendChild(link);
              link.click();
              link.remove();
              URL.revokeObjectURL(blobUrl);
              Toast.success("PDF downloaded!");
            } catch {
              Toast.error("Failed to download PDF");
            }
          } else {
            // Paid — keep modal open, show downloading state
            await handlePdfDownload(language);
            // After successful download, mark this language as free locally
            setLocalDownloadedLangs(prev => ({ ...prev, [language]: true }));
            refreshWallet();
            setShowDownloadModal(false);
          }
        }}
        featureName="Kundli Report"
        downloadCost={(() => {
          const charges = chargesData?.data || [];
          const slug = "Kundli-report";
          for (const section of charges) {
            if (!Array.isArray(section?.list)) continue;
            const match = section.list.find((c) => c?.slug?.toLowerCase() === slug.toLowerCase());
            if (match) return match.amount || 0;
          }
          return 0;
        })()}
        walletBalance={walletBalance ?? 0}
        isDownloading={isDownloadingPdf}
        languages={[
          { id: "en", label: "English", sub: "English" },
          { id: "hi", label: "Hindi", sub: "हिंदी" },
          { id: "mr", label: "Marathi", sub: "मराठी" },
          { id: "gu", label: "Gujarati", sub: "ગુજરાતી" },
          { id: "bn", label: "Bengali", sub: "বাংলা" },
        ]}
        generatedLanguages={(() => {
          const freshProfile = profiles.find(p => p._id === selectedProfile?._id);
          const reports = freshProfile?.kundli_report || selectedProfile?.kundli_report || [];
          const map = {};
          if (Array.isArray(reports)) {
            reports.forEach(r => {
              if (r?.language && r?.file_url) map[r.language] = r.file_url;
            });
          }
          // Merge locally tracked downloads
          Object.keys(localDownloadedLangs).forEach(lang => {
            if (!map[lang]) map[lang] = true;
          });
          return map;
        })()}
      />
    </div>
  );
};

export default Kundali;
