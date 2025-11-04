// src/components/tabs/BasicContent.jsx
import React from "react";
import styles from "./BasicContent.module.scss";
import { PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";

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
        ) }
      </div>
    </div>
  );
};


const BasicContent = ({ basicData, userData }) => {
  const { birthDetails, birthPanchang, astroDetails } = basicData || {};


  // Helper to format date
  const formatDate = (d, m, y) => `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;

  // Helper to format time (12-hour with AM/PM)
  const formatTime = (hour, minute) => {
    let h = Number(hour);
    const suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
  };

  const basic = {
    title: "Basic Details",
    data: {
      "Name": userData.name || "--",
      "Date": formatDate(birthDetails.day, birthDetails.month, birthDetails.year),
      "Time": formatTime(birthDetails.hour, birthDetails.minute),
      "Place": userData.birthPlace || "--",
      "Latitude": birthDetails.latitude ?? "--",
      "Longitude": birthDetails.longitude ?? "--",
      "Timezone": birthDetails.timezone ? `GMT +${birthDetails.timezone}` : "--",
      "Sunrise": birthDetails.sunrise || "--",
      "Sunset": birthDetails.sunset || "--",
      "Ayanamsha": birthDetails.ayanamsha ? birthDetails.ayanamsha.toFixed(5) : "--",
    }
  }

  const panchangTable = {
    title: "Panchang Details",
    data: {
      "Day": birthPanchang.day,
      "Tithi": birthPanchang.tithi,
      "Yog": birthPanchang.yog,
      "Nakshatra": birthPanchang.nakshatra,
      "Karan": birthPanchang.karan,
      "Sunrise": birthPanchang.sunrise,
      "Sunset": birthPanchang.sunset,
    },
  }

  const astros = {
    title: "Avakhada Details",
    data: {
      "Ascendant": astroDetails.ascendant,
      "Varna": astroDetails.Varna,
      "Vashya": astroDetails.Vashya,
      "Yoni": astroDetails.Yoni,
      "Gan": astroDetails.Gan,
      "Nadi": astroDetails.Nadi,
      "Sign": astroDetails.sign,
      "Sign Lord": astroDetails.SignLord,
      "Nakshatra": astroDetails.Naksahtra,
      "Nakshatra Lord": astroDetails.NaksahtraLord,
      "Charan": astroDetails.Charan != 0
          ? astroDetails.Charan.toString()
          : null,
      "Yog": astroDetails.Yog,
      "Karan": astroDetails.Karan,
      "Tithi": astroDetails.Tithi,
      "Yunja": astroDetails.yunja,
      "Tatva": astroDetails.tatva,
      "Name Alphabet": astroDetails.name_alphabet,
      "Paya": astroDetails.paya,
    },
  }


  return (
    <div>
      <div className=" flex mb-4 ">
        <PrimaryText isSemiBold size_20 color={appColors.tri}>
          {userData?.name}
        </PrimaryText>
        <div className=" mr-2 ml-2" />
        <PrimaryText isSemiBold size_20 color={appColors.tri}>
          ({userData?.day} - {userData?.month} - {userData?.year})
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
