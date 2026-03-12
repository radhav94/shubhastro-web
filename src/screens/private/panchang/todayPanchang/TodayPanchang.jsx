import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styles from "./TodayPanchang.module.scss";
import { useFetchAdvancePanchangQuery } from "../../../../redux/api/panchang/panchangApi";

import { PanchangInputCard } from "../../../../component";
import PanchangCards from "../../../../component/UI/cards/PanchangCards";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

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
  const pad = (num) => String(num).padStart(2, "0");
  
  // Get initial date and location from navigation state
  const { date: initialDate, location: initialLocation, latitude: initialLat, longitude: initialLon } = location.state || {};
  
  // Initialize with passed data or current date/location
  const now = initialDate ? new Date(initialDate) : new Date();
  
  const [payload, setPayload] = useState({
    day: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    hour: pad(now.getHours()),
    min: pad(now.getMinutes()),  
    lat: initialLat || 19.132,
    lon: initialLon || 72.342, 
    tzone: 5.5,
  });
  
  const { data, isLoading, isSuccess } = useFetchAdvancePanchangQuery(payload);
  const panchangData = data?.response;

  // Auto-trigger API call if date/location passed from navigation
  useEffect(() => {
    if (initialDate && initialLat && initialLon) {
      const date = new Date(initialDate);
      const pad = (val) => (val < 10 ? "0" + val : val);
      
      setPayload({
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        hour: pad(date.getHours()),
        min: pad(date.getMinutes()),
        lat: Number(initialLat),
        lon: Number(initialLon),
        tzone: 5.5,
      });
    }
  }, [initialDate, initialLat, initialLon]);

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
    setPayload({
      day: dob ? dob.getUTCDate() : now.getDate(),
      month: dob ? dob.getUTCMonth() + 1 : now.getMonth() + 1,
      year: dob ? dob.getUTCFullYear() : now.getFullYear(),
      hour: dob ? pad(dob.getHours()) : pad(now.getHours()),
      min: dob ? pad(dob.getMinutes()-27) : pad(now.getMinutes()),
      lat: Number(details?.latitude) || 19.132,
      lon: Number(details?.longitude) || 72.342,
      tzone: 5.5,
    });
  };

  return (
    <>
      <PrimaryLoader isLoading={isLoading} />

      {isSuccess && (
        <div className={styles.mainContainer}>
          <PanchangInputCard 
            onTap={onTap} 
            title="Panchang"
            initialDate={initialDate}
            initialLocation={initialLocation}
            initialLatitude={initialLat}
            initialLongitude={initialLon}
          />

          <PanchangCards data={todayData} />
          <PanchangCards data={ayanamsaData} title="Ayanamsa & Rasi" />
          <PanchangCards data={masaData} title="Masa (Hindu Month Details)" />
          <PanchangCards data={yearData} title="Samvat Years" />

          <PanchangCards title="Important Muhurats" muhratData={muhuratData} />

          <PanchangCards
            title="Tithi"
            data={tithiData}
            summary={panchangData?.tithi?.special}
          />
          <PanchangCards
            title="Nakshatra"
            data={nakshatraData}
            summary={panchangData?.nakshatra?.summary}
          />
          <PanchangCards title="Yoga" data={yogData} />
          <PanchangCards title="Karana" data={karanData} />
        </div>
      )}
    </>
  );
};

export default TodayPanchang;
