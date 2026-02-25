import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import styles from "./KundaliContent.module.scss";
import { buildVedicParam } from "../../../../utils/VedicParams.js/vedicParams";
import {
  useGetMahaDashaQuery,
  useGetAntarDashaQuery,
  useGetPratyantarDashaQuery,
} from "../../../../redux/api/kundli/kundliApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

/**
 * VimshottariDasha Component
 * 
 * Multi-step drilldown interface for Vimshottari Dasha system:
 * Step 1: Mahadasha (main period)
 * Step 2: Antardasha (sub-period)
 * Step 3: Pratyantardasha (sub-sub-period)
 * 
 * Each row click navigates to next level with right-to-left swipe animation
 */

// Helper function to convert planet names to short codes
const getPlanetShortCode = (planetName) => {
  const planetCodes = {
    'Sun': 'Su',
    'Moon': 'Mo',
    'Mars': 'Ma',
    'Mercury': 'Me',
    'Jupiter': 'Ju',
    'Venus': 'Ve',
    'Saturn': 'Sa',
    'Rahu': 'Ra',
    'Ketu': 'Ke'
  };
  return planetCodes[planetName] || planetName;
};

const AdditionalPlanetaryInfo = ({ onPlanetClick }) => {
  const payload = useSelector((state) => state?.form?.kundliPayload);
  const params = payload ? buildVedicParam(payload) : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPath, setSelectedPath] = useState([]); // Stores {planet, startDate, endDate, index}
  const [direction, setDirection] = useState(1);

  console.log('Dasha Component - Params:', params);
  console.log('Dasha Component - Payload:', payload);

  // Fetch Mahadasha data
  const {
    data: mahaDashaData,
    isLoading: mahaDashaLoading,
    error: mahaDashaError,
  } = useGetMahaDashaQuery(params ? params : skipToken);

  console.log('Mahadasha Data:', mahaDashaData);
  console.log('Mahadasha Error:', mahaDashaError);

  // Fetch Antardasha data (only when step 2 and planet selected)
  const antarDashaParams =
    currentStep >= 2 && selectedPath[0]
      ? { ...params }
      : null;
  const {
    data: antarDashaData,
    isLoading: antarDashaLoading,
  } = useGetAntarDashaQuery(antarDashaParams ? antarDashaParams : skipToken);

  // Fetch Pratyantardasha data (only when step 3 and both planets selected)
  const pratyantarDashaParams =
    currentStep >= 3 && selectedPath[0] && selectedPath[1]
      ? { ...params }
      : null;
  const {
    data: pratyantarDashaData,
    isLoading: pratyantarDashaLoading,
  } = useGetPratyantarDashaQuery(
    pratyantarDashaParams ? pratyantarDashaParams : skipToken
  );

  const steps = [
    { id: 1, label: "Mahadasha" },
    { id: 2, label: "Antardasha" },
    { id: 3, label: "Pratyantardasha" }
  ];

  const handleRowClick = (row) => {
    if (currentStep < 3) {
      setDirection(1);
      setSelectedPath([...selectedPath, row]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePlanetLinkClick = (e, row) => {
    e.stopPropagation(); // Prevent row click from firing
    
    // Call the onPlanetClick callback if provided (for scrolling to accordion)
    if (onPlanetClick && currentStep === 1) {
      onPlanetClick(row.planet);
    }
    
    // Also navigate to next step (original functionality)
    if (currentStep < 3) {
      setDirection(1);
      setSelectedPath([...selectedPath, row]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepClick = (stepId) => {
    if (stepId < currentStep) {
      setDirection(-1);
      setCurrentStep(stepId);
      setSelectedPath(selectedPath.slice(0, stepId - 1));
    }
  };

  const handleLevelUp = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
      setSelectedPath(selectedPath.slice(0, -1));
    }
  };

  // Format API data to match table structure
  const formatDashaData = (apiData, selectedIndex = null, parentEndDate = null) => {
    if (!apiData || !apiData.response) {
      console.warn('No API data or response:', apiData);
      return [];
    }
    
    console.log('Formatting data:', apiData, 'Selected Index:', selectedIndex, 'Parent End Date:', parentEndDate);
    
    // For Mahadasha - combine mahadasha and mahadasha_order arrays
    if (apiData.response?.mahadasha && apiData.response?.mahadasha_order) {
      const planets = apiData.response.mahadasha;
      const endDates = apiData.response.mahadasha_order;
      
      // Validate arrays
      if (!Array.isArray(planets) || !Array.isArray(endDates)) {
        console.warn('Mahadasha data is not in array format');
        return [];
      }
      
      if (planets.length !== endDates.length) {
        console.warn('Mahadasha planets and dates arrays have different lengths');
        return [];
      }
      
      return planets.map((planet, index) => {
        // First row always gets "Birth" as start date
        const rowStartDate = index === 0 ? "Birth" : endDates[index - 1];
        const rowEndDate = endDates[index];
        
        return {
          planet: planet,
          startDate: rowStartDate,
          endDate: rowEndDate,
          index: index, // Store index for later use
        };
      });
    }
    
    // For Antardasha - use selected Mahadasha index
    if (apiData.response?.antardashas && apiData.response?.antardasha_order && selectedIndex !== null) {
      const allAntardashas = apiData.response.antardashas;
      const allAntardashaOrders = apiData.response.antardasha_order;
      
      // Validate arrays
      if (!Array.isArray(allAntardashas) || !Array.isArray(allAntardashaOrders)) {
        console.warn('Antardasha data is not in array format');
        return [];
      }
      
      // Use the selected index directly
      if (selectedIndex >= 0 && selectedIndex < allAntardashas.length && 
          Array.isArray(allAntardashas[selectedIndex]) && Array.isArray(allAntardashaOrders[selectedIndex])) {
        const planetPairs = allAntardashas[selectedIndex];
        const endDates = allAntardashaOrders[selectedIndex];
        
        console.log('Found Antardasha at index:', selectedIndex);
        
        return planetPairs.map((pair, index) => {
          // pair is like "Mercury/Mercury"
          const [mainPlanet, subPlanet] = pair.split('/');
          const displayName = `${getPlanetShortCode(mainPlanet)}-${getPlanetShortCode(subPlanet)}`;
          
          // First row gets parent Mahadasha start date, rest get previous row's end date
          const rowStartDate = index === 0 ? (parentEndDate || "Birth") : endDates[index - 1];
          const rowEndDate = endDates[index];
          
          return {
            planet: displayName, // Display as "Me-Me"
            startDate: rowStartDate,
            endDate: rowEndDate,
            index: index, // Store index for later use
          };
        });
      } else {
        console.warn('Invalid Antardasha index:', selectedIndex);
      }
    }
    
    // For Pratyantardasha - use both Mahadasha and Antardasha indices
    if (apiData.response?.paryantardasha && apiData.response?.paryantardasha_order) {
      const allPratyantardashas = apiData.response.paryantardasha;
      const allPratyantardashaOrders = apiData.response.paryantardasha_order;
      
      // Validate arrays
      if (!Array.isArray(allPratyantardashas) || !Array.isArray(allPratyantardashaOrders)) {
        console.warn('Pratyantardasha data is not in array format');
        return [];
      }
      
      // selectedIndex is the Antardasha index from step 2
      // We also need the Mahadasha index from step 1 (stored in selectedPath[0].index)
      const mahaIndex = selectedPath[0]?.index;
      const antarIndex = selectedIndex;
      
      console.log('Looking for Pratyantardasha at indices - Maha:', mahaIndex, 'Antar:', antarIndex);
      
      // Use both indices to get the exact array
      if (mahaIndex >= 0 && antarIndex >= 0 && 
          mahaIndex < allPratyantardashas.length &&
          Array.isArray(allPratyantardashas[mahaIndex]) &&
          antarIndex < allPratyantardashas[mahaIndex].length &&
          Array.isArray(allPratyantardashas[mahaIndex][antarIndex]) &&
          Array.isArray(allPratyantardashaOrders[mahaIndex]) &&
          Array.isArray(allPratyantardashaOrders[mahaIndex][antarIndex])) {
        
        const selectedPratyantardashaArray = allPratyantardashas[mahaIndex][antarIndex];
        const selectedPratyantardashaOrderArray = allPratyantardashaOrders[mahaIndex][antarIndex];
        
        console.log('Found Pratyantardasha at indices:', mahaIndex, antarIndex);
        
        return selectedPratyantardashaArray.map((triple, index) => {
          // triple is like "Sa/Me/Ve"
          const [mahaPlanet, antarPlanet, pratyantarPlanet] = triple.split('/');
          const displayName = `${getPlanetShortCode(mahaPlanet)}-${getPlanetShortCode(antarPlanet)}-${getPlanetShortCode(pratyantarPlanet)}`;
          
          const rowStartDate = index === 0 ? (parentEndDate || "Birth") : selectedPratyantardashaOrderArray[index - 1];
          const rowEndDate = selectedPratyantardashaOrderArray[index];
          
          return {
            planet: displayName, // Display as "Sa-Me-Ve"
            startDate: rowStartDate,
            endDate: rowEndDate,
            index: index, // Store index for later use
          };
        });
      } else {
        console.warn('Invalid Pratyantardasha indices - Maha:', mahaIndex, 'Antar:', antarIndex);
      }
    }
    
    return [];
  };

  const getCurrentData = () => {
    if (currentStep === 1) {
      return formatDashaData(mahaDashaData);
    } else if (currentStep === 2) {
      const selectedIndex = selectedPath[0]?.index; // Use index instead of planet name
      const selectedMahadashaStartDate = selectedPath[0]?.startDate;
      return formatDashaData(antarDashaData, selectedIndex, selectedMahadashaStartDate);
    } else if (currentStep === 3) {
      const selectedIndex = selectedPath[1]?.index; // Use index instead of planet name
      const selectedAntardashaStartDate = selectedPath[1]?.startDate;
      return formatDashaData(pratyantarDashaData, selectedIndex, selectedAntardashaStartDate);
    }
    return [];
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0
    })
  };

  const isLoading = mahaDashaLoading || antarDashaLoading || pratyantarDashaLoading;
  const hasError = mahaDashaError && currentStep === 1;

  if (isLoading) {
    return (
      <div className={styles.newSection}>
        <PrimaryLoader isLoading={true} />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={styles.newSection}>
        <h2 className={styles.sectionTitle}>Vimshottari Dasha</h2>
        <div className={styles.placeholderText}>
          Unable to load Dasha data. Please try again later.
        </div>
      </div>
    );
  }

  const currentData = getCurrentData();

  return (
    <div className={styles.newSection}>
      <h2 className={styles.sectionTitle}>Vimshottari Dasha</h2>
      
      {/* Stepper */}
      <div className={styles.dashaStepperContainer}>
        {steps.map((step, index) => (
          <div key={step.id} className={styles.dashaStepWrapper}>
            <button
              className={`${styles.dashaStep} ${
                currentStep === step.id ? styles.active : ''
              } ${currentStep > step.id ? styles.completed : ''}`}
              onClick={() => handleStepClick(step.id)}
              disabled={step.id > currentStep}
            >
              <span className={styles.dashaStepNumber}>{step.id}</span>
              <span className={styles.dashaStepLabel}>{step.label}</span>
            </button>
            {index < steps.length - 1 && (
              <div className={styles.dashaStepLine} />
            )}
          </div>
        ))}
      </div>

      {/* Table with animation */}
      <div className={styles.dashaTableContainer}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={styles.dashaTableWrapper}
          >
            <div className={styles.dashaTable}>
              {/* Table Header */}
              <div className={styles.dashaTableHeader}>
                <div className={styles.dashaTableCell}>Planet</div>
                <div className={styles.dashaTableCell}>Start Date</div>
                <div className={styles.dashaTableCell}>End Date</div>
              </div>

              {/* Table Body */}
              <div className={styles.dashaTableBody}>
                {currentData && currentData.length > 0 ? (
                  currentData.map((row, index) => (
                    <div
                      key={index}
                      className={styles.dashaTableRow}
                      onClick={() => handleRowClick(row)}
                    >
                      <div className={styles.dashaTableCell}>
                        {currentStep === 1 ? (
                          <a 
                            className={styles.planetLink}
                            onClick={(e) => handlePlanetLinkClick(e, row)}
                          >
                            {row.planet}
                          </a>
                        ) : (
                          <span>{row.planet}</span>
                        )}
                      </div>
                      <div className={styles.dashaTableCell}>{row.startDate}</div>
                      <div className={styles.dashaTableCell}>{row.endDate}</div>
                      {currentStep < 3 && (
                        <div className={styles.dashaTableArrow}>
                          <ChevronRight size={20} />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={styles.placeholderText}>
                    No data available
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Level Up Button */}
      {currentStep > 1 && (
        <div className={styles.levelUpContainer}>
          <button 
            className={styles.levelUpButton}
            onClick={handleLevelUp}
          >
            <ChevronRight size={18} className={styles.levelUpIcon} />
            Level Up
          </button>
        </div>
      )}
    </div>
  );
};

export default AdditionalPlanetaryInfo;
