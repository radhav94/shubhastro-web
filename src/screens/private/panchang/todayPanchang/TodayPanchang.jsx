import { useState } from "react";
import { useTodayPanchang } from "./useTodayPanchang";
import styles from "./TodayPanchang.module.scss";
import { useFetchAdvancePanchangQuery } from "../../../../redux/api/panchang/panchangApi";
import { FaSun, FaMoon } from "react-icons/fa";
import { TbSunset2 } from "react-icons/tb";
import { GrSign } from "react-icons/gr";
import { CiCloudOn } from "react-icons/ci";
import { GiMoonBats, GiStonePath } from "react-icons/gi";
import { MdCalendarMonth } from "react-icons/md";
import { HiOutlineSwitchHorizontal } from "react-icons/hi";
import { FaRegMoon } from "react-icons/fa6";
import { PanchangInputCard } from "../../../../component";
import PanchangCards from "../../../../component/UI/cards/PanchangCards";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

const TodayPanchang = () => {
  const [data, onCardClick, onSubmit, zodiacDetails, onChat] =
    useTodayPanchang();

  const [payload, setPayload] = useState({
    day: 6,
    month: 1,
    year: 2000,
    hour: 7,
    min: 45,
    lat: 19.132,
    lon: 72.342,
    tzone: 5.5,
  });

  const {
    data: panchangData,
    isLoading,
    error,
    isSuccess,
  } = useFetchAdvancePanchangQuery({ payload });

  const todayData = [
    {
      key: "Sun Rise",
      value: panchangData?.sunrise,
      icon: <FaSun />,
    },
    {
      key: "Moon Rise",
      value: panchangData?.moonrise,
      icon: <FaMoon />,
    },
    {
      key: "Sun Set",
      value: panchangData?.sunset,
      icon: <TbSunset2 size={20} />,
    },
    {
      key: "Moon Set",
      value: panchangData?.moonset,
      icon: <GiMoonBats size={26} />,
    },

    { key: "Moon Sign", value: panchangData?.moon_sign, icon: <GrSign /> },
    { key: "Ayana", value: panchangData?.ayana, icon: <GiStonePath /> },
  ];

  const monthData = [
    {
      key: "Hindu month",
      value: panchangData?.hindu_maah?.purnimanta,
      icon: <MdCalendarMonth />,
    },
    {
      key: "Direction",
      value: panchangData?.disha_shool,
      icon: <HiOutlineSwitchHorizontal />,
    },
    { key: "Ritu", value: panchangData?.ritu, icon: <CiCloudOn /> },
    {
      key: "Tithi",
      value: panchangData?.tithi?.details?.tithi_name,
      icon: <FaRegMoon />,
    },
  ];

  const muhratData = {
    abhijit: {
      title: "Abhijit Muhurat",
      end: panchangData?.abhijit_muhurta?.end,
      start: panchangData?.abhijit_muhurta?.start,
    },
    rahukaal: {
      title: "Rahu Kaal",
      end: panchangData?.rahukaal?.end,
      start: panchangData?.rahukaal?.start,
    },
  };

  const tithiData = [
    {
      key: "Name",
      value: panchangData?.tithi?.details?.tithi_name,
    },
    {
      key: "Deity",
      value: panchangData?.tithi?.details?.deity,
    },
    {
      key: "Special",
      value: panchangData?.tithi?.details?.special,
    },
  ];

  const nakshatraData = [
    {
      key: "Name",
      value: panchangData?.nakshatra?.details?.nak_name,
    },
    {
      key: "Ruler",
      value: panchangData?.nakshatra?.details?.ruler,
    },
    {
      key: "Deity",
      value: panchangData?.nakshatra?.details?.deity,
    },
    {
      key: "Special",
      value: panchangData?.nakshatra?.details?.special,
    },
  ];

  const yogData = [
    {
      key: "Name",
      value: panchangData?.yog?.details?.yog_name,
    },
    {
      key: "Special",
      value: panchangData?.yog?.details?.special,
    },
  ];

  const karanData = [
    {
      key: "Name",
      value: panchangData?.karan?.details?.karan_name,
    },
    {
      key: "Ruler",
      value: panchangData?.karan?.details?.ruler,
    },
    {
      key: "Deity",
      value: panchangData?.karan?.details?.deity,
    },
    {
      key: "Special",
      value: panchangData?.karan?.details?.special?.slice(0, 33),
    },
  ];

  const onTap = (data) => {
    const date = new Date(data?.dateOfBirth);

    const payload = {
      day: parseInt(date.getUTCDate()) || 12,
      month: parseInt(date.getUTCMonth()) + 1 || 1,
      year: parseInt(date.getUTCFullYear()) || 1999,
      hour: parseInt(date.getUTCHours()) || 1,
      min: parseInt(date.getUTCMinutes()) || 6,
      lat: parseInt(data?.latitude) || 19.132,
      lon: parseInt(data?.longitude) || 72.342,
      tzone: 5.5,
    };

    setPayload(payload);
  };

  return (
    <>
      <PrimaryLoader isLoading={isLoading} />
      {isSuccess && (
        <div className={styles.mainContainer}>
          {/* <InternalBanner data={data} onCardClick={onCardClick} /> */}
          <PanchangInputCard onTap={onTap} title={"Today's Panchang"} />
          <div>
            <PanchangCards data={monthData} muhratData={muhratData} />
            <PanchangCards title="Sun and Moon Calculations" data={todayData} />
            <PanchangCards
              title="Nakshatra"
              data={nakshatraData}
              summary={panchangData?.nakshatra?.details?.summary}
            />
            <PanchangCards title="Tithi" data={tithiData} />
            <PanchangCards title="Yog" data={yogData} />
            <PanchangCards title="Karan" data={karanData} />
          </div>
        </div>
      )}
    </>
  );
};

export default TodayPanchang;
