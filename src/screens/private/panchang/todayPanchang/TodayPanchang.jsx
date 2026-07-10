import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import styles from "./TodayPanchang.module.scss";
import { useFetchAdvancePanchangQuery } from "../../../../redux/api/panchang/panchangApi";
import useUserLocation from "../../../../utils/hooks/useUserLocation";
import { useGetAstroDetailsQuery, useGetPlanetsQuery } from "../../../../redux/api/kundli/kundliApi";
import { useGetAllKundlisQuery } from "../../../../services/appServices/kundliServicesNew";
import { buildVedicParam } from "../../../../utils/VedicParams.js/vedicParams";
import { skipToken } from "@reduxjs/toolkit/query";
import { setForm } from "../../../../redux/kundliform/formSlice";
import { setSelectedKundli } from "../../../../redux/kundli/kundliSlice";
import { trackEvent } from "../../../../utils/analytics";

import { PanchangInputCard } from "../../../../component";
import PanchangCards from "../../../../component/UI/cards/PanchangCards";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import BasicContent from "../../kundli/BasicContent/BasicContent";
import BackButton from "../../../../component/UI/BackButton/BackButton";
import ProfileSelector from "../../kundli/components/ProfileSelector";
import { ProfileManager } from "../../../../component/UI/Profile";
// import AccordionSection from "../../../../component/UI/AccordionSection/AccordionSection";

// Icons
import { BsCalendar2Week } from "react-icons/bs";
import { TbSunrise, TbSunset2 } from "react-icons/tb";
import {
  FaMoon,
  FaSun,
  FaStar,
  FaRegMoon,
  FaCloudSun,
  FaGlobeAsia,
  FaClock,
  FaDirections,
  FaCloud,
} from "react-icons/fa";
import { GiMoonBats, GiStonePath } from "react-icons/gi";
import { RiMoonFoggyFill, RiMoonFoggyLine } from "react-icons/ri";
import { CiCloudOn } from "react-icons/ci";
import { GoNumber } from "react-icons/go";
import { WiMoonFull } from "react-icons/wi";

const TodayPanchang = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const pad = (num) => String(num).padStart(2, "0");
  const userLocation = useUserLocation();

  // Track panchang page view on mount
  useEffect(() => {
    const now = new Date();
    trackEvent("panchang_viewed", {
      date_viewed: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    });
  }, []);

  // Profile selector state
  const [showSelectProfile, setShowSelectProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  
  // Get initial date and location from navigation state OR URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const { date: initialDate, location: initialLocation, latitude: initialLat, longitude: initialLon } = location.state || {};
  
  // Fallback to query params if state is not available
  const queryLat = searchParams.get('lat');
  const queryLon = searchParams.get('lon');
  
  const finalLat = initialLat || queryLat || userLocation.lat;
  const finalLon = initialLon || queryLon || userLocation.lon;
  const finalLocation = initialLocation || userLocation.locationName;
  
  // Initialize with passed data or current date/location
  const now = initialDate ? new Date(initialDate) : new Date();
  
  const [payload, setPayload] = useState({
    day: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    hour: pad(now.getHours()),
    min: pad(now.getMinutes()),  
    lat: finalLat,
    lon: finalLon, 
    tzone: 5.5,
  });
  
  const { data, isLoading, isSuccess } = useFetchAdvancePanchangQuery(payload);
  const panchangData = data?.response;

  // Tab state: "birth" or "overall"
  const [panchangTab, setPanchangTab] = useState("birth");

  // ── Birth Panchang: Profile & API data ──
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const selectedKundli = useSelector((state) => state.kundli?.selectedKundli);

  const { data: kundliProfilesData } = useGetAllKundlisQuery(undefined, {
    skip: !isLoggedIn,
  });
  const profiles = kundliProfilesData?.data || [];
  const selfProfile = profiles.find((p) => p.relation?.toLowerCase() === "self") || profiles[0];
  const activeProfile = selectedProfile
    ? profiles.find((p) => p._id === selectedProfile._id) || selectedProfile
    : selectedKundli?._id
      ? profiles.find((p) => p._id === selectedKundli._id) || selfProfile
      : selfProfile;

  // Auto-select first profile
  useEffect(() => {
    if (profiles.length && !selectedProfile) {
      const initial = selectedKundli?._id
        ? profiles.find((p) => p._id === selectedKundli._id) || selfProfile
        : selfProfile;
      if (initial) setSelectedProfile(initial);
    }
  }, [profiles.length]);

  // Handle profile selection from modal
  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
    setShowSelectProfile(false);
    dispatch(setSelectedKundli(profile));
  };

  // Sync active profile to Redux form state so BasicContent can read it
  useEffect(() => {
    if (!activeProfile) return;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const meridiem = activeProfile.hour >= 12 ? "PM" : "AM";
    const hour12 = activeProfile.hour > 12 ? activeProfile.hour - 12 : activeProfile.hour === 0 ? 12 : activeProfile.hour;

    dispatch(setForm({
      name: activeProfile.name,
      gender: activeProfile.gender === "male" ? "Male" : activeProfile.gender === "female" ? "Female" : "Others",
      day: String(activeProfile.day),
      month: months[activeProfile.month - 1],
      year: String(activeProfile.year),
      hour: String(hour12),
      minute: String(activeProfile.min),
      meridiem,
      birthPlace: activeProfile.place,
      latitude: activeProfile.lat,
      longitude: activeProfile.lon,
    }));
  }, [activeProfile?._id, dispatch]);

  // Build birth panchang params: use profile if available, else use page's default payload
  const birthPayload = activeProfile
    ? {
        day: activeProfile.day,
        month: activeProfile.month,
        year: activeProfile.year,
        hour: String(activeProfile.hour).padStart(2, "0"),
        min: String(activeProfile.min).padStart(2, "0"),
        lat: activeProfile.lat,
        lon: activeProfile.lon,
        tzone: activeProfile.tzone || 5.5,
      }
    : payload; // fallback to page's default date/location

  // Build vedic params for kundli APIs
  const birthVedicParams = buildVedicParam({
    day: birthPayload.day,
    month: birthPayload.month,
    year: birthPayload.year,
    hour: birthPayload.hour,
    min: birthPayload.min,
    lat: birthPayload.lat,
    lon: birthPayload.lon,
    tzone: birthPayload.tzone || 5.5,
  });

  // Fetch planets data (provides birthDetails + birthPanchang for BasicContent)
  const { data: planetsData, isLoading: planetsLoading } =
    useGetPlanetsQuery(birthVedicParams || skipToken);

  // Fetch astro details (provides avakhada data for BasicContent)
  const { data: astroDetailsRaw, isLoading: astroLoading } =
    useGetAstroDetailsQuery(birthVedicParams || skipToken);
  const astroDetails = astroDetailsRaw?.response;

  // Auto-trigger API call if date/location passed from navigation
  useEffect(() => {
    if (initialDate && (initialLat || queryLat) && (initialLon || queryLon)) {
      const date = new Date(initialDate);
      const pad = (val) => (val < 10 ? "0" + val : val);
      
      setPayload({
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        hour: pad(date.getHours()),
        min: pad(date.getMinutes()),
        lat: Number(initialLat || queryLat),
        lon: Number(initialLon || queryLon),
        tzone: 5.5,
      });
    }
  }, [initialDate, initialLat, initialLon, queryLat, queryLon, panchangTab]);

  // Update payload when browser geolocation resolves
  useEffect(() => {
    if (userLocation.loaded && !userLocation.isDefault) {
      setPayload((prev) => ({
        ...prev,
        lat: userLocation.lat,
        lon: userLocation.lon,
      }));
    }
  }, [userLocation.loaded, userLocation.lat, userLocation.lon]);

  // -------------------- TODAY HIGHLIGHTS --------------------
  const todayData = [
    { key: "Day", value: panchangData?.day?.name, icon: <BsCalendar2Week /> },

    {
      key: "Sunrise",
      value: panchangData?.advanced_details?.sun_rise,
      icon: <TbSunrise />,
    },
    {
      key: "Sunset",
      value: panchangData?.advanced_details?.sun_set,
      icon: <TbSunset2 />,
    },

    {
      key: "Moonrise",
      value: panchangData?.advanced_details?.moon_rise,
      icon: <FaMoon />,
    },
    {
      key: "Moonset",
      value: panchangData?.advanced_details?.moon_set,
      icon: <GiMoonBats />,
    },

    {
      key: "Next Full Moon",
      value: panchangData?.advanced_details?.next_full_moon,
      icon: <WiMoonFull />,
    },
    {
      key: "Next New Moon",
      value: panchangData?.advanced_details?.next_new_moon,
      icon: <FaMoon />,
    },

    {
      key: "Rasi (Moon Sign)",
      value: panchangData?.rasi?.name,
      icon: <GiStonePath />,
    },

    // Sun Position
    {
      key: "Sun Zodiac",
      value: panchangData?.sun_position?.zodiac,
      icon: <FaSun />,
    },
    {
      key: "Sun Nakshatra",
      value: panchangData?.sun_position?.nakshatra,
      icon: <FaStar />,
    },
    {
      key: "Sun Rasi No.",
      value: panchangData?.sun_position?.rasi_no,
      icon: <FaStar />,
    },
    {
      key: "Sun Nakshatra No.",
      value: panchangData?.sun_position?.nakshatra_no,
      icon: <FaStar />,
    },
    {
      key: "Sun Degree at Rise",
      value: panchangData?.sun_position?.sun_degree_at_rise,
      icon: <FaSun />,
    },

    // Moon Position
    {
      key: "Moon Degree",
      value: panchangData?.moon_position?.moon_degree,
      icon: <GiMoonBats />,
    },

    {
      key: "Ayanamsa",
      value: `${panchangData?.ayanamsa?.name}`,
      icon: <GiStonePath />,
    },
    {
      key: "Ayanamsa Number",
      value: panchangData?.ayanamsa?.number,
      icon: <GoNumber />,
    },

    {
      key: "Paksha",
      value: panchangData?.advanced_details?.masa?.paksha,
      icon: <FaRegMoon />,
    },
    {
      key: "Ritu",
      value: panchangData?.advanced_details?.masa?.ritu,
      icon: <CiCloudOn />,
    },
    {
      key: "Tamil Ritu",
      value: panchangData?.advanced_details?.masa?.ritu_tamil,
      icon: <FaCloud />,
    },

    {
      key: "Moon Yogini Nivas",
      value: panchangData?.advanced_details?.moon_yogini_nivas,
      icon: <RiMoonFoggyFill />,
    },
    {
      key: "Ahargana",
      value: panchangData?.advanced_details?.ahargana,
      icon: <FaGlobeAsia />,
    },

    {
      key: "Vaara",
      value: panchangData?.advanced_details?.vaara,
      icon: <FaGlobeAsia />,
    },
    {
      key: "Disha Shool",
      value: panchangData?.advanced_details?.disha_shool,
      icon: <FaDirections />,
    },

    { key: "Date", value: panchangData?.date, icon: <FaClock /> },
  ];

  // -------------------- MASA DETAILS --------------------
  const masa = panchangData?.advanced_details?.masa;

  const masaData = [
    { key: "Amanta Name", value: masa?.amanta_name },
    { key: "Amanta Number", value: masa?.amanta_number },
    { key: "Amanta Date", value: masa?.amanta_date },
    { key: "Alternate Amanta Name", value: masa?.alternate_amanta_name },
    { key: "Amanta Start", value: masa?.amanta_start },
    { key: "Amanta End", value: masa?.amanta_end },

    { key: "Purnimanta Name", value: masa?.purnimanta_name },
    { key: "Purnimanta Number", value: masa?.purnimanta_number },
    { key: "Purnimanta Date", value: masa?.purnimanta_date },
    {
      key: "Alternate Purnimanta Name",
      value: masa?.alternate_purnimanta_name,
    },
    { key: "Purnimanta Start", value: masa?.purnimanta_start },
    { key: "Purnimanta End", value: masa?.purnimanta_end },

    { key: "Adhik Maas", value: masa?.adhik_maasa ? "Yes" : "No" },
    { key: "Ayana", value: masa?.ayana },
    { key: "Real Ayana", value: masa?.real_ayana },

    { key: "Tamil Month", value: masa?.tamil_month },
    { key: "Tamil Month Number", value: masa?.tamil_month_num },
    { key: "Tamil Day", value: masa?.tamil_day },

    { key: "Moon Phase", value: masa?.moon_phase },
  ];

  // -------------------- YEAR DETAILS --------------------
  const years = panchangData?.advanced_details?.years;

  const yearData = [
    { key: "Kali Year", value: years?.kali },
    { key: "Kali Samvat Number", value: years?.kali_samvaat_number },
    { key: "Kali Samvat Name", value: years?.kali_samvaat_name },

    { key: "Saka Year", value: years?.saka },
    { key: "Saka Samvat Number", value: years?.saka_samvaat_number },
    { key: "Saka Samvat Name", value: years?.saka_samvaat_name },

    { key: "Vikram Samvat", value: years?.vikram_samvaat },
    { key: "Vikram Samvat Number", value: years?.vikram_samvaat_number },
    { key: "Vikram Samvat Name", value: years?.vikram_samvaat_name },
  ];

  // -------------------- TITHI DETAILS --------------------
  const tithi = panchangData?.tithi;

  const tithiData = [
    { key: "Name", value: tithi?.name },
    { key: "Number", value: tithi?.number },
    { key: "Type", value: tithi?.type },
    { key: "Deity", value: tithi?.diety },
    { key: "Meaning", value: tithi?.meaning },
    { key: "Special", value: tithi?.special },

    { key: "Start", value: tithi?.start },
    { key: "End", value: tithi?.end },

    { key: "Next Tithi", value: tithi?.next_tithi },
  ];

  // -------------------- NAKSHATRA DETAILS --------------------
  const nakshatra = panchangData?.nakshatra;

  const nakshatraData = [
    { key: "Name", value: nakshatra?.name },
    { key: "Number", value: nakshatra?.number },
    { key: "Pada", value: nakshatra?.pada },
    { key: "Lord", value: nakshatra?.lord },
    { key: "Deity", value: nakshatra?.diety },

    { key: "Meaning", value: nakshatra?.meaning },
    { key: "Special", value: nakshatra?.special },
    { key: "Summary", value: nakshatra?.summary },

    {
      key: "Auspicious Direction",
      value: nakshatra?.auspicious_disha?.join(", "),
    },

    { key: "Start", value: nakshatra?.start },
    { key: "End", value: nakshatra?.end },

    { key: "Next Nakshatra", value: nakshatra?.next_nakshatra },
  ];

  // -------------------- KARANA DETAILS --------------------
  const karana = panchangData?.karana;

  const karanData = [
    { key: "Name", value: karana?.name },
    { key: "Number", value: karana?.number },

    { key: "Type", value: karana?.type },
    { key: "Lord", value: karana?.lord },
    { key: "Deity", value: karana?.diety },

    { key: "Special", value: karana?.special },

    { key: "Start", value: karana?.start },
    { key: "End", value: karana?.end },

    { key: "Next Karana", value: karana?.next_karana },
  ];

  // -------------------- YOGA DETAILS --------------------
  const yoga = panchangData?.yoga;

  const yogData = [
    { key: "Name", value: yoga?.name },
    { key: "Number", value: yoga?.number },

    { key: "Meaning", value: yoga?.meaning },
    { key: "Special", value: yoga?.special },

    { key: "Start", value: yoga?.start },
    { key: "End", value: yoga?.end },

    { key: "Next Yoga", value: yoga?.next_yoga },
  ];

  // -------------------- MUHURAT DETAILS --------------------
  const muhuratData = {
    abhijit: {
      title: "Abhijit Muhurat",
      start: panchangData?.advanced_details?.abhijit_muhurta?.start,
      end: panchangData?.advanced_details?.abhijit_muhurta?.end,
    },
    rahukaal: {
      title: "Rahu Kaal",
      start: panchangData?.rahukaal.split("to")[0],
      end: panchangData?.rahukaal.split("to")[1],
    },
    gulika: {
      title: "Gulika Kaal",
      start: panchangData?.gulika.split("to")[0],
      end: panchangData?.gulika.split("to")[1],
    },
    yamakanta: {
      title: "Yamakanta Kaal",
      start: panchangData?.yamakanta.split("to")[0],
      end: panchangData?.yamakanta.split("to")[1],
    },
  };

  // -------------------------
  //  AYANAMSA & RASI SECTION
  // -------------------------
  const ayanamsaData = [
    { key: "Ayanamsa Name", value: panchangData?.ayanamsa?.name },
    { key: "Ayanamsa Number", value: panchangData?.ayanamsa?.number },
    { key: "Rasi (Moon Sign)", value: panchangData?.rasi?.name },
  ];

  // -------------------------
  //  INPUT HANDLER
  // -------------------------
  const onTap = (details) => {
    const now = new Date();
    const dob = details?.dateOfBirth ? new Date(details.dateOfBirth) : null;
    const pad = (val) => (val < 10 ? "0" + val : val);

    const newDate = dob || now;
    trackEvent("panchang_date_changed", {
      new_date: `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}`,
    });

    setPayload({
      day: dob ? dob.getUTCDate() : now.getDate(),
      month: dob ? dob.getUTCMonth() + 1 : now.getMonth() + 1,
      year: dob ? dob.getUTCFullYear() : now.getFullYear(),
      hour: dob ? pad(dob.getHours()) : pad(now.getHours()),
      min: dob ? pad(dob.getMinutes()-27) : pad(now.getMinutes()),
      lat: Number(details?.latitude) || userLocation.lat,
      lon: Number(details?.longitude) || userLocation.lon,
      tzone: 5.5,
    });
  };

  const intialDate = `${payload.year}-${String(payload.month).padStart(2, "0")}-${String(payload.day).padStart(2, "0")}`
  return (
    <>
      <BackButton />

      {/* Profile Selector - shown for logged-in users */}
      {isLoggedIn && (
        <ProfileSelector
          selectedProfile={activeProfile}
          onSelectClick={() => setShowSelectProfile(true)}
          onEditClick={() => {}}
        />
      )}

      {/* Profile Manager Modal */}
      <ProfileManager
        isOpen={showSelectProfile}
        onClose={() => setShowSelectProfile(false)}
        onProfileSelect={handleSelectProfile}
        selectedProfileId={activeProfile?._id}
        title="Select Profile"
        enabledOperations={{
          list: true,
          add: true,
          edit: true,
          delete: true,
        }}
      />

      <PrimaryLoader isLoading={isLoading} />

      {isSuccess && (
        <div className={styles.mainContainer}>
          {/* PanchangInputCard - only shown on Overall Panchang tab */}
         
            <PanchangInputCard 
              key={panchangTab}
              onTap={onTap} 
              title="Panchang"
              initialDate={intialDate}
              initialLocation={finalLocation}
              initialLatitude={finalLat}
              initialLongitude={finalLon}
              showForm={isLoggedIn ? panchangTab:"overall"}
            />
          

          {/* Tab Switch - only for logged-in users */}
          {isLoggedIn && (
            <div className={styles.tabWrapper}>
              <button
                className={`${styles.tab} ${panchangTab === "birth" ? styles.tabActive : ""}`}
                onClick={() => setPanchangTab("birth")}
              >
                Birth Panchang
              </button>
              <button
                className={`${styles.tab} ${panchangTab === "overall" ? styles.tabActive : ""}`}
                onClick={() => setPanchangTab("overall")}
              >
                Overall Panchang
              </button>
            </div>
          )}

          {/* Birth Panchang Tab - only for logged-in users */}
          {isLoggedIn && panchangTab === "birth" && (
            <div className={styles.birthPanchangContent}>
              {(planetsLoading || astroLoading) && <PrimaryLoader isLoading />}
              <BasicContent
                birthDetails={planetsData?.response}
                birthPanchang={planetsData?.response?.panchang}
                astroDetails={astroDetails}
                ghatkaChakra={planetsData?.response?.ghatka_chakra}
              />
            </div>
          )}

          {/* Overall Panchang - shown when tab is "overall" OR user is not logged in */}
          {(!isLoggedIn || panchangTab === "overall") && (
            <>
              <PanchangCards data={todayData} />
              <PanchangCards data={ayanamsaData} title="Ayanamsa & Rasi" />
              <PanchangCards data={masaData} title="Masa (Hindu Month Details)" />
              <PanchangCards data={yearData} title="Samvat Years" />
              <PanchangCards title="Important Muhurats" muhratData={muhuratData} />
              <PanchangCards title="Tithi" data={tithiData} summary={panchangData?.tithi?.special} />
              <PanchangCards title="Nakshatra" data={nakshatraData} summary={panchangData?.nakshatra?.summary} />
              <PanchangCards title="Yoga" data={yogData} />
              <PanchangCards title="Karana" data={karanData} />
            </>
          )}
        </div>
      )}
    </>
  );
};

export default TodayPanchang;
