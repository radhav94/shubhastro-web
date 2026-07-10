// src/components/tabs/BasicContent.jsx
import React, { useState } from "react";
import styles from "./BasicContent.module.scss";
import { PrimaryText } from "../../../../component";
import { appColors } from "../../../../utils/theme";
import { useSelector } from "react-redux";
import { useFetchBirthDetailsQuery } from "../../../../redux/api/kundli/kundliApi";
import { capitalizeWords } from "../../../../utils/capitalize";
import { format12HourTime } from "../../../../utils/dateFormat/dateTime";
import arrowUp from "../../../../assets/images/arrow-up.svg";

const AccordionSection = ({ title, data = {}, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

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
    <div className={styles.accordionSection}>
      <button
        className={styles.accordionHeader}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h3 className={styles.accordionTitle}>{title}</h3>
        <span className="text-sm text-gray-400">
          <img
            src={arrowUp}
            alt="toggle"
            className={`transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div className={styles.accordionContent}>
          {/* NEW design: group entries into boxes of 3, each box is one grey container with stacked rows */}
          {entries.length > 0 && (
            <div className={styles.detailsList}>
              {Array.from({ length: Math.ceil(entries.length / 3) }, (_, groupIndex) => (
                <div key={groupIndex} className={styles.detailGroupBox}>
                  {entries.slice(groupIndex * 3, groupIndex * 3 + 3).map(([key, value]) => (
                    <div key={key} className={styles.detailGroupRow}>
                      <span className={styles.detailLabel}>{formatKeyLabel(key)}</span>
                      <span className={styles.detailValue}>{value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* OLD design: each entry in its own detailRow grey box */}
          {/* {entries.length > 0 && (
            <div className={styles.detailsList}>
              {entries.map(([key, value]) => (
                <div key={key} className={styles.detailRow}>
                  <span className={styles.detailLabel}>
                    {formatKeyLabel(key)}
                  </span>
                  <span className={styles.detailValue}>{value}</span>
                </div>
              ))}
            </div>
          )} */}
        </div>
      )}
    </div>
  );
};

const BasicContent = (props) => {
  const userDetails = useSelector((state) => state?.form?.userDetails);

  const { birthDetails, birthPanchang, astroDetails, ghatkaChakra } = props || {};

  if (!birthDetails || !birthPanchang || !astroDetails) return null;

  // Helper to format date
  const formatDate = (d, m, y) =>
    `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;

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

  const basicDetailsData = {
    Name: userDetails?.name || "--",
    Date: userDetails ? (formatDate(userDetails.day, monthMap[userDetails.month] || userDetails.month, userDetails.year) || "--") : "--",
    Time: userDetails ? (format12HourTime(userDetails.hour, userDetails.minute, userDetails.meridiem) || "--") : "--",
    Place: userDetails?.birthPlace || "--",
    Rasi: birthDetails?.rasi || "--",
    Nakshatra: birthDetails?.nakshatra || "--",
    "Nakshatra Pada": birthDetails?.nakshatra_pada ?? "--",
    "Day of Birth": birthDetails?.panchang?.day_of_birth || "--",
    // "Day Lord": birthDetails?.panchang?.day_lord || "--",
    // "Hora Lord": birthDetails?.panchang?.hora_lord || "--",
    // Sunrise: birthDetails?.panchang?.sunrise_at_birth || "--",
    // Sunset: birthDetails?.panchang?.sunset_at_birth || "--",
    // Tithi: birthDetails?.panchang?.tithi || "--",
    // Yoga: birthDetails?.panchang?.yoga || "--",
    // Karana: birthDetails?.panchang?.karana || "--",
    Ayanamsa: birthDetails?.panchang?.ayanamsa ? `${birthDetails.panchang.ayanamsa.toFixed(2)}°` : "--",
    // "Ayanamsa Type": birthDetails?.panchang?.ayanamsa_name || "--",
  };

  const panchangDetailsData = {
    Day: birthPanchang.day_of_birth || "--",
    Tithi: birthPanchang.tithi || "--",
    Yoga: birthPanchang.yoga || "--",
    Karana: birthPanchang.karana || "--",
    "Day Lord": birthPanchang.day_lord || "--",
    "Hora Lord": birthPanchang.hora_lord || "--",
    Sunrise: birthPanchang.sunrise_at_birth || "--",
    Sunset: birthPanchang.sunset_at_birth || "--",
    AyanamsaType: birthPanchang.ayanamsa_name || "--",
  };

  const avakhadaDetailsData = {
    Gana: capitalizeWords(astroDetails.gana) || "--",
    Yoni: capitalizeWords(astroDetails.yoni) || "--",
    Vasya: capitalizeWords(astroDetails.vasya) || "--",
    Nadi: capitalizeWords(astroDetails.nadi) || "--",
    Varna: capitalizeWords(astroDetails.varna) || "--",
    Paya: capitalizeWords(astroDetails.paya) || "--",
    "Paya By Nakshatra": capitalizeWords(astroDetails.paya_by_nakshatra) || "--",
    Tatva: capitalizeWords(astroDetails.tatva) || "--",
    "Life Stone": capitalizeWords(astroDetails.life_stone) || "--",
    "Lucky Stone": capitalizeWords(astroDetails.lucky_stone) || "--",
    "Fortune Stone": capitalizeWords(astroDetails.fortune_stone) || "--",
    "Name Start": capitalizeWords(astroDetails.name_start) || "--",
    "Ascendant Sign": capitalizeWords(astroDetails.ascendant_sign) || "--",
    "Ascendant Nakshatra": capitalizeWords(astroDetails.ascendant_nakshatra) || "--",
    Rasi: capitalizeWords(astroDetails.rasi) || "--",
    "Rasi Lord": capitalizeWords(astroDetails.rasi_lord) || "--",
    Nakshatra: capitalizeWords(astroDetails.nakshatra) || "--",
    "Nakshatra Lord": capitalizeWords(astroDetails.nakshatra_lord) || "--",
    "Nakshatra Pada": capitalizeWords(astroDetails.nakshatra_pada) || "--",
    "Sun Sign": capitalizeWords(astroDetails.sun_sign) || "--",
    Tithi: capitalizeWords(astroDetails.tithi) || "--",
    Karana: capitalizeWords(astroDetails.karana) || "--",
    Yoga: capitalizeWords(astroDetails.yoga) || "--",
    Ayanamsha: astroDetails.ayanamsa ? `${astroDetails.ayanamsa.toFixed(2)}°` : "--",
  };

  return (
    <div className={styles.basicContentContainer}>
      <AccordionSection
        title="Basic Details"
        data={basicDetailsData}
        defaultOpen={true}
      />
      <AccordionSection
        title="Panchang Details"
        data={panchangDetailsData}
        defaultOpen={false}
      />
      <AccordionSection
        title="Avakhada Details"
        data={avakhadaDetailsData}
        defaultOpen={false}
      />
      {ghatkaChakra && (
        <AccordionSection
          title="Ghatka Chakra"
          data={{
            Rasi: capitalizeWords(ghatkaChakra.rasi) || "--",
            Tithi: Array.isArray(ghatkaChakra.tithi) ? ghatkaChakra.tithi.join(", ") : (ghatkaChakra.tithi || "--"),
            Day: capitalizeWords(ghatkaChakra.day) || "--",
            Nakshatra: capitalizeWords(ghatkaChakra.nakshatra) || "--",
            Tatva: capitalizeWords(ghatkaChakra.tatva) || "--",
            Lord: capitalizeWords(ghatkaChakra.lord) || "--",
            "Same Sex Lagna": capitalizeWords(ghatkaChakra.same_sex_lagna) || "--",
            "Opposite Sex Lagna": capitalizeWords(ghatkaChakra.opposite_sex_lagna) || "--",
          }}
          defaultOpen={false}
        />
      )}
    </div>
  );
};

export default BasicContent;
