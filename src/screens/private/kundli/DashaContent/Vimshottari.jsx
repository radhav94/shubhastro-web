import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useGetMahaDashaPredictionsQuery } from "../../../../redux/api/kundli/dashaApi";
import styles from "./DashaContent.module.scss";
import { skipToken } from "@reduxjs/toolkit/query";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import { buildVedicParam } from "../../../../utils/VedicParams.js/vedicParams";
import AdditionalPlanetaryInfo from "../kundaliContent/AdditionalPlanetaryInfo";

const Vimshottari = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const formData = useSelector((state) => state?.form?.kundliPayload);
  const accordionRefs = useRef([]);

  const queryArgs = formData ? buildVedicParam(formData) : skipToken;

  const { data, isLoading } = useGetMahaDashaPredictionsQuery(queryArgs);

  const handlePlanetClick = (planetName) => {
    if (!data?.response?.dashas) return;

    // Find the index of the dasha that matches the planet name
    const dashaIndex = data.response.dashas.findIndex(
      (dasha) => dasha.dasha === planetName
    );

    if (dashaIndex !== -1) {
      // Expand the accordion
      setExpandedIndex(dashaIndex);
      
      // Scroll to the accordion after a short delay to allow expansion animation
      setTimeout(() => {
        accordionRefs.current[dashaIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  };

  if (isLoading) {
    return <PrimaryLoader isLoading={isLoading} />;
  }

  if (!data?.response?.dashas) {
    return (
      <div className={styles.emptyState}>
        <p>No Dasha data available</p>
      </div>
    );
  }

  const toggleDasha = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <>
     {/* Vimshottari Dasha Section */}
          <AdditionalPlanetaryInfo 
            title="Vimshottari Dasha"
            isLoading={false}
            onPlanetClick={handlePlanetClick}
          />
    <div className={styles.dashaContainer}>
      {data.response.dashas.map((dasha, i) => (
        <div 
          key={i} 
          className={styles.dashaAccordion}
          ref={(el) => (accordionRefs.current[i] = el)}
        >
          {/* Accordion Header */}
          <div 
            className={styles.dashaHeader}
            onClick={() => toggleDasha(i)}
          >
            <div className={styles.headerContent}>
              <div className={styles.dashaName}>{dasha.dasha} Mahadasha</div>
              <div className={styles.dateRange}>
                {dasha.dasha_start_year} - {dasha.dasha_end_year}
              </div>
            </div>
            <div className={`${styles.arrow} ${expandedIndex === i ? styles.arrowExpanded : ''}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Accordion Content */}
          <div className={`${styles.dashaContent} ${expandedIndex === i ? styles.contentExpanded : ''}`}>
            <div className={styles.contentInner}>
              <div className={styles.twoColumnLayout}>
                <div className={styles.textGray}>
                  <span className={styles.desc}>Prediction : </span>{" "}
                  {dasha.prediction}
                </div>
                <div className={styles.textGray}>
                  <span className={styles.desc}>Planet in Zodiac : </span>{" "}
                  {dasha.planet_in_zodiac}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}  
    </div>
    </>
  );
};

export default Vimshottari;
