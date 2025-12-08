// src/components/tabs/BasicContent.jsx
import React from "react";
import styles from "./BasicContent.module.scss";
import { PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";
import { useSelector } from "react-redux";
import { useFetchBirthDetailsQuery } from "../../../../redux/api/kundli/kundliApi";
import { capitalizeWords } from "../../../../utils/capitalize";

const DetailCard = ({ title, data = {} }) => {
  // format labels nicely (camelCase or snake_case → readable text)
  const formatKeyLabel = (key) => {
    if (!key) return "";
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const entries = Object.entries(data).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );

  return (
    <div className={styles.detailCard}>
      {title && <h3 className={styles.cardTitle}>{title}</h3>}
      <div className={styles.tableWrapper}>
        {entries.length > 0 && (
          <table className={styles.detailsTable}>
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key}>
                  <td className={styles.keyCell}>{formatKeyLabel(key)}</td>
                  <td className={styles.valueCell}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const BasicContent = (props) => {
  const userDetails = useSelector((state) => state?.form?.userDetails);

  const { birthDetails, birthPanchang, astroDetails } = props || {};

  if (!birthDetails || !birthPanchang || !astroDetails) return null;

  // Helper to format date
  const formatDate = (d, m, y) =>
    `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;

  // Helper to format time (12-hour with AM/PM)
  const formatTime = (hour, minute) => {
    let h = Number(hour);
    const suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${String(h).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )} ${suffix}`;
  };
  const monthMap = {
    Jan: 1,
    January: 1,
    Feb: 2,
    February: 2,
    Mar: 3,
    March: 3,
    Apr: 4,
    April: 4,
    May: 5,
    Jun: 6,
    June: 6,
    Jul: 7,
    July: 7,
    Aug: 8,
    August: 8,
    Sep: 9,
    September: 9,
    Oct: 10,
    October: 10,
    Nov: 11,
    November: 11,
    Dec: 12,
    December: 12,
  };

  const basic = {
    title: "Basic Details",
    data: {
      Name: capitalizeWords(userDetails.name) || "--",
      Date: formatDate(
        userDetails.day,
        monthMap[userDetails.month],
        userDetails.year
      ),
      Time: formatTime(userDetails.hour, userDetails.minute),
      Place: userDetails.birthPlace || "--",
      Latitude: userDetails.latitude ?? "--",
      Longitude: userDetails.longitude ?? "--",
      Timezone: userDetails.timezone ? `GMT +${birthDetails.timezone}` : "5.5",
      Sunrise: birthDetails.sunrise || "--",
      Sunset: birthDetails.sunset || "--",
      Ayanamsha: astroDetails.ayanamsa
        ? astroDetails.ayanamsa.toFixed(5)
        : "--",
    },
  };

  const panchangTable = {
    title: "Panchang Details",
    data: {
      Day: birthPanchang.day,
      Tithi: birthPanchang.tithi,
      Yog: birthPanchang.yog,
      Nakshatra: birthPanchang.nakshatra,
      Karan: birthPanchang.karan,
      Sunrise: birthPanchang.sunrise,
      Sunset: birthPanchang.sunset,
      "Vedic Sunrise": birthPanchang.vedic_sunrise,
      "Vedic Sunset": birthPanchang.vedic_sunrise,
    },
  };

  const astros = {
    title: "Avakhada Details",
    data: {
      Gana: capitalizeWords(astroDetails.gana),
      Yoni: capitalizeWords(astroDetails.yoni),
      Vasya: capitalizeWords(astroDetails.vasya),
      Nadi: capitalizeWords(astroDetails.nadi),
      Varna: capitalizeWords(astroDetails.varna),

      Paya: capitalizeWords(astroDetails.paya),
      "Paya By Nakshatra": capitalizeWords(astroDetails.paya_by_nakshatra),

      Tatva: capitalizeWords(astroDetails.tatva),

      "Life Stone": capitalizeWords(astroDetails.life_stone),
      "Lucky Stone": capitalizeWords(astroDetails.lucky_stone),
      "Fortune Stone": capitalizeWords(astroDetails.fortune_stone),

      "Name Start": capitalizeWords(astroDetails.name_start),

      "Ascendant Sign": capitalizeWords(astroDetails.ascendant_sign),
      "Ascendant Nakshatra": capitalizeWords(astroDetails.ascendant_nakshatra),

      Rasi: capitalizeWords(astroDetails.rasi),
      "Rasi Lord": capitalizeWords(astroDetails.rasi_lord),

      Nakshatra: capitalizeWords(astroDetails.nakshatra),
      "Nakshatra Lord": capitalizeWords(astroDetails.nakshatra_lord),
      "Nakshatra Pada": capitalizeWords(astroDetails.nakshatra_pada),

      "Sun Sign": capitalizeWords(astroDetails.sun_sign),

      Tithi: capitalizeWords(astroDetails.tithi),
      Karana: capitalizeWords(astroDetails.karana),
      Yoga: capitalizeWords(astroDetails.yoga),

      Ayanamsha: capitalizeWords(astroDetails.ayanamsa.toFixed(5)),
    },
  };

  return (
    <div>
      <div className=" flex mb-4 ">
        <PrimaryText isSemiBold size_20 color={appColors.tri}>
          {userDetails?.name?.charAt(0).toUpperCase() +
            userDetails?.name?.slice(1)}
        </PrimaryText>
        <div className=" mr-2 ml-2" />
        <PrimaryText isSemiBold size_20 color={appColors.tri}>
          ({birthDetails?.day} - {birthDetails?.month} - {birthDetails?.year})
        </PrimaryText>
      </div>

      <div className={styles.gridContainer}>
        <div className={styles.basicCard}>
          {/* <DetailCard title="Basic Details" data={basicDetails} /> */}
          <DetailCard {...basic} />
        </div>
        <div className={styles.panchangCard}>
          <DetailCard {...panchangTable} />
        </div>
        <div className={styles.avakhadaCard}>
          <DetailCard {...astros} />
        </div>
      </div>
    </div>
  );
};

export default BasicContent;
